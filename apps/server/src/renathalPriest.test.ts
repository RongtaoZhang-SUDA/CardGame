import { describe, expect, it } from "vitest";
import type { BoardMinion, DeckDefinition, GameState } from "@dormstone/shared";
import { validateDeck } from "@dormstone/shared";
import { applyGameAction, createGame } from "./engine.js";
import { renathalPriestDeckCardIds, renathalPriestSideboardCardIds, renathalPriestTemplate } from "./renathalPriest.js";
import { sampleCards } from "./sampleCards.js";

function deck(owner: string, deckClass: DeckDefinition["class"], cardIds: string[]): DeckDefinition {
  return {
    id: `${owner}_${deckClass}`,
    owner,
    name: "测试卡组",
    class: deckClass,
    cardIds,
    sideboardCardIds: [],
    updatedAt: new Date().toISOString()
  };
}

function readyGame(seed = 500): GameState {
  const game = createGame("RENO_RULES", [
    { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
    { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
  ], sampleCards, seed);
  game.phase = "playing";
  game.turn = 10;
  game.currentPlayer = 0;
  for (const player of game.players) {
    player.hand = [];
    player.board = [];
    player.deck = [];
    player.maxMana = 10;
    player.mana = 10;
    player.hero.heroPowerUsed = false;
  }
  return game;
}

function boardMinion(instanceId: string, cardId: string, owner: 0 | 1, attack = 1, health = 1): BoardMinion {
  return {
    instanceId,
    cardId,
    owner,
    attack,
    health,
    maxHealth: health,
    keywords: [],
    exhausted: false,
    summonedTurn: 1,
    attacksThisTurn: 0,
    silenced: false,
    temporaryAttack: 0
  };
}

describe("Renathal highlander priest preset", () => {
  it("uses the screenshot deck as the main forty cards and updated E.T.C. band", () => {
    expect(renathalPriestDeckCardIds).toEqual([
      "reno_priest_raise_dead",
      "reno_priest_chameleos",
      "reno_priest_nightshade_tea",
      "reno_priest_psychic_conjurer",
      "reno_priest_mend",
      "reno_priest_power_word_barrier",
      "reno_priest_deafen",
      "reno_priest_papercraft_angel",
      "reno_priest_creation_protocol",
      "reno_priest_banker",
      "reno_priest_dirty_rat",
      "reno_priest_kaldorei_spirit",
      "reno_priest_thoughtsteal",
      "reno_priest_shadow_word_death",
      "reno_priest_power_chord_synchronize",
      "reno_priest_cozy_voljin",
      "reno_priest_lazul",
      "reno_priest_zola",
      "reno_priest_etc",
      "reno_priest_renathal",
      "reno_priest_twilight_torrent",
      "reno_priest_nameless_one",
      "reno_priest_puppet_theatre",
      "reno_priest_glowstone_worm",
      "reno_priest_mind_control_tech",
      "reno_priest_shadow_word_ruin",
      "reno_priest_repackage",
      "reno_priest_zilliax_deluxe_3000",
      "reno_priest_ignis",
      "reno_priest_theotar",
      "reno_priest_reno_jackson",
      "reno_priest_harmonic_pop",
      "reno_priest_lightbomb",
      "reno_priest_elise_badlands",
      "reno_priest_marin_manager",
      "reno_priest_lone_ranger_reno",
      "reno_priest_amanthul",
      "reno_priest_yogg_unleashed",
      "reno_priest_ceaseless_expanse",
      "reno_priest_ysera_emerald"
    ]);
    expect(renathalPriestSideboardCardIds).toEqual([
      "reno_priest_puppet_theatre",
      "reno_band_photographer_fizzle",
      "reno_band_kiljaeden"
    ]);
    expect(validateDeck({
      class: "priest",
      cardIds: renathalPriestTemplate.presetCardIds ?? [],
      sideboardCardIds: renathalPriestTemplate.sideboardCardIds
    }, sampleCards).errors).toEqual([]);
  });

  it("applies Ysera Emerald's start-of-game mana cap increase", () => {
    const priestDeck = deck("A", "priest", [
      "reno_priest_ysera_emerald",
      "reno_priest_renathal",
      ...Array(38).fill("neutral_squire")
    ]);
    const game = createGame("YSERA", [
      { nickname: "A", class: "priest", deck: priestDeck },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("roar_chillwind_yeti")) }
    ], sampleCards, 404);

    expect(game.players[0].manaCap).toBe(15);
    expect(game.players[1].manaCap).toBe(15);
  });

  it("forges cards as a separate 2-mana hand action", () => {
    const game = readyGame(501);
    game.players[0].hand = [{ instanceId: "protocol", cardId: "reno_priest_creation_protocol", owner: 0, origin: "starting_deck" }];
    game.players[0].deck = [{ instanceId: "deck_minion", cardId: "reno_priest_kaldorei_spirit", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "forge_card", handInstanceId: "protocol" }, sampleCards);

    expect(game.players[0].mana).toBe(8);
    expect(game.players[0].hand[0].forged).toBe(true);
    expect(game.players[0].forgedThisGame).toBe(true);
    expect(() => applyGameAction(game, "A", { type: "forge_card", handInstanceId: "protocol" }, sampleCards)).toThrow("已经锻造");
  });

  it("buffs Kaldorei Spirit by +3/+3 after using a hero power this turn", () => {
    const game = readyGame(502);
    game.players[0].hero.heroPowerCardId = "hero_power_warrior";
    game.players[0].hand = [{ instanceId: "kaldorei", cardId: "reno_priest_kaldorei_spirit", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "hero_power" }, sampleCards);
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "kaldorei" }, sampleCards);

    expect(game.players[0].board[0].attack).toBe(4);
    expect(game.players[0].board[0].health).toBe(6);
    expect(game.players[0].board[0].maxHealth).toBe(6);
  });

  it("uses Aman'Thul as a Titan ability after entering play, not as a battlecry", () => {
    const game = readyGame(503);
    game.players[0].hand = [{ instanceId: "amanthul", cardId: "reno_priest_amanthul", owner: 0, origin: "starting_deck" }];
    game.players[1].board = [boardMinion("enemy", "neutral_squire", 1, 1, 2)];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "amanthul" }, sampleCards);

    const titan = game.players[0].board[0];
    expect(game.pendingChoice).toBeUndefined();
    expect(() => applyGameAction(game, "A", { type: "attack", source: { type: "minion", seat: 0, instanceId: titan.instanceId }, target: { type: "hero", seat: 1 } }, sampleCards)).toThrow("不能攻击");

    applyGameAction(game, "A", { type: "use_titan_ability", minionInstanceId: titan.instanceId }, sampleCards);
    expect(game.pendingChoice?.kind).toBe("titan_ability");
    const copyOption = game.pendingChoice!.options.find((option) => option.cardId === "reno_choice_amanthul_copy")!;
    applyGameAction(game, "A", {
      type: "choose",
      choiceId: game.pendingChoice!.id,
      optionInstanceId: copyOption.instanceId,
      target: { type: "minion", seat: 1, instanceId: "enemy" }
    }, sampleCards);

    expect(titan.usedTitanAbilityCardIds).toContain("reno_choice_amanthul_copy");
    expect(titan.titanAbilityUsedTurn).toBe(game.turn);
    expect(game.players[0].board.some((minion) => minion.cardId === "neutral_squire" && minion.attack === 3 && minion.maxHealth === 4)).toBe(true);
  });

  it("removes minions with Lone Ranger Reno without triggering deathrattles", () => {
    const game = readyGame(504);
    game.players[0].hand = [{ instanceId: "reno", cardId: "reno_priest_lone_ranger_reno", owner: 0, origin: "starting_deck" }];
    game.players[1].board = [boardMinion("salvager", "gearwright_salvager", 1, 3, 5)];
    game.players[1].deck = [{ instanceId: "enemy_draw", cardId: "neutral_squire", owner: 1, origin: "starting_deck" }];
    game.players[1].hand = [];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "reno" }, sampleCards);

    expect(game.players[1].board).toHaveLength(0);
    expect(game.players[1].hand).toHaveLength(0);
    expect(game.players[1].graveyard).toContain("gearwright_salvager");
  });
});
