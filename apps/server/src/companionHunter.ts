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

export const companionHunterCards: CardDefinition[] = [
  card({ id: "companion_hunter_mad_alchemist", name: "疯狂的炼金师", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 2, health: 2, races: ["UNDEAD"], text: "战吼：使一个随从的攻击力和生命值互换。", keywords: ["battlecry"], requiresTarget: true, rules: ["hunter_mad_alchemist"] }),
  card({ id: "companion_hunter_animal_companion", name: "动物伙伴", class: "hunter", type: "spell", rarity: "common", cost: 3, text: "随机召唤一个野兽伙伴。", rules: ["hunter_animal_companion"] }),
  card({ id: "companion_hunter_broll", name: "布罗尔·熊皮", class: "hunter", type: "minion", rarity: "legendary", cost: 5, attack: 3, health: 5, text: "在你施放一个法术后，随机召唤一个动物伙伴。", rules: ["hunter_broll_bearmantle"] }),
  card({ id: "companion_hunter_raptor_nest_caretaker", name: "迅猛龙巢护工", class: "hunter", type: "minion", rarity: "rare", cost: 1, attack: 1, health: 1, text: "战吼：随机获取一张法力值消耗为（1）的随从牌。亡语：随机获取一张法力值消耗为（1）的法术牌。", keywords: ["battlecry", "deathrattle"], rules: ["hunter_raptor_nest_caretaker"] }),
  card({ id: "companion_hunter_aurelia", name: "游侠队长奥蕾莉亚", class: "hunter", type: "minion", rarity: "legendary", cost: 3, attack: 2, health: 4, text: "战吼：发现一张法术牌。如果你使用过希尔瓦娜斯或温蕾萨，每使用过一位，重复一次。", keywords: ["battlecry"], rules: ["hunter_ranger_aurelia"] }),
  card({ id: "companion_hunter_vereesa", name: "游侠新兵温蕾萨", class: "hunter", type: "minion", rarity: "legendary", cost: 3, attack: 2, health: 4, text: "战吼：使你牌库中的随从牌获得+1/+1。如果你使用过奥蕾莉亚或希尔瓦娜斯，每使用过一位，重复一次。", keywords: ["battlecry"], rules: ["hunter_ranger_vereesa"] }),
  card({ id: "companion_hunter_sylvanas", name: "游侠将军希尔瓦娜斯", class: "hunter", type: "minion", rarity: "legendary", cost: 3, attack: 2, health: 4, text: "奇闻。战吼：对所有敌人造成2点伤害。如果你使用过奥蕾莉亚或温蕾萨，每使用过一位，重复一次。", keywords: ["battlecry"], rules: ["hunter_ranger_sylvanas"] }),
  card({ id: "companion_hunter_taya", name: "塔雅·陆行", class: "hunter", type: "minion", rarity: "legendary", cost: 5, attack: 4, health: 6, text: "战吼：在本局对战中，你的召唤动物伙伴的卡牌多召唤一个伙伴。", keywords: ["battlecry"], rules: ["hunter_taya_runetotem"] }),
  card({ id: "companion_hunter_tracking", name: "追踪术", class: "hunter", type: "spell", rarity: "common", cost: 1, text: "从你的牌库中发现一张牌。", rules: ["hunter_tracking"] }),
  card({ id: "companion_hunter_little_critter_caretaker", name: "小动物看护者", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 2, health: 2, text: "在你的回合结束时，为双方英雄各恢复3点生命值。", rules: ["hunter_little_critter_caretaker"] }),
  card({ id: "companion_hunter_wound_prey", name: "击伤猎物", class: "hunter", type: "spell", rarity: "common", cost: 1, text: "造成1点伤害。召唤一只1/1并具有突袭的土狼。", requiresTarget: true, rules: ["hunter_wound_prey"] }),
  card({ id: "companion_hunter_blazing_cinder", name: "炽烈烬火", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 2, health: 1, races: ["ELEMENTAL"], text: "亡语：造成2点伤害，随机分配到所有敌人身上。", keywords: ["deathrattle"], rules: ["hunter_blazing_cinder"] }),
  card({ id: "companion_hunter_sands_of_time", name: "时间之沙", class: "neutral", type: "spell", rarity: "common", cost: 1, text: "回溯。发现一张任意职业的法术牌。", rules: ["hunter_sands_of_time"] }),
  card({ id: "companion_hunter_face_the_tolvir", name: "直面托维尔", class: "hunter", type: "spell", rarity: "epic", cost: 3, text: "再次使用你在本局对战中使用过的每一张法力值消耗为（1）的牌（尽可能以敌人为目标）。", rules: ["hunter_face_the_tolvir"] }),
  card({ id: "companion_hunter_tame_beast", name: "驯服宠物", class: "hunter", type: "spell", rarity: "common", cost: 1, text: "将你此后的动物伙伴替换为法力值消耗增加（1）点的随机野兽。抽一张牌。", effects: [{ type: "draw", amount: 1 }], rules: ["hunter_tame_beast"] }),
  card({ id: "companion_hunter_spirit_bond_hunter", name: "灵语猎手", class: "hunter", type: "minion", rarity: "rare", cost: 4, attack: 2, health: 2, text: "战吼：选择并召唤一个动物伙伴。", keywords: ["battlecry"], choiceOptionCardIds: ["companion_choice_misha", "companion_choice_leokk", "companion_choice_huffer"], rules: ["hunter_spirit_bond_hunter"] }),
  card({ id: "companion_hunter_migrating_elekk", name: "迁徙的雷象", class: "hunter", type: "minion", rarity: "rare", cost: 2, attack: 2, health: 3, races: ["BEAST"], text: "嘲讽。战吼：将你此后的动物伙伴替换为法力值消耗增加（1）点的随机野兽。", keywords: ["taunt", "battlecry"], rules: ["hunter_migrating_elekk"] }),
  card({ id: "companion_hunter_free_roam", name: "自由漫步", class: "hunter", type: "spell", rarity: "rare", cost: 7, text: "将你此后的动物伙伴替换为法力值消耗增加（2）点的随机野兽。选择并召唤一个动物伙伴。", choiceOptionCardIds: ["companion_choice_misha", "companion_choice_leokk", "companion_choice_huffer"], rules: ["hunter_free_roam"] }),
  card({ id: "companion_hunter_call_of_the_wild", name: "兽群呼唤", class: "hunter", type: "spell", rarity: "epic", cost: 8, text: "召唤全部三个动物伙伴。", rules: ["hunter_call_of_the_wild"] }),
  card({ id: "companion_hunter_niri", name: "环形山的尼利", class: "hunter", type: "minion", rarity: "legendary", cost: 3, attack: 2, health: 5, text: "每当你使用一张法力值消耗为（1）的随从牌，使其属性值翻倍。每当你施放一个法力值消耗为（1）的法术，施放两次。", rules: ["hunter_niri_of_ungoro"] }),
  card({ id: "companion_hunter_archbishop_nelle", name: "大主教奈丽", class: "hunter", type: "minion", rarity: "legendary", cost: 3, attack: 3, health: 4, races: ["DRAENEI"], text: "战吼：将你的英雄技能替换为追踪术（从你的牌库中发现一张牌）。", keywords: ["battlecry"], rules: ["hunter_archbishop_nelle"] }),
  card({ id: "companion_hunter_beaststalker_tavish", name: "野兽追猎者塔维什", class: "hunter", type: "hero", rarity: "legendary", cost: 6, health: 30, text: "战吼：发现并施放两张强化的奥秘牌。", keywords: ["battlecry"], effects: [{ type: "gain_armor", amount: 5 }], rules: ["hunter_beaststalker_tavish"] }),
  card({ id: "companion_hunter_heart_of_stranglethorn", name: "荆棘谷之心", class: "hunter", type: "spell", rarity: "legendary", cost: 8, text: "可交易。复活所有法力值消耗大于或等于（5）点的友方野兽。", rules: ["hunter_heart_of_stranglethorn"] }),
  card({ id: "companion_hunter_zuljin", name: "祖尔金", class: "hunter", type: "hero", rarity: "legendary", cost: 10, health: 30, text: "战吼：施放你在本局对战中使用过的所有法术（目标随机而定）。", keywords: ["battlecry"], effects: [{ type: "gain_armor", amount: 5 }], rules: ["hunter_zuljin"] }),

  card({ id: "hunter_secret_improved_frost_trap", name: "强化冰霜陷阱", class: "hunter", type: "spell", rarity: "rare", cost: 2, text: "奥秘：当你的对手施放一个法术时，改为将其移回拥有者的手牌，并且法力值消耗增加（2）点。", rules: ["hunter_secret_improved_frost_trap"], collectible: false }),
  card({ id: "hunter_secret_improved_explosive_trap", name: "强化爆炸陷阱", class: "hunter", type: "spell", rarity: "rare", cost: 2, text: "奥秘：当你的英雄受到攻击，对所有敌人造成2点伤害。", rules: ["hunter_secret_improved_explosive_trap"], collectible: false }),
  card({ id: "hunter_secret_improved_snake_trap", name: "强化毒蛇陷阱", class: "hunter", type: "spell", rarity: "rare", cost: 2, text: "奥秘：当你的随从受到攻击时，召唤三条2/2的蛇。", rules: ["hunter_secret_improved_snake_trap"], collectible: false }),
  card({ id: "hunter_secret_improved_pack_tactics", name: "强化集群战术", class: "hunter", type: "spell", rarity: "rare", cost: 2, text: "奥秘：当一个友方随从受到攻击时，召唤两个该随从的3/3的复制。", rules: ["hunter_secret_improved_pack_tactics"], collectible: false }),
  card({ id: "hunter_secret_improved_open_the_cages", name: "强化打开兽笼", class: "hunter", type: "spell", rarity: "rare", cost: 2, text: "奥秘：当你的回合开始时，如果你控制着两个随从，召唤两个动物伙伴。", rules: ["hunter_secret_improved_open_the_cages"], collectible: false }),

  card({ id: "hero_power_hunter_tracking", name: "追踪术", class: "hunter", type: "hero_power", rarity: "common", cost: 1, text: "从你的牌库中发现一张牌。", rules: ["hunter_tracking"], collectible: false }),
  card({ id: "hero_power_tavish_beast_companion", name: "召唤宠物", class: "hunter", type: "hero_power", rarity: "common", cost: 2, text: "随机召唤一个动物伙伴。", rules: ["hunter_animal_companion"], collectible: false }),

  card({ id: "hunter_token_improved_snake", name: "蛇", class: "hunter", type: "minion", rarity: "common", cost: 1, attack: 2, health: 2, races: ["BEAST"], text: "强化毒蛇陷阱召唤的野兽。", collectible: false }),
  card({ id: "companion_token_misha", name: "米莎", class: "hunter", type: "minion", rarity: "common", cost: 3, attack: 4, health: 4, races: ["BEAST"], text: "嘲讽。", keywords: ["taunt"], collectible: false }),
  card({ id: "companion_token_leokk", name: "雷欧克", class: "hunter", type: "minion", rarity: "common", cost: 3, attack: 2, health: 4, races: ["BEAST"], text: "你的其他随从获得+1攻击力。", rules: ["beast_leokk_aura"], collectible: false }),
  card({ id: "companion_token_huffer", name: "霍弗", class: "hunter", type: "minion", rarity: "common", cost: 3, attack: 4, health: 2, races: ["BEAST"], text: "冲锋。", keywords: ["charge"], collectible: false }),
  card({ id: "companion_choice_misha", name: "召唤米莎", class: "hunter", type: "spell", rarity: "common", cost: 3, text: "召唤米莎。", rules: ["hunter_companion_misha"], collectible: false }),
  card({ id: "companion_choice_leokk", name: "召唤雷欧克", class: "hunter", type: "spell", rarity: "common", cost: 3, text: "召唤雷欧克。", rules: ["hunter_companion_leokk"], collectible: false }),
  card({ id: "companion_choice_huffer", name: "召唤霍弗", class: "hunter", type: "spell", rarity: "common", cost: 3, text: "召唤霍弗。", rules: ["hunter_companion_huffer"], collectible: false }),
  card({ id: "companion_token_hyena", name: "受伤的土狼", class: "hunter", type: "minion", rarity: "common", cost: 1, attack: 1, health: 1, races: ["BEAST"], text: "突袭。", keywords: ["rush"], collectible: false }),

  card({ id: "companion_beast_bloodfen_raptor", name: "血沼迅猛龙", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 3, health: 2, races: ["BEAST"], text: "野兽随从。" }),
  card({ id: "companion_beast_ironfur_grizzly", name: "铁鬃灰熊", class: "neutral", type: "minion", rarity: "common", cost: 3, attack: 3, health: 3, races: ["BEAST"], text: "嘲讽。", keywords: ["taunt"] }),
  card({ id: "companion_beast_lost_tallstrider", name: "迷失的陆行鸟", class: "neutral", type: "minion", rarity: "common", cost: 4, attack: 5, health: 4, races: ["BEAST"], text: "野兽随从。" }),
  card({ id: "companion_beast_oasis_snapjaw", name: "绿洲钳嘴龟", class: "neutral", type: "minion", rarity: "common", cost: 4, attack: 2, health: 7, races: ["BEAST"], text: "野兽随从。" }),
  card({ id: "companion_beast_stranglethorn_tiger", name: "荆棘谷猛虎", class: "neutral", type: "minion", rarity: "common", cost: 5, attack: 5, health: 5, races: ["BEAST"], text: "野兽随从。" }),
  card({ id: "companion_beast_savannah_highmane", name: "长鬃草原狮", class: "hunter", type: "minion", rarity: "rare", cost: 6, attack: 6, health: 5, races: ["BEAST"], text: "亡语：召唤两只2/2的土狼。", keywords: ["deathrattle"] }),
  card({ id: "companion_beast_giant_mastodon", name: "巨型乳齿象", class: "neutral", type: "minion", rarity: "common", cost: 7, attack: 6, health: 10, races: ["BEAST"], text: "嘲讽。", keywords: ["taunt"] }),
  card({ id: "companion_beast_king_krush", name: "暴龙王克鲁什", class: "hunter", type: "minion", rarity: "legendary", cost: 9, attack: 8, health: 8, races: ["BEAST"], text: "冲锋。", keywords: ["charge"] })
];

