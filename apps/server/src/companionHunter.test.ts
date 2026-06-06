import { describe, expect, it } from "vitest";
import type { DeckDefinition } from "@dormstone/shared";
import { companionHunterDeckCardIds } from "./companionHunter.js";
import { getDeckTemplate } from "./deckTemplates.js";
import { applyGameAction, createGame, toPublicGameState } from "./engine.js";
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
  it("registers the requested 30-card deck template from the screenshot", () => {
    const catalog = new Map(sampleCards.map((card) => [card.id, card]));
    const template = getDeckTemplate("custom_companion_hunter");

    expect(template?.nameZh).toBe("伙伴猎");
    expect(template?.presetCardIds).toEqual(companionHunterDeckCardIds);
    expect(companionHunterDeckCardIds).toEqual([
      "companion_hunter_tame_beast",
      "companion_hunter_tame_beast",
      "companion_hunter_raptor_nest_caretaker",
      "companion_hunter_raptor_nest_caretaker",
      "companion_hunter_migrating_elekk",
      "companion_hunter_migrating_elekk",
      "companion_hunter_face_the_tolvir",
      "companion_hunter_face_the_tolvir",
      "companion_hunter_vereesa",
      "companion_hunter_niri",
      "companion_hunter_spirit_bond_hunter",
      "companion_hunter_spirit_bond_hunter",
      "companion_hunter_broll",
      "companion_hunter_free_roam",
      "companion_hunter_free_roam",
      "companion_hunter_call_of_the_wild",
      "companion_hunter_call_of_the_wild",
      "companion_hunter_wound_prey",
      "companion_hunter_wound_prey",
      "companion_hunter_little_critter_caretaker",
      "companion_hunter_little_critter_caretaker",
      "companion_hunter_animal_companion",
      "companion_hunter_animal_companion",
      "companion_hunter_aurelia",
      "companion_hunter_sylvanas",
      "companion_hunter_archbishop_nelle",
      "companion_hunter_taya",
      "companion_hunter_beaststalker_tavish",
      "companion_hunter_heart_of_stranglethorn",
      "companion_hunter_zuljin"
    ]);
    expect(companionHunterDeckCardIds.filter((cardId) => !catalog.has(cardId))).toEqual([]);
    expect(companionHunterDeckCardIds).not.toContain("companion_hunter_tracking");
    expect(companionHunterDeckCardIds).not.toContain("companion_hunter_blazing_cinder");
    expect(companionHunterDeckCardIds).not.toContain("companion_hunter_sands_of_time");
    expect(companionHunterDeckCardIds).not.toContain("companion_hunter_mad_alchemist");
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
    expect(game.players[0].animalCompanionReplacementPools?.["4"]).toHaveLength(3);
    expect(game.players[0].animalCompanionReplacementPools?.["4"]).toContain(summoned.cardId);
    expect(summoned.cardId.startsWith("companion_token_")).toBe(false);
    expect(summonedCard?.races).toContain("BEAST");
    expect(summonedCard?.cost).toBe(4);
  });

  it("uses a fixed three-Beast pool for each upgraded Animal Companion cost", () => {
    const game = gameForCompanion(123);
    game.players[0].hand = [
      { instanceId: "tame", cardId: "companion_hunter_tame_beast", owner: 0 },
      { instanceId: "animal1", cardId: "companion_hunter_animal_companion", owner: 0 },
      { instanceId: "animal2", cardId: "companion_hunter_animal_companion", owner: 0 },
      { instanceId: "elekk", cardId: "companion_hunter_migrating_elekk", owner: 0 },
      { instanceId: "animal3", cardId: "companion_hunter_animal_companion", owner: 0 }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "tame" }, sampleCards);
    const fourCostPool = [...(game.players[0].animalCompanionReplacementPools?.["4"] ?? [])];
    game.players[0].mana = 10;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "animal1" }, sampleCards);
    game.players[0].mana = 10;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "animal2" }, sampleCards);

    expect(fourCostPool).toHaveLength(3);
    expect(game.players[0].board.slice(0, 2).every((minion) => fourCostPool.includes(minion.cardId))).toBe(true);

    game.players[0].mana = 10;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "elekk" }, sampleCards);
    expect(game.players[0].animalCompanionReplacementCost).toBe(5);
    const fiveCostPool = game.players[0].animalCompanionReplacementPools?.["5"] ?? [];
    expect(fiveCostPool).toHaveLength(3);
    expect(toPublicGameState(game, "A").players[0].animalCompanionReplacementPools?.["4"]).toEqual(fourCostPool);
    expect(toPublicGameState(game, "B").players[0].animalCompanionReplacementPools).toBeUndefined();
    game.players[0].mana = 10;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "animal3" }, sampleCards);
    expect(fiveCostPool).toContain(game.players[0].board.at(-1)?.cardId);
  });

  it("shows upgraded Beast pool options for Spirit Bond Hunter", () => {
    const game = gameForCompanion(321);
    game.players[0].hand = [
      { instanceId: "tame", cardId: "companion_hunter_tame_beast", owner: 0 },
      { instanceId: "spirit", cardId: "companion_hunter_spirit_bond_hunter", owner: 0 }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "tame" }, sampleCards);
    const fourCostPool = [...(game.players[0].animalCompanionReplacementPools?.["4"] ?? [])];
    game.players[0].mana = 10;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "spirit" }, sampleCards);

    const choice = game.pendingChoice;
    expect(choice?.kind).toBe("animal_companion_pool");
    expect(choice?.options.map((option) => option.cardId).sort()).toEqual([...fourCostPool].sort());
    expect(choice?.options.some((option) => option.cardId.startsWith("companion_choice_"))).toBe(false);

    const picked = choice!.options[0];
    applyGameAction(game, "A", { type: "choose", choiceId: choice!.id, optionInstanceId: picked.instanceId }, sampleCards);

    expect(game.players[0].board.some((minion) => minion.cardId === picked.cardId)).toBe(true);
    expect(game.players[0].board.some((minion) => minion.cardId.startsWith("companion_token_"))).toBe(false);
  });

  it("implements Wound Prey damage plus a rushing Beast token", () => {
    const game = gameForCompanion();
    game.players[0].hand = [{ instanceId: "prey", cardId: "companion_hunter_wound_prey", owner: 0 }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "prey", target: { type: "hero", seat: 1 } }, sampleCards);

    expect(game.players[1].hero.health).toBe(29);
    expect(game.players[0].board[0].cardId).toBe("companion_token_hyena");
    expect(game.players[0].board[0].keywords).toContain("rush");
  });

  it("triggers Broll after a spell even when that spell opens a Discover choice", () => {
    const game = gameForCompanion();
    game.players[0].hand = [
      { instanceId: "broll", cardId: "companion_hunter_broll", owner: 0 },
      { instanceId: "tracking", cardId: "companion_hunter_tracking", owner: 0 }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "broll" }, sampleCards);
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "tracking" }, sampleCards);

    expect(game.pendingChoice?.kind).toBe("dragon_wave_shaper");
    expect(game.players[0].board.some((minion) => minion.cardId === "companion_hunter_broll")).toBe(true);
    expect(game.players[0].board.some((minion) => minion.cardId.startsWith("companion_token_"))).toBe(true);
  });

  it("lets Archbishop Nelle replace the hero power with Tracking", () => {
    const game = gameForCompanion();
    game.players[0].hand = [{ instanceId: "nelle", cardId: "companion_hunter_archbishop_nelle", owner: 0 }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "nelle" }, sampleCards);

    expect(game.players[0].hero.heroPowerCardId).toBe("hero_power_hunter_tracking");
    expect(game.players[0].hero.heroPowerCost).toBe(1);
  });

  it("lets Beaststalker Tavish replace the hero power with an animal companion power", () => {
    const game = gameForCompanion();
    game.players[0].hand = [{ instanceId: "tavish", cardId: "companion_hunter_beaststalker_tavish", owner: 0 }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "tavish" }, sampleCards);
    applyGameAction(game, "A", { type: "hero_power" }, sampleCards);

    expect(game.players[0].hero.heroPowerCardId).toBe("hero_power_tavish_beast_companion");
    expect(game.players[0].secrets).toHaveLength(2);
    expect(game.players[0].board.some((minion) => minion.cardId.startsWith("companion_token_"))).toBe(true);
  });

  it("returns an opponent spell to hand with Improved Frost Trap", () => {
    const game = gameForCompanion();
    game.currentPlayer = 1;
    game.players[0].secrets = [{ instanceId: "frost", cardId: "hunter_secret_improved_frost_trap", owner: 0 }];
    game.players[1].hand = [{ instanceId: "prey", cardId: "companion_hunter_wound_prey", owner: 1 }];

    applyGameAction(game, "B", { type: "play_card", handInstanceId: "prey", target: { type: "hero", seat: 0 } }, sampleCards);

    expect(game.players[0].hero.health).toBe(30);
    expect(game.players[1].hand).toMatchObject([{ cardId: "companion_hunter_wound_prey", costOverride: 3 }]);
    expect(game.players[0].secrets).toHaveLength(0);
  });

  it("triggers Improved Explosive Trap when the hero is attacked", () => {
    const game = gameForCompanion();
    game.currentPlayer = 1;
    game.players[0].secrets = [{ instanceId: "explosive", cardId: "hunter_secret_improved_explosive_trap", owner: 0 }];
    game.players[1].hero.weapon = { cardId: "test_weapon", attack: 1, durability: 1 };
    game.players[1].board = [
      { instanceId: "squire", cardId: "neutral_squire", owner: 1, attack: 1, health: 2, maxHealth: 2, keywords: [], exhausted: false, summonedTurn: 0, attacksThisTurn: 0, silenced: false, temporaryAttack: 0 }
    ];

    applyGameAction(game, "B", { type: "attack", source: { type: "hero", seat: 1 }, target: { type: "hero", seat: 0 } }, sampleCards);

    expect(game.players[1].hero.health).toBe(28);
    expect(game.players[1].board).toHaveLength(0);
    expect(game.players[0].secrets).toHaveLength(0);
  });

  it("triggers Improved Snake Trap and Improved Pack Tactics when a friendly minion is attacked", () => {
    const game = gameForCompanion();
    game.currentPlayer = 1;
    game.players[0].secrets = [
      { instanceId: "snake", cardId: "hunter_secret_improved_snake_trap", owner: 0 },
      { instanceId: "pack", cardId: "hunter_secret_improved_pack_tactics", owner: 0 }
    ];
    game.players[0].board = [
      { instanceId: "target", cardId: "neutral_squire", owner: 0, attack: 1, health: 3, maxHealth: 3, keywords: [], exhausted: false, summonedTurn: 0, attacksThisTurn: 0, silenced: false, temporaryAttack: 0 }
    ];
    game.players[1].board = [
      { instanceId: "attacker", cardId: "neutral_squire", owner: 1, attack: 1, health: 3, maxHealth: 3, keywords: [], exhausted: false, summonedTurn: 0, attacksThisTurn: 0, silenced: false, temporaryAttack: 0 }
    ];

    applyGameAction(game, "B", { type: "attack", source: { type: "minion", seat: 1, instanceId: "attacker" }, target: { type: "minion", seat: 0, instanceId: "target" } }, sampleCards);

    expect(game.players[0].board.filter((minion) => minion.cardId === "hunter_token_improved_snake")).toHaveLength(3);
    expect(game.players[0].board.filter((minion) => minion.cardId === "neutral_squire" && minion.attack === 3 && minion.maxHealth === 3)).toHaveLength(2);
    expect(game.players[0].secrets).toHaveLength(0);
  });

  it("triggers Improved Open the Cages at the start of its owner's turn", () => {
    const game = gameForCompanion();
    game.currentPlayer = 1;
    game.players[0].secrets = [{ instanceId: "cages", cardId: "hunter_secret_improved_open_the_cages", owner: 0 }];
    game.players[0].board = [
      { instanceId: "one", cardId: "neutral_squire", owner: 0, attack: 1, health: 1, maxHealth: 1, keywords: [], exhausted: false, summonedTurn: 0, attacksThisTurn: 0, silenced: false, temporaryAttack: 0 },
      { instanceId: "two", cardId: "neutral_squire", owner: 0, attack: 1, health: 1, maxHealth: 1, keywords: [], exhausted: false, summonedTurn: 0, attacksThisTurn: 0, silenced: false, temporaryAttack: 0 }
    ];

    applyGameAction(game, "B", { type: "end_turn" }, sampleCards);

    expect(game.players[0].secrets).toHaveLength(0);
    expect(game.players[0].board.filter((minion) => minion.cardId.startsWith("companion_token_"))).toHaveLength(2);
  });

  it("resurrects dead 5-cost or higher friendly Beasts with Heart of Stranglethorn", () => {
    const game = gameForCompanion();
    game.players[0].graveyard = ["companion_beast_stranglethorn_tiger", "companion_beast_oasis_snapjaw", "companion_beast_king_krush"];
    game.players[0].hand = [{ instanceId: "heart", cardId: "companion_hunter_heart_of_stranglethorn", owner: 0 }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "heart" }, sampleCards);

    expect(game.players[0].board.map((minion) => minion.cardId)).toEqual([
      "companion_beast_stranglethorn_tiger",
      "companion_beast_king_krush"
    ]);
  });

  it("replays hunter spells with Zul'jin", () => {
    const game = gameForCompanion();
    game.players[0].hunterSpellsCastThisGame = ["companion_hunter_animal_companion", "companion_hunter_wound_prey"];
    game.players[0].hand = [{ instanceId: "zuljin", cardId: "companion_hunter_zuljin", owner: 0 }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "zuljin" }, sampleCards);

    expect(game.players[1].hero.health).toBe(29);
    expect(game.players[0].board.some((minion) => minion.cardId.startsWith("companion_token_"))).toBe(true);
    expect(game.players[0].board.some((minion) => minion.cardId === "companion_token_hyena")).toBe(true);
  });
});
