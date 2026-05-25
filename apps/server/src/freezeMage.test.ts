import { describe, expect, it } from "vitest";
import { getDeckTemplate } from "./deckTemplates.js";
import { freezeMageDeckCardIds } from "./freezeMage.js";
import { sampleCards } from "./sampleCards.js";

describe("Freeze Mage preset", () => {
  it("registers a complete 30-card deck template", () => {
    const catalog = new Map(sampleCards.map((card) => [card.id, card]));
    const template = getDeckTemplate("custom_freeze_mage");

    expect(template?.nameZh).toBe("冰法");
    expect(template?.presetCardIds).toEqual(freezeMageDeckCardIds);
    expect(freezeMageDeckCardIds).toHaveLength(30);
    expect(freezeMageDeckCardIds.filter((cardId) => !catalog.has(cardId))).toEqual([]);
    expect(catalog.get("freeze_mage_ice_block")?.rules).toContain("mage_secret_ice_block");
    expect(catalog.get("freeze_mage_ice_barrier")?.rules).toContain("mage_secret_ice_barrier");
  });
});
