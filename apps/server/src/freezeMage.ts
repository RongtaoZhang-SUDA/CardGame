import type { CardDefinition, DeckTemplate, HeroClassProfile } from "@dormstone/shared";

type CardInput = Omit<CardDefinition, "status" | "collectible" | "version" | "updatedAt" | "keywords" | "effects"> &
  Partial<Pick<CardDefinition, "collectible" | "keywords" | "effects" | "rules" | "requiresTarget">>;

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

export const freezeMageCards: CardDefinition[] = [
  card({ id: "freeze_mage_ice_lance", name: "冰枪术", class: "mage", type: "spell", rarity: "common", cost: 1, text: "冻结一个角色。如果它已经被冻结，则改为对其造成4点伤害。", requiresTarget: true, rules: ["mage_ice_lance"] }),
  card({ id: "freeze_mage_arcane_missiles", name: "奥术飞弹", class: "mage", type: "spell", rarity: "common", cost: 1, text: "造成3点伤害，随机分配到所有敌人身上。", rules: ["mage_arcane_missiles"] }),

  card({ id: "freeze_mage_frostbolt", name: "寒冰箭", class: "mage", type: "spell", rarity: "common", cost: 2, text: "造成3点伤害，并使目标冻结。", requiresTarget: true, effects: [{ type: "damage", amount: 3, target: "selected" }], rules: ["mage_frostbolt"] }),
  card({ id: "freeze_mage_doomsayer", name: "末日预言者", class: "neutral", type: "minion", rarity: "epic", cost: 2, attack: 0, health: 7, text: "在你的回合开始时，消灭所有随从。", rules: ["mage_doomsayer"] }),
  card({ id: "freeze_mage_novice_engineer", name: "工程师学徒", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 1, health: 1, text: "战吼：抽一张牌。", keywords: ["battlecry"], effects: [{ type: "draw", amount: 1, trigger: "battlecry" }] }),
  card({ id: "freeze_mage_loot_hoarder", name: "战利品贮藏者", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 2, health: 1, text: "亡语：抽一张牌。", keywords: ["deathrattle"], effects: [{ type: "draw", amount: 1, trigger: "deathrattle" }] }),
  card({ id: "freeze_mage_bloodmage_thalnos", name: "血法师萨尔诺斯", class: "neutral", type: "minion", rarity: "legendary", cost: 2, attack: 1, health: 1, text: "法术伤害+1。亡语：抽一张牌。", keywords: ["spell_damage", "deathrattle"], effects: [{ type: "draw", amount: 1, trigger: "deathrattle" }] }),

  card({ id: "freeze_mage_arcane_intellect", name: "奥术智慧", class: "mage", type: "spell", rarity: "common", cost: 3, text: "抽两张牌。", effects: [{ type: "draw", amount: 2 }] }),
  card({ id: "freeze_mage_ice_block", name: "寒冰屏障", class: "mage", type: "spell", rarity: "epic", cost: 3, text: "奥秘：当你的英雄受到致命伤害时，防止该伤害，并在本回合中获得免疫。", rules: ["mage_secret_ice_block"] }),
  card({ id: "freeze_mage_frost_nova", name: "冰霜新星", class: "mage", type: "spell", rarity: "common", cost: 3, text: "冻结所有敌方随从。", rules: ["mage_frost_nova"] }),
  card({ id: "freeze_mage_ice_barrier", name: "寒冰护体", class: "mage", type: "spell", rarity: "common", cost: 3, text: "奥秘：当你的英雄受到攻击时，获得8点护甲。", rules: ["mage_secret_ice_barrier"] }),
  card({ id: "freeze_mage_acolyte_of_pain", name: "苦痛侍僧", class: "neutral", type: "minion", rarity: "common", cost: 3, attack: 1, health: 4, text: "每当该随从受到伤害，抽一张牌。", rules: ["mage_acolyte_of_pain"] }),

  card({ id: "freeze_mage_fireball", name: "火球术", class: "mage", type: "spell", rarity: "common", cost: 4, text: "造成6点伤害。", requiresTarget: true, effects: [{ type: "damage", amount: 6, target: "selected" }] }),
  card({ id: "freeze_mage_polymorph", name: "变形术", class: "mage", type: "spell", rarity: "common", cost: 4, text: "使一个随从变形成为1/1的绵羊。", requiresTarget: true, rules: ["mage_polymorph"] }),

  card({ id: "freeze_mage_antique_healbot", name: "老式治疗机器人", class: "neutral", type: "minion", rarity: "common", cost: 5, attack: 3, health: 3, races: ["MECHANICAL"], text: "战吼：为你的英雄恢复8点生命值。", keywords: ["battlecry"], effects: [{ type: "heal", amount: 8, target: "own_hero", trigger: "battlecry" }] }),

  card({ id: "freeze_mage_blizzard", name: "暴风雪", class: "mage", type: "spell", rarity: "rare", cost: 6, text: "对所有敌方随从造成2点伤害，并使其冻结。", rules: ["mage_blizzard"] }),

  card({ id: "freeze_mage_flamestrike", name: "烈焰风暴", class: "mage", type: "spell", rarity: "epic", cost: 7, text: "对所有敌方随从造成5点伤害。", effects: [{ type: "damage", amount: 5, target: "all_enemy_minions" }] }),

  card({ id: "freeze_mage_alexstrasza", name: "阿莱克丝塔萨", class: "neutral", type: "minion", rarity: "legendary", cost: 9, attack: 8, health: 8, races: ["DRAGON"], text: "战吼：将一个英雄的剩余生命值变为15。", keywords: ["battlecry"], requiresTarget: true, rules: ["mage_alexstrasza"] }),

  card({ id: "freeze_mage_pyroblast", name: "炎爆术", class: "mage", type: "spell", rarity: "epic", cost: 10, text: "造成10点伤害。", requiresTarget: true, effects: [{ type: "damage", amount: 10, target: "selected" }] }),

  card({ id: "freeze_token_sheep", name: "绵羊", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 1, health: 1, races: ["BEAST"], text: "", collectible: false })
];

