import { describe, expect, it } from "vitest";
import type { DeckDefinition } from "@dormstone/shared";
import { companionHunterDeckCardIds } from "./companionHunter.js";
import { getDeckTemplate } from "./deckTemplates.js";
import { applyGameAction, createGame } from "./engine.js";
import { sampleCards } from "./sampleCards.js";

function deck(owner: string, cardIds: string[]): DeckDefinition {
  return {
    id: `${owner}_companion_test`,
    owner,
    name: "Companion test",
    class: "hunter",
    cardIds,
    updatedAt: new Date().toISOString()
  };
}

function gameForCompanion(seed = 12075187): ReturnType<typeof createGame> {
  const game = createGame("HUNT", [
    { nickname: "A", class: "hunter", deck: deck("A", Array(30).fill("companion_hunter_tracking")) },
    { nickname: "B", class: "hunter", deck: deck("B", Array(30).fill("neutral_squire")) }
  ], sampleCards, seed);
  game.phase = "playing";
  game.currentPlayer = 0;
  game.turn = 4;
  game.players[0].maxMana = 10;
  game.players[0].mana = 10;
  game.players[1].maxMana = 10;
  game.players[1].mana = 10;
  return game;
}

describe("Companion Hunter", () => {
  it("registers the requested 30-card deck template", () => {
    const catalog = new Map(sampleCards.map((card) => [card.id, card]));
    const template = getDeckTemplate("custom_companion_hunter");

    expect(template?.nameZh).toBe("伙伴猎");
    expect(template?.presetCardIds).toEqual(companionHunterDeckCardIds);
    expect(companionHunterDeckCardIds).toHaveLength(30);
    expect(companionHunterDeckCardIds.filter((cardId) => !catalog.has(cardId))).toEqual([]);
    expect(catalog.get("companion_hunter_animal_companion")?.rules).toContain("hunter_animal_companion");
  });

  it("summons real animal companions and Taya adds an extra one", () => {
    const game = gameForCompanion();
    game.players[0].hand = [
      { instanceId: "taya", cardId: "companion_hunter_taya", owner: 0 },
      { instanceId: "animal", cardId: "companion_hunter_animal_companion", owner: 0 }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "taya" }, sampleCards);
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "animal" }, sampleCards);

    const companions = game.players[0].board.filter((minion) => minion.cardId.startsWith("companion_token_"));
    expect(companions).toHaveLength(2);
    expect(companions.every((minion) => sampleCards.find((card) => card.id === minion.cardId)?.races?.includes("BEAST"))).toBe(true);
  });

  it("upgrades future animal companions into higher-cost random beasts", () => {
    const game = gameForCompanion(99);
    game.players[0].hand = [
      { instanceId: "tame", cardId: "companion_hunter_tame_beast", owner: 0 },
      { instanceId: "animal", cardId: "companion_hunter_animal_companion", owner: 0 }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "tame" }, sampleCards);
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "animal" }, sampleCards);

    const summoned = game.players[0].board[0];
    const summonedCard = sampleCards.find((card) => card.id === summoned.cardId);
    expect(game.players[0].animalCompanionReplacementCost).toBe(4);
    expect(summoned.cardId.startsWith("companion_token_")).toBe(false);
    expect(summonedCard?.races).toContain("BEAST");
    expect(summonedCard?.cost).toBe(4);
  });

  it("implements Wound Prey damage plus a rushing Beast token", () => {
    const game = gameForCompanion();
    game.players[0].hand = [{ instanceId: "prey", cardId: "companion_hunter_wound_prey", owner: 0 }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "prey", target: { type: "hero", seat: 1 } }, sampleCards);

    expect(game.players[1].hero.health).toBe(29);
    expect(game.players[0].board[0].cardId).toBe("companion_token_hyena");
    expect(game.players[0].board[0].keywords).toContain("rush");
  });
});
