import { describe, expect, it } from "vitest";
import { fourPlusBeastPoolCardIds } from "./beastPool.js";
import { sampleCards } from "./sampleCards.js";

describe("four-plus Beast pool", () => {
  it("adds all generated Hunter and Neutral collectible Beasts that cost 4 or more", () => {
    const cards = fourPlusBeastPoolCardIds.map((cardId) => sampleCards.find((card) => card.id === cardId));

    expect(cards).toHaveLength(173);
    expect(cards.every(Boolean)).toBe(true);
    expect(cards.every((card) => card!.collectible)).toBe(true);
    expect(cards.every((card) => card!.type === "minion")).toBe(true);
    expect(cards.every((card) => card!.cost >= 4)).toBe(true);
    expect(cards.every((card) => card!.races?.includes("BEAST"))).toBe(true);
    expect(cards.every((card) => card!.class === "hunter" || card!.class === "neutral")).toBe(true);
  });

  it("marks common Beast effects as executable generic rules", () => {
    const highmane = sampleCards.find((card) => card.id === "beast_pool_core_ex1_534");
    const kingKrush = sampleCards.find((card) => card.id === "beast_pool_core_ex1_543");
    const owl = sampleCards.find((card) => card.id === "beast_pool_av_704");
    const kodo = sampleCards.find((card) => card.id === "beast_pool_new1_041");
    const redHerring = sampleCards.find((card) => card.id === "beast_pool_rev_014");
    const magmaw = sampleCards.find((card) => card.id === "beast_pool_cata_550");

    expect(highmane?.rules).toContain("beast_generic_deathrattle");
    expect(kingKrush?.keywords).toContain("charge");
    expect(owl?.rules).toContain("beast_generic_deathrattle");
    expect(kodo?.rules).toContain("beast_generic_battlecry");
    expect(redHerring?.rules).toContain("beast_red_herring");
    expect(magmaw?.rules).toContain("beast_magmaw_colossal");
    expect(sampleCards.find((card) => card.id === "beast_token_magmaw_limb")?.rules).toContain("beast_magmaw_limb");
  });
});
