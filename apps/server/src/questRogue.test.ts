import { describe, expect, it } from "vitest";
import type { BoardMinion, CardInstance, DeckDefinition, Seat } from "@dormstone/shared";
import { applyGameAction, createGame } from "./engine.js";
import { questRogueDeckCardIds } from "./questRogue.js";
import { sampleCards } from "./sampleCards.js";

function deck(owner: string, deckClass: DeckDefinition["class"], cardIds: string[]): DeckDefinition {
  return {
    id: `${owner}_${deckClass}`,
    owner,
    name: "测试卡组",
    class: deckClass,
    cardIds,
    updatedAt: new Date().toISOString()
  };
}

function instance(cardId: string, instanceId: string, owner: Seat = 0): CardInstance {
  return { instanceId, cardId, owner, origin: "generated" };
}

function minion(cardId: string, instanceId: string, owner: Seat = 0): BoardMinion {
  const card = sampleCards.find((item) => item.id === cardId);
  if (!card) throw new Error(`missing card ${cardId}`);
  return {
    ...instance(cardId, instanceId, owner),
    attack: card.attack ?? 0,
    health: card.health ?? 1,
    maxHealth: card.health ?? 1,
    keywords: [...card.keywords],
    exhausted: false,
    summonedTurn: 0,
    attacksThisTurn: 0,
    silenced: false,
    temporaryAttack: 0
  };
}

function readyQuestRogueGame() {
  const game = createGame("QUEST", [
    { nickname: "A", class: "rogue", deck: deck("A", "rogue", questRogueDeckCardIds) },
    { nickname: "B", class: "mage", deck: deck("B", "mage", Array(30).fill("neutral_squire")) }
  ], sampleCards, 37);
  applyGameAction(game, "A", { type: "mulligan", cardInstanceIds: [] }, sampleCards);
  applyGameAction(game, "B", { type: "mulligan", cardInstanceIds: [] }, sampleCards);
  game.currentPlayer = 0;
  game.players[0].maxMana = 10;
  game.players[0].mana = 10;
  return game;
}

describe("2017 quest rogue", () => {
  it("keeps The Caverns Below in the opening hand and completes on four matching minions", () => {
    const game = readyQuestRogueGame();
    const player = game.players[0];

    expect(player.hand.some((card) => card.cardId === "quest_rogue_the_caverns_below")).toBe(true);
    player.hand = [
      instance("quest_rogue_the_caverns_below", "quest"),
      instance("quest_rogue_stonetusk_boar", "boar_1"),
      instance("quest_rogue_stonetusk_boar", "boar_2"),
      instance("quest_rogue_stonetusk_boar", "boar_3"),
      instance("quest_rogue_stonetusk_boar", "boar_4")
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "quest" }, sampleCards);
    for (const id of ["boar_1", "boar_2", "boar_3", "boar_4"]) {
      applyGameAction(game, "A", { type: "play_card", handInstanceId: id }, sampleCards);
    }

    expect(player.quest).toMatchObject({ progress: 4, required: 4, completed: true });
    expect(player.hand.some((card) => card.cardId === "quest_rogue_crystal_core")).toBe(true);
    expect(game.logs.some((log) => log.message.includes("任务进度提升") && log.message.includes("4/4"))).toBe(true);
  });

  it("Crystal Core turns board, hand, deck, drawn cards, and later summons into 5/5 minions", () => {
    const game = readyQuestRogueGame();
    const player = game.players[0];
    player.board = [minion("quest_rogue_fire_fly", "board_firefly")];
    player.hand = [
      instance("quest_rogue_crystal_core", "core"),
      instance("quest_rogue_fire_fly", "hand_firefly"),
      instance("quest_rogue_mimic_pod", "mimic"),
      instance("neutral_call", "call")
    ];
    player.deck = [instance("quest_rogue_novice_engineer", "deck_engineer")];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "core" }, sampleCards);
    expect(player.crystalCoreActive).toBe(true);
    expect(player.board[0]).toMatchObject({ attack: 5, health: 5, maxHealth: 5 });
    expect(player.hand.find((card) => card.instanceId === "hand_firefly")).toMatchObject({ attackOverride: 5, healthOverride: 5 });
    expect(player.deck[0]).toMatchObject({ attackOverride: 5, healthOverride: 5 });

    player.mana = 10;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "hand_firefly" }, sampleCards);
    expect(player.board.find((item) => item.instanceId === "hand_firefly")).toMatchObject({ attack: 5, health: 5, maxHealth: 5 });
    expect(player.hand.find((card) => card.cardId === "quest_rogue_flame_elemental")).toMatchObject({ attackOverride: 5, healthOverride: 5 });

    player.mana = 10;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "mimic" }, sampleCards);
    const engineers = player.hand.filter((card) => card.cardId === "quest_rogue_novice_engineer");
    expect(engineers).toHaveLength(2);
    expect(engineers.every((card) => card.attackOverride === 5 && card.healthOverride === 5)).toBe(true);

    player.mana = 10;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "call" }, sampleCards);
    const summoned = player.board.filter((item) => item.cardId === "token_drone");
    expect(summoned).toHaveLength(2);
    expect(summoned.every((item) => item.attack === 5 && item.health === 5 && item.maxHealth === 5)).toBe(true);
  });
});
