import { describe, expect, it } from "vitest";
import type { CardDefinition, DeckDefinition } from "./types.js";
import { validateCard, validateDeck } from "./validation.js";

const baseCard: CardDefinition = {
  id: "neutral_guard",
  name: "路口守卫",
  class: "neutral",
  type: "minion",
  rarity: "common",
  cost: 2,
  attack: 2,
  health: 3,
  text: "嘲讽",
  keywords: ["taunt"],
  effects: [],
  status: "published",
  collectible: true,
  version: 1
};

describe("card validation", () => {
  it("accepts a valid minion", () => {
    expect(validateCard(baseCard).valid).toBe(true);
  });

  it("rejects bad ids and missing minion stats", () => {
    const result = validateCard({ ...baseCard, id: "Bad Id", attack: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("deck validation", () => {
  it("enforces class and copy limits", () => {
    const legendary: CardDefinition = { ...baseCard, id: "warden_oath", name: "誓约巨像", class: "warden", rarity: "legendary" };
    const deck: Pick<DeckDefinition, "class" | "cardIds"> = {
      class: "warden",
      cardIds: Array(28).fill(baseCard.id).concat([legendary.id, legendary.id])
    };
    const result = validateDeck(deck, [baseCard, legendary]);
    expect(result.valid).toBe(false);
    expect(result.errors.join("\n")).toContain("最多只能携带");
  });

  it("accepts a Renathal-sized deck when a starting rule grants 40 cards", () => {
    const renathal: CardDefinition = {
      ...baseCard,
      id: "prince_renathal_test",
      name: "雷纳索尔王子",
      rarity: "legendary",
      deckRules: { deckSize: 40, startingHealth: 40 }
    };
    const fillers = Array.from({ length: 39 }, (_, index) => ({ ...baseCard, id: `neutral_filler_${index}` }));
    const deck: Pick<DeckDefinition, "class" | "cardIds"> = {
      class: "warden",
      cardIds: [renathal.id, ...fillers.map((card) => card.id)]
    };
    expect(validateDeck(deck, [renathal, ...fillers]).valid).toBe(true);
  });
});
