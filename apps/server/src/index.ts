import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { CLASS_LABELS, COLLECTIBLE_CLASSES, GAME_RULES, legalCardsForClass, type CollectibleClass, type DeckDefinition, type DeckTemplate, type GameAction, type GameState, type RoomState, type Seat } from "@dormstone/shared";
import { applyGameAction, createGame, toPublicGameState } from "./engine.js";
import { deletePersistedRoom, getDeck, getProfile, listCards, listDecks, listPersistedRooms, loadGame, migrate, persistGame, persistRoom, saveCard, saveDeck, setCardStatus, upsertProfile } from "./db.js";
import { buildDeckFromTemplate, getDeckTemplate, listDeckTemplates } from "./deckTemplates.js";

interface RoomRecord {
  state: RoomState;
  game?: GameState;
}

const port = Number(process.env.PORT ?? 4000);
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true }
});
const rooms = new Map<string, RoomRecord>();

migrate();
restoreRooms();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "8mb" }));

app.post("/api/profile", (req, res) => respond(res, () => upsertProfile(String(req.body.nickname ?? ""))));

app.get("/api/cards", (req, res) =>
  respond(res, () => {
    const includeHidden = req.query.includeHidden === "1";
    if (includeHidden) {
      const profile = getProfile(String(req.query.nickname ?? ""));
      if (!profile?.isAdmin) throw new Error("只有管理员可以查看草稿和禁用卡牌。");
    }
    return listCards(includeHidden);
  })
);

app.post("/api/cards", (req, res) => respond(res, () => saveCard(String(req.body.nickname ?? ""), req.body.card)));

app.patch("/api/cards/:id/status", (req, res) => respond(res, () => setCardStatus(String(req.body.nickname ?? ""), req.params.id, req.body.status)));

app.get("/api/decks", (req, res) => respond(res, () => listDecks(String(req.query.owner ?? ""))));

app.post("/api/decks", (req, res) => respond(res, () => saveDeck(req.body.deck)));

app.get("/api/deck-templates", (_req, res) => respond(res, () => listDeckTemplates()));

app.post("/api/deck-templates/:id/deck", (req, res) =>
  respond(res, () => {
    const owner = String(req.body.owner ?? "");
    const template = getDeckTemplate(req.params.id);
    if (!template) throw new Error("找不到卡组模板。");
    const classOverride = req.body.classOverride as CollectibleClass | undefined;
    const built = buildDeckFromTemplate(template, listCards(false), classOverride);
    return saveDeck({
      id: `template_${template.id}_${Date.now()}_${randomUUID().slice(0, 8)}`,
      owner,
      name: `${template.nameZh} · ${CLASS_LABELS[built.class]}`,
      class: built.class,
      cardIds: built.cardIds,
      sideboardCardIds: built.sideboardCardIds,
      templateId: template.id
    });
  })
);

app.get("/api/starter-deck", (req, res) =>
  respond(res, () => {
    const deckClass = String(req.query.class ?? "") as CollectibleClass;
    if (!COLLECTIBLE_CLASSES.includes(deckClass)) throw new Error("职业无效。");
    return buildStarterDeck(deckClass);
  })
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, "../../web/dist");
if (existsSync(path.join(webDist, "index.html"))) {
  app.use(express.static(webDist));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => res.sendFile(path.join(webDist, "index.html")));
}

