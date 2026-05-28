import type { CardDefinition } from "@dormstone/shared";
import { csvCoreCards } from "./csvCoreCards.js";
import { dragonHighlanderDruidCards } from "./dragonHighlanderDruid.js";
import { companionHunterCards } from "./companionHunter.js";
import { freezeMageCards } from "./freezeMage.js";
import { questRogueCards } from "./questRogue.js";
import { renathalPriestCards } from "./renathalPriest.js";

const now = new Date().toISOString();
type CardInput = Omit<CardDefinition, "status" | "collectible" | "version" | "updatedAt" | "keywords" | "effects"> &
  Partial<Pick<CardDefinition, "status" | "collectible" | "keywords" | "effects">>;

function card(input: CardInput): CardDefinition {
  const { status = "published", collectible = true, keywords = [], effects = [], ...rest } = input;
  return {
    ...rest,
    status,
    collectible,
    version: 1,
    updatedAt: now,
    keywords,
    effects
  };
}

export const sampleCards: CardDefinition[] = [
  ...csvCoreCards,
  ...dragonHighlanderDruidCards,
  ...companionHunterCards,
  ...freezeMageCards,
  ...questRogueCards,
  ...renathalPriestCards,
  card({ id: "coin", name: "先手机巧", class: "neutral", type: "spell", rarity: "common", cost: 0, text: "在本回合获得 1 点法力。", effects: [{ type: "gain_mana", amount: 1 }], collectible: false }),
  card({ id: "token_drone", name: "巡检构件", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 1, health: 1, text: "基础衍生随从。", collectible: false }),
  card({ id: "token_guard", name: "誓约卫兵", class: "warden", type: "minion", rarity: "common", cost: 1, attack: 1, health: 2, text: "嘲讽。", keywords: ["taunt"], collectible: false }),
  card({ id: "token_ghoul", name: "临时食尸鬼", class: "death_knight", type: "minion", rarity: "common", cost: 1, attack: 1, health: 1, text: "冲锋。", keywords: ["charge"], collectible: false }),
  card({ id: "token_recruit", name: "白银新兵", class: "paladin", type: "minion", rarity: "common", cost: 1, attack: 1, health: 1, text: "基础衍生随从。", collectible: false }),
  card({ id: "token_totem", name: "基础图腾", class: "shaman", type: "minion", rarity: "common", cost: 1, attack: 0, health: 2, text: "基础衍生随从。", collectible: false }),
  card({ id: "hero_power_death_knight", name: "Ghoul Charge", class: "death_knight", type: "hero_power", rarity: "common", cost: 2, text: "召唤一个具有冲锋的 1/1 食尸鬼。", effects: [{ type: "summon", cardId: "token_ghoul", amount: 1, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_demon_hunter", name: "Demon Claws", class: "demon_hunter", type: "hero_power", rarity: "common", cost: 1, text: "本回合获得 +1 攻击力。", effects: [{ type: "hero_attack", amount: 1, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_druid", name: "Shapeshift", class: "druid", type: "hero_power", rarity: "common", cost: 2, text: "本回合获得 +1 攻击力，并获得 1 点护甲。", effects: [{ type: "hero_attack", amount: 1, trigger: "hero_power" }, { type: "gain_armor", amount: 1, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_hunter", name: "Steady Shot", class: "hunter", type: "hero_power", rarity: "common", cost: 2, text: "对敌方英雄造成 2 点伤害。", effects: [{ type: "damage", amount: 2, target: "enemy_hero", trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_mage", name: "Fireblast", class: "mage", type: "hero_power", rarity: "common", cost: 2, text: "造成 1 点伤害。", effects: [{ type: "damage", amount: 1, target: "selected", trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_paladin", name: "Reinforce", class: "paladin", type: "hero_power", rarity: "common", cost: 2, text: "召唤一个 1/1 白银新兵。", effects: [{ type: "summon", cardId: "token_recruit", amount: 1, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_priest", name: "Lesser Heal", class: "priest", type: "hero_power", rarity: "common", cost: 2, text: "恢复 2 点生命值。", effects: [{ type: "heal", amount: 2, target: "selected", trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_rogue", name: "Dagger Mastery", class: "rogue", type: "hero_power", rarity: "common", cost: 2, text: "装备一把 1/2 匕首。", effects: [{ type: "equip_weapon", attack: 1, durability: 2, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_shaman", name: "Totemic Call", class: "shaman", type: "hero_power", rarity: "common", cost: 2, text: "召唤一个基础图腾。", effects: [{ type: "summon", cardId: "token_totem", amount: 1, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_warlock", name: "Life Tap", class: "warlock", type: "hero_power", rarity: "common", cost: 2, text: "受到 2 点伤害，抽一张牌。", effects: [{ type: "damage", amount: 2, target: "own_hero", trigger: "hero_power" }, { type: "draw", amount: 1, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_warrior", name: "Armor Up!", class: "warrior", type: "hero_power", rarity: "common", cost: 2, text: "获得 2 点护甲。", effects: [{ type: "gain_armor", amount: 2, trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_warden", name: "守护祷言", class: "warden", type: "hero_power", rarity: "common", cost: 2, text: "恢复 2 点生命值。", effects: [{ type: "heal", amount: 2, target: "selected", trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_arcanist", name: "星火", class: "arcanist", type: "hero_power", rarity: "common", cost: 2, text: "造成 1 点伤害。", effects: [{ type: "damage", amount: 1, target: "selected", trigger: "hero_power" }], collectible: false }),
  card({ id: "hero_power_gearwright", name: "装配", class: "gearwright", type: "hero_power", rarity: "common", cost: 2, text: "召唤一个 1/1 的巡检构件。", effects: [{ type: "summon", cardId: "token_drone", amount: 1, trigger: "hero_power" }], collectible: false }),

  card({ id: "neutral_squire", name: "街巷新兵", class: "neutral", type: "minion", rarity: "common", cost: 1, attack: 1, health: 2, text: "", keywords: [] }),
  card({ id: "neutral_guard", name: "路口守卫", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 2, health: 3, text: "嘲讽。", keywords: ["taunt"] }),
  card({ id: "neutral_archer", name: "屋顶弩手", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 2, health: 1, text: "战吼：造成 1 点伤害。", keywords: ["battlecry"], effects: [{ type: "damage", amount: 1, target: "selected", trigger: "battlecry" }] }),
  card({ id: "neutral_cleric", name: "流光医师", class: "neutral", type: "minion", rarity: "common", cost: 2, attack: 1, health: 3, text: "战吼：恢复 2 点生命值。", keywords: ["battlecry"], effects: [{ type: "heal", amount: 2, target: "selected", trigger: "battlecry" }] }),
  card({ id: "neutral_runner", name: "前线奔袭者", class: "neutral", type: "minion", rarity: "common", cost: 3, attack: 3, health: 2, text: "突袭。", keywords: ["rush"] }),
  card({ id: "neutral_golem", name: "石纹造物", class: "neutral", type: "minion", rarity: "common", cost: 3, attack: 3, health: 4, text: "", keywords: [] }),
  card({ id: "neutral_engineer", name: "抄录工程师", class: "neutral", type: "minion", rarity: "rare", cost: 3, attack: 2, health: 2, text: "战吼：抽一张牌。", keywords: ["battlecry"], effects: [{ type: "draw", amount: 1, trigger: "battlecry" }] }),
  card({ id: "neutral_knight", name: "晨辉骑士", class: "neutral", type: "minion", rarity: "rare", cost: 4, attack: 4, health: 4, text: "圣盾。", keywords: ["divine_shield"] }),
  card({ id: "neutral_raider", name: "破阵先锋", class: "neutral", type: "minion", rarity: "common", cost: 4, attack: 5, health: 3, text: "", keywords: [] }),
  card({ id: "neutral_medic", name: "巡队疗愈者", class: "neutral", type: "minion", rarity: "rare", cost: 5, attack: 4, health: 5, text: "吸血。", keywords: ["lifesteal"] }),
  card({ id: "neutral_sentinel", name: "城门重卫", class: "neutral", type: "minion", rarity: "common", cost: 5, attack: 3, health: 6, text: "嘲讽。", keywords: ["taunt"] }),
  card({ id: "neutral_colossus", name: "七环巨像", class: "neutral", type: "minion", rarity: "epic", cost: 7, attack: 7, health: 7, text: "", keywords: [] }),
  card({ id: "neutral_insight", name: "战术洞察", class: "neutral", type: "spell", rarity: "common", cost: 2, text: "抽两张牌。", effects: [{ type: "draw", amount: 2 }] }),
  card({ id: "neutral_blast", name: "聚能冲击", class: "neutral", type: "spell", rarity: "common", cost: 4, text: "造成 3 点伤害。", effects: [{ type: "damage", amount: 3, target: "selected" }] }),
  card({ id: "neutral_restoration", name: "急救术", class: "neutral", type: "spell", rarity: "common", cost: 3, text: "恢复 4 点生命值。", effects: [{ type: "heal", amount: 4, target: "selected" }] }),
  card({ id: "neutral_call", name: "临时征召", class: "neutral", type: "spell", rarity: "rare", cost: 5, text: "召唤两个 1/1 的巡检构件。", effects: [{ type: "summon", cardId: "token_drone", amount: 2 }] }),
  card({ id: "neutral_blade", name: "遗迹短刃", class: "neutral", type: "weapon", rarity: "common", cost: 3, attack: 3, durability: 2, text: "装备一把 3/2 武器。" }),

  card({ id: "warden_recruit", name: "誓厅学徒", class: "warden", type: "minion", rarity: "common", cost: 1, attack: 1, health: 3, text: "", keywords: [] }),
  card({ id: "warden_shieldbearer", name: "盾墙见习", class: "warden", type: "minion", rarity: "common", cost: 2, attack: 1, health: 4, text: "嘲讽。", keywords: ["taunt"] }),
  card({ id: "warden_oath_light", name: "誓光", class: "warden", type: "spell", rarity: "common", cost: 2, text: "恢复 3 点生命值，抽一张牌。", effects: [{ type: "heal", amount: 3, target: "selected" }, { type: "draw", amount: 1 }] }),
  card({ id: "warden_vanguard", name: "晨誓先锋", class: "warden", type: "minion", rarity: "rare", cost: 3, attack: 3, health: 3, text: "圣盾。", keywords: ["divine_shield"] }),
  card({ id: "warden_bastion", name: "白墙守备", class: "warden", type: "minion", rarity: "common", cost: 4, attack: 2, health: 6, text: "嘲讽。", keywords: ["taunt"] }),
  card({ id: "warden_lifebinder", name: "誓链医官", class: "warden", type: "minion", rarity: "rare", cost: 4, attack: 3, health: 4, text: "战吼：恢复 4 点生命值。", keywords: ["battlecry"], effects: [{ type: "heal", amount: 4, target: "selected", trigger: "battlecry" }] }),
  card({ id: "warden_sanctuary", name: "临阵壁垒", class: "warden", type: "spell", rarity: "rare", cost: 5, text: "召唤两个 1/2 并具有嘲讽的誓约卫兵。", effects: [{ type: "summon", cardId: "token_guard", amount: 2 }] }),
  card({ id: "warden_high_guard", name: "静誓统领", class: "warden", type: "minion", rarity: "legendary", cost: 6, attack: 5, health: 7, text: "嘲讽，吸血。", keywords: ["taunt", "lifesteal"] }),

  card({ id: "arcanist_spark", name: "星屑火花", class: "arcanist", type: "spell", rarity: "common", cost: 1, text: "造成 1 点伤害。", effects: [{ type: "damage", amount: 1, target: "selected" }] }),
  card({ id: "arcanist_apprentice", name: "观星学徒", class: "arcanist", type: "minion", rarity: "common", cost: 2, attack: 2, health: 2, text: "法术伤害 +1。", keywords: ["spell_damage"] }),
  card({ id: "arcanist_arc", name: "弧光箭", class: "arcanist", type: "spell", rarity: "common", cost: 2, text: "造成 2 点伤害。", effects: [{ type: "damage", amount: 2, target: "selected" }] }),
  card({ id: "arcanist_researcher", name: "星图研究员", class: "arcanist", type: "minion", rarity: "rare", cost: 3, attack: 2, health: 3, text: "战吼：抽一张牌。", keywords: ["battlecry"], effects: [{ type: "draw", amount: 1, trigger: "battlecry" }] }),
  card({ id: "arcanist_nova", name: "星环新星", class: "arcanist", type: "spell", rarity: "rare", cost: 4, text: "对所有敌人造成 2 点伤害。", effects: [{ type: "damage", amount: 2, target: "all_enemies" }] }),
  card({ id: "arcanist_channeler", name: "灵能导流者", class: "arcanist", type: "minion", rarity: "common", cost: 4, attack: 4, health: 3, text: "战吼：造成 2 点伤害。", keywords: ["battlecry"], effects: [{ type: "damage", amount: 2, target: "selected", trigger: "battlecry" }] }),
  card({ id: "arcanist_overload", name: "过载星芒", class: "arcanist", type: "spell", rarity: "epic", cost: 5, text: "造成 5 点伤害。", effects: [{ type: "damage", amount: 5, target: "selected" }] }),
  card({ id: "arcanist_archsage", name: "穹顶贤者", class: "arcanist", type: "minion", rarity: "legendary", cost: 6, attack: 4, health: 6, text: "法术伤害 +1。战吼：抽两张牌。", keywords: ["spell_damage", "battlecry"], effects: [{ type: "draw", amount: 2, trigger: "battlecry" }] }),

  card({ id: "gearwright_wrench", name: "扳手机修", class: "gearwright", type: "minion", rarity: "common", cost: 1, attack: 1, health: 2, text: "战吼：召唤一个 1/1 的巡检构件。", keywords: ["battlecry"], effects: [{ type: "summon", cardId: "token_drone", amount: 1, trigger: "battlecry" }] }),
  card({ id: "gearwright_microbot", name: "微型构件", class: "gearwright", type: "minion", rarity: "common", cost: 2, attack: 2, health: 2, text: "", keywords: [] }),
  card({ id: "gearwright_assembly", name: "快速装配", class: "gearwright", type: "spell", rarity: "common", cost: 2, text: "召唤两个 1/1 的巡检构件。", effects: [{ type: "summon", cardId: "token_drone", amount: 2 }] }),
  card({ id: "gearwright_turret", name: "折叠炮台", class: "gearwright", type: "minion", rarity: "common", cost: 3, attack: 2, health: 4, text: "嘲讽。", keywords: ["taunt"] }),
  card({ id: "gearwright_overclock", name: "超频校准", class: "gearwright", type: "spell", rarity: "rare", cost: 3, text: "使一个随从获得 +2/+2。", effects: [{ type: "buff", attack: 2, health: 2, target: "selected" }] }),
  card({ id: "gearwright_hammer", name: "脉冲扳锤", class: "gearwright", type: "weapon", rarity: "common", cost: 3, attack: 2, durability: 3, text: "装备一把 2/3 武器。" }),
  card({ id: "gearwright_salvager", name: "废件回收员", class: "gearwright", type: "minion", rarity: "rare", cost: 4, attack: 3, health: 5, text: "亡语：抽一张牌。", keywords: ["deathrattle"], effects: [{ type: "draw", amount: 1, trigger: "deathrattle" }] }),
  card({ id: "gearwright_titan", name: "总装核心", class: "gearwright", type: "minion", rarity: "legendary", cost: 6, attack: 6, health: 6, text: "战吼：召唤两个 1/1 的巡检构件。", keywords: ["battlecry"], effects: [{ type: "summon", cardId: "token_drone", amount: 2, trigger: "battlecry" }] })
];
