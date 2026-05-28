import { mkdirSync } from "node:fs";
import path from "node:path";
import type { CardDefinition, DeckDefinition, PlayerProfile, RoomState } from "@dormstone/shared";
import { validateCard, validateDeck } from "@dormstone/shared";
import { sampleCards } from "./sampleCards.js";

export interface PersistedGame {
  id: string;
  roomCode: string;
  json: string;
  updatedAt: string;
}

const dataDir = process.env.DORMSTONE_DATA_DIR ?? path.resolve(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

let db: any | undefined;
try {
  const sqlite = await import("better-sqlite3");
  db = new sqlite.default(path.join(dataDir, "dormstone.sqlite"));
  db.pragma("journal_mode = WAL");
} catch (error) {
  console.warn("better-sqlite3 native binding is unavailable; using in-memory storage for this dev session.", error);
}

const memory = {
  players: new Map<string, PlayerProfile>(),
  cards: new Map<string, CardDefinition>(),
  decks: new Map<string, DeckDefinition>(),
  rooms: new Map<string, RoomState>(),
  games: new Map<string, PersistedGame>()
};

export function migrate(): void {
  if (!db) {
    for (const card of sampleCards) memory.cards.set(card.id, card);
    return;
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      nickname TEXT PRIMARY KEY,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      class TEXT NOT NULL,
      name TEXT NOT NULL,
      card_ids TEXT NOT NULL,
      sideboard_ids TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      FOREIGN KEY(owner) REFERENCES players(nickname)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      room_code TEXT NOT NULL,
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureColumn("decks", "sideboard_ids", "TEXT NOT NULL DEFAULT '[]'");

  const findSeedCard = db.prepare("SELECT json FROM cards WHERE id = ?");
  const insert = db.prepare("INSERT INTO cards (id, json, status, updated_at) VALUES (?, ?, ?, ?)");
  const refreshSeed = db.prepare("UPDATE cards SET json = ?, status = ?, updated_at = ? WHERE id = ?");
  const tx = db.transaction(() => {
    for (const card of sampleCards) {
      const existing = findSeedCard.get(card.id) as { json: string } | undefined;
      if (!existing) {
        insert.run(card.id, JSON.stringify(card), card.status, card.updatedAt ?? new Date().toISOString());
        continue;
      }
      const saved = JSON.parse(existing.json) as CardDefinition;
      if (saved.version <= 1) refreshSeed.run(JSON.stringify(card), card.status, card.updatedAt ?? new Date().toISOString(), card.id);
    }
  });
  tx();
}

export function upsertProfile(nickname: string): PlayerProfile {
  const clean = normalizeNickname(nickname);
  if (!clean) throw new Error("昵称不能为空。");
  if (!db) {
    const existing = memory.players.get(clean);
    if (existing) return existing;
    const profile: PlayerProfile = {
      nickname: clean,
      isAdmin: [...memory.players.values()].every((player) => !player.isAdmin),
      createdAt: new Date().toISOString()
    };
    memory.players.set(clean, profile);
    return profile;
  }
  const existing = db.prepare("SELECT nickname, is_admin as isAdmin, created_at as createdAt FROM players WHERE nickname = ?").get(clean) as PlayerProfile | undefined;
  if (existing) return { ...existing, isAdmin: Boolean(existing.isAdmin) };

  const adminCount = db.prepare("SELECT COUNT(*) AS count FROM players WHERE is_admin = 1").get() as { count: number };
  const profile: PlayerProfile = {
    nickname: clean,
    isAdmin: adminCount.count === 0,
    createdAt: new Date().toISOString()
  };
  db.prepare("INSERT INTO players (nickname, is_admin, created_at) VALUES (?, ?, ?)").run(profile.nickname, profile.isAdmin ? 1 : 0, profile.createdAt);
  return profile;
}

export function getProfile(nickname: string): PlayerProfile | undefined {
  if (!db) return memory.players.get(normalizeNickname(nickname));
  const row = db.prepare("SELECT nickname, is_admin as isAdmin, created_at as createdAt FROM players WHERE nickname = ?").get(normalizeNickname(nickname)) as PlayerProfile | undefined;
  return row ? { ...row, isAdmin: Boolean(row.isAdmin) } : undefined;
}

export function assertAdmin(nickname: string): void {
  const profile = getProfile(nickname);
  if (!profile?.isAdmin) throw new Error("只有房主/管理员可以修改卡牌。");
}

export function listCards(includeHidden = false): CardDefinition[] {
  if (!db) {
    return [...memory.cards.values()]
      .filter((card) => includeHidden || card.status === "published")
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, "zh-Hans-CN"));
  }
  const rows = db.prepare("SELECT json FROM cards").all() as { json: string }[];
  return rows
    .map((row) => JSON.parse(row.json) as CardDefinition)
    .filter((card) => includeHidden || card.status === "published")
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, "zh-Hans-CN"));
}

export function saveCard(nickname: string, input: CardDefinition): CardDefinition {
  assertAdmin(nickname);
  const existing = getCard(input.id);
  const card: CardDefinition = {
    ...input,
    version: existing ? existing.version + 1 : Math.max(1, input.version ?? 1),
    updatedAt: new Date().toISOString()
  };
  const validation = validateCard(card);
  if (!validation.valid) throw new Error(validation.errors.join("\n"));
  if (!db) {
    memory.cards.set(card.id, card);
    return card;
  }
  db.prepare("INSERT INTO cards (id, json, status, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json, status = excluded.status, updated_at = excluded.updated_at").run(
    card.id,
    JSON.stringify(card),
    card.status,
    card.updatedAt
  );
  return card;
}