export const companionHunterDeckCardIds = [
  ...Array(2).fill("companion_hunter_tame_beast"),
  ...Array(2).fill("companion_hunter_raptor_nest_caretaker"),
  ...Array(2).fill("companion_hunter_migrating_elekk"),
  ...Array(2).fill("companion_hunter_face_the_tolvir"),
  "companion_hunter_vereesa",
  "companion_hunter_niri",
  ...Array(2).fill("companion_hunter_spirit_bond_hunter"),
  "companion_hunter_broll",
  ...Array(2).fill("companion_hunter_free_roam"),
  ...Array(2).fill("companion_hunter_call_of_the_wild"),
  ...Array(2).fill("companion_hunter_wound_prey"),
  ...Array(2).fill("companion_hunter_little_critter_caretaker"),
  ...Array(2).fill("companion_hunter_animal_companion"),
  "companion_hunter_aurelia",
  "companion_hunter_sylvanas",
  "companion_hunter_archbishop_nelle",
  "companion_hunter_taya",
  "companion_hunter_beaststalker_tavish",
  "companion_hunter_heart_of_stranglethorn",
  "companion_hunter_zuljin"
];

const hunterHero: HeroClassProfile = {
  class: "hunter",
  classZh: "猎人",
  classEn: "Hunter",
  defaultHero: "雷克萨",
  heroPowerName: "稳固射击",
  heroPowerCost: 2,
  heroPowerText: "对敌方英雄造成2点伤害。",
  traits: ["动物伙伴", "野兽", "法术联动", "中速节奏"],
  sourceUrls: []
};

