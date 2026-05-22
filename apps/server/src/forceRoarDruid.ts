import type { CardDefinition, DeckTemplate, HeroClassProfile } from "@dormstone/shared";

type CardInput = Omit<CardDefinition, "status" | "collectible" | "version" | "updatedAt" | "keywords" | "effects"> &
  Partial<Pick<CardDefinition, "collectible" | "keywords" | "effects" | "rules" | "requiresTarget" | "choiceOptionCardIds">>;

const now = new Date().toISOString();

function card(input: CardInput): CardDefinition {
  return {
    ...input,
    status: "published",
    collectible: input.collectible ?? true,
    version: 1,
    updatedAt: now,
    keywords: input.keywords ?? [],
    effects: input.effects ?? []
  };
}

export const forceRoarDruidCards: CardDefinition[] = [
  card({ id: "roar_innervate", name: "激活C", class: "druid", type: "spell", rarity: "common", cost: 0, text: "本回合获得 2 点临时法力。", effects: [{ type: "gain_mana", amount: 2 }] }),
  card({ id: "roar_wrath", name: "愤怒C", class: "druid", type: "spell", rarity: "common", cost: 2, text: "抉择：对一个随从造成 3 点伤害；或者造成 1 点伤害并抽一张牌。", choiceOptionCardIds: ["roar_choice_wrath_damage", "roar_choice_wrath_draw"] }),
  card({ id: "roar_savage_roar", name: "野蛮咆哮C", class: "druid", type: "spell", rarity: "common", cost: 3, text: "本回合你的所有角色获得 +2 攻击力。", rules: ["savage_roar"] }),
  card({ id: "roar_swipe", name: "横扫C", class: "druid", type: "spell", rarity: "common", cost: 4, text: "对一个敌人造成 4 点伤害，并对所有其他敌人造成 1 点伤害。", requiresTarget: true, rules: ["swipe"] }),
  card({ id: "roar_keeper", name: "丛林守护者C", class: "druid", type: "minion", rarity: "rare", cost: 4, attack: 2, health: 4, text: "抉择：造成 2 点伤害；或者沉默一个随从。", keywords: ["battlecry"], choiceOptionCardIds: ["roar_choice_keeper_damage", "roar_choice_keeper_silence"] }),
  card({ id: "roar_druid_of_claw", name: "利爪德鲁伊C", class: "druid", type: "minion", rarity: "common", cost: 5, attack: 4, health: 4, text: "抉择：获得冲锋；或者获得 +2 生命值和嘲讽。", choiceOptionCardIds: ["roar_choice_claw_charge", "roar_choice_claw_taunt"] }),
  card({ id: "roar_force_of_nature", name: "自然之力C", class: "druid", type: "spell", rarity: "epic", cost: 6, text: "召唤三个 2/2 并具有冲锋的树人，它们会在回合结束时死亡。", rules: ["force_of_nature"] }),
  card({ id: "roar_cairne", name: "凯恩·血蹄C", class: "neutral", type: "minion", rarity: "legendary", cost: 6, attack: 4, health: 5, text: "亡语：召唤一个 4/5 的贝恩·血蹄。", keywords: ["deathrattle"], effects: [{ type: "summon", amount: 1, cardId: "roar_token_baine", trigger: "deathrattle" }] }),
  card({ id: "roar_ancient_lore", name: "知识古树C", class: "druid", type: "minion", rarity: "epic", cost: 7, attack: 5, health: 5, text: "抉择：抽两张牌；或者恢复 5 点生命值。", choiceOptionCardIds: ["roar_choice_lore_draw", "roar_choice_lore_heal"] }),
  card({ id: "roar_cenarius", name: "塞纳留斯C", class: "druid", type: "minion", rarity: "legendary", cost: 9, attack: 5, health: 8, text: "抉择：使你的其他随从获得 +2/+2；或者召唤两个 2/2 并具有嘲讽的树人。", choiceOptionCardIds: ["roar_choice_cenarius_buff", "roar_choice_cenarius_treants"] }),
  card({ id: "roar_wild_growth", name: "野性成长C", class: "druid", type: "spell", rarity: "common", cost: 2, text: "获得一个空的法力水晶；若已满 10 个法力水晶，则获得过量法力。", rules: ["wild_growth"] }),
  card({ id: "roar_thalnos", name: "血法师萨尔诺斯C", class: "neutral", type: "minion", rarity: "legendary", cost: 2, attack: 1, health: 1, text: "法术伤害 +1。亡语：抽一张牌。", keywords: ["spell_damage", "deathrattle"], effects: [{ type: "draw", amount: 1, trigger: "deathrattle" }] }),
  card({ id: "roar_big_game_hunter", name: "王牌猎人C", class: "neutral", type: "minion", rarity: "epic", cost: 3, attack: 4, health: 2, text: "战吼：消灭一个攻击力大于或等于 7 的随从。", keywords: ["battlecry"], requiresTarget: true, rules: ["big_game_hunter"] }),
  card({ id: "roar_chillwind_yeti", name: "冰风雪人C", class: "neutral", type: "minion", rarity: "common", cost: 4, attack: 4, health: 5, text: "扎实的中期站场随从。" }),
  card({ id: "roar_harrison_jones", name: "哈里森·琼斯C", class: "neutral", type: "minion", rarity: "legendary", cost: 5, attack: 5, health: 4, text: "战吼：摧毁对手的武器，并抽等同于其耐久度数量的牌。", keywords: ["battlecry"], rules: ["harrison_jones"] }),
  card({ id: "roar_azure_drake", name: "碧蓝幼龙C", class: "neutral", type: "minion", rarity: "rare", cost: 5, attack: 4, health: 4, text: "法术伤害 +1。战吼：抽一张牌。", keywords: ["spell_damage", "battlecry"], effects: [{ type: "draw", amount: 1, trigger: "battlecry" }] }),
  card({ id: "roar_black_knight", name: "黑骑士C", class: "neutral", type: "minion", rarity: "legendary", cost: 6, attack: 4, health: 5, text: "战吼：消灭一个具有嘲讽的敌方随从。", keywords: ["battlecry"], requiresTarget: true, rules: ["black_knight"] }),
  card({ id: "roar_ancient_war", name: "战争古树C", class: "druid", type: "minion", rarity: "epic", cost: 7, attack: 5, health: 5, text: "抉择：获得 +5 攻击力；或者获得 +5 生命值和嘲讽。", choiceOptionCardIds: ["roar_choice_war_attack", "roar_choice_war_taunt"] }),
  card({ id: "roar_ragnaros", name: "炎魔之王拉格纳罗斯C", class: "neutral", type: "minion", rarity: "legendary", cost: 8, attack: 8, health: 8, text: "无法攻击。在你的回合结束时，随机对一个敌人造成 8 点伤害。", rules: ["ragnaros"] }),

  card({ id: "roar_choice_wrath_damage", name: "愤怒：重击", class: "druid", type: "spell", rarity: "common", cost: 0, text: "对一个随从造成 3 点伤害。", requiresTarget: true, effects: [{ type: "damage", amount: 3, target: "any_minion" }], collectible: false }),
  card({ id: "roar_choice_wrath_draw", name: "愤怒：过牌", class: "druid", type: "spell", rarity: "common", cost: 0, text: "对一个随从造成 1 点伤害，抽一张牌。", requiresTarget: true, effects: [{ type: "damage", amount: 1, target: "any_minion" }, { type: "draw", amount: 1 }], collectible: false }),
  card({ id: "roar_choice_keeper_damage", name: "丛林守护者：月火术", class: "druid", type: "hero_power", rarity: "common", cost: 0, text: "造成 2 点伤害。", effects: [{ type: "damage", amount: 2, target: "selected" }], collectible: false }),
  card({ id: "roar_choice_keeper_silence", name: "丛林守护者：驱散", class: "druid", type: "hero_power", rarity: "common", cost: 0, text: "沉默一个随从。", requiresTarget: true, effects: [{ type: "silence", target: "any_minion" }], collectible: false }),
  card({ id: "roar_choice_claw_charge", name: "利爪德鲁伊：猎豹形态", class: "druid", type: "spell", rarity: "common", cost: 0, text: "变为 4/4 并获得冲锋。", rules: ["druid_claw_charge"], collectible: false }),
  card({ id: "roar_choice_claw_taunt", name: "利爪德鲁伊：熊形态", class: "druid", type: "spell", rarity: "common", cost: 0, text: "变为 4/6 并获得嘲讽。", rules: ["druid_claw_taunt"], collectible: false }),
  card({ id: "roar_choice_lore_draw", name: "知识古树：智慧", class: "druid", type: "spell", rarity: "common", cost: 0, text: "抽两张牌。", effects: [{ type: "draw", amount: 2 }], collectible: false }),
  card({ id: "roar_choice_lore_heal", name: "知识古树：滋养", class: "druid", type: "spell", rarity: "common", cost: 0, text: "恢复 5 点生命值。", effects: [{ type: "heal", amount: 5, target: "selected" }], collectible: false }),
  card({ id: "roar_choice_cenarius_buff", name: "塞纳留斯：森林祝福", class: "druid", type: "spell", rarity: "common", cost: 0, text: "使你的其他随从获得 +2/+2。", rules: ["cenarius_buff"], collectible: false }),
  card({ id: "roar_choice_cenarius_treants", name: "塞纳留斯：守护树人", class: "druid", type: "spell", rarity: "common", cost: 0, text: "召唤两个 2/2 并具有嘲讽的树人。", effects: [{ type: "summon", cardId: "roar_token_treant_taunt", amount: 2 }], collectible: false }),
  card({ id: "roar_choice_war_attack", name: "战争古树：拔根", class: "druid", type: "spell", rarity: "common", cost: 0, text: "战争古树获得 +5 攻击力。", rules: ["ancient_war_attack"], collectible: false }),
  card({ id: "roar_choice_war_taunt", name: "战争古树：扎根", class: "druid", type: "spell", rarity: "common", cost: 0, text: "战争古树获得 +5 生命值和嘲讽。", rules: ["ancient_war_taunt"], collectible: false }),

  card({ id: "roar_token_treant_charge", name: "自然之力树人", class: "druid", type: "minion", rarity: "common", cost: 2, attack: 2, health: 2, text: "冲锋。回合结束时死亡。", keywords: ["charge"], collectible: false }),
  card({ id: "roar_token_treant_taunt", name: "守护树人", class: "druid", type: "minion", rarity: "common", cost: 2, attack: 2, health: 2, text: "嘲讽。", keywords: ["taunt"], collectible: false }),
  card({ id: "roar_token_baine", name: "贝恩·血蹄", class: "neutral", type: "minion", rarity: "common", cost: 4, attack: 4, health: 5, text: "凯恩·血蹄的亡语随从。", collectible: false }),
  card({ id: "roar_excess_mana", name: "过量法力", class: "druid", type: "spell", rarity: "common", cost: 0, text: "抽一张牌。", effects: [{ type: "draw", amount: 1 }], collectible: false })
];

