import type { CardDefinition, DeckTemplate, HeroClassProfile } from "@dormstone/shared";

type CardInput = Omit<CardDefinition, "status" | "collectible" | "version" | "updatedAt" | "keywords" | "effects"> &
  Partial<Pick<CardDefinition, "collectible" | "keywords" | "effects" | "rules" | "sideboardSlots" | "deckRules" | "requiresTarget" | "choiceOptionCardIds">>;

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

export const renathalPriestCards: CardDefinition[] = [
  card({ id: "reno_priest_raise_dead", name: "亡者复生", class: "priest", type: "spell", rarity: "common", cost: 0, text: "将本局对战中最后死亡的至多两个友方随从复制加入手牌。对你的英雄造成 3 点伤害。", rules: ["priest_raise_dead"] }),
  card({ id: "reno_priest_nightshade_tea", name: "夜影花茶", class: "priest", type: "spell", rarity: "rare", cost: 1, text: "对一个随从造成 2 点伤害。对你的英雄造成 2 点伤害。可使用 3 次。", repeatableUses: 3, requiresTarget: true, effects: [{ type: "damage", amount: 2, target: "any_minion" }, { type: "damage", amount: 2, target: "own_hero" }] }),
  card({ id: "reno_priest_finley", name: "海中向导芬利爵士", class: "neutral", type: "minion", rarity: "legendary", cost: 1, attack: 1, health: 3, text: "战吼：若你的牌库没有重复牌，交换你的手牌与牌库底部同等数量的牌。", keywords: ["battlecry"], rules: ["priest_finley"] }),
  card({ id: "reno_priest_zephrys", name: "了不起的杰弗里斯", class: "neutral", type: "minion", rarity: "legendary", cost: 2, attack: 3, health: 2, text: "战吼：若你的牌库没有重复牌，将一张应急愿望加入你的手牌。", keywords: ["battlecry"], rules: ["priest_zephrys"] }),
  card({ id: "reno_priest_fanboy", name: "饭圈迷弟", class: "priest", type: "minion", rarity: "common", cost: 2, attack: 2, health: 2, text: "抉择：使一个友方随从获得 +2 攻击力；或者获得 +2 生命值。", choiceOptionCardIds: ["reno_choice_fanboy_attack", "reno_choice_fanboy_health"] }),
  card({ id: "reno_priest_dirty_rat", name: "卑劣的脏鼠", class: "neutral", type: "minion", rarity: "epic", cost: 2, attack: 2, health: 6, text: "嘲讽。战吼：从对手手牌随机拉出一个随从。", keywords: ["taunt", "battlecry"], rules: ["dirty_rat"] }),
  card({ id: "reno_priest_kaldorei_spirit", name: "卡多雷精魂", class: "priest", type: "minion", rarity: "common", cost: 2, attack: 1, health: 3, text: "嘲讽，吸血。战吼：若你本回合使用过英雄技能，获得 +1/+1。", keywords: ["taunt", "lifesteal", "battlecry"], rules: ["priest_kaldorei_spirit"] }),
  card({ id: "reno_priest_identity_theft", name: "盗用身份", class: "priest", type: "spell", rarity: "rare", cost: 3, text: "复制对手手牌中的一张随机牌和牌库中的一张随机牌并置入你的手牌。", rules: ["priest_identity_theft"] }),
  card({ id: "reno_priest_illucia", name: "裂心者伊露希亚", class: "priest", type: "minion", rarity: "legendary", cost: 3, attack: 3, health: 3, text: "战吼：交换双方手牌。", keywords: ["battlecry"], rules: ["priest_illucia"] }),
  card({ id: "reno_priest_renathal", name: "雷纳索尔王子", class: "neutral", type: "minion", rarity: "legendary", cost: 3, attack: 3, health: 4, text: "对战开始时：你的起始牌库上限和起始生命值为 40。", deckRules: { deckSize: 40, startingHealth: 40 } }),
  card({ id: "reno_priest_tight_lipped", name: "锋鳞", class: "neutral", type: "minion", rarity: "epic", cost: 3, attack: 2, health: 4, text: "你的对手的卡牌法力值消耗不能少于 (2) 点。", rules: ["razorscale"] }),
  card({ id: "reno_priest_mixologist", name: "混调师", class: "neutral", type: "minion", rarity: "epic", cost: 3, attack: 2, health: 3, text: "战吼：将一份定制药水加入你的手牌。", keywords: ["battlecry"], rules: ["priest_mixologist"] }),
  card({ id: "reno_priest_hysteria", name: "狂乱", class: "priest", type: "spell", rarity: "epic", cost: 4, text: "选择一个随从。使其随机攻击其他随从，直到它死亡或场上没有其他随从。", requiresTarget: true, rules: ["priest_hysteria"] }),
  card({ id: "reno_priest_okani", name: "剑圣奥卡尼", class: "neutral", type: "minion", rarity: "legendary", cost: 4, attack: 2, health: 6, text: "抉择：反制对手打出的下一张随从牌；或者下一张法术牌。", keywords: ["battlecry"], choiceOptionCardIds: ["reno_choice_okani_minion", "reno_choice_okani_spell"] }),
  card({ id: "reno_priest_glowstone_worm", name: "亮石旋岩虫", class: "priest", type: "minion", rarity: "rare", cost: 4, attack: 4, health: 4, text: "吸血。", keywords: ["lifesteal"] }),
  card({ id: "reno_priest_raza", name: "缚链者拉兹", class: "priest", type: "minion", rarity: "legendary", cost: 5, attack: 5, health: 5, text: "战吼：若你的牌库没有重复牌，本局对战你的英雄技能消耗变为 0。", keywords: ["battlecry"], rules: ["priest_raza"] }),
  card({ id: "reno_priest_magatha", name: "乐坛灾星玛加萨", class: "neutral", type: "minion", rarity: "legendary", cost: 5, attack: 5, health: 5, text: "战吼：抽五张牌。抽到的法术牌改为交给你的对手。", keywords: ["battlecry"], rules: ["priest_magatha"] }),
  card({ id: "reno_priest_reno_jackson", name: "雷诺·杰克逊", class: "neutral", type: "minion", rarity: "legendary", cost: 6, attack: 4, health: 6, text: "战吼：若你的牌库没有重复牌，则将你的英雄恢复到生命上限。", keywords: ["battlecry"], rules: ["reno_jackson"] }),
  card({ id: "reno_priest_amanthul", name: "阿曼苏尔", class: "priest", type: "minion", rarity: "legendary", cost: 7, attack: 3, health: 10, text: "抉择：消灭一个敌方随从；或者抽两张牌。", choiceOptionCardIds: ["reno_choice_amanthul_remove", "reno_choice_amanthul_draw"] }),
  card({ id: "reno_priest_lone_ranger_reno", name: "孤胆游侠雷诺", class: "neutral", type: "hero", rarity: "legendary", cost: 8, text: "英雄牌。获得 5 点护甲。消灭所有敌方随从。将你的英雄技能替换为每回合随机切换的雷诺手枪。", effects: [{ type: "gain_armor", amount: 5 }], rules: ["priest_lone_ranger_reno"] }),
  card({ id: "reno_priest_deafen", name: "致聋术", class: "priest", type: "spell", rarity: "common", cost: 1, text: "沉默一个随从。", effects: [{ type: "silence", target: "selected" }] }),
  card({ id: "reno_priest_psychic_conjurer", name: "心灵咒术师", class: "priest", type: "minion", rarity: "common", cost: 1, attack: 1, health: 1, text: "战吼：复制对手牌库中的一张随机牌并置入你的手牌。", keywords: ["battlecry"], rules: ["priest_psychic_conjurer"] }),
  card({ id: "reno_priest_miracle_salesman", name: "奇迹推销员", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 2, health: 2, text: "亡语：抽一张牌。", keywords: ["deathrattle"], effects: [{ type: "draw", amount: 1, trigger: "deathrattle" }] }),
  card({ id: "reno_priest_serena", name: "塞瑞娜·血羽", class: "priest", type: "minion", rarity: "legendary", cost: 2, attack: 1, health: 1, text: "战吼：选择一个敌方随从，偷取其高于 1 的攻击力和当前生命值。", keywords: ["battlecry"], requiresTarget: true, rules: ["priest_serena"] }),
  card({ id: "reno_priest_cult_neophyte", name: "异教低阶牧师", class: "neutral", type: "minion", rarity: "rare", cost: 2, attack: 2, health: 3, text: "战吼：你对手下个回合的法术消耗增加 (1) 点。", keywords: ["battlecry"], rules: ["priest_cult_neophyte"] }),
  card({ id: "reno_priest_papercraft_angel", name: "纸艺天使", class: "priest", type: "minion", rarity: "common", cost: 2, attack: 2, health: 3, text: "在场时，你的英雄技能消耗为 0。", rules: ["priest_papercraft_angel"] }),
  card({ id: "reno_priest_cathedral", name: "赎罪教堂", class: "priest", type: "spell", rarity: "rare", cost: 3, text: "使一个友方随从获得 +2/+1。抽一张牌。", requiresTarget: true, effects: [{ type: "buff", attack: 2, health: 1, target: "friendly_minion" }, { type: "draw", amount: 1 }] }),
  card({ id: "reno_priest_lazul", name: "拉祖尔女士", class: "priest", type: "minion", rarity: "legendary", cost: 3, attack: 3, health: 2, text: "战吼：选择一张敌方手牌，复制并置入你的手牌。", keywords: ["battlecry"], rules: ["priest_lazul"] }),
  card({ id: "reno_priest_harvester", name: "嫉妒收割者", class: "priest", type: "minion", rarity: "legendary", cost: 3, attack: 4, health: 3, text: "战吼：复制对手手牌中的一张随机牌。", keywords: ["battlecry"], rules: ["priest_harvester"] }),
  card({ id: "reno_priest_holmes", name: "摩洛克·福尔摩斯", class: "neutral", type: "minion", rarity: "legendary", cost: 3, attack: 3, health: 4, text: "战吼：复制对手牌库中的两张随机牌。", keywords: ["battlecry"], rules: ["priest_holmes"] }),
  card({ id: "reno_priest_banker", name: "和善的银行职员", class: "priest", type: "minion", rarity: "epic", cost: 3, attack: 2, health: 4, text: "战吼：复制对手牌库中的一张随机法术牌。", keywords: ["battlecry"], rules: ["priest_banker"] }),
  card({ id: "reno_priest_puppet_theatre", name: "木偶剧场", class: "priest", type: "location", rarity: "common", cost: 4, durability: 2, text: "选择一个敌方随从，获取它的 1/1 复制，其法力值消耗为 (1)。", requiresTarget: true, rules: ["priest_puppet_theatre"] }),
  card({ id: "reno_priest_najark", name: "纳亚克·海克森", class: "priest", type: "minion", rarity: "legendary", cost: 4, attack: 1, health: 4, text: "战吼：夺取一个敌方随从。当纳亚克死亡时，将它归还。", keywords: ["battlecry", "deathrattle"], requiresTarget: true, rules: ["priest_najark"] }),
  card({ id: "reno_priest_etc", name: "乐队经理精英牛头人酋长", class: "neutral", type: "minion", rarity: "legendary", cost: 4, attack: 4, health: 4, text: "构筑时带三张备牌。战吼：从尚未取出的乐队备牌中选择一张加入手牌。", keywords: ["battlecry"], sideboardSlots: 3, rules: ["etc_band_manager"] }),
  card({ id: "reno_priest_loatheb", name: "洛欧塞布", class: "neutral", type: "minion", rarity: "legendary", cost: 5, attack: 5, health: 5, text: "战吼：你对手下个回合的法术消耗增加 (5) 点。", keywords: ["battlecry"], rules: ["priest_loatheb"] }),
  card({ id: "reno_priest_benedictus", name: "黑暗主教本尼迪塔斯", class: "priest", type: "minion", rarity: "legendary", cost: 5, attack: 5, health: 5, text: "对战开始时：将你的英雄技能替换为心灵尖刺。", rules: ["priest_benedictus"] }),
  card({ id: "reno_priest_spawn_of_shadows", name: "暗影子嗣", class: "priest", type: "minion", rarity: "epic", cost: 5, attack: 5, health: 5, text: "战吼：对双方英雄造成 4 点伤害。在场时，你使用英雄技能后再次如此。", keywords: ["battlecry"], rules: ["priest_spawn_of_shadows"] }),
  card({ id: "reno_priest_theotar", name: "疯狂公爵西塔尔", class: "neutral", type: "minion", rarity: "legendary", cost: 6, attack: 4, health: 4, text: "战吼：从双方手牌各选择一张牌并交换。", keywords: ["battlecry"], rules: ["theotar"] }),
  card({ id: "reno_priest_shadowreaper", name: "暗影收割者安度因", class: "priest", type: "spell", rarity: "legendary", cost: 8, text: "消灭所有攻击力大于或等于 5 的敌方随从。将你的英雄技能替换为虚空形态。", rules: ["priest_shadowreaper"] }),
  card({ id: "reno_priest_aviana", name: "艾维娜，艾露恩钦选者", class: "neutral", type: "minion", rarity: "legendary", cost: 9, attack: 5, health: 5, text: "战吼：将双方当前手牌的消耗变为 (1) 点。", keywords: ["battlecry"], rules: ["priest_aviana"] }),
  card({ id: "reno_band_rustrot_viper", name: "锈烂蝰蛇", class: "neutral", type: "minion", rarity: "common", cost: 3, attack: 3, health: 4, text: "战吼：摧毁对手的武器。", keywords: ["battlecry"], rules: ["rustrot_viper"] }),
  card({ id: "reno_band_steamcleaner", name: "蒸汽清洁器", class: "neutral", type: "minion", rarity: "rare", cost: 5, attack: 5, health: 5, text: "战吼：摧毁双方牌库中所有非起始牌。", keywords: ["battlecry"], rules: ["steamcleaner"] }),

  card({ id: "reno_choice_fanboy_attack", name: "饭圈迷弟：鼓动进攻", class: "priest", type: "spell", rarity: "common", cost: 0, text: "使一个友方随从获得 +2 攻击力。", requiresTarget: true, effects: [{ type: "buff", attack: 2, health: 0, target: "friendly_minion" }], collectible: false }),
  card({ id: "reno_choice_fanboy_health", name: "饭圈迷弟：保留体力", class: "priest", type: "spell", rarity: "common", cost: 0, text: "使一个友方随从获得 +2 生命值。", requiresTarget: true, effects: [{ type: "buff", attack: 0, health: 2, target: "friendly_minion" }], collectible: false }),
  card({ id: "reno_choice_okani_minion", name: "剑圣奥卡尼：反制随从", class: "neutral", type: "spell", rarity: "common", cost: 0, text: "反制对手打出的下一张随从牌。", rules: ["priest_okani_minion"], collectible: false }),
  card({ id: "reno_choice_okani_spell", name: "剑圣奥卡尼：反制法术", class: "neutral", type: "spell", rarity: "common", cost: 0, text: "反制对手打出的下一张法术牌。", rules: ["priest_okani_spell"], collectible: false }),
  card({ id: "reno_choice_amanthul_remove", name: "阿曼苏尔：剥离", class: "priest", type: "spell", rarity: "legendary", cost: 0, text: "消灭一个敌方随从。", requiresTarget: true, effects: [{ type: "destroy", target: "enemy_minion" }], collectible: false }),
  card({ id: "reno_choice_amanthul_draw", name: "阿曼苏尔：远见", class: "priest", type: "spell", rarity: "legendary", cost: 0, text: "抽两张牌。", effects: [{ type: "draw", amount: 2 }], collectible: false }),
  card({ id: "reno_token_wish", name: "应急愿望", class: "priest", type: "spell", rarity: "rare", cost: 1, text: "造成 3 点伤害。抽一张牌。", effects: [{ type: "damage", amount: 3, target: "selected" }, { type: "draw", amount: 1 }], collectible: false }),
  card({ id: "reno_token_mixture", name: "定制药水", class: "neutral", type: "spell", rarity: "rare", cost: 1, text: "恢复 3 点生命值。抽一张牌。", effects: [{ type: "heal", amount: 3, target: "selected" }, { type: "draw", amount: 1 }], collectible: false }),
  card({ id: "hero_power_mind_spike", name: "心灵尖刺", class: "priest", type: "hero_power", rarity: "common", cost: 2, text: "造成 2 点伤害。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_voidform", name: "虚空形态", class: "priest", type: "hero_power", rarity: "legendary", cost: 2, text: "造成 2 点伤害。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_reno_bullet_arcane", name: "奥术子弹", class: "neutral", type: "hero_power", rarity: "legendary", cost: 2, text: "造成 2 点伤害。恢复 2 点本回合法力。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }, { type: "gain_mana", amount: 2, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_reno_bullet_fire", name: "火焰子弹", class: "neutral", type: "hero_power", rarity: "legendary", cost: 2, text: "造成 2 点伤害。对所有敌方随从造成 1 点伤害。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }, { type: "damage", amount: 1, target: "all_enemy_minions", trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_reno_bullet_frost", name: "冰霜子弹", class: "neutral", type: "hero_power", rarity: "legendary", cost: 2, text: "造成 2 点伤害。获得 4 点护甲。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }, { type: "gain_armor", amount: 4, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_reno_bullet_holy", name: "神圣子弹", class: "neutral", type: "hero_power", rarity: "legendary", cost: 2, text: "造成 2 点伤害。随机使一个友方随从获得 +2/+2。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }], rules: ["priest_reno_holy_bullet"], collectible: false }),
  card({ id: "hero_power_reno_bullet_nature", name: "自然子弹", class: "neutral", type: "hero_power", rarity: "legendary", cost: 2, text: "造成 2 点伤害。发现一张法术牌。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }], rules: ["priest_reno_nature_bullet"], collectible: false }),
  card({ id: "hero_power_reno_bullet_shadow", name: "暗影子弹", class: "neutral", type: "hero_power", rarity: "legendary", cost: 2, text: "造成 2 点伤害。随机召唤一个 3 费随从。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }], rules: ["priest_reno_shadow_bullet"], collectible: false }),
  card({ id: "hero_power_reno_bullet_fel", name: "邪能子弹", class: "neutral", type: "hero_power", rarity: "legendary", cost: 2, text: "造成 2 点伤害。抽一张牌。", effects: [{ type: "damage", amount: 2, target: "selected", trigger: "hero_power" }, { type: "draw", amount: 1, trigger: "hero_power" }], collectible: false })
];

export const renathalPriestDeckCardIds = renathalPriestCards.slice(0, 40).map((item) => item.id);
export const renathalPriestSideboardCardIds = ["reno_priest_theotar", "reno_band_rustrot_viper", "reno_band_steamcleaner"];

const priestHero: HeroClassProfile = {
  class: "priest",
  classZh: "牧师",
  classEn: "Priest",
  defaultHero: "安度因",
  heroPowerName: "次级治疗术",
  heroPowerCost: 2,
  heroPowerText: "恢复 2 点生命值。",
  traits: ["宇宙", "资源", "英雄技能联动", "40 张雷纳索尔构筑"],
  sourceUrls: []
};

export const renathalPriestTemplate: DeckTemplate = {
  id: "custom_reno_priest_renathal",
  class: "priest",
  defaultClass: "priest",
  classZh: "牧师",
  classEn: "Priest",
  nameZh: "宇宙牧 / 雷诺牧 40",
  nameEn: "Renathal Reno Priest",
  era: "CSV 预设",
  mode: "狂野",
  archetype: "宇宙控制",
  tags: ["宇宙", "雷纳索尔", "雷诺", "备牌"],
  fame: "S",
  annoyance: 5,
  uniqueness: 5,
  coreCardsZh: ["雷纳索尔王子", "雷诺·杰克逊", "缚链者拉兹", "暗影收割者安度因", "乐队经理精英牛头人酋长"],
  coreCardsEn: ["Prince Renathal", "Reno Jackson", "Raza the Chained", "Shadowreaper Anduin", "E.T.C., Band Manager"],
  winCondition: "依靠宇宙保命、资源交换和英雄技能组件拖入后期。",
  whyIncluded: "按用户提供的完整 CSV 套牌加入，并保留雷纳索尔 40 张起始牌库与 E.T.C. 三张备牌。",
  recommendedUse: "直接在大厅选择这套预设开始对战。",
  sourceNote: "主套牌来自用户 CSV；牛头人备牌规则和三张备牌文本按当前卡牌资料建模。",
  sourceUrls: [],
  hero: priestHero,
  presetCardIds: renathalPriestDeckCardIds,
  sideboardCardIds: renathalPriestSideboardCardIds,
  expectedDeckSize: 40
};