export function setCardStatus(nickname: string, id: string, status: CardDefinition["status"]): CardDefinition {
  assertAdmin(nickname);
  const card = getCard(id);
  if (!card) throw new Error("找不到卡牌。");
  return saveCard(nickname, { ...card, status });
}

export function getCard(id: string): CardDefinition | undefined {
  if (!db) return memory.cards.get(id);
  const row = db.prepare("SELECT json FROM cards WHERE id = ?").get(id) as { json: string } | undefined;
  return row ? (JSON.parse(row.json) as CardDefinition) : undefined;
}

export function listDecks(owner: string): DeckDefinition[] {
  if (!db) {
    const clean = normalizeNickname(owner);
    return [...memory.decks.values()]
      .filter((deck) => deck.owner === clean)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const rows = db.prepare("SELECT id, owner, class, name, card_ids as cardIds, sideboard_ids as sideboardCardIds, updated_at as updatedAt FROM decks WHERE owner = ? ORDER BY updated_at DESC").all(normalizeNickname(owner)) as Array<Omit<DeckDefinition, "cardIds" | "sideboardCardIds"> & { cardIds: string; sideboardCardIds: string }>;
  return rows.map((row) => ({ ...row, cardIds: JSON.parse(row.cardIds) as string[], sideboardCardIds: JSON.parse(row.sideboardCardIds) as string[] }));
}

export function getDeck(id: string): DeckDefinition | undefined {
  if (!db) return memory.decks.get(id);
  const row = db.prepare("SELECT id, owner, class, name, card_ids as cardIds, sideboard_ids as sideboardCardIds, updated_at as updatedAt FROM decks WHERE id = ?").get(id) as (Omit<DeckDefinition, "cardIds" | "sideboardCardIds"> & { cardIds: string; sideboardCardIds: string }) | undefined;
  return row ? { ...row, cardIds: JSON.parse(row.cardIds) as string[], sideboardCardIds: JSON.parse(row.sideboardCardIds) as string[] } : undefined;
}

export function saveDeck(deck: Omit<DeckDefinition, "updatedAt"> & Partial<Pick<DeckDefinition, "updatedAt">>): DeckDefinition {
  const profile = getProfile(deck.owner);
  if (!profile) throw new Error("请先创建昵称。");
  const fullDeck: DeckDefinition = {
    ...deck,
    owner: normalizeNickname(deck.owner),
    name: deck.name.trim() || "未命名卡组",
    updatedAt: new Date().toISOString()
  };
  const validation = validateDeck(fullDeck, listCards(true));
  if (!validation.valid) throw new Error(validation.errors.join("\n"));
  if (!db) {
    memory.decks.set(fullDeck.id, fullDeck);
    return fullDeck;
  }
  db.prepare("INSERT INTO decks (id, owner, class, name, card_ids, sideboard_ids, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET class = excluded.class, name = excluded.name, card_ids = excluded.card_ids, sideboard_ids = excluded.sideboard_ids, updated_at = excluded.updated_at").run(
    fullDeck.id,
    fullDeck.owner,
    fullDeck.class,
    fullDeck.name,
    JSON.stringify(fullDeck.cardIds),
    JSON.stringify(fullDeck.sideboardCardIds ?? []),
    fullDeck.updatedAt
  );
  return fullDeck;
}

export function listPersistedRooms(): RoomState[] {
  if (!db) return [...memory.rooms.values()];
  const rows = db.prepare("SELECT json FROM rooms").all() as { json: string }[];
  return rows.map((row) => JSON.parse(row.json) as RoomState);
}

export function persistRoom(room: RoomState): void {
  if (!db) {
    memory.rooms.set(room.code, room);
    return;
  }
  db.prepare("INSERT INTO rooms (code, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(code) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at").run(room.code, JSON.stringify(room), room.updatedAt);
}

export function deletePersistedRoom(code: string): void {
  const roomCode = code.trim().toUpperCase();
  if (!db) {
    memory.rooms.delete(roomCode);
    for (const [id, game] of memory.games) {
      if (game.roomCode === roomCode) memory.games.delete(id);
    }
    return;
  }
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM games WHERE room_code = ?").run(roomCode);
    db.prepare("DELETE FROM rooms WHERE code = ?").run(roomCode);
  });
  tx();
}

export function persistGame(id: string, roomCode: string, gameJson: string): void {
  if (!db) {
    memory.games.set(id, { id, roomCode, json: gameJson, updatedAt: new Date().toISOString() });
    return;
  }
  db.prepare("INSERT INTO games (id, room_code, json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at").run(id, roomCode, gameJson, new Date().toISOString());
}

export function loadGame(id: string): PersistedGame | undefined {
  if (!db) return memory.games.get(id);
  return db.prepare("SELECT id, room_code as roomCode, json, updated_at as updatedAt FROM games WHERE id = ?").get(id) as PersistedGame | undefined;
}

function normalizeNickname(nickname: string): string {
  return nickname.trim().slice(0, 24);
}

function ensureColumn(table: string, column: string, definition: string): void {
  if (!db) return;
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