export const forceRoarDruidDeckCardIds = [
  ...Array(2).fill("roar_innervate"),
  ...Array(2).fill("roar_wrath"),
  ...Array(2).fill("roar_savage_roar"),
  ...Array(2).fill("roar_swipe"),
  ...Array(2).fill("roar_keeper"),
  ...Array(2).fill("roar_druid_of_claw"),
  ...Array(2).fill("roar_force_of_nature"),
  "roar_cairne",
  ...Array(2).fill("roar_ancient_lore"),
  "roar_cenarius",
  ...Array(2).fill("roar_wild_growth"),
  "roar_thalnos",
  "roar_big_game_hunter",
  ...Array(2).fill("roar_chillwind_yeti"),
  "roar_harrison_jones",
  ...Array(2).fill("roar_azure_drake"),
  "roar_black_knight",
  "roar_ancient_war",
  "roar_ragnaros"
];

const druidHero: HeroClassProfile = {
  class: "druid",
  classZh: "德鲁伊",
  classEn: "Druid",
  defaultHero: "玛法里奥",
  heroPowerName: "变形",
  heroPowerCost: 2,
  heroPowerText: "本回合获得 +1 攻击力，并获得 1 点护甲。",
  traits: ["跳费", "中期站场", "法强横扫", "自然之力咆哮斩杀"],
  sourceUrls: []
};