export const freezeMageDeckCardIds = [
  ...Array(2).fill("freeze_mage_ice_lance"),
  "freeze_mage_arcane_missiles",
  ...Array(2).fill("freeze_mage_frostbolt"),
  ...Array(2).fill("freeze_mage_doomsayer"),
  ...Array(2).fill("freeze_mage_novice_engineer"),
  ...Array(2).fill("freeze_mage_loot_hoarder"),
  "freeze_mage_bloodmage_thalnos",
  ...Array(2).fill("freeze_mage_arcane_intellect"),
  ...Array(2).fill("freeze_mage_ice_block"),
  ...Array(2).fill("freeze_mage_frost_nova"),
  "freeze_mage_ice_barrier",
  ...Array(2).fill("freeze_mage_acolyte_of_pain"),
  ...Array(2).fill("freeze_mage_fireball"),
  "freeze_mage_polymorph",
  "freeze_mage_antique_healbot",
  ...Array(2).fill("freeze_mage_blizzard"),
  "freeze_mage_flamestrike",
  "freeze_mage_alexstrasza",
  "freeze_mage_pyroblast"
];

const mageHero: HeroClassProfile = {
  class: "mage",
  classZh: "法师",
  classEn: "Mage",
  defaultHero: "吉安娜",
  heroPowerName: "火焰冲击",
  heroPowerCost: 2,
  heroPowerText: "造成1点伤害。",
  traits: ["冰冻", "奥秘", "控场", "法术斩杀"],
  sourceUrls: []
};

export const freezeMageTemplate: DeckTemplate = {
  id: "custom_freeze_mage",
  class: "mage",
  defaultClass: "mage",
  classZh: "法师",
  classEn: "Mage",
  nameZh: "冰法",
  nameEn: "Freeze Mage",
  era: "狂野",
  mode: "狂野",
  archetype: "经典控场冰法",
  tags: ["冰冻", "奥秘", "法术", "控场", "斩杀"],
  fame: "A",
  annoyance: 4,
  uniqueness: 5,
  coreCardsZh: ["寒冰屏障", "冰霜新星", "暴风雪", "阿莱克丝塔萨", "炎爆术"],
  coreCardsEn: ["Ice Block", "Frost Nova", "Blizzard", "Alexstrasza", "Pyroblast"],
  winCondition: "用冰冻和清场拖慢攻势，依靠奥秘保命，再通过阿莱克丝塔萨、火球术、冰枪术和炎爆术完成斩杀。",
  whyIncluded: "按用户提供的截图接入冰法，并补齐冰冻、奥秘隐藏、抽牌、清场和斩杀组件。",
  recommendedUse: "在大厅直接选择这套30张冰法开始对战。",
  sourceNote: "主牌表按用户截图整理，卡文效果由用户确认后接入。",
  sourceUrls: [],
  hero: mageHero,
  presetCardIds: freezeMageDeckCardIds,
  expectedDeckSize: 30
};
