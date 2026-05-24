import { describe, expect, it } from "vitest";
import type { CardDefinition, DeckDefinition } from "@dormstone/shared";
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

function testCard(input: Partial<CardDefinition> & Pick<CardDefinition, "id" | "name" | "class" | "type" | "cost">): CardDefinition {
  return {
    rarity: "common",
    text: "",
    keywords: [],
    effects: [],
    status: "published",
    collectible: true,
    version: 1,
    ...input
  };
}

describe("Dragon Highlander Druid", () => {
  it("registers the requested 40-card Renathal preset", () => {
    const template = getDeckTemplate("custom_dragon_highlander_druid");

    expect(template?.presetCardIds).toHaveLength(40);
    expect(template?.presetCardIds).toContain("dragon_rheastrasza");
    expect(template?.presetCardIds).toContain("dragon_eonar");
    expect(template?.sideboardCardIds).toHaveLength(3);
  });

  it("keeps a broad Pure Nest pool of collectible Druid and Neutral dragons", () => {
    const discoverable = sampleCards.filter((card) =>
      card.collectible &&
      card.type === "minion" &&
      card.races?.includes("DRAGON") &&
      (card.class === "druid" || card.class === "neutral") &&
      card.id !== "dragon_rheastrasza"
    );

    expect(discoverable.length).toBeGreaterThanOrEqual(18);
    expect(discoverable.map((card) => card.id)).toEqual(expect.arrayContaining([
      "dragon_emerald_explorer",
      "dragon_seeded_green_drake",
      "dragon_primordial_drake",
      "dragon_alexstrasza_lifebinder",
      "dragon_deathwing",
      "dragon_raid_boss_onyxia"
    ]));
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

  it("limits Pure Nest discovery to Druid and Neutral dragon cards", () => {
    const cards: CardDefinition[] = [
      testCard({ id: "neutral_squire", name: "街巷新兵", class: "neutral", type: "minion", cost: 1, attack: 1, health: 2 }),
      testCard({ id: "dragon_pure_nest", name: "纯净龙巢", class: "druid", type: "minion", cost: 11, attack: 0, health: 1, rules: ["dragon_pure_nest"], collectible: false }),
      testCard({ id: "dragon_rheastrasza", name: "瑞亚丝塔萨", class: "druid", type: "minion", cost: 8, attack: 8, health: 8, races: ["DRAGON"] }),
      testCard({ id: "druid_dragon", name: "德鲁伊测试龙", class: "druid", type: "minion", cost: 7, attack: 7, health: 7, races: ["DRAGON"] }),
      testCard({ id: "neutral_dragon", name: "中立测试龙", class: "neutral", type: "minion", cost: 5, attack: 5, health: 5, races: ["DRAGON"] }),
      testCard({ id: "mage_dragon", name: "法师测试龙", class: "mage", type: "minion", cost: 4, attack: 4, health: 4, races: ["DRAGON"] }),
      testCard({ id: "priest_dragon", name: "牧师测试龙", class: "priest", type: "minion", cost: 3, attack: 3, health: 3, races: ["DRAGON"] }),
      testCard({ id: "warrior_dragon", name: "战士测试龙", class: "warrior", type: "minion", cost: 2, attack: 2, health: 2, races: ["DRAGON"] })
    ];
    const game = createGame("PURENESTPOOL", [
      { nickname: "A", class: "druid", deck: deck("A", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "mage", deck: deck("B", Array(30).fill("neutral_squire")) }
    ], cards, 91);
    game.phase = "playing";
    game.currentPlayer = 1;
    game.turn = 8;
    game.players[0].board = [{
      instanceId: "nest",
      cardId: "dragon_pure_nest",
      owner: 0,
      origin: "generated",
      attack: 0,
      health: 1,
      maxHealth: 1,
      keywords: [],
      exhausted: true,
      summonedTurn: 7,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0,
      cannotAttack: true,
      untouchable: true
    }];
    const catalog = new Map(cards.map((card) => [card.id, card]));

    applyGameAction(game, "B", { type: "end_turn" }, cards);

    expect(game.pendingChoice?.kind).toBe("discover_to_hand");
    expect(game.pendingChoice?.options.map((option) => option.cardId).sort()).toEqual(["druid_dragon", "neutral_dragon"]);
    for (const option of game.pendingChoice?.options ?? []) {
      const card = catalog.get(option.cardId)!;
      expect(card.class === "druid" || card.class === "neutral").toBe(true);
      expect(card.races).toContain("DRAGON");
      expect(option.costOverride).toBe(Math.max(0, card.cost - 4));
    }
  });

  it("lets Emerald Explorer discover from the expanded Druid and Neutral dragon pool", () => {
    const game = liveGame();
    const catalog = new Map(sampleCards.map((card) => [card.id, card]));
    game.players[0].mana = 6;
    game.players[0].hand = [{ instanceId: "emerald", cardId: "dragon_emerald_explorer", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "emerald" }, sampleCards);

    expect(game.pendingChoice?.kind).toBe("discover_to_hand");
    expect(game.pendingChoice?.options).toHaveLength(3);
    for (const option of game.pendingChoice?.options ?? []) {
      const card = catalog.get(option.cardId)!;
      expect(card.type).toBe("minion");
      expect(card.races).toContain("DRAGON");
      expect(card.class === "druid" || card.class === "neutral").toBe(true);
      expect(option.costOverride).toBe(card.cost);
    }
  });

  it("applies several newly added dragon battlecries", () => {
    const game = liveGame();
    game.players[0].mana = 10;
    game.players[0].hand = [
      { instanceId: "primordial", cardId: "dragon_primordial_drake", owner: 0, origin: "starting_deck" },
      { instanceId: "filler", cardId: "dragon_bronze_whelp", owner: 0, origin: "starting_deck" }
    ];
    game.players[0].board = [{
      instanceId: "friendly",
      cardId: "neutral_squire",
      owner: 0,
      origin: "generated",
      attack: 1,
      health: 4,
      maxHealth: 4,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];
    game.players[1].board = [{
      instanceId: "enemy",
      cardId: "neutral_squire",
      owner: 1,
      origin: "generated",
      attack: 1,
      health: 4,
      maxHealth: 4,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "primordial" }, sampleCards);

    expect(game.players[0].board.find((minion) => minion.instanceId === "friendly")?.health).toBe(2);
    expect(game.players[1].board.find((minion) => minion.instanceId === "enemy")?.health).toBe(2);
    expect(game.players[0].board.find((minion) => minion.cardId === "dragon_primordial_drake")?.health).toBe(8);

    game.players[0].mana = 10;
    game.players[0].hand = [
      { instanceId: "deathwing", cardId: "dragon_deathwing", owner: 0, origin: "starting_deck" },
      { instanceId: "discarded", cardId: "dragon_bronze_whelp", owner: 0, origin: "starting_deck" }
    ];
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "deathwing" }, sampleCards);

    expect(game.players[0].board.map((minion) => minion.cardId)).toEqual(["dragon_deathwing"]);
    expect(game.players[1].board).toHaveLength(0);
    expect(game.players[0].graveyard).toContain("dragon_bronze_whelp");
  });

  it("resolves new dragon deathrattles into real dragon cards", () => {
    const game = liveGame();
    game.players[0].board = [{
      instanceId: "seeded",
      cardId: "dragon_seeded_green_drake",
      owner: 0,
      origin: "generated",
      attack: 4,
      health: 1,
      maxHealth: 4,
      keywords: ["taunt", "deathrattle"],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];
    game.players[0].hand = [{ instanceId: "blast", cardId: "neutral_blast", owner: 0, origin: "starting_deck" }];
    game.players[0].mana = 4;

    applyGameAction(game, "A", {
      type: "play_card",
      handInstanceId: "blast",
      target: { type: "minion", seat: 0, instanceId: "seeded" }
    }, sampleCards);

    const generatedDragon = game.players[0].hand.at(-1)!;
    const generatedCard = sampleCards.find((card) => card.id === generatedDragon.cardId)!;
    expect(generatedCard.races).toContain("DRAGON");
    expect(generatedCard.class === "druid" || generatedCard.class === "neutral").toBe(true);
    expect(generatedDragon.costOverride).toBe(Math.max(0, generatedCard.cost - 2));
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