io.on("connection", (socket) => {
  socket.emit("lobby:state", roomSummaries());

  socket.on("profile:identify", (payload: { nickname?: string }, ack) =>
    safeAck(ack, () => {
      const profile = upsertProfile(String(payload.nickname ?? ""));
      socket.data.nickname = profile.nickname;
      socket.join(playerChannel(profile.nickname));
      reconnectPlayer(profile.nickname, socket.id);
      return profile;
    })
  );

  socket.on("room:create", (_payload, ack) =>
    safeAck(ack, () => {
      const nickname = requireNickname(socket);
      const room = createRoom(nickname);
      socket.join(room.state.code);
      emitEverything();
      return room.state;
    })
  );

  socket.on("room:join", (payload: { code?: string }, ack) =>
    safeAck(ack, () => {
      const nickname = requireNickname(socket);
      const room = getRoom(String(payload.code ?? "").toUpperCase());
      if (room.state.status !== "waiting") throw new Error("该房间已经开始。");
      const existingSeat = seatInRoom(room.state, nickname);
      const openSeat = room.state.seats.find((seat) => !seat.nickname);
      if (existingSeat === undefined && !openSeat) throw new Error("房间已满。");
      const seat = existingSeat ?? openSeat!.seat;
      room.state.seats[seat] = { ...room.state.seats[seat], nickname, connected: true };
      room.state.updatedAt = new Date().toISOString();
      socket.join(room.state.code);
      emitEverything(room);
      return room.state;
    })
  );

  socket.on("room:leave", (_payload, ack) =>
    safeAck(ack, () => {
      const nickname = requireNickname(socket);
      const room = roomForNickname(nickname);
      if (!room) return null;
      const seat = seatInRoom(room.state, nickname);
      if (seat !== undefined && room.state.status === "waiting") {
        room.state.seats[seat] = { seat, ready: false, connected: false };
        room.state.updatedAt = new Date().toISOString();
      }
      socket.leave(room.state.code);
      emitEverything(room);
      return null;
    })
  );

  socket.on("room:delete", (payload: { code?: string }, ack) =>
    safeAck(ack, () => {
      const nickname = requireNickname(socket);
      const code = String(payload.code ?? "").toUpperCase();
      const room = code ? getRoom(code) : requirePlayerRoom(nickname);
      if (room.state.status === "playing") throw new Error("对局进行中不能删除房间。");
      const profile = getProfile(nickname);
      const isOwner = room.state.seats[0].nickname === nickname;
      if (!isOwner && !profile?.isAdmin) throw new Error("只有房主或管理员可以删除房间。");
      deleteRoom(room);
      return room.state.code;
    })
  );

  socket.on("room:selectDeck", (payload: { deckId?: string }, ack) =>
    safeAck(ack, () => {
      const nickname = requireNickname(socket);
      const room = requirePlayerRoom(nickname);
      const seat = requireSeat(room.state, nickname);
      const deckId = String(payload.deckId ?? "");
      const template = getDeckTemplate(deckId);
      const savedDeck = template ? undefined : getDeck(deckId);
      if (!template && (!savedDeck || savedDeck.owner !== nickname)) throw new Error("请选择一套预设卡组。");
      room.state.seats[seat] = { ...room.state.seats[seat], deckId, ready: false };
      room.state.updatedAt = new Date().toISOString();
      emitEverything(room);
      return room.state;
    })
  );

  socket.on("room:ready", (payload: { ready?: boolean }, ack) =>
    safeAck(ack, () => {
      const nickname = requireNickname(socket);
      const room = requirePlayerRoom(nickname);
      const seat = requireSeat(room.state, nickname);
      if (!room.state.seats[seat].deckId) throw new Error("请先选择卡组。");
      room.state.seats[seat] = { ...room.state.seats[seat], ready: Boolean(payload.ready) };
      if (room.state.seats.every((item) => item.nickname && item.deckId && item.ready) && room.state.status === "waiting") {
        startRoomGame(room);
      } else {
        room.state.updatedAt = new Date().toISOString();
      }
      emitEverything(room);
      return room.state;
    })
  );

  socket.on("game:action", (payload: { action?: GameAction }, ack) =>
    safeAck(ack, () => {
      const nickname = requireNickname(socket);
      const room = requirePlayerRoom(nickname);
      if (!room.game) throw new Error("房间还没有开始对局。");
      applyGameAction(room.game, nickname, payload.action as GameAction, listCards(true));
      if (room.game.phase === "finished") room.state.status = "finished";
      room.state.updatedAt = new Date().toISOString();
      emitEverything(room);
      return true;
    })
  );

  socket.on("disconnect", () => {
    const nickname = socket.data.nickname as string | undefined;
    if (!nickname) return;
    setTimeout(() => {
      const stillConnected = Boolean(io.sockets.adapter.rooms.get(playerChannel(nickname))?.size);
      if (!stillConnected) {
        for (const room of rooms.values()) {
          const seat = seatInRoom(room.state, nickname);
          if (seat !== undefined) {
            room.state.seats[seat].connected = false;
            room.state.updatedAt = new Date().toISOString();
            emitEverything(room);
          }
        }
      }
    }, 250);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Dormstone server listening on http://localhost:${port}`);
});

function respond(res: express.Response, fn: () => unknown): void {
  try {
    res.json({ ok: true, data: fn() });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

function safeAck(ack: unknown, fn: () => unknown): void {
  try {
    const data = fn();
    if (typeof ack === "function") ack({ ok: true, data });
  } catch (error) {
    if (typeof ack === "function") ack({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

function createRoom(nickname: string): RoomRecord {
  const now = new Date().toISOString();
  const code = nextRoomCode();
  const room: RoomRecord = {
    state: {
      code,
      status: "waiting",
      seats: [
        { seat: 0, nickname, ready: false, connected: true },
        { seat: 1, ready: false, connected: false }
      ],
      createdAt: now,
      updatedAt: now
    }
  };
  rooms.set(code, room);
  return room;
}

function deleteRoom(room: RoomRecord): void {
  rooms.delete(room.state.code);
  deletePersistedRoom(room.state.code);
  io.to(room.state.code).emit("room:deleted", { code: room.state.code });
  io.in(room.state.code).socketsLeave(room.state.code);
  io.emit("lobby:state", roomSummaries());
}

function startRoomGame(room: RoomRecord): void {
  const [seatA, seatB] = room.state.seats;
  const deckA = buildSelectedDeck(seatA.deckId, seatA.nickname);
  const deckB = buildSelectedDeck(seatB.deckId, seatB.nickname);
  if (!seatA.nickname || !seatB.nickname || !deckA || !deckB) throw new Error("双方都需要选择卡组。");
  room.game = createGame(room.state.code, [
    { nickname: seatA.nickname, class: deckA.class, deck: deckA },
    { nickname: seatB.nickname, class: deckB.class, deck: deckB }
  ], listCards(true));
  room.state.status = "playing";
  room.state.gameId = room.game.id;
  room.state.updatedAt = new Date().toISOString();
}

function buildSelectedDeck(deckId: string | undefined, owner: string | undefined): DeckDefinition | undefined {
  if (!deckId || !owner) return undefined;
  const template = getDeckTemplate(deckId);
  if (template) return virtualDeckFromTemplate(template, owner);
  const deck = getDeck(deckId);
  return deck?.owner === owner ? deck : undefined;
}

function virtualDeckFromTemplate(template: DeckTemplate, owner: string): DeckDefinition {
  const built = buildDeckFromTemplate(template, listCards(false));
  return {
    id: template.id,
    owner,
    name: `${template.nameZh} · ${CLASS_LABELS[built.class]}`,
    class: built.class,
    cardIds: built.cardIds,
    sideboardCardIds: built.sideboardCardIds,
    templateId: template.id,
    updatedAt: new Date().toISOString()
  };
}

function reconnectPlayer(nickname: string, socketId: string): void {
  const room = roomForNickname(nickname);
  if (!room) return;
  const seat = seatInRoom(room.state, nickname);
  if (seat !== undefined) room.state.seats[seat].connected = true;
  io.sockets.sockets.get(socketId)?.join(room.state.code);
  emitEverything(room);
}

function emitEverything(room?: RoomRecord): void {
  if (room) persistRecord(room);
  io.emit("lobby:state", roomSummaries());
  if (room) emitRoom(room);
}

function emitRoom(room: RoomRecord): void {
  io.to(room.state.code).emit("room:state", room.state);
  if (!room.game) return;
  for (const seat of room.state.seats) {
    if (!seat.nickname) continue;
    io.to(playerChannel(seat.nickname)).emit("game:state", toPublicGameState(room.game, seat.nickname));
  }
}

function persistRecord(room: RoomRecord): void {
  persistRoom(room.state);
  if (room.game) persistGame(room.game.id, room.state.code, JSON.stringify(room.game));
}

function restoreRooms(): void {
  for (const state of listPersistedRooms()) {
    const cleanState: RoomState = {
      ...state,
      seats: state.seats.map((seat) => ({ ...seat, connected: false })) as RoomState["seats"]
    };
    const record: RoomRecord = { state: cleanState };
    if (state.gameId) {
      const game = loadGame(state.gameId);
      if (game) record.game = JSON.parse(game.json) as GameState;
    }
    rooms.set(state.code, record);
  }
}

function buildStarterDeck(deckClass: CollectibleClass): Pick<DeckDefinition, "class" | "cardIds"> {
  const legal = legalCardsForClass(listCards(false), deckClass).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, "zh-Hans-CN"));
  const cardIds: string[] = [];
  for (const card of legal) {
    const limit = card.rarity === "legendary" ? GAME_RULES.maxLegendaryCopies : GAME_RULES.maxCopies;
    for (let index = 0; index < limit && cardIds.length < GAME_RULES.deckSize; index += 1) cardIds.push(card.id);
    if (cardIds.length === GAME_RULES.deckSize) break;
  }
  if (cardIds.length < GAME_RULES.deckSize) throw new Error("当前卡池不足以生成默认卡组。");
  return { class: deckClass, cardIds };
}

function roomSummaries(): RoomState[] {
  return [...rooms.values()].map((room) => room.state).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function roomForNickname(nickname: string): RoomRecord | undefined {
  return [...rooms.values()].find((room) => room.state.seats.some((seat) => seat.nickname === nickname));
}

function requirePlayerRoom(nickname: string): RoomRecord {
  const room = roomForNickname(nickname);
  if (!room) throw new Error("你还不在房间中。");
  return room;
}

function getRoom(code: string): RoomRecord {
  const room = rooms.get(code);
  if (!room) throw new Error("找不到房间。");
  return room;
}

function seatInRoom(room: RoomState, nickname: string): Seat | undefined {
  const index = room.seats.findIndex((seat) => seat.nickname === nickname);
  return index === 0 || index === 1 ? (index as Seat) : undefined;
}

function requireSeat(room: RoomState, nickname: string): Seat {
  const seat = seatInRoom(room, nickname);
  if (seat === undefined) throw new Error("你不在这个房间中。");
  return seat;
}

function requireNickname(socket: { data: { nickname?: string } }): string {
  if (!socket.data.nickname) throw new Error("请先输入昵称。");
  return socket.data.nickname;
}

function nextRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    if (!rooms.has(code)) return code;
  }
  return randomUUID().slice(0, 4).toUpperCase();
}

function playerChannel(nickname: string): string {
  return `player:${nickname}`;
}
