import { describe, expect, it } from "vitest";
import type { DeckDefinition } from "@dormstone/shared";
import { getDeckTemplate } from "./deckTemplates.js";
import { applyGameAction, createGame } from "./engine.js";
import { sampleCards } from "./sampleCards.js";

function deck(owner: string, cardIds: string[]): DeckDefinition {
  return {
    id: `${owner}_dragon_test`,
    owner,
    name: "Dragon test",
    class: "druid",
    cardIds,
    updatedAt: new Date().toISOString()
  };
}

function liveGame(): ReturnType<typeof createGame> {
  const game = createGame("DRAGON", [
    { nickname: "A", class: "druid", deck: deck("A", Array(40).fill("dragon_aquatic_form")) },
    { nickname: "B", class: "druid", deck: deck("B", Array(30).fill("neutral_squire")) }
  ], sampleCards, 71);
  game.phase = "playing";
  game.currentPlayer = 0;
  game.turn = 6;
  return game;
}

describe("Dragon Highlander Druid", () => {
  it("registers the requested 40-card Renathal preset", () => {
    const template = getDeckTemplate("custom_dragon_highlander_druid");

    expect(template?.presetCardIds).toHaveLength(40);
    expect(template?.presetCardIds).toContain("dragon_rheastrasza");
    expect(template?.presetCardIds).toContain("dragon_eonar");
    expect(template?.sideboardCardIds).toHaveLength(3);
  });

  it("ramps from dragon holding cards and turns Guff into a 20-mana hero", () => {
    const game = liveGame();
    game.players[0].maxMana = 2;
    game.players[0].mana = 2;
    game.players[0].hand = [
      { instanceId: "whelp", cardId: "dragon_splish_splash_whelp", owner: 0, origin: "starting_deck" },
      { instanceId: "held_dragon", cardId: "dragon_rheastrasza", owner: 0, origin: "starting_deck" }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "whelp" }, sampleCards);
    expect(game.players[0].maxMana).toBe(3);

    game.players[0].maxMana = 5;
    game.players[0].mana = 5;
    game.players[0].hand = [{ instanceId: "guff", cardId: "dragon_guff", owner: 0, origin: "starting_deck" }];
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "guff" }, sampleCards);

    expect(game.players[0].manaCap).toBe(20);
    expect(game.players[0].maxMana).toBe(6);
    expect(game.players[0].hero.heroPowerCardId).toBe("hero_power_guff_nurture");
  });

  it("lets Sir Finley swap hand with the deck bottom even when the deck has duplicates", () => {
    const game = liveGame();
    game.players[0].mana = 1;
    game.players[0].hand = [
      { instanceId: "finley", cardId: "dragon_finley", owner: 0, origin: "starting_deck" },
      { instanceId: "hand_a", cardId: "dragon_overgrowth", owner: 0, origin: "starting_deck" },
      { instanceId: "hand_b", cardId: "dragon_nourish", owner: 0, origin: "starting_deck" }
    ];
    game.players[0].deck = [
      { instanceId: "dup_a", cardId: "neutral_squire", owner: 0, origin: "starting_deck" },
      { instanceId: "dup_b", cardId: "neutral_squire", owner: 0, origin: "starting_deck" },
      { instanceId: "bottom_a", cardId: "dragon_eonar", owner: 0, origin: "starting_deck" },
      { instanceId: "bottom_b", cardId: "dragon_rheastrasza", owner: 0, origin: "starting_deck" }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "finley" }, sampleCards);

    expect(game.players[0].hand.map((card) => card.instanceId)).toEqual(["bottom_a", "bottom_b"]);
    expect(game.players[0].deck.map((card) => card.instanceId)).toEqual(["dup_a", "dup_b", "hand_a", "hand_b"]);
    expect(game.players[0].board.map((minion) => minion.cardId)).toContain("dragon_finley");
  });

  it("summons Pure Nest from Rheastrasza when the remaining deck is highlander", () => {
    const game = liveGame();
    game.players[0].deck = [];
    game.players[0].maxMana = 8;
    game.players[0].mana = 8;
    game.players[0].hand = [{ instanceId: "rhea", cardId: "dragon_rheastrasza", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "rhea" }, sampleCards);

    expect(game.players[0].board.map((minion) => minion.cardId)).toEqual(["dragon_rheastrasza", "dragon_pure_nest"]);
  });

  it("has Pure Nest discover discounted dragons without Rheastrasza", () => {
    const game = liveGame();
    game.players[0].deck = [];
    game.players[0].maxMana = 8;
    game.players[0].mana = 8;
    game.players[0].hand = [{ instanceId: "rhea", cardId: "dragon_rheastrasza", owner: 0, origin: "starting_deck" }];
    const catalog = new Map(sampleCards.map((card) => [card.id, card]));

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "rhea" }, sampleCards);
    game.currentPlayer = 1;
    applyGameAction(game, "B", { type: "end_turn" }, sampleCards);

    expect(game.pendingChoice?.kind).toBe("discover_to_hand");
    expect(game.pendingChoice?.options).toHaveLength(3);
    expect(game.pendingChoice?.options.map((option) => option.cardId)).not.toContain("dragon_rheastrasza");
    for (const option of game.pendingChoice?.options ?? []) {
      const card = catalog.get(option.cardId)!;
      expect(card.type).toBe("minion");
      expect(card.races).toContain("DRAGON");
      expect(option.costOverride).toBe(Math.max(0, card.cost - 4));
    }
  });

  it("makes Pure Nest untouchable in combat and targeted effects", () => {
    const game = liveGame();
    game.players[0].deck = [];
    game.players[0].maxMana = 8;
    game.players[0].mana = 8;
    game.players[0].hand = [{ instanceId: "rhea", cardId: "dragon_rheastrasza", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "rhea" }, sampleCards);
    const nest = game.players[0].board.find((minion) => minion.cardId === "dragon_pure_nest")!;
    expect(nest).toMatchObject({ cannotAttack: true, untouchable: true });

    game.currentPlayer = 1;
    game.players[1].board = [{
      instanceId: "attacker",
      cardId: "neutral_squire",
      owner: 1,
      origin: "generated",
      attack: 1,
      health: 2,
      maxHealth: 2,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];
    game.players[1].mana = 4;
    game.players[1].hand = [{ instanceId: "blast", cardId: "neutral_blast", owner: 1, origin: "starting_deck" }];

    expect(() =>
      applyGameAction(game, "B", {
        type: "attack",
        source: { type: "minion", seat: 1, instanceId: "attacker" },
        target: { type: "minion", seat: 0, instanceId: nest.instanceId }
      }, sampleCards)
    ).toThrow("无法被攻击");
    expect(() =>
      applyGameAction(game, "B", {
        type: "play_card",
        handInstanceId: "blast",
        target: { type: "minion", seat: 0, instanceId: nest.instanceId }
      }, sampleCards)
    ).toThrow("无法成为目标");
    expect(nest.health).toBe(1);
  });

  it("makes friendly minion cards cost 1 while Aviana is active", () => {
    const game = liveGame();
    game.players[0].mana = 1;
    game.players[0].board = [{
      instanceId: "aviana_board",
      cardId: "dragon_aviana",
      owner: 0,
      origin: "generated",
      attack: 5,
      health: 5,
      maxHealth: 5,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];
    game.players[0].hand = [
      { instanceId: "colossus_hand", cardId: "neutral_colossus", owner: 0, origin: "starting_deck" },
      { instanceId: "spell_hand", cardId: "dragon_overgrowth", owner: 0, origin: "starting_deck" }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "colossus_hand" }, sampleCards);
    expect(game.players[0].mana).toBe(0);
    expect(game.players[0].board.map((minion) => minion.cardId)).toContain("neutral_colossus");

    game.players[0].mana = 1;
    expect(() => applyGameAction(game, "A", { type: "play_card", handInstanceId: "spell_hand" }, sampleCards)).toThrow("法力不足");

    game.players[0].board.find((minion) => minion.instanceId === "aviana_board")!.silenced = true;
    game.players[0].hand = [{ instanceId: "rhea_hand", cardId: "dragon_rheastrasza", owner: 0, origin: "starting_deck" }];
    expect(() => applyGameAction(game, "A", { type: "play_card", handInstanceId: "rhea_hand" }, sampleCards)).toThrow("法力不足");
  });
});
