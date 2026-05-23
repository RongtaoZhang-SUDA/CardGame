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

  it("summons Pure Nest from Rheastrasza when the remaining deck is highlander", () => {
    const game = liveGame();
    game.players[0].deck = [];
    game.players[0].maxMana = 8;
    game.players[0].mana = 8;
    game.players[0].hand = [{ instanceId: "rhea", cardId: "dragon_rheastrasza", owner: 0, origin: "starting_deck" }];

    applyGameAction(game, "A", { type: "play_card", handInstanceId: "rhea" }, sampleCards);

    expect(game.players[0].board.map((minion) => minion.cardId)).toEqual(["dragon_rheastrasza", "dragon_pure_nest"]);
  });
});
