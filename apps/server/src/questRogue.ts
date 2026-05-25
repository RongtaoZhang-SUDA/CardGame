import type { CardDefinition, DeckTemplate, HeroClassProfile } from "@dormstone/shared";

type CardInput = Omit<CardDefinition, "status" | "collectible" | "version" | "updatedAt" | "keywords" | "effects"> &
  Partial<Pick<CardDefinition, "collectible" | "keywords" | "effects" | "rules" | "requiresTarget" | "races">>;

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

export const questRogueCards: CardDefinition[] = [
  card({ id: "quest_rogue_preparation", name: "伺机待发", sourceNameEn: "Preparation", class: "rogue", type: "spell", rarity: "epic", cost: 0, text: "本回合中，你的下一个法术的法力值消耗减少（3）点。", rules: ["rogue_preparation"] }),
  card({ id: "quest_rogue_shadowstep", name: "暗影步", sourceNameEn: "Shadowstep", class: "rogue", type: "spell", rarity: "common", cost: 0, text: "使一个友方随从移回你的手牌，其法力值消耗减少（2）点。", requiresTarget: true, rules: ["rogue_shadowstep"] }),
  card({ id: "quest_rogue_backstab", name: "背刺", sourceNameEn: "Backstab", class: "rogue", type: "spell", rarity: "common", cost: 0, text: "对一个未受伤的随从造成2点伤害。", requiresTarget: true, rules: ["rogue_backstab"] }),
  card({ id: "quest_rogue_the_caverns_below", name: "探索地下洞穴", sourceNameEn: "The Caverns Below", class: "rogue", type: "spell", rarity: "legendary", cost: 1, text: "任务：使用四张名称相同的随从牌。奖励：水晶核心。", rules: ["rogue_the_caverns_below"] }),

  card({ id: "quest_rogue_fire_fly", name: "火羽精灵", sourceNameEn: "Fire Fly", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 1, health: 2, text: "战吼：将一张1/2的烈焰元素置入你的手牌。", keywords: ["battlecry"], races: ["ELEMENTAL"], rules: ["rogue_fire_fly"] }),
  card({ id: "quest_rogue_southsea_deckhand", name: "南海船工", sourceNameEn: "Southsea Deckhand", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 2, health: 1, text: "如果你装备一把武器，该随从具有冲锋。", races: ["PIRATE"], rules: ["rogue_southsea_deckhand"] }),
  card({ id: "quest_rogue_stonetusk_boar", name: "石牙野猪", sourceNameEn: "Stonetusk Boar", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 1, health: 1, text: "冲锋。", keywords: ["charge"], races: ["BEAST"] }),
  card({ id: "quest_rogue_undercity_huckster", name: "幽暗城商贩", sourceNameEn: "Undercity Huckster", class: "rogue", type: "minion", rarity: "rare", cost: 1, attack: 1, health: 1, text: "战吼：将一张对手职业的随机卡牌置入你的手牌。", keywords: ["battlecry"], races: ["PIRATE"], rules: ["rogue_swashburglar_huckster"] }),
  card({ id: "quest_rogue_patches", name: "海盗帕奇斯", sourceNameEn: "Patches the Pirate", class: "neutral", type: "minion", rarity: "legendary", cost: 1, attack: 1, health: 1, text: "冲锋。在你使用一张海盗牌后，从你的牌库中召唤该随从。", keywords: ["charge"], races: ["PIRATE", "DEMON"], rules: ["rogue_patches"] }),

  card({ id: "quest_rogue_youthful_brewmaster", name: "年轻的酒仙", sourceNameEn: "Youthful Brewmaster", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 3, health: 2, text: "战吼：使一个友方随从移回你的手牌。", keywords: ["battlecry"], requiresTarget: true, rules: ["rogue_youthful_brewmaster"] }),
  card({ id: "quest_rogue_gadgetzan_ferryman", name: "加基森摆渡人", sourceNameEn: "Gadgetzan Ferryman", class: "rogue", type: "minion", rarity: "common", cost: 2, attack: 2, health: 3, text: "连击：使一个友方随从移回你的手牌。", keywords: ["battlecry"], requiresTarget: true, rules: ["rogue_gadgetzan_ferryman"] }),
  card({ id: "quest_rogue_novice_engineer", name: "工程师学徒", sourceNameEn: "Novice Engineer", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 1, health: 1, text: "战吼：抽一张牌。", keywords: ["battlecry"], effects: [{ type: "draw", amount: 1, trigger: "battlecry" }] }),
  card({ id: "quest_rogue_eviscerate", name: "刺骨", sourceNameEn: "Eviscerate", class: "rogue", type: "spell", rarity: "common", cost: 2, text: "造成2点伤害；连击：改为造成4点伤害。", requiresTarget: true, rules: ["rogue_eviscerate"] }),

  card({ id: "quest_rogue_igneous_elemental", name: "火岩元素", sourceNameEn: "Igneous Elemental", class: "neutral", type: "minion", rarity: "common", cost: 3, attack: 2, health: 3, text: "亡语：将两张1/2的烈焰元素置入你的手牌。", keywords: ["deathrattle"], races: ["ELEMENTAL"], rules: ["rogue_igneous_elemental"] }),
  card({ id: "quest_rogue_mimic_pod", name: "拟态豆荚", sourceNameEn: "Mimic Pod", class: "rogue", type: "spell", rarity: "rare", cost: 3, text: "抽一张牌，然后将其复制牌置入你的手牌。", rules: ["rogue_mimic_pod"] }),
  card({ id: "quest_rogue_fan_of_knives", name: "刀扇", sourceNameEn: "Fan of Knives", class: "rogue", type: "spell", rarity: "common", cost: 3, text: "对所有敌方随从造成1点伤害，抽一张牌。", effects: [{ type: "damage", amount: 1, target: "all_enemy_minions" }, { type: "draw", amount: 1 }] }),

  card({ id: "quest_rogue_flame_elemental", name: "烈焰元素", sourceNameEn: "Flame Elemental", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 1, health: 2, text: "火羽精灵与火岩元素衍生的元素。", races: ["ELEMENTAL"], collectible: false }),
  card({ id: "quest_rogue_crystal_core", name: "水晶核心", sourceNameEn: "Crystal Core", class: "rogue", type: "spell", rarity: "legendary", cost: 5, text: "在本局对战的剩余时间内，你的随从变为5/5。", rules: ["rogue_crystal_core"], collectible: false })
];

