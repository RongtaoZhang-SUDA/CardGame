import { CARD_CLASSES, COLLECTIBLE_CLASSES, GAME_RULES } from "./constants.js";
import type { CardDefinition, CardEffect, CollectibleClass, DeckDefinition, ValidationResult } from "./types.js";

const cardTypes = ["minion", "spell", "weapon", "location", "hero", "hero_power"];
const rarities = ["common", "rare", "epic", "legendary"];
const statuses = ["draft", "published", "disabled"];
const keywords = ["taunt", "charge", "rush", "divine_shield", "lifesteal", "deathrattle", "battlecry", "windfury", "poisonous", "spell_damage"];

export function validateCard(card: Partial<CardDefinition>): ValidationResult {
  const errors: string[] = [];
  if (!card.id || !/^[a-z0-9][a-z0-9_-]{2,63}$/.test(card.id)) {
    errors.push("卡牌 ID 需要使用 3-64 位小写字母、数字、下划线或短横线。");
  }
  if (!card.name || card.name.trim().length < 1) errors.push("卡牌名称不能为空。");
  if (!card.class || !CARD_CLASSES.includes(card.class)) errors.push("卡牌职业无效。");
  if (!card.type || !cardTypes.includes(card.type)) errors.push("卡牌类型无效。");
  if (!card.rarity || !rarities.includes(card.rarity)) errors.push("稀有度无效。");
  if (!card.status || !statuses.includes(card.status)) errors.push("发布状态无效。");
  if (!Number.isInteger(card.cost) || card.cost! < 0 || card.cost! > 30) errors.push("费用需要是 0-30 的整数。");
  if (!Array.isArray(card.keywords)) errors.push("关键词需要是数组。");
  if (card.keywords?.some((keyword) => !keywords.includes(keyword))) errors.push("包含未知关键词。");
  if (!Array.isArray(card.effects)) errors.push("效果需要是数组。");

  if (card.type === "minion") {
    if (!Number.isInteger(card.attack) || card.attack! < 0) errors.push("随从攻击力需要是非负整数。");
    if (!Number.isInteger(card.health) || card.health! < 1) errors.push("随从生命值至少为 1。");
  }
  if (card.type === "weapon") {
    if (!Number.isInteger(card.attack) || card.attack! < 0) errors.push("武器攻击力需要是非负整数。");
    if (!Number.isInteger(card.durability) || card.durability! < 1) errors.push("武器耐久至少为 1。");
  }
  if (card.type === "location" && (!Number.isInteger(card.durability) || card.durability! < 1)) errors.push("Locations need at least 1 durability.");
  if ((card.type === "spell" || card.type === "hero" || card.type === "hero_power") && (card.attack || card.health || card.durability)) {
    errors.push("法术、英雄牌和英雄技能不应设置攻击、生命或耐久。");
  }

  if (card.repeatableUses !== undefined && (!Number.isInteger(card.repeatableUses) || card.repeatableUses < 2)) {
    errors.push("repeatableUses must be an integer of at least 2.");
  }

  for (const effect of card.effects ?? []) {
    errors.push(...validateEffect(effect));
  }

  return { valid: errors.length === 0, errors };
}

function validateEffect(effect: CardEffect): string[] {
  const errors: string[] = [];
  const typed = effect as CardEffect & Record<string, unknown>;
  if (!["damage", "heal", "gain_armor", "hero_attack", "gain_mana", "draw", "summon", "buff", "equip_weapon", "destroy", "silence"].includes(effect.type)) {
    errors.push("包含未知效果类型。");
  }
  if (["damage", "heal", "gain_armor", "hero_attack", "gain_mana", "draw"].includes(effect.type) && (!Number.isInteger(typed.amount) || Number(typed.amount) < 1)) {
    errors.push(`${effect.type} 效果的数值至少为 1。`);
  }
  if (effect.type === "summon") {
    if (!typed.cardId || typeof typed.cardId !== "string") errors.push("召唤效果需要 cardId。");
    if (!Number.isInteger(typed.amount) || Number(typed.amount) < 1) errors.push("召唤数量至少为 1。");
  }
  if (effect.type === "buff") {
    if (!Number.isInteger(typed.attack) || !Number.isInteger(typed.health)) errors.push("增益效果需要整数攻击和生命。");
  }
  if (effect.type === "equip_weapon") {
    if (!Number.isInteger(typed.attack) || Number(typed.attack) < 0) errors.push("装备武器攻击力无效。");
    if (!Number.isInteger(typed.durability) || Number(typed.durability) < 1) errors.push("装备武器耐久无效。");
  }
  return errors;
}

