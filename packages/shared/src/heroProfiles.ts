import type { HeroClassProfile } from "./types.js";

export const HERO_CLASS_PROFILES: Record<string, HeroClassProfile> = {
  death_knight: {
    class: "death_knight",
    classZh: "死亡骑士",
    classEn: "Death Knight",
    defaultHero: "The Lich King",
    heroPowerName: "Ghoul Charge",
    heroPowerCost: 2,
    heroPowerText: "召唤一个具有冲锋的 1/1 食尸鬼。",
    traits: ["亡灵", "符文", "尸体资源", "中后期压制"],
    sourceUrls: ["https://hearthstone.wiki.gg/wiki/Ghoul_Charge", "https://hearthstone.fandom.com/wiki/Class"]
  },
  demon_hunter: {
    class: "demon_hunter",
    classZh: "恶魔猎手",
    classEn: "Demon Hunter",
    defaultHero: "Illidan Stormrage",
    heroPowerName: "Demon Claws",
    heroPowerCost: 1,
    heroPowerText: "本回合获得 +1 攻击力。",
    traits: ["英雄攻击", "低费节奏", "流放", "恶魔协同"],
    sourceUrls: ["https://hearthstone.wiki.gg/wiki/Demon_Hunter", "https://hearthstone.fandom.com/wiki/Hero_Power"]
  },
  druid: {
    class: "druid",
    classZh: "德鲁伊",
    classEn: "Druid",
    defaultHero: "Malfurion Stormrage",
    heroPowerName: "Shapeshift",
    heroPowerCost: 2,
    heroPowerText: "本回合获得 +1 攻击力，并获得 1 点护甲。",
    traits: ["跳费", "抉择", "铺场", "大哥与资源"],
    sourceUrls: ["https://hearthstone.wiki.gg/wiki/Druid", "https://hearthstone.wiki.gg/wiki/Shapeshift"]
  },
  hunter: {
    class: "hunter",
    classZh: "猎人",
    classEn: "Hunter",
    defaultHero: "Rexxar",
    heroPowerName: "Steady Shot",
    heroPowerCost: 2,
    heroPowerText: "对敌方英雄造成 2 点伤害。",
    traits: ["野兽", "直伤", "奥秘", "快攻压血"],
    sourceUrls: ["https://hearthstone.fandom.com/wiki/Hero_Power", "https://hearthstone.fandom.com/wiki/Class"]
  },
  mage: {
    class: "mage",
    classZh: "法师",
    classEn: "Mage",
    defaultHero: "Jaina Proudmoore",
    heroPowerName: "Fireblast",
    heroPowerCost: 2,
    heroPowerText: "造成 1 点伤害。",
    traits: ["法术", "冻结", "直伤", "控制与斩杀"],
    sourceUrls: ["https://hearthstone.fandom.com/wiki/Hero_Power", "https://hearthstone.fandom.com/wiki/Class"]
  },
  paladin: {
    class: "paladin",
    classZh: "圣骑士",
    classEn: "Paladin",
    defaultHero: "Uther Lightbringer",
    heroPowerName: "Reinforce",
    heroPowerCost: 2,
    heroPowerText: "召唤一个 1/1 白银之手新兵。",
    traits: ["铺场", "圣盾", "增益", "武器"],
    sourceUrls: ["https://hearthstone.fandom.com/wiki/Hero_Power", "https://hearthstone.fandom.com/wiki/Class"]
  },
  priest: {
    class: "priest",
    classZh: "牧师",
    classEn: "Priest",
    defaultHero: "Anduin Wrynn",
    heroPowerName: "Lesser Heal",
    heroPowerCost: 2,
    heroPowerText: "恢复 2 点生命值。",
    traits: ["治疗", "控制", "偷牌", "复活与资源"],
    sourceUrls: ["https://hearthstone.fandom.com/wiki/Hero_Power", "https://hearthstone.fandom.com/wiki/Class"]
  },
  rogue: {
    class: "rogue",
    classZh: "潜行者",
    classEn: "Rogue",
    defaultHero: "Valeera Sanguinar",
    heroPowerName: "Dagger Mastery",
    heroPowerCost: 2,
    heroPowerText: "装备一把 1/2 匕首。",
    traits: ["连击", "武器节奏", "回手", "爆发"],
    sourceUrls: ["https://hearthstone.fandom.com/wiki/Hero_Power", "https://hearthstone.fandom.com/wiki/Class"]
  },
  shaman: {
    class: "shaman",
    classZh: "萨满祭司",
    classEn: "Shaman",
    defaultHero: "Thrall",
    heroPowerName: "Totemic Call",
    heroPowerCost: 2,
    heroPowerText: "召唤一个基础图腾。",
    traits: ["图腾", "过载", "元素", "进化与战吼"],
    sourceUrls: ["https://hearthstone.fandom.com/wiki/Hero_Power", "https://hearthstone.fandom.com/wiki/Class"]
  },
  warlock: {
    class: "warlock",
    classZh: "术士",
    classEn: "Warlock",
    defaultHero: "Gul'dan",
    heroPowerName: "Life Tap",
    heroPowerCost: 2,
    heroPowerText: "受到 2 点伤害，抽一张牌。",
    traits: ["自伤", "抽牌", "恶魔", "弃牌与控制"],
    sourceUrls: ["https://hearthstone.fandom.com/wiki/Hero_Power", "https://hearthstone.fandom.com/wiki/Class"]
  },
  warrior: {
    class: "warrior",
    classZh: "战士",
    classEn: "Warrior",
    defaultHero: "Garrosh Hellscream",
    heroPowerName: "Armor Up!",
    heroPowerCost: 2,
    heroPowerText: "获得 2 点护甲。",
    traits: ["护甲", "武器", "受伤协同", "控制与海盗快攻"],
    sourceUrls: ["https://hearthstone.fandom.com/wiki/Hero_Power", "https://hearthstone.fandom.com/wiki/Class"]
  }
};