export const questRogueDeckCardIds: string[] = [
  "quest_rogue_preparation", "quest_rogue_preparation",
  "quest_rogue_shadowstep", "quest_rogue_shadowstep",
  "quest_rogue_backstab", "quest_rogue_backstab",
  "quest_rogue_the_caverns_below",
  "quest_rogue_fire_fly", "quest_rogue_fire_fly",
  "quest_rogue_southsea_deckhand", "quest_rogue_southsea_deckhand",
  "quest_rogue_stonetusk_boar", "quest_rogue_stonetusk_boar",
  "quest_rogue_undercity_huckster", "quest_rogue_undercity_huckster",
  "quest_rogue_patches",
  "quest_rogue_youthful_brewmaster", "quest_rogue_youthful_brewmaster",
  "quest_rogue_gadgetzan_ferryman", "quest_rogue_gadgetzan_ferryman",
  "quest_rogue_novice_engineer", "quest_rogue_novice_engineer",
  "quest_rogue_eviscerate", "quest_rogue_eviscerate",
  "quest_rogue_igneous_elemental", "quest_rogue_igneous_elemental",
  "quest_rogue_mimic_pod", "quest_rogue_mimic_pod",
  "quest_rogue_fan_of_knives", "quest_rogue_fan_of_knives"
];

const rogueHero: HeroClassProfile = {
  class: "rogue",
  classZh: "潜行者",
  classEn: "Rogue",
  defaultHero: "瓦莉拉",
  heroPowerName: "匕首精通",
  heroPowerCost: 2,
  heroPowerText: "装备一把1/2的匕首。",
  traits: ["任务", "回手", "海盗", "2017任务贼"],
  sourceUrls: []
};

export const questRogueTemplate: DeckTemplate = {
  id: "custom_quest_rogue_2017",
  class: "rogue",
  defaultClass: "rogue",
  classZh: "潜行者",
  classEn: "Rogue",
  nameZh: "2017任务贼",
  nameEn: "2017 Quest Rogue",
  era: "勇闯安戈洛",
  mode: "狂野怀旧",
  archetype: "任务组合",
  tags: ["任务", "回手", "低费随从", "水晶核心"],
  fame: "A",
  annoyance: 5,
  uniqueness: 5,
  coreCardsZh: ["探索地下洞穴", "水晶核心", "暗影步", "年轻的酒仙", "火羽精灵"],
  coreCardsEn: ["The Caverns Below", "Crystal Core", "Shadowstep", "Youthful Brewmaster", "Fire Fly"],
  winCondition: "重复使用同名低费随从完成任务，打出水晶核心后用5/5随从铺场压制。",
  whyIncluded: "按截图构筑的2017同款任务贼，保留任务、回手、海盗帕奇斯与水晶核心的核心节奏。",
  recommendedUse: "适合测试任务进度、回手组件与持续型随从属性光环。",
  sourceNote: "User-provided 2017 Quest Rogue decklist.",
  sourceUrls: [],
  hero: rogueHero,
  presetCardIds: questRogueDeckCardIds,
  expectedDeckSize: 30
};