export function validateDeck(deck: Pick<DeckDefinition, "class" | "cardIds" | "sideboardCardIds">, cards: CardDefinition[]): ValidationResult {
  const errors: string[] = [];
  if (!COLLECTIBLE_CLASSES.includes(deck.class)) errors.push("卡组职业无效。");

  const byId = new Map(cards.map((card) => [card.id, card]));
  const mainCards = deck.cardIds.map((cardId) => byId.get(cardId)).filter(Boolean) as CardDefinition[];
  const deckSize = Math.max(GAME_RULES.deckSize, ...mainCards.map((card) => card.deckRules?.deckSize ?? 0));
  if (deck.cardIds.length !== deckSize) errors.push(`卡组必须正好包含 ${deckSize} 张牌。`);
  const counts = new Map<string, number>();

  for (const cardId of deck.cardIds) {
    const card = byId.get(cardId);
    counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
    if (!card) {
      errors.push(`找不到卡牌：${cardId}`);
      continue;
    }
    if (card.status !== "published" || !card.collectible) errors.push(`${card.name} 不是可构筑卡牌。`);
    if (card.class !== "neutral" && card.class !== deck.class) errors.push(`${card.name} 不属于当前职业。`);
  }

  const sideboardCardIds = deck.sideboardCardIds ?? [];
  const sideboardSlots = mainCards.reduce((slots, card) => slots + (card.sideboardSlots ?? 0), 0);
  if (sideboardSlots === 0 && sideboardCardIds.length > 0) errors.push("当前卡组没有备牌位。");
  if (sideboardSlots > 0 && sideboardCardIds.length !== sideboardSlots) errors.push(`备牌必须正好包含 ${sideboardSlots} 张牌。`);

  const sideboardCounts = new Map<string, number>();
  for (const cardId of sideboardCardIds) {
    const card = byId.get(cardId);
    sideboardCounts.set(cardId, (sideboardCounts.get(cardId) ?? 0) + 1);
    if (!card) {
      errors.push(`找不到备牌：${cardId}`);
      continue;
    }
    if (card.status !== "published" || !card.collectible) errors.push(`${card.name} 不是可构筑备牌。`);
    if (card.class !== "neutral" && card.class !== deck.class) errors.push(`${card.name} 不属于当前职业的备牌。`);
  }

  for (const [cardId, count] of counts) {
    const card = byId.get(cardId);
    const limit = card?.rarity === "legendary" ? GAME_RULES.maxLegendaryCopies : GAME_RULES.maxCopies;
    if (count > limit) {
      errors.push(`${card?.name ?? cardId} 最多只能携带 ${limit} 张。`);
    }
  }
  for (const [cardId, count] of sideboardCounts) {
    const card = byId.get(cardId);
    const limit = card?.rarity === "legendary" ? GAME_RULES.maxLegendaryCopies : GAME_RULES.maxCopies;
    if (count > limit) errors.push(`${card?.name ?? cardId} 的备牌最多只能携带 ${limit} 张。`);
  }

  return { valid: errors.length === 0, errors };
}

export function isTargetedEffect(effect: CardEffect): boolean {
  return effect.target === "selected";
}

export function cardNeedsTarget(card: CardDefinition): boolean {
  return Boolean(card.requiresTarget || card.effects.some(isTargetedEffect));
}

export function legalCardsForClass(cards: CardDefinition[], deckClass: CollectibleClass): CardDefinition[] {
  return cards.filter((card) => card.collectible && card.status === "published" && (card.class === "neutral" || card.class === deckClass));
}