export const forceRoarDruidTemplate: DeckTemplate = {
  id: "custom_force_roar_druid_classic",
  class: "druid",
  defaultClass: "druid",
  classZh: "德鲁伊",
  classEn: "Druid",
  nameZh: "咆哮德",
  nameEn: "Classic Force Roar Druid",
  era: "经典",
  mode: "经典 / 局域网复刻",
  archetype: "中速斩杀",
  tags: ["咆哮", "抉择", "跳费", "经典"],
  fame: "S",
  annoyance: 3,
  uniqueness: 5,
  coreCardsZh: ["激活C", "野性成长C", "自然之力C", "野蛮咆哮C", "横扫C"],
  coreCardsEn: ["Innervate", "Wild Growth", "Force of Nature", "Savage Roar", "Swipe"],
  winCondition: "跳费抢中期场面，用自然之力与野蛮咆哮放大斩杀窗口。",
  whyIncluded: "按用户提供 CSV 加入经典咆哮德，并把关键抉择、法强与针对随从战吼纳入对局逻辑。",
  recommendedUse: "直接在大厅选择，和宇宙牧一起作为当前两套可玩预设。",
  sourceNote: "主套牌来自用户 CSV，规则按经典版本卡牌文本实现。",
  sourceUrls: [],
  hero: druidHero,
  presetCardIds: forceRoarDruidDeckCardIds,
  expectedDeckSize: 30
};
