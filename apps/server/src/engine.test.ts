import { describe, expect, it } from "vitest";
import type { CardDefinition, DeckDefinition } from "@dormstone/shared";
import { applyGameAction, createGame, toPublicGameState } from "./engine.js";
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

describe("game engine", () => {
  it("starts after both players finish mulligan and lets current player play a minion", () => {
    const game = createGame("TEST", [
      { nickname: "A", class: "warden", deck: deck("A", "warden", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "arcanist", deck: deck("B", "arcanist", Array(30).fill("neutral_squire")) }
    ], sampleCards, 7);
    const firstSeat = game.currentPlayer;

    applyGameAction(game, "A", { type: "mulligan", cardInstanceIds: [] }, sampleCards);
    applyGameAction(game, "B", { type: "mulligan", cardInstanceIds: [] }, sampleCards);

    expect(game.phase).toBe("playing");
    expect(game.currentPlayer).toBe(firstSeat);
    const currentPlayer = game.players[firstSeat];
    const handCard = currentPlayer.hand[0];
    applyGameAction(game, currentPlayer.nickname, { type: "play_card", handInstanceId: handCard.instanceId }, sampleCards);
    expect(currentPlayer.board).toHaveLength(1);
    expect(currentPlayer.mana).toBe(0);
  });

  it("randomizes who starts and gives the second player the coin", () => {
    const firstSeats = new Set<number>();

    for (let seed = 1; seed <= 32; seed += 1) {
      const game = createGame("START", [
        { nickname: "A", class: "warden", deck: deck("A", "warden", Array(30).fill("neutral_squire")) },
        { nickname: "B", class: "arcanist", deck: deck("B", "arcanist", Array(30).fill("neutral_squire")) }
      ], sampleCards, seed);
      const firstSeat = game.currentPlayer;
      const secondSeat = firstSeat === 0 ? 1 : 0;

      firstSeats.add(firstSeat);
      expect(game.players[firstSeat].hand).toHaveLength(3);
      expect(game.players[secondSeat].hand).toHaveLength(5);
      expect(game.players[secondSeat].hand.some((card) => card.cardId === "coin")).toBe(true);
    }

    expect(firstSeats).toEqual(new Set([0, 1]));
  });

  it("enforces taunt before hero attacks", () => {
    const game = createGame("TEST", [
      { nickname: "A", class: "warden", deck: deck("A", "warden", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "arcanist", deck: deck("B", "arcanist", Array(30).fill("neutral_guard")) }
    ], sampleCards, 9);

    applyGameAction(game, "A", { type: "mulligan", cardInstanceIds: [] }, sampleCards);
    applyGameAction(game, "B", { type: "mulligan", cardInstanceIds: [] }, sampleCards);
    game.players[0].board.push({
      instanceId: "attacker",
      cardId: "neutral_squire",
      owner: 0,
      attack: 1,
      health: 2,
      maxHealth: 2,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });
    game.players[1].board.push({
      instanceId: "taunt",
      cardId: "neutral_guard",
      owner: 1,
      attack: 2,
      health: 3,
      maxHealth: 3,
      keywords: ["taunt"],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });

    expect(() =>
      applyGameAction(game, "A", { type: "attack", source: { type: "minion", seat: 0, instanceId: "attacker" }, target: { type: "hero", seat: 1 } }, sampleCards)
    ).toThrow("嘲讽");
  });

  it("allows rush minions to attack minions but not heroes on the summoned turn", () => {
    const game = createGame("RUSH", [
      { nickname: "A", class: "warden", deck: deck("A", "warden", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "arcanist", deck: deck("B", "arcanist", Array(30).fill("neutral_squire")) }
    ], sampleCards, 10);
    game.phase = "playing";
    game.turn = 3;
    game.currentPlayer = 0;
    game.players[0].mana = 3;
    game.players[0].hand = [{ instanceId: "runner", cardId: "neutral_runner", owner: 0, origin: "starting_deck" }];
    game.players[1].board.push({
      instanceId: "target",
      cardId: "neutral_squire",
      owner: 1,
      attack: 1,
      health: 2,
      maxHealth: 2,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "runner" }, sampleCards);
    const runner = game.players[0].board.find((minion) => minion.cardId === "neutral_runner")!;

    expect(() =>
      applyGameAction(game, "A", { type: "attack", source: { type: "minion", seat: 0, instanceId: runner.instanceId }, target: { type: "hero", seat: 1 } }, sampleCards)
    ).toThrow("现在不能攻击");
    applyGameAction(game, "A", { type: "attack", source: { type: "minion", seat: 0, instanceId: runner.instanceId }, target: { type: "minion", seat: 1, instanceId: "target" } }, sampleCards);
    expect(runner.attacksThisTurn).toBe(1);
  });

  it("allows charge minions to attack heroes on the summoned turn", () => {
    const game = createGame("CHARGE", [
      { nickname: "A", class: "death_knight", deck: deck("A", "death_knight", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "arcanist", deck: deck("B", "arcanist", Array(30).fill("neutral_squire")) }
    ], sampleCards, 11);
    game.phase = "playing";
    game.turn = 3;
    game.currentPlayer = 0;
    game.players[0].mana = 2;

    applyGameAction(game, "A", { type: "hero_power" }, sampleCards);
    const ghoul = game.players[0].board.find((minion) => minion.cardId === "token_ghoul")!;
    applyGameAction(game, "A", { type: "attack", source: { type: "minion", seat: 0, instanceId: ghoul.instanceId }, target: { type: "hero", seat: 1 } }, sampleCards);

    expect(game.players[1].hero.health).toBe(29);
    expect(ghoul.attacksThisTurn).toBe(1);
  });

  it("starts Renathal decks at 40 Health and consumes an E.T.C. band choice", () => {
    const renathalDeck = deck("A", "priest", [
      "reno_priest_renathal",
      "reno_priest_etc",
      ...Array(38).fill("neutral_squire")
    ]);
    renathalDeck.sideboardCardIds = ["reno_band_rustrot_viper", "reno_band_steamcleaner", "reno_priest_theotar"];
    const game = createGame("BAND", [
      { nickname: "A", class: "priest", deck: renathalDeck },
      { nickname: "B", class: "arcanist", deck: deck("B", "arcanist", Array(30).fill("neutral_squire")) }
    ], sampleCards, 15);

    expect(game.players[0].hero.health).toBe(40);
    game.phase = "playing";
    game.turn = 1;
    game.currentPlayer = 0;
    game.players[0].mana = 10;
    game.players[0].hand = [{ instanceId: "etc_hand", cardId: "reno_priest_etc", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "etc_hand" }, sampleCards);
    expect(game.pendingChoice?.kind).toBe("etc_band");
    const choice = game.pendingChoice!;
    applyGameAction(game, "A", { type: "choose", choiceId: choice.id, optionInstanceId: choice.options[0].instanceId }, sampleCards);

    expect(game.pendingChoice).toBeUndefined();
    expect(game.players[0].sideboard).toHaveLength(2);
    expect(game.players[0].hand).toHaveLength(1);
  });

  it("makes cards cost at least two against Razorscale", () => {
    const game = createGame("RAZOR", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("reno_priest_tight_lipped")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 45);
    game.phase = "playing";
    game.turn = 1;
    game.currentPlayer = 1;
    game.players[0].board = [{
      instanceId: "razorscale",
      cardId: "reno_priest_tight_lipped",
      owner: 0,
      attack: 2,
      health: 4,
      maxHealth: 4,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];
    game.players[1].mana = 1;
    game.players[1].hand = [{ instanceId: "coin_hand", cardId: "coin", owner: 1, origin: "generated" }];

    expect(() => applyGameAction(game, "B", { type: "play_card", handInstanceId: "coin_hand" }, sampleCards)).toThrow("法力不足");
    expect(game.players[1].hand).toHaveLength(1);
  });

  it("keeps Renathal Priest preset effects backed by engine metadata", () => {
    const priestCards = sampleCards.filter((card) => card.id.startsWith("reno_priest_") && card.collectible);
    const inert = priestCards.filter((card) =>
      card.effects.length === 0
      && !card.rules?.length
      && !card.choiceOptionCardIds?.length
      && !card.titanAbilityCardIds?.length
      && !card.deckRules
      && card.keywords.length === 0
    );

    expect(inert.map((card) => card.id)).toEqual([]);
  });

  it("lets Raza discount hero powers and Shadowreaper replace Lesser Heal", () => {
    const game = createGame("SHADOW", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 51);
    game.phase = "playing";
    game.turn = 8;
    game.currentPlayer = 0;
    game.players[0].deck = [];
    game.players[0].mana = 13;
    game.players[0].hand = [
      { instanceId: "raza", cardId: "reno_priest_raza", owner: 0, origin: "starting_deck" },
      { instanceId: "shadowreaper", cardId: "reno_priest_shadowreaper", owner: 0, origin: "starting_deck" }
    ];
    game.players[1].board = [{
      instanceId: "large",
      cardId: "neutral_colossus",
      owner: 1,
      attack: 7,
      health: 7,
      maxHealth: 7,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "raza" }, sampleCards);
    expect(game.players[0].hero.heroPowerCost).toBe(0);

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "shadowreaper" }, sampleCards);
    expect(game.players[1].board).toHaveLength(0);
    expect(game.players[0].hero.heroPowerCardId).toBe("hero_power_voidform");

    applyGameAction(game, "A", { type: "hero_power", target: { type: "hero", seat: 1 } }, sampleCards);
    expect(game.players[1].hero.health).toBe(28);
  });

  it("lets Mind Spike target minions after Benedictus replaces the Priest hero power", () => {
    const benedictusDeck = deck("A", "priest", [
      "reno_priest_benedictus",
      ...Array(29).fill("neutral_squire")
    ]);
    const game = createGame("SPIKE", [
      { nickname: "A", class: "priest", deck: benedictusDeck },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 57);
    game.phase = "playing";
    game.turn = 3;
    game.currentPlayer = 0;
    game.players[0].mana = 2;
    game.players[1].board = [{
      instanceId: "spike_target",
      cardId: "neutral_guard",
      owner: 1,
      attack: 2,
      health: 3,
      maxHealth: 3,
      keywords: ["taunt"],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];

    expect(game.players[0].hero.heroPowerCardId).toBe("hero_power_mind_spike");
    applyGameAction(game, "A", { type: "hero_power", target: { type: "minion", seat: 1, instanceId: "spike_target" } }, sampleCards);

    expect(game.players[1].board[0].health).toBe(1);
    expect(game.players[1].hero.health).toBe(30);
  });

  it("keeps Nightshade Tea in hand until its third use", () => {
    const game = createGame("TEA", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 59);
    game.phase = "playing";
    game.turn = 3;
    game.currentPlayer = 0;
    game.players[0].mana = 3;
    game.players[0].hand = [{ instanceId: "tea", cardId: "reno_priest_nightshade_tea", owner: 0, origin: "starting_deck" }];
    game.players[1].board = [{
      instanceId: "tea_target",
      cardId: "neutral_colossus",
      owner: 1,
      attack: 7,
      health: 7,
      maxHealth: 7,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];
    const target = { type: "minion" as const, seat: 1 as const, instanceId: "tea_target" };

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "tea", target }, sampleCards);
    expect(game.players[0].hand).toEqual([{ instanceId: "tea", cardId: "reno_priest_nightshade_tea", owner: 0, origin: "starting_deck", remainingUses: 2 }]);
    expect(game.players[0].graveyard).not.toContain("reno_priest_nightshade_tea");

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "tea", target }, sampleCards);
    expect(game.players[0].hand[0].remainingUses).toBe(1);

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "tea", target }, sampleCards);
    expect(game.players[0].hand).toHaveLength(0);
    expect(game.players[0].graveyard).toContain("reno_priest_nightshade_tea");
    expect(game.players[0].hero.health).toBe(24);
    expect(game.players[1].board[0].health).toBe(1);
  });

  it("uses Puppet Theatre as a cooldown location that makes 1/1 copies", () => {
    const game = createGame("PUPPET", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 60);
    game.phase = "playing";
    game.turn = 4;
    game.currentPlayer = 0;
    game.players[0].mana = 10;
    game.players[0].hand = [{ instanceId: "theatre", cardId: "reno_priest_puppet_theatre", owner: 0, origin: "starting_deck" }];
    game.players[1].board = [
      {
        instanceId: "first_puppet_target",
        cardId: "neutral_colossus",
        owner: 1,
        attack: 7,
        health: 7,
        maxHealth: 7,
        keywords: [],
        exhausted: false,
        summonedTurn: 0,
        attacksThisTurn: 0,
        silenced: false,
        temporaryAttack: 0
      },
      {
        instanceId: "second_puppet_target",
        cardId: "neutral_guard",
        owner: 1,
        attack: 2,
        health: 3,
        maxHealth: 3,
        keywords: ["taunt"],
        exhausted: false,
        summonedTurn: 0,
        attacksThisTurn: 0,
        silenced: false,
        temporaryAttack: 0
      }
    ];

    const firstTarget = { type: "minion" as const, seat: 1 as const, instanceId: "first_puppet_target" };
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "theatre" }, sampleCards);
    expect(sampleCards.find((card) => card.id === "reno_priest_puppet_theatre")?.type).toBe("location");
    expect(game.players[0].locations[0]).toMatchObject({ cardId: "reno_priest_puppet_theatre", durability: 2, readyTurn: game.turn });
    const locationId = game.players[0].locations[0].instanceId;
    applyGameAction(game, "A", { type: "use_location", locationInstanceId: locationId, target: firstTarget }, sampleCards);

    const copy = game.players[0].hand.find((card) => card.cardId === "neutral_colossus")!;
    expect(copy).toMatchObject({ costOverride: 1, attackOverride: 1, healthOverride: 1 });
    applyGameAction(game, "A", { type: "play_card", handInstanceId: copy.instanceId }, sampleCards);
    expect(game.players[0].board[0]).toMatchObject({ cardId: "neutral_colossus", attack: 1, health: 1, maxHealth: 1 });
    expect(game.players[0].locations[0]).toMatchObject({ durability: 1, readyTurn: game.turn + 4 });
    expect(() => applyGameAction(game, "A", { type: "use_location", locationInstanceId: locationId, target: firstTarget }, sampleCards)).toThrow();

    applyGameAction(game, "A", { type: "end_turn" }, sampleCards);
    applyGameAction(game, "B", { type: "end_turn" }, sampleCards);
    expect(() => applyGameAction(game, "A", { type: "use_location", locationInstanceId: locationId, target: { type: "minion", seat: 1, instanceId: "second_puppet_target" } }, sampleCards)).toThrow();

    applyGameAction(game, "A", { type: "end_turn" }, sampleCards);
    applyGameAction(game, "B", { type: "end_turn" }, sampleCards);
    applyGameAction(game, "A", { type: "use_location", locationInstanceId: locationId, target: { type: "minion", seat: 1, instanceId: "second_puppet_target" } }, sampleCards);
    expect(game.players[0].locations).toHaveLength(0);
    expect(game.players[0].graveyard).toContain("reno_priest_puppet_theatre");
  });

  it("lets Lazul discover from three random enemy hand cards", () => {
    const game = createGame("LAZUL", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 602);
    game.phase = "playing";
    game.turn = 3;
    game.currentPlayer = 0;
    game.players[0].mana = 3;
    game.players[0].hand = [{ instanceId: "lazul", cardId: "reno_priest_lazul", owner: 0, origin: "starting_deck" }];
    game.players[1].hand = [
      { instanceId: "enemy_a", cardId: "neutral_squire", owner: 1, origin: "starting_deck" },
      { instanceId: "enemy_b", cardId: "neutral_guard", owner: 1, origin: "starting_deck" },
      { instanceId: "enemy_c", cardId: "neutral_insight", owner: 1, origin: "starting_deck" },
      { instanceId: "enemy_d", cardId: "neutral_blast", owner: 1, origin: "starting_deck" }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "lazul" }, sampleCards);

    expect(game.pendingChoice?.kind).toBe("copy_enemy_hand");
    expect(game.pendingChoice?.options).toHaveLength(3);
    expect(new Set(game.pendingChoice?.options.map((option) => option.instanceId)).size).toBe(3);
    expect(game.pendingChoice?.options.every((option) => game.players[1].hand.includes(option))).toBe(true);
  });

  it("lets Serena steal stats until she has more attack and health", () => {
    const game = createGame("SERENA", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 604);
    game.phase = "playing";
    game.turn = 4;
    game.currentPlayer = 0;
    game.players[0].mana = 2;
    game.players[0].hand = [{ instanceId: "serena", cardId: "reno_priest_serena", owner: 0, origin: "starting_deck" }];
    game.players[1].board.push({
      instanceId: "enemy_big",
      cardId: "neutral_colossus",
      owner: 1,
      attack: 4,
      health: 4,
      maxHealth: 4,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "serena", target: { type: "minion", seat: 1, instanceId: "enemy_big" } }, sampleCards);

    const serena = game.players[0].board.find((minion) => minion.cardId === "reno_priest_serena")!;
    const victim = game.players[1].board.find((minion) => minion.instanceId === "enemy_big")!;
    expect(serena).toMatchObject({ attack: 3, health: 3, maxHealth: 3 });
    expect(victim).toMatchObject({ attack: 2, health: 2, maxHealth: 2 });
  });

  it("lets Serena calculate stolen attack and health independently", () => {
    const game = createGame("SERENASPLIT", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 606);
    game.phase = "playing";
    game.turn = 4;
    game.currentPlayer = 0;
    game.players[0].mana = 2;
    game.players[0].hand = [{ instanceId: "serena", cardId: "reno_priest_serena", owner: 0, origin: "starting_deck" }];
    game.players[1].board.push({
      instanceId: "enemy_wall",
      cardId: "neutral_guard",
      owner: 1,
      attack: 1,
      health: 5,
      maxHealth: 5,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "serena", target: { type: "minion", seat: 1, instanceId: "enemy_wall" } }, sampleCards);

    const serena = game.players[0].board.find((minion) => minion.cardId === "reno_priest_serena")!;
    const victim = game.players[1].board.find((minion) => minion.instanceId === "enemy_wall")!;
    expect(serena).toMatchObject({ attack: 2, health: 4, maxHealth: 4 });
    expect(victim).toMatchObject({ attack: 0, health: 2, maxHealth: 2 });
  });

  it("does not trigger card effects while Theotar swaps chosen hand cards", () => {
    const game = createGame("THEOTAR", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 605);
    game.phase = "playing";
    game.turn = 5;
    game.currentPlayer = 0;
    game.players[0].mana = 6;
    game.players[0].hand = [
      { instanceId: "theotar", cardId: "reno_priest_theotar", owner: 0, origin: "starting_deck" },
      { instanceId: "friendly_blast", cardId: "neutral_blast", owner: 0, origin: "starting_deck" },
      { instanceId: "friendly_spell", cardId: "neutral_insight", owner: 0, origin: "starting_deck" },
      { instanceId: "friendly_minion", cardId: "neutral_guard", owner: 0, origin: "starting_deck" },
      { instanceId: "friendly_other", cardId: "neutral_colossus", owner: 0, origin: "starting_deck" }
    ];
    game.players[1].hand = [
      { instanceId: "enemy_archer", cardId: "neutral_archer", owner: 1, origin: "starting_deck" },
      { instanceId: "enemy_blast", cardId: "neutral_blast", owner: 1, origin: "starting_deck" },
      { instanceId: "enemy_guard", cardId: "neutral_guard", owner: 1, origin: "starting_deck" },
      { instanceId: "enemy_colossus", cardId: "neutral_colossus", owner: 1, origin: "starting_deck" }
    ];
    game.players[0].board.push({
      instanceId: "friendly_target",
      cardId: "neutral_squire",
      owner: 0,
      attack: 1,
      health: 2,
      maxHealth: 2,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });
    game.players[1].board.push({
      instanceId: "enemy_target",
      cardId: "neutral_squire",
      owner: 1,
      attack: 1,
      health: 2,
      maxHealth: 2,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "theotar" }, sampleCards);
    const firstChoice = game.pendingChoice!;
    expect(firstChoice.kind).toBe("theotar_friendly");
    expect(firstChoice.options).toHaveLength(3);
    expect(new Set(firstChoice.options.map((option) => option.instanceId)).size).toBe(3);
    expect(firstChoice.options.every((option) => game.players[0].hand.includes(option))).toBe(true);
    const friendlyOption = firstChoice.options.find((option) => option.cardId === "neutral_blast") ?? firstChoice.options[0];
    applyGameAction(game, "A", { type: "choose", choiceId: firstChoice.id, optionInstanceId: friendlyOption.instanceId, target: { type: "minion", seat: 1, instanceId: "enemy_target" } }, sampleCards);
    const secondChoice = game.pendingChoice!;
    expect(secondChoice.kind).toBe("theotar_enemy");
    expect(secondChoice.options).toHaveLength(3);
    expect(new Set(secondChoice.options.map((option) => option.instanceId)).size).toBe(3);
    expect(secondChoice.options.every((option) => game.players[1].hand.includes(option))).toBe(true);
    const enemyOption = secondChoice.options.find((option) => option.cardId === "neutral_archer") ?? secondChoice.options[0];
    applyGameAction(game, "A", { type: "choose", choiceId: secondChoice.id, optionInstanceId: enemyOption.instanceId, target: { type: "minion", seat: 0, instanceId: "friendly_target" } }, sampleCards);

    expect(game.players[0].hand.some((card) => card.instanceId === enemyOption.instanceId && card.owner === 0)).toBe(true);
    expect(game.players[1].hand.some((card) => card.instanceId === friendlyOption.instanceId && card.owner === 1)).toBe(true);
    expect(game.players[0].board.find((minion) => minion.instanceId === "friendly_target")?.health).toBe(2);
    expect(game.players[1].board.find((minion) => minion.instanceId === "enemy_target")?.health).toBe(2);
    expect(game.players[0].graveyard).not.toContain(friendlyOption.cardId);
    expect(game.players[1].board.map((minion) => minion.cardId)).not.toContain(enemyOption.cardId);
  });

  it("expires quickdraw effects after the turn a card is drawn", () => {
    const quickdrawArmor: CardDefinition = {
      id: "test_quickdraw_armor",
      name: "快枪测试",
      class: "neutral",
      type: "spell",
      rarity: "common",
      cost: 0,
      text: "快枪：获得 3 点护甲。",
      keywords: [],
      effects: [{ type: "gain_armor", amount: 3, trigger: "quickdraw" }],
      status: "published",
      collectible: false,
      version: 1
    };
    const cards = [...sampleCards, quickdrawArmor];
    const game = createGame("QUICKDRAW", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], cards, 603);
    game.phase = "playing";
    game.turn = 2;
    game.currentPlayer = 1;
    game.players[0].deck = [
      { instanceId: "quickdraw_now", cardId: quickdrawArmor.id, owner: 0, origin: "starting_deck" },
      { instanceId: "quickdraw_later", cardId: quickdrawArmor.id, owner: 0, origin: "starting_deck" }
    ];

    applyGameAction(game, "B", { type: "end_turn" }, cards);
    const sameTurnCard = game.players[0].hand.find((card) => card.cardId === quickdrawArmor.id)!;
    expect(sameTurnCard.drawnTurn).toBe(game.turn);
    applyGameAction(game, "A", { type: "play_card", handInstanceId: sameTurnCard.instanceId }, cards);
    expect(game.players[0].hero.armor).toBe(3);

    applyGameAction(game, "A", { type: "end_turn" }, cards);
    applyGameAction(game, "B", { type: "end_turn" }, cards);
    const expiredCard = game.players[0].hand.find((card) => card.cardId === quickdrawArmor.id)!;
    applyGameAction(game, "A", { type: "end_turn" }, cards);
    applyGameAction(game, "B", { type: "end_turn" }, cards);
    applyGameAction(game, "A", { type: "play_card", handInstanceId: expiredCard.instanceId }, cards);
    expect(game.players[0].hero.armor).toBe(3);
  });

  it("plays Lone Ranger Reno as a hero card with rotating bullet hero powers", () => {
    const game = createGame("RENO", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 61);
    game.phase = "playing";
    game.turn = 8;
    game.currentPlayer = 0;
    game.players[0].mana = 8;
    game.players[0].hand = [{ instanceId: "reno_hero", cardId: "reno_priest_lone_ranger_reno", owner: 0, origin: "starting_deck" }];
    game.players[1].board = [{
      instanceId: "enemy_board",
      cardId: "neutral_guard",
      owner: 1,
      attack: 2,
      health: 3,
      maxHealth: 3,
      keywords: ["taunt"],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    }];

    expect(sampleCards.find((card) => card.id === "reno_priest_lone_ranger_reno")?.type).toBe("hero");
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "reno_hero" }, sampleCards);

    expect(game.players[0].hero.armor).toBe(5);
    expect(game.players[1].board).toHaveLength(0);
    expect(game.players[0].hero.heroPowerCardId).toMatch(/^hero_power_reno_bullet_/);

    const firstBullet = game.players[0].hero.heroPowerCardId;
    game.players[0].mana = 2;
    applyGameAction(game, "A", { type: "hero_power", target: { type: "hero", seat: 1 } }, sampleCards);
    expect(game.players[1].hero.health).toBeLessThan(30);

    applyGameAction(game, "A", { type: "end_turn" }, sampleCards);
    applyGameAction(game, "B", { type: "end_turn" }, sampleCards);
    expect(game.players[0].hero.heroPowerCardId).toMatch(/^hero_power_reno_bullet_/);
    expect(game.players[0].hero.heroPowerCardId).not.toBe(firstBullet);
  });

  it("applies next-turn spell taxes and Okani counter choices", () => {
    const game = createGame("DENIAL", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 63);
    game.phase = "playing";
    game.turn = 4;
    game.currentPlayer = 0;
    game.players[0].mana = 9;
    game.players[0].hand = [
      { instanceId: "loatheb", cardId: "reno_priest_loatheb", owner: 0, origin: "starting_deck" },
      { instanceId: "okani", cardId: "reno_priest_okani", owner: 0, origin: "starting_deck" }
    ];
    game.players[1].hand = [{ instanceId: "coin", cardId: "coin", owner: 1, origin: "generated" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "loatheb" }, sampleCards);
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "okani" }, sampleCards);
    const choice = game.pendingChoice!;
    const spellChoice = choice.options.find((option) => option.cardId === "reno_choice_okani_spell")!;
    applyGameAction(game, "A", { type: "choose", choiceId: choice.id, optionInstanceId: spellChoice.instanceId }, sampleCards);
    applyGameAction(game, "A", { type: "end_turn" }, sampleCards);

    game.players[1].mana = 4;
    expect(() => applyGameAction(game, "B", { type: "play_card", handInstanceId: "coin" }, sampleCards)).toThrow("法力不足");
    game.players[1].mana = 5;
    applyGameAction(game, "B", { type: "play_card", handInstanceId: "coin" }, sampleCards);
    expect(game.players[1].mana).toBe(0);
    expect(game.players[1].graveyard).toContain("coin");
  });

  it("delays Aviana, Elune's Chosen until three friendly turns pass", () => {
    const game = createGame("AVIANACHOSEN", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 64);
    game.phase = "playing";
    game.turn = 4;
    game.currentPlayer = 0;
    game.players[0].mana = 9;
    game.players[0].hand = [
      { instanceId: "aviana", cardId: "reno_priest_aviana", owner: 0, origin: "starting_deck" },
      { instanceId: "spell_before", cardId: "neutral_insight", owner: 0, origin: "starting_deck" }
    ];
    game.players[1].hand = [{ instanceId: "enemy_colossus", cardId: "neutral_colossus", owner: 1, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "aviana" }, sampleCards);

    expect(game.players[0]).toMatchObject({ avianaCountdown: 3, avianaActive: false });
    expect(game.players[0].hand.find((card) => card.instanceId === "spell_before")?.costOverride).toBeUndefined();
    expect(game.players[1].hand[0].costOverride).toBeUndefined();

    for (let cycle = 0; cycle < 2; cycle += 1) {
      applyGameAction(game, "A", { type: "end_turn" }, sampleCards);
      applyGameAction(game, "B", { type: "end_turn" }, sampleCards);
    }
    expect(game.players[0]).toMatchObject({ avianaCountdown: 1, avianaActive: false });
    game.players[0].mana = 1;
    expect(() => applyGameAction(game, "A", { type: "play_card", handInstanceId: "spell_before" }, sampleCards)).toThrow("法力不足");

    applyGameAction(game, "A", { type: "end_turn" }, sampleCards);
    applyGameAction(game, "B", { type: "end_turn" }, sampleCards);
    expect(game.players[0].avianaCountdown).toBeUndefined();
    expect(game.players[0].avianaActive).toBe(true);

    game.players[0].mana = 1;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "spell_before" }, sampleCards);
    expect(game.players[0].mana).toBe(0);

    game.players[0].mana = 1;
    game.players[0].hand.push({ instanceId: "friendly_colossus", cardId: "neutral_colossus", owner: 0, origin: "starting_deck" });
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "friendly_colossus" }, sampleCards);
    expect(game.players[0].mana).toBe(0);

    game.currentPlayer = 1;
    game.players[1].mana = 1;
    expect(() => applyGameAction(game, "B", { type: "play_card", handInstanceId: "enemy_colossus" }, sampleCards)).toThrow("法力不足");
  });

  it("does not make the coin cost 1 after Aviana's full moon effect", () => {
    const game = createGame("AVIANACOIN", [
      { nickname: "A", class: "priest", deck: deck("A", "priest", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 65);
    game.phase = "playing";
    game.turn = 8;
    game.currentPlayer = 0;
    game.players[0].avianaActive = true;
    game.players[0].mana = 0;
    game.players[0].hand = [{ instanceId: "coin", cardId: "coin", owner: 0, origin: "generated" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "coin" }, sampleCards);

    expect(game.players[0].mana).toBe(1);
    expect(game.players[0].graveyard).toContain("coin");
  });

  it("lets the coin add temporary mana above the current mana crystals", () => {
    const game = createGame("COINSECOND", [
      { nickname: "A", class: "druid", deck: deck("A", "druid", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "priest", deck: deck("B", "priest", Array(30).fill("neutral_squire")) }
    ], sampleCards, 66);
    game.phase = "playing";
    game.turn = 2;
    game.currentPlayer = 0;
    game.players[0].maxMana = 2;
    game.players[0].mana = 2;
    game.players[0].hand = [{ instanceId: "coin", cardId: "coin", owner: 0, origin: "generated" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "coin" }, sampleCards);

    expect(game.players[0].mana).toBe(3);
    expect(game.players[0].maxMana).toBe(2);
    expect(game.players[0].graveyard).toContain("coin");
  });

  it("keeps mage secrets hidden until they trigger", () => {
    const game = createGame("SECRETS", [
      { nickname: "A", class: "mage", deck: deck("A", "mage", Array(30).fill("freeze_mage_ice_barrier")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 67);
    game.phase = "playing";
    game.turn = 3;
    game.currentPlayer = 0;
    game.players[0].mana = 3;
    game.players[0].hand = [{ instanceId: "barrier", cardId: "freeze_mage_ice_barrier", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "barrier" }, sampleCards);

    expect(game.players[0].secrets).toHaveLength(1);
    expect(game.players[0].graveyard).not.toContain("freeze_mage_ice_barrier");
    expect(game.logs.at(-1)?.message).not.toContain("寒冰护体");
    expect(toPublicGameState(game, "A").players[0].secrets[0].cardId).toBe("freeze_mage_ice_barrier");
    expect(toPublicGameState(game, "B").players[0].secrets[0].hidden).toBe(true);
    expect(toPublicGameState(game, "B").players[0].secrets[0].cardId).toBeUndefined();

    game.currentPlayer = 1;
    game.players[1].board.push({
      instanceId: "attacker",
      cardId: "neutral_squire",
      owner: 1,
      attack: 1,
      health: 2,
      maxHealth: 2,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });
    applyGameAction(game, "B", { type: "attack", source: { type: "minion", seat: 1, instanceId: "attacker" }, target: { type: "hero", seat: 0 } }, sampleCards);

    expect(game.players[0].secrets).toHaveLength(0);
    expect(game.players[0].graveyard).toContain("freeze_mage_ice_barrier");
    expect(game.players[0].hero.armor).toBe(7);
    expect(game.logs.some((entry) => entry.message.includes("寒冰护体触发"))).toBe(true);
  });

  it("prevents lethal damage with Ice Block and grants same-turn immunity", () => {
    const game = createGame("ICEBLOCK", [
      { nickname: "A", class: "mage", deck: deck("A", "mage", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "mage", deck: deck("B", "mage", Array(30).fill("freeze_mage_fireball")) }
    ], sampleCards, 68);
    game.phase = "playing";
    game.turn = 6;
    game.currentPlayer = 1;
    game.players[0].hero.health = 5;
    game.players[0].secrets = [{ instanceId: "block", cardId: "freeze_mage_ice_block", owner: 0, origin: "starting_deck" }];
    game.players[1].mana = 6;
    game.players[1].hand = [{ instanceId: "fireball", cardId: "freeze_mage_fireball", owner: 1, origin: "starting_deck" }];

    applyGameAction(game, "B", { type: "play_card", handInstanceId: "fireball", target: { type: "hero", seat: 0 } }, sampleCards);

    expect(game.players[0].hero.health).toBe(5);
    expect(game.players[0].hero.immuneUntilTurn).toBe(6);
    expect(game.players[0].secrets).toHaveLength(0);
    expect(game.logs.some((entry) => entry.message.includes("寒冰屏障触发"))).toBe(true);

    applyGameAction(game, "B", { type: "hero_power", target: { type: "hero", seat: 0 } }, sampleCards);
    expect(game.players[0].hero.health).toBe(5);
  });

  it("freezes heroes and blocks frozen hero attacks", () => {
    const game = createGame("FREEZEHERO", [
      { nickname: "A", class: "mage", deck: deck("A", "mage", Array(30).fill("freeze_mage_frostbolt")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 69);
    game.phase = "playing";
    game.turn = 4;
    game.currentPlayer = 0;
    game.players[0].mana = 2;
    game.players[0].hand = [{ instanceId: "frostbolt", cardId: "freeze_mage_frostbolt", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "frostbolt", target: { type: "hero", seat: 1 } }, sampleCards);

    expect(game.players[1].hero.frozenUntilTurn).toBe(5);
    expect(game.players[1].hero.health).toBe(27);

    game.turn = 5;
    game.currentPlayer = 1;
    game.players[1].hero.temporaryAttack = 1;
    expect(() => applyGameAction(game, "B", { type: "attack", source: { type: "hero", seat: 1 }, target: { type: "hero", seat: 0 } }, sampleCards)).toThrow("英雄被冻结");
  });

  it("resolves Doomsayer, Acolyte of Pain, Polymorph, and Blizzard", () => {
    const game = createGame("FREEZEMAGEKIT", [
      { nickname: "A", class: "mage", deck: deck("A", "mage", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "mage", deck: deck("B", "mage", Array(30).fill("neutral_squire")) }
    ], sampleCards, 70);
    game.phase = "playing";
    game.turn = 7;
    game.currentPlayer = 0;
    game.players[0].mana = 10;
    game.players[0].hand = [
      { instanceId: "poly", cardId: "freeze_mage_polymorph", owner: 0, origin: "starting_deck" },
      { instanceId: "blizzard", cardId: "freeze_mage_blizzard", owner: 0, origin: "starting_deck" }
    ];
    game.players[0].board.push({
      instanceId: "acolyte",
      cardId: "freeze_mage_acolyte_of_pain",
      owner: 0,
      attack: 1,
      health: 4,
      maxHealth: 4,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });
    game.players[1].board.push({
      instanceId: "doomsayer",
      cardId: "freeze_mage_doomsayer",
      owner: 1,
      attack: 0,
      health: 7,
      maxHealth: 7,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });
    game.players[1].board.push({
      instanceId: "target",
      cardId: "neutral_colossus",
      owner: 1,
      attack: 7,
      health: 7,
      maxHealth: 7,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0
    });

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "poly", target: { type: "minion", seat: 1, instanceId: "target" } }, sampleCards);
    expect(game.players[1].board.find((minion) => minion.instanceId === "target")?.cardId).toBe("freeze_token_sheep");

    const handBeforeDamage = game.players[0].hand.length;
    applyGameAction(game, "A", { type: "hero_power", target: { type: "minion", seat: 0, instanceId: "acolyte" } }, sampleCards);
    expect(game.players[0].hand.length).toBe(handBeforeDamage + 1);

    game.players[0].mana = 6;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "blizzard" }, sampleCards);
    expect(game.players[1].board.every((minion) => (minion.frozenUntilTurn ?? -1) >= game.turn)).toBe(true);

    applyGameAction(game, "A", { type: "end_turn" }, sampleCards);
    expect(game.players[0].board).toHaveLength(0);
    expect(game.players[1].board).toHaveLength(0);
  });
  it("tracks board stat effects separately and removes them with silence", () => {
    const game = createGame("SILENCE_STATS", [
      { nickname: "A", class: "gearwright", deck: deck("A", "gearwright", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 171);
    game.phase = "playing";
    game.currentPlayer = 0;
    game.turn = 6;
    game.players[0].mana = 6;
    game.players[0].board = [{
      instanceId: "target",
      cardId: "neutral_squire",
      owner: 0,
      origin: "generated",
      attack: 1,
      health: 2,
      maxHealth: 2,
      keywords: [],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0,
      statEffects: { attack: 0, health: 0 }
    }];
    game.players[0].hand = [
      { instanceId: "buff", cardId: "gearwright_overclock", owner: 0, origin: "starting_deck" },
      { instanceId: "starfish", cardId: "dragon_starfish", owner: 0, origin: "starting_deck" }
    ];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "buff", target: { type: "minion", seat: 0, instanceId: "target" } }, sampleCards);
    const target = game.players[0].board.find((minion) => minion.instanceId === "target")!;
    expect(target).toMatchObject({ attack: 3, health: 4, maxHealth: 4, statEffects: { attack: 2, health: 2 } });

    game.players[0].mana = 3;
    applyGameAction(game, "A", { type: "play_card", handInstanceId: "starfish" }, sampleCards);
    expect(target).toMatchObject({ attack: 1, health: 2, maxHealth: 2, silenced: true, statEffects: { attack: 0, health: 0 } });
  });

  it("copies board stat effects when Broken Mirror summons the table copy", () => {
    const game = createGame("BROKEN_MIRROR_STATS", [
      { nickname: "A", class: "druid", deck: deck("A", "druid", Array(30).fill("neutral_squire")) },
      { nickname: "B", class: "druid", deck: deck("B", "druid", Array(30).fill("neutral_squire")) }
    ], sampleCards, 172);
    game.phase = "playing";
    game.currentPlayer = 0;
    game.turn = 6;
    game.players[0].mana = 5;
    game.players[0].hand = [{ instanceId: "mirror", cardId: "dragon_broken_mirror", owner: 0, origin: "starting_deck" }];
    game.players[1].board = [{
      instanceId: "buffed",
      cardId: "neutral_squire",
      owner: 1,
      origin: "generated",
      attack: 3,
      health: 4,
      maxHealth: 4,
      keywords: ["taunt"],
      exhausted: false,
      summonedTurn: 0,
      attacksThisTurn: 0,
      silenced: false,
      temporaryAttack: 0,
      statEffects: { attack: 2, health: 2 }
    }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "mirror", target: { type: "minion", seat: 1, instanceId: "buffed" } }, sampleCards);

    const boardCopy = game.players[0].board.find((minion) => minion.cardId === "neutral_squire")!;
    expect(boardCopy).toMatchObject({ attack: 3, health: 4, maxHealth: 4, keywords: ["taunt"], statEffects: { attack: 2, health: 2 } });
    expect(game.players[0].hand.some((card) => card.cardId === "neutral_squire")).toBe(true);
    expect(game.players[0].deck.some((card) => card.cardId === "neutral_squire")).toBe(true);
  });
});