export const companionHunterTemplate: DeckTemplate = {
  id: "custom_companion_hunter",
  class: "hunter",
  defaultClass: "hunter",
  classZh: "猎人",
  classEn: "Hunter",
  nameZh: "伙伴猎",
  nameEn: "Companion Hunter",
  era: "标准",
  mode: "狂野",
  archetype: "动物伙伴野兽猎",
  tags: ["动物伙伴", "野兽", "猎人", "节奏"],
  fame: "A",
  annoyance: 4,
  uniqueness: 5,
  coreCardsZh: ["动物伙伴", "塔雅·陆行", "驯服宠物", "迁徙的雷象", "直面托维尔"],
  coreCardsEn: ["Animal Companion", "Taya Runetotem", "Tame Beast", "Migrating Elekk", "Face the Tol'vir"],
  winCondition: "用低费组件和动物伙伴建立场面，通过驯服宠物、迁徙的雷象、自由漫步和直面托维尔把后续伙伴升级成更高费随机野兽，再用荆棘谷之心、兽群呼唤和祖尔金扩大场面压力。",
  whyIncluded: "按用户提供的营地截图修正为 30 张伙伴猎牌表，并为动物伙伴、伙伴升级、英雄技能替换、复活野兽和祖尔金重放法术补上可执行规则。",
  recommendedUse: "在大厅直接选择这套30张伙伴猎开始对战。",
  sourceNote: "牌表按用户提供的营地截图核对，并用 HearthstoneJSON 中文卡牌数据校准缺失卡牌的类型、费用和正文。",
  sourceUrls: [
    "https://www.iyingdi.com/web/tools/hearthstone/userdecks/deckdetail/12075187?btypes=home",
    "https://hearthstone.huijiwiki.com/wiki/Card/68529",
    "https://hearthstone.huijiwiki.com/wiki/%E9%87%8E%E5%85%BD%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89",
    "https://api.hearthstonejson.com/v1/latest/zhCN/cards.json"
  ],
  hero: hunterHero,
  presetCardIds: companionHunterDeckCardIds,
  expectedDeckSize: 30
};
