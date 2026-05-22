import type { CardDefinition } from "@dormstone/shared";

// Generated from the user CSV core-card names and HearthstoneJSON latest card data.
// This file stores only compact playable proxy metadata: name, class, type, rarity, stats, mechanics-derived keywords, and simplified effects.
export const csvCoreCards: CardDefinition[] = [
  {
    "id": "hsjson_RLK_038",
    "name": "冰冷触摸",
    "class": "death_knight",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "造成 2 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 2,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_RLK_025",
    "name": "冰霜打击",
    "class": "death_knight",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "造成 3 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 3,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_JAM_006",
    "name": "冻感舞步",
    "class": "death_knight",
    "type": "spell",
    "rarity": "rare",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_RLK_116",
    "name": "死灵殡葬师",
    "class": "death_knight",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_CORE_RLK_051",
    "name": "吸血鬼之血",
    "class": "death_knight",
    "type": "spell",
    "rarity": "rare",
    "cost": 2,
    "text": "抽 1 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_RLK_061",
    "name": "战场通灵师",
    "class": "death_knight",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 2
  },
  {
    "id": "hsjson_TOY_823",
    "name": "彩虹裁缝",
    "class": "death_knight",
    "type": "minion",
    "rarity": "epic",
    "cost": 3,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "health": 3
  },
  {
    "id": "hsjson_RLK_015",
    "name": "凛风冲击",
    "class": "death_knight",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "造成 3 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 3,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_RLK_087",
    "name": "窒息",
    "class": "death_knight",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_RLK_024",
    "name": "灵界打击",
    "class": "death_knight",
    "type": "spell",
    "rarity": "common",
    "cost": 4,
    "text": "吸血。造成 6 点伤害。",
    "keywords": [
      "lifesteal"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 6,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_RLK_707",
    "name": "墓地之力",
    "class": "death_knight",
    "type": "spell",
    "rarity": "epic",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_RLK_035",
    "name": "邪爆",
    "class": "death_knight",
    "type": "spell",
    "rarity": "rare",
    "cost": 5,
    "text": "造成 1 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 1,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_LEG_RLK_224",
    "name": "监督者弗里吉达拉",
    "class": "death_knight",
    "type": "minion",
    "rarity": "legendary",
    "cost": 6,
    "text": "战吼。战吼：造成 2 点伤害。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 2,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "health": 6
  },
  {
    "id": "hsjson_LEG_RLK_071",
    "name": "帕奇维克",
    "class": "death_knight",
    "type": "minion",
    "rarity": "legendary",
    "cost": 7,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 4,
    "health": 6
  },
  {
    "id": "hsjson_TTN_737",
    "name": "兵主",
    "class": "death_knight",
    "type": "minion",
    "rarity": "legendary",
    "cost": 8,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 7,
    "health": 9
  },
  {
    "id": "hsjson_LEG_RLK_085",
    "name": "玛洛加尔领主",
    "class": "death_knight",
    "type": "minion",
    "rarity": "legendary",
    "cost": 8,
    "text": "战吼。使一个随从获得 +2/+2。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "buff",
        "attack": 2,
        "health": 2,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 9,
    "health": 7
  },
  {
    "id": "hsjson_CORE_RLK_741",
    "name": "窃魂者",
    "class": "death_knight",
    "type": "minion",
    "rarity": "epic",
    "cost": 8,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 5,
    "health": 5
  },
  {
    "id": "hsjson_CORE_REV_834",
    "name": "灭绝圣物",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "造成 1 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 1,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_BT_175",
    "name": "双刃斩击",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_DMF_221",
    "name": "邪吼冲击",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "吸血。造成 1 点伤害。",
    "keywords": [
      "lifesteal"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 1,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_SW_039",
    "name": "一决胜负",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "legendary",
    "cost": 1,
    "text": "抽 4 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 4,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_BT_351",
    "name": "战斗邪犬",
    "class": "demon_hunter",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 1,
    "health": 2
  },
  {
    "id": "hsjson_BT_514",
    "name": "献祭光环",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "造成 1 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 1,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_SW_040",
    "name": "邪能弹幕",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "造成 2 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 2,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_BT_429",
    "name": "恶魔变形",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "legendary",
    "cost": 4,
    "text": "造成 5 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 5,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_SCH_356",
    "name": "滑翔",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "rare",
    "cost": 4,
    "text": "抽 4 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 4,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_BT_187",
    "name": "凯恩·日怒",
    "class": "demon_hunter",
    "type": "minion",
    "rarity": "legendary",
    "cost": 4,
    "text": "冲锋。",
    "keywords": [
      "charge"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "health": 5
  },
  {
    "id": "hsjson_DMF_230",
    "name": "伊格诺斯",
    "class": "demon_hunter",
    "type": "minion",
    "rarity": "legendary",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 6
  },
  {
    "id": "hsjson_CORE_REV_508",
    "name": "次元圣物",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "epic",
    "cost": 5,
    "text": "抽 2 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 2,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_BT_601",
    "name": "古尔丹之颅",
    "class": "demon_hunter",
    "type": "spell",
    "rarity": "rare",
    "cost": 6,
    "text": "抽 3 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 3,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_REV_937",
    "name": "圣物匠赛·墨克斯",
    "class": "demon_hunter",
    "type": "minion",
    "rarity": "legendary",
    "cost": 8,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 8,
    "health": 8
  },
  {
    "id": "hsjson_CORE_EX1_169",
    "name": "激活",
    "class": "druid",
    "type": "spell",
    "rarity": "rare",
    "cost": 0,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.123Z"
  },
  {
    "id": "hsjson_HERO_06ah",
    "name": "克苏恩",
    "class": "druid",
    "type": "spell",
    "rarity": "common",
    "cost": 0,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_Core_CS2_008",
    "name": "月火术",
    "class": "druid",
    "type": "spell",
    "rarity": "common",
    "cost": 0,
    "text": "造成 1 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 1,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_AT_037",
    "name": "活体根须",
    "class": "druid",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "造成 2 点伤害。召唤 2 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 2,
        "target": "selected",
        "trigger": "play"
      },
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CFM_602",
    "name": "青玉护符",
    "class": "druid",
    "type": "spell",
    "rarity": "rare",
    "cost": 1,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CORE_CS2_013",
    "name": "野性成长",
    "class": "druid",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CORE_CS2_012",
    "name": "横扫",
    "class": "druid",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "造成 4 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 4,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CFM_713",
    "name": "青玉绽放",
    "class": "druid",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CS2_011",
    "name": "野蛮咆哮",
    "class": "druid",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_EX1_166",
    "name": "丛林守护者",
    "class": "druid",
    "type": "minion",
    "rarity": "rare",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z",
    "attack": 2,
    "health": 4
  },
  {
    "id": "hsjson_BT_130",
    "name": "过度生长",
    "class": "druid",
    "type": "spell",
    "rarity": "common",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CFM_343",
    "name": "青玉巨兽",
    "class": "druid",
    "type": "minion",
    "rarity": "common",
    "cost": 5,
    "text": "战吼。嘲讽。召唤 1 个 1/1 构件。",
    "keywords": [
      "battlecry",
      "taunt"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z",
    "attack": 3,
    "health": 6
  },
  {
    "id": "hsjson_YOP_026",
    "name": "树木生长",
    "class": "druid",
    "type": "spell",
    "rarity": "rare",
    "cost": 5,
    "text": "使一个随从获得 +2/+1。召唤 2 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "buff",
        "attack": 2,
        "health": 1,
        "target": "selected",
        "trigger": "play"
      },
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_BT_135",
    "name": "萤火成群",
    "class": "druid",
    "type": "spell",
    "rarity": "epic",
    "cost": 5,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_164",
    "name": "滋养",
    "class": "druid",
    "type": "spell",
    "rarity": "rare",
    "cost": 5,
    "text": "抽 3 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 3,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CORE_EX1_571",
    "name": "自然之力",
    "class": "druid",
    "type": "spell",
    "rarity": "epic",
    "cost": 5,
    "text": "召唤 3 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 3,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_WC_006",
    "name": "安娜科德拉",
    "class": "druid",
    "type": "minion",
    "rarity": "legendary",
    "cost": 6,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z",
    "attack": 3,
    "health": 7
  },
  {
    "id": "hsjson_CORE_ICC_054",
    "name": "传播瘟疫",
    "class": "druid",
    "type": "spell",
    "rarity": "rare",
    "cost": 6,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CORE_EX1_165",
    "name": "利爪德鲁伊",
    "class": "druid",
    "type": "minion",
    "rarity": "common",
    "cost": 6,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z",
    "attack": 4,
    "health": 6
  },
  {
    "id": "hsjson_BAR_539",
    "name": "超凡之盟",
    "class": "druid",
    "type": "spell",
    "rarity": "epic",
    "cost": 8,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_BT_131",
    "name": "伊谢尔·风歌",
    "class": "druid",
    "type": "minion",
    "rarity": "legendary",
    "cost": 9,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z",
    "attack": 5,
    "health": 5
  },
  {
    "id": "hsjson_CORE_ICC_085",
    "name": "终极感染",
    "class": "druid",
    "type": "spell",
    "rarity": "epic",
    "cost": 10,
    "text": "造成 5 点伤害。抽 5 张牌。获得 5 点护甲。召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 5,
        "target": "selected",
        "trigger": "play"
      },
      {
        "type": "draw",
        "amount": 5,
        "trigger": "play"
      },
      {
        "type": "gain_armor",
        "amount": 5,
        "trigger": "play"
      },
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z"
  },
  {
    "id": "hsjson_CORE_FP1_011",
    "name": "结网蛛",
    "class": "hunter",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 1
  },
  {
    "id": "hsjson_CORE_ICC_052",
    "name": "装死",
    "class": "hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_KAR_004",
    "name": "豹子戏法",
    "class": "hunter",
    "type": "spell",
    "rarity": "rare",
    "cost": 2,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_610",
    "name": "爆炸陷阱",
    "class": "hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "造成 2 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 2,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_611",
    "name": "冰冻陷阱",
    "class": "hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_NEW1_031",
    "name": "动物伙伴",
    "class": "hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_EX1_538",
    "name": "关门放狗",
    "class": "hunter",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_539",
    "name": "杀戮命令",
    "class": "hunter",
    "type": "spell",
    "rarity": "rare",
    "cost": 3,
    "text": "造成 3 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 3,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_KAR_006",
    "name": "神秘女猎手",
    "class": "hunter",
    "type": "minion",
    "rarity": "common",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 4
  },
  {
    "id": "hsjson_EX1_536",
    "name": "鹰角弓",
    "class": "hunter",
    "type": "weapon",
    "rarity": "rare",
    "cost": 3,
    "text": "装备武器。",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "durability": 0
  },
  {
    "id": "hsjson_DS1_070",
    "name": "驯兽师",
    "class": "hunter",
    "type": "minion",
    "rarity": "common",
    "cost": 4,
    "text": "战吼。使一个随从获得 +2/+2。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "buff",
        "attack": 2,
        "health": 2,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 3
  },
  {
    "id": "hsjson_CORE_EX1_534",
    "name": "长鬃草原狮",
    "class": "hunter",
    "type": "minion",
    "rarity": "rare",
    "cost": 6,
    "text": "亡语。召唤 2 个 1/1 构件。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "deathrattle"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 7,
    "health": 5
  },
  {
    "id": "hsjson_LOOT_511",
    "name": "卡瑟娜·冬灵",
    "class": "hunter",
    "type": "minion",
    "rarity": "legendary",
    "cost": 8,
    "text": "战吼。亡语。",
    "keywords": [
      "battlecry",
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 6,
    "health": 6
  },
  {
    "id": "hsjson_UNG_028",
    "name": "打开时空之门",
    "class": "mage",
    "type": "spell",
    "rarity": "legendary",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_NEW1_012",
    "name": "法力浮龙",
    "class": "mage",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 3
  },
  {
    "id": "hsjson_CORE_UNG_020",
    "name": "秘法学家",
    "class": "mage",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_EX1_608",
    "name": "巫师学徒",
    "class": "mage",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 2
  },
  {
    "id": "hsjson_BOT_600",
    "name": "研发计划",
    "class": "mage",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_LOOT_101",
    "name": "爆炸符文",
    "class": "mage",
    "type": "spell",
    "rarity": "rare",
    "cost": 3,
    "text": "造成 6 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 6,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CS2_026",
    "name": "冰霜新星",
    "class": "mage",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_287",
    "name": "法术反制",
    "class": "mage",
    "type": "spell",
    "rarity": "rare",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_EX1_295",
    "name": "寒冰屏障",
    "class": "mage",
    "type": "spell",
    "rarity": "epic",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_EX1_612",
    "name": "肯瑞托法师",
    "class": "mage",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 3
  },
  {
    "id": "hsjson_GVG_004",
    "name": "地精炎术师",
    "class": "mage",
    "type": "minion",
    "rarity": "rare",
    "cost": 4,
    "text": "战吼。战吼：造成 6 点伤害。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 6,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 5,
    "health": 4
  },
  {
    "id": "hsjson_CORE_CS2_029",
    "name": "火球术",
    "class": "mage",
    "type": "spell",
    "rarity": "common",
    "cost": 4,
    "text": "造成 6 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 6,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_UNG_948",
    "name": "熔岩镜像",
    "class": "mage",
    "type": "spell",
    "rarity": "rare",
    "cost": 4,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_LOOT_108",
    "name": "艾露尼斯",
    "class": "mage",
    "type": "weapon",
    "rarity": "legendary",
    "cost": 6,
    "text": "装备武器。",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 0,
    "durability": 0
  },
  {
    "id": "hsjson_ULD_238",
    "name": "考古专家雷诺",
    "class": "mage",
    "type": "minion",
    "rarity": "legendary",
    "cost": 6,
    "text": "战吼。战吼：造成 10 点伤害。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 10,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 6
  },
  {
    "id": "hsjson_CORE_EX1_559",
    "name": "大法师安东尼达斯",
    "class": "mage",
    "type": "minion",
    "rarity": "legendary",
    "cost": 7,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 5,
    "health": 7
  },
  {
    "id": "hsjson_CORE_ICC_833",
    "name": "冰霜女巫吉安娜",
    "class": "mage",
    "type": "spell",
    "rarity": "legendary",
    "cost": 9,
    "text": "战吼。召唤 1 个 1/1 构件。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_279",
    "name": "炎爆术",
    "class": "mage",
    "type": "spell",
    "rarity": "epic",
    "cost": 10,
    "text": "造成 10 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 10,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_UNG_205",
    "name": "冰川裂片",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 1
  },
  {
    "id": "hsjson_GVG_082",
    "name": "发条侏儒",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 1
  },
  {
    "id": "hsjson_CFM_637",
    "name": "海盗帕奇斯",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 1,
    "health": 1
  },
  {
    "id": "hsjson_CORE_UNG_809",
    "name": "火羽精灵",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 2
  },
  {
    "id": "hsjson_EX1_029",
    "name": "麻风侏儒",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "亡语。亡语：造成 2 点伤害。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 2,
        "target": "selected",
        "trigger": "deathrattle"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 1
  },
  {
    "id": "hsjson_FP1_028",
    "name": "送葬者",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 2
  },
  {
    "id": "hsjson_RLK_123",
    "name": "白骨投手",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "战吼。战吼：造成 2 点伤害。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 2,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_CORE_GVG_085",
    "name": "吵吵机器人",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "圣盾。嘲讽。",
    "keywords": [
      "divine_shield",
      "taunt"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 2
  },
  {
    "id": "hsjson_NEW1_019",
    "name": "飞刀杂耍者",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 2
  },
  {
    "id": "hsjson_FP1_002",
    "name": "鬼灵爬行者",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "亡语。召唤 2 个 1/1 构件。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "deathrattle"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 2
  },
  {
    "id": "hsjson_CORE_EX1_162",
    "name": "恐狼前锋",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 2
  },
  {
    "id": "hsjson_CS2_173",
    "name": "蓝鳃战士",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "冲锋。",
    "keywords": [
      "charge"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 1
  },
  {
    "id": "hsjson_ULD_003",
    "name": "了不起的杰弗里斯",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 2,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 2
  },
  {
    "id": "hsjson_CORE_NEW1_021",
    "name": "末日预言者",
    "class": "neutral",
    "type": "minion",
    "rarity": "epic",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 0,
    "health": 7
  },
  {
    "id": "hsjson_BT_733",
    "name": "莫尔葛工匠",
    "class": "neutral",
    "type": "minion",
    "rarity": "epic",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 4
  },
  {
    "id": "hsjson_CORE_EX1_049",
    "name": "年轻的酒仙",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 2
  },
  {
    "id": "hsjson_BRMC_94",
    "name": "萨弗拉斯",
    "class": "neutral",
    "type": "weapon",
    "rarity": "common",
    "cost": 2,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "durability": 0
  },
  {
    "id": "hsjson_UNG_073",
    "name": "石塘猎人",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "战吼。使一个随从获得 +1/+1。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "buff",
        "attack": 1,
        "health": 1,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_OG_281",
    "name": "邪灵召唤师",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "战吼。使一个随从获得 +2/+2。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "buff",
        "attack": 2,
        "health": 2,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_CORE_NEW1_018",
    "name": "血帆袭击者",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_CORE_CS2_181",
    "name": "负伤剑圣",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "战吼。战吼：造成 4 点伤害。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 4,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 7
  },
  {
    "id": "hsjson_CORE_EX1_050",
    "name": "寒光智者",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 2
  },
  {
    "id": "hsjson_CORE_UNG_928",
    "name": "焦油爬行者",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 3,
    "text": "嘲讽。",
    "keywords": [
      "taunt"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 1,
    "health": 5
  },
  {
    "id": "hsjson_OG_162",
    "name": "克苏恩的信徒",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "战吼。战吼：造成 2 点伤害。使一个随从获得 +2/+2。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 2,
        "target": "selected",
        "trigger": "battlecry"
      },
      {
        "type": "buff",
        "attack": 2,
        "health": 2,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 2
  },
  {
    "id": "hsjson_UNG_083",
    "name": "魔暴龙蛋",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "亡语。召唤 1 个 1/1 构件。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "deathrattle"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 0,
    "health": 3
  },
  {
    "id": "hsjson_ULD_719",
    "name": "沙漠野兔",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 3,
    "text": "战吼。召唤 2 个 1/1 构件。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 1
  },
  {
    "id": "hsjson_Core_UNG_072",
    "name": "石丘防御者",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "战吼。嘲讽。",
    "keywords": [
      "battlecry",
      "taunt"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 1,
    "health": 5
  },
  {
    "id": "hsjson_FP1_009",
    "name": "死亡领主",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "亡语。嘲讽。",
    "keywords": [
      "deathrattle",
      "taunt"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 8
  },
  {
    "id": "hsjson_CORE_EX1_507",
    "name": "鱼人领军",
    "class": "neutral",
    "type": "minion",
    "rarity": "epic",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 3
  },
  {
    "id": "hsjson_CORE_EX1_093",
    "name": "阿古斯防御者",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 4,
    "text": "战吼。使一个随从获得 +1/+1。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "buff",
        "attack": 1,
        "health": 1,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 3
  },
  {
    "id": "hsjson_GVG_006",
    "name": "机械跃迁者",
    "class": "neutral",
    "type": "minion",
    "rarity": "common",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 4
  },
  {
    "id": "hsjson_CFM_621",
    "name": "卡扎库斯",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 4,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 3
  },
  {
    "id": "hsjson_CORE_EX1_043",
    "name": "暮光幼龙",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 4,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 1
  },
  {
    "id": "hsjson_CORE_ICC_466",
    "name": "萨隆苦囚",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 4,
    "text": "战吼。嘲讽。召唤 1 个 1/1 构件。",
    "keywords": [
      "battlecry",
      "taunt"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_UNG_089",
    "name": "温顺的巨壳龙",
    "class": "neutral",
    "type": "minion",
    "rarity": "epic",
    "cost": 4,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 5,
    "health": 4
  },
  {
    "id": "hsjson_CORE_GIL_622",
    "name": "吸血蚊",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 4,
    "text": "战吼。战吼：造成 3 点伤害。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 3,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 3
  },
  {
    "id": "hsjson_LT23_028H_01",
    "name": "亚煞极",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 12
  },
  {
    "id": "hsjson_CORE_NEW1_026",
    "name": "紫罗兰教师",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z",
    "attack": 3,
    "health": 5
  },
  {
    "id": "hsjson_KAR_114",
    "name": "巴内斯",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 5,
    "text": "战吼。召唤 1 个 1/1 构件。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 4
  },
  {
    "id": "hsjson_CFM_344",
    "name": "飞火流星·芬杰",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 5,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 5
  },
  {
    "id": "hsjson_CORE_EX1_116",
    "name": "火车王里诺艾",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 5,
    "text": "战吼。冲锋。召唤 2 个 1/1 构件。",
    "keywords": [
      "battlecry",
      "charge"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 6,
    "health": 2
  },
  {
    "id": "hsjson_BRM_019",
    "name": "恐怖的奴隶主",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 5,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "health": 3
  },
  {
    "id": "hsjson_CFM_668",
    "name": "魅影歹徒",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 5,
    "text": "战吼。召唤 2 个 1/1 构件。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 2
  },
  {
    "id": "hsjson_SCH_623",
    "name": "劈砍课程",
    "class": "neutral",
    "type": "spell",
    "rarity": "common",
    "cost": 5,
    "text": "抽 2 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 2,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_LOOT_161",
    "name": "食肉魔块",
    "class": "neutral",
    "type": "minion",
    "rarity": "epic",
    "cost": 5,
    "text": "战吼。亡语。召唤 2 个 1/1 构件。召唤 2 个 1/1 构件。",
    "keywords": [
      "battlecry",
      "deathrattle"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "battlecry"
      },
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "deathrattle"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 6
  },
  {
    "id": "hsjson_CORE_GIL_692",
    "name": "吉恩·格雷迈恩",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 6,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 6,
    "health": 5
  },
  {
    "id": "hsjson_CORE_EX1_110",
    "name": "凯恩·血蹄",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 6,
    "text": "亡语。嘲讽。召唤 1 个 1/1 构件。",
    "keywords": [
      "deathrattle",
      "taunt"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "deathrattle"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 5,
    "health": 5
  },
  {
    "id": "hsjson_CORE_LOE_011",
    "name": "雷诺·杰克逊",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 6,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 6
  },
  {
    "id": "hsjson_CORE_EX1_016",
    "name": "希尔瓦娜斯·风行者",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 6,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 5,
    "health": 5
  },
  {
    "id": "hsjson_CORE_EX1_095",
    "name": "加基森拍卖师",
    "class": "neutral",
    "type": "minion",
    "rarity": "rare",
    "cost": 7,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 4
  },
  {
    "id": "hsjson_CORE_GVG_110",
    "name": "砰砰博士",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 7,
    "text": "战吼。召唤 2 个 1/1 构件。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 7,
    "health": 7
  },
  {
    "id": "hsjson_OG_131",
    "name": "维克洛尔大帝",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 7,
    "text": "战吼。嘲讽。召唤 1 个 1/1 构件。",
    "keywords": [
      "battlecry",
      "taunt"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 6,
    "health": 7
  },
  {
    "id": "hsjson_DAL_736",
    "name": "档案员艾丽西娜",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 8,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 7,
    "health": 7
  },
  {
    "id": "hsjson_CORE_VAN_EX1_561",
    "name": "阿莱克丝塔萨",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 9,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 8,
    "health": 8
  },
  {
    "id": "hsjson_DRG_089",
    "name": "红龙女王阿莱克丝塔萨",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 9,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 8,
    "health": 8
  },
  {
    "id": "hsjson_EX1_563",
    "name": "玛里苟斯",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 9,
    "text": "法术伤害 +1。",
    "keywords": [
      "spell_damage"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.124Z",
    "attack": 4,
    "health": 12
  },
  {
    "id": "hsjson_CORE_GIL_826",
    "name": "噬月者巴库",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 9,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 7,
    "health": 8
  },
  {
    "id": "hsjson_CORE_EX1_586",
    "name": "海巨人",
    "class": "neutral",
    "type": "minion",
    "rarity": "epic",
    "cost": 10,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 8,
    "health": 8
  },
  {
    "id": "hsjson_BOT_424",
    "name": "机械克苏恩",
    "class": "neutral",
    "type": "minion",
    "rarity": "legendary",
    "cost": 10,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 10,
    "health": 10
  },
  {
    "id": "hsjson_CORE_EX1_105",
    "name": "山岭巨人",
    "class": "neutral",
    "type": "minion",
    "rarity": "epic",
    "cost": 12,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 8,
    "health": 8
  },
  {
    "id": "hsjson_CORE_EX1_620",
    "name": "熔核巨人",
    "class": "neutral",
    "type": "minion",
    "rarity": "epic",
    "cost": 20,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 8,
    "health": 8
  },
  {
    "id": "hsjson_CORE_EX1_130",
    "name": "崇高牺牲",
    "class": "paladin",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_OG_006",
    "name": "恶鳍审判者",
    "class": "paladin",
    "type": "minion",
    "rarity": "epic",
    "cost": 1,
    "text": "战吼。召唤 1 个 1/1 构件。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 3
  },
  {
    "id": "hsjson_CORE_FP1_020",
    "name": "复仇",
    "class": "paladin",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "使一个随从获得 +3/+2。",
    "keywords": [],
    "effects": [
      {
        "type": "buff",
        "attack": 3,
        "health": 2,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_EX1_136",
    "name": "救赎",
    "class": "paladin",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_UNG_960",
    "name": "迷失丛林",
    "class": "paladin",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "召唤 2 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_BOT_909",
    "name": "水晶学",
    "class": "paladin",
    "type": "spell",
    "rarity": "rare",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_GVG_059",
    "name": "齿轮光锤",
    "class": "paladin",
    "type": "weapon",
    "rarity": "epic",
    "cost": 3,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "durability": 0
  },
  {
    "id": "hsjson_EX1_349",
    "name": "神恩术",
    "class": "paladin",
    "type": "spell",
    "rarity": "rare",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_EX1_365",
    "name": "神圣愤怒",
    "class": "paladin",
    "type": "spell",
    "rarity": "rare",
    "cost": 3,
    "text": "抽 1 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_TRL_302",
    "name": "暂避锋芒",
    "class": "paladin",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_LOOT_333",
    "name": "等级提升",
    "class": "paladin",
    "type": "spell",
    "rarity": "epic",
    "cost": 5,
    "text": "使一个随从获得 +2/+2。",
    "keywords": [],
    "effects": [
      {
        "type": "buff",
        "attack": 2,
        "health": 2,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_GVG_060",
    "name": "军需官",
    "class": "paladin",
    "type": "minion",
    "rarity": "epic",
    "cost": 5,
    "text": "战吼。使一个随从获得 +2/+2。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "buff",
        "attack": 2,
        "health": 2,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 5
  },
  {
    "id": "hsjson_AT_079",
    "name": "神秘挑战者",
    "class": "paladin",
    "type": "minion",
    "rarity": "epic",
    "cost": 5,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 5,
    "health": 5
  },
  {
    "id": "hsjson_ETC_329",
    "name": "舞王坎格尔",
    "class": "paladin",
    "type": "minion",
    "rarity": "legendary",
    "cost": 5,
    "text": "亡语。吸血。",
    "keywords": [
      "deathrattle",
      "lifesteal"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 3
  },
  {
    "id": "hsjson_BRM_001",
    "name": "严正警戒",
    "class": "paladin",
    "type": "spell",
    "rarity": "common",
    "cost": 5,
    "text": "抽 2 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 2,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_383",
    "name": "提里奥·弗丁",
    "class": "paladin",
    "type": "minion",
    "rarity": "legendary",
    "cost": 8,
    "text": "亡语。圣盾。嘲讽。",
    "keywords": [
      "deathrattle",
      "divine_shield",
      "taunt"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 8,
    "health": 8
  },
  {
    "id": "hsjson_LOE_026",
    "name": "亡者归来",
    "class": "paladin",
    "type": "spell",
    "rarity": "rare",
    "cost": 10,
    "text": "召唤 7 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 7,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_TRL_300",
    "name": "西瓦尔拉，猛虎之神",
    "class": "paladin",
    "type": "minion",
    "rarity": "legendary",
    "cost": 25,
    "text": "圣盾。吸血。突袭。",
    "keywords": [
      "divine_shield",
      "lifesteal",
      "rush"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 7,
    "health": 5
  },
  {
    "id": "hsjson_CORE_CS2_235",
    "name": "北郡牧师",
    "class": "priest",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 3
  },
  {
    "id": "hsjson_SC_757",
    "name": "幻像",
    "class": "priest",
    "type": "spell",
    "rarity": "rare",
    "cost": 1,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CS1_129",
    "name": "心灵之火",
    "class": "priest",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_SW_433",
    "name": "寻求指引",
    "class": "priest",
    "type": "spell",
    "rarity": "legendary",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_CS2_004",
    "name": "真言术：盾",
    "class": "priest",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "抽 1 张牌。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_UNG_029",
    "name": "暗影视界",
    "class": "priest",
    "type": "spell",
    "rarity": "epic",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CS2_236",
    "name": "神圣之灵",
    "class": "priest",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_EX1_339",
    "name": "思维窃取",
    "class": "priest",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_ICC_213",
    "name": "永恒奴役",
    "class": "priest",
    "type": "spell",
    "rarity": "rare",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_BAR_735",
    "name": "泽瑞拉",
    "class": "priest",
    "type": "minion",
    "rarity": "legendary",
    "cost": 4,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 4
  },
  {
    "id": "hsjson_CFM_020",
    "name": "缚链者拉兹",
    "class": "priest",
    "type": "minion",
    "rarity": "legendary",
    "cost": 5,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 5,
    "health": 5
  },
  {
    "id": "hsjson_LOE_104",
    "name": "埋葬",
    "class": "priest",
    "type": "spell",
    "rarity": "common",
    "cost": 6,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_EX1_091",
    "name": "秘教暗影祭司",
    "class": "priest",
    "type": "minion",
    "rarity": "epic",
    "cost": 6,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 5
  },
  {
    "id": "hsjson_CORE_ICC_235",
    "name": "暗影精华",
    "class": "priest",
    "type": "spell",
    "rarity": "rare",
    "cost": 7,
    "text": "召唤 1 个 1/1 构件。",
    "keywords": [],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_ICC_830",
    "name": "暗影收割者安度因",
    "class": "priest",
    "type": "spell",
    "rarity": "legendary",
    "cost": 8,
    "text": "战吼。消灭一个随从。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "destroy",
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_ICC_214",
    "name": "黑曜石雕像",
    "class": "priest",
    "type": "minion",
    "rarity": "epic",
    "cost": 9,
    "text": "亡语。吸血。嘲讽。",
    "keywords": [
      "deathrattle",
      "lifesteal",
      "taunt"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "health": 8
  },
  {
    "id": "hsjson_CS1_113",
    "name": "精神控制",
    "class": "priest",
    "type": "spell",
    "rarity": "common",
    "cost": 9,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_SW_433t3a",
    "name": "净化的碎片",
    "class": "priest",
    "type": "spell",
    "rarity": "legendary",
    "cost": 10,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_144",
    "name": "暗影步",
    "class": "rogue",
    "type": "spell",
    "rarity": "common",
    "cost": 0,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_145",
    "name": "伺机待发",
    "class": "rogue",
    "type": "spell",
    "rarity": "epic",
    "cost": 0,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CS2_073",
    "name": "冷血",
    "class": "rogue",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_LOOT_542",
    "name": "弑君",
    "class": "rogue",
    "type": "weapon",
    "rarity": "legendary",
    "cost": 1,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "durability": 0
  },
  {
    "id": "hsjson_UNG_067",
    "name": "探索地下洞穴",
    "class": "rogue",
    "type": "spell",
    "rarity": "legendary",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_ICC_221",
    "name": "吸血药膏",
    "class": "rogue",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_EX1_128",
    "name": "隐藏",
    "class": "rogue",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_CS2_074",
    "name": "致命药膏",
    "class": "rogue",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_LOOT_033",
    "name": "洞穴探宝者",
    "class": "rogue",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 1
  },
  {
    "id": "hsjson_BRM_007",
    "name": "夜幕奇袭",
    "class": "rogue",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_OG_330",
    "name": "幽暗城商贩",
    "class": "rogue",
    "type": "minion",
    "rarity": "rare",
    "cost": 2,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_DAL_716",
    "name": "宿敌",
    "class": "rogue",
    "type": "spell",
    "rarity": "rare",
    "cost": 4,
    "text": "造成 4 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 4,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_BOT_087",
    "name": "学术剽窃",
    "class": "rogue",
    "type": "spell",
    "rarity": "epic",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_NEW1_004",
    "name": "消失",
    "class": "rogue",
    "type": "spell",
    "rarity": "common",
    "cost": 6,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_GIL_598",
    "name": "苔丝·格雷迈恩",
    "class": "rogue",
    "type": "minion",
    "rarity": "legendary",
    "cost": 7,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 6,
    "health": 6
  },
  {
    "id": "hsjson_LOE_018",
    "name": "坑道穴居人",
    "class": "shaman",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 1,
    "health": 3
  },
  {
    "id": "hsjson_OG_027",
    "name": "异变",
    "class": "shaman",
    "type": "spell",
    "rarity": "rare",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_565",
    "name": "火舌图腾",
    "class": "shaman",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 0,
    "health": 3
  },
  {
    "id": "hsjson_CORE_CS2_045",
    "name": "石化武器",
    "class": "shaman",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CFM_696",
    "name": "衰变",
    "class": "shaman",
    "type": "spell",
    "rarity": "rare",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_AT_052",
    "name": "图腾魔像",
    "class": "shaman",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 4
  },
  {
    "id": "hsjson_EX1_241",
    "name": "熔岩爆裂",
    "class": "shaman",
    "type": "spell",
    "rarity": "rare",
    "cost": 3,
    "text": "造成 5 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 5,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_CORE_EX1_246",
    "name": "妖术",
    "class": "shaman",
    "type": "spell",
    "rarity": "common",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z"
  },
  {
    "id": "hsjson_ULD_413",
    "name": "分裂战斧",
    "class": "shaman",
    "type": "weapon",
    "rarity": "epic",
    "cost": 4,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "durability": 0
  },
  {
    "id": "hsjson_CORE_EX1_567",
    "name": "毁灭之锤",
    "class": "shaman",
    "type": "weapon",
    "rarity": "epic",
    "cost": 5,
    "text": "风怒。",
    "keywords": [
      "windfury"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 2,
    "durability": 0
  },
  {
    "id": "hsjson_BT_102",
    "name": "沼泽拳刺",
    "class": "shaman",
    "type": "weapon",
    "rarity": "epic",
    "cost": 5,
    "text": "装备武器。",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 4,
    "durability": 0
  },
  {
    "id": "hsjson_LOOT_358",
    "name": "撼世者格朗勃尔",
    "class": "shaman",
    "type": "minion",
    "rarity": "legendary",
    "cost": 6,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 7,
    "health": 7
  },
  {
    "id": "hsjson_GIL_820",
    "name": "沙德沃克",
    "class": "shaman",
    "type": "minion",
    "rarity": "legendary",
    "cost": 9,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 6,
    "health": 6
  },
  {
    "id": "hsjson_HERO_07d",
    "name": "恩佐斯",
    "class": "warlock",
    "type": "spell",
    "rarity": "common",
    "cost": 0,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_UNG_829",
    "name": "拉卡利献祭",
    "class": "warlock",
    "type": "spell",
    "rarity": "legendary",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_EX1_319",
    "name": "烈焰小鬼",
    "class": "warlock",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "战吼。战吼：造成 3 点伤害。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "damage",
        "amount": 3,
        "target": "selected",
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 3,
    "health": 2
  },
  {
    "id": "hsjson_EX1_308",
    "name": "灵魂之火",
    "class": "warlock",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "造成 4 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 4,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_KAR_089",
    "name": "玛克扎尔的小鬼",
    "class": "warlock",
    "type": "minion",
    "rarity": "common",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 1,
    "health": 3
  },
  {
    "id": "hsjson_DAL_602",
    "name": "情势反转",
    "class": "warlock",
    "type": "spell",
    "rarity": "rare",
    "cost": 2,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_ICC_041",
    "name": "亵渎",
    "class": "warlock",
    "type": "spell",
    "rarity": "rare",
    "cost": 2,
    "text": "造成 1 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 1,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_KAR_205",
    "name": "镀银魔像",
    "class": "warlock",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "health": 4
  },
  {
    "id": "hsjson_EX1_303",
    "name": "暗影烈焰",
    "class": "warlock",
    "type": "spell",
    "rarity": "rare",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_UNG_832",
    "name": "血色绽放",
    "class": "warlock",
    "type": "spell",
    "rarity": "epic",
    "cost": 4,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_LOOT_417",
    "name": "大灾变",
    "class": "warlock",
    "type": "spell",
    "rarity": "epic",
    "cost": 5,
    "text": "消灭一个随从。",
    "keywords": [],
    "effects": [
      {
        "type": "destroy",
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_EX1_310",
    "name": "末日守卫",
    "class": "warlock",
    "type": "minion",
    "rarity": "rare",
    "cost": 5,
    "text": "战吼。冲锋。",
    "keywords": [
      "battlecry",
      "charge"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.125Z",
    "attack": 5,
    "health": 7
  },
  {
    "id": "hsjson_LOOT_306",
    "name": "着魔男仆",
    "class": "warlock",
    "type": "minion",
    "rarity": "rare",
    "cost": 5,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 2
  },
  {
    "id": "hsjson_CORE_EX1_323",
    "name": "加拉克苏斯大王",
    "class": "warlock",
    "type": "spell",
    "rarity": "legendary",
    "cost": 8,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_LOOT_368",
    "name": "虚空领主",
    "class": "warlock",
    "type": "minion",
    "rarity": "epic",
    "cost": 9,
    "text": "亡语。嘲讽。召唤 3 个 1/1 构件。",
    "keywords": [
      "deathrattle",
      "taunt"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 3,
        "trigger": "deathrattle"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "health": 9
  },
  {
    "id": "hsjson_CORE_ICC_831",
    "name": "鲜血掠夺者古尔丹",
    "class": "warlock",
    "type": "spell",
    "rarity": "legendary",
    "cost": 10,
    "text": "战吼。召唤 1 个 1/1 构件。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 1,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_EX1_410",
    "name": "盾牌猛击",
    "class": "warrior",
    "type": "spell",
    "rarity": "epic",
    "cost": 1,
    "text": "造成 1 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 1,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_OG_312",
    "name": "恩佐斯的副官",
    "class": "warrior",
    "type": "minion",
    "rarity": "common",
    "cost": 1,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 1,
    "health": 1
  },
  {
    "id": "hsjson_UNG_934",
    "name": "火羽之心",
    "class": "warrior",
    "type": "spell",
    "rarity": "legendary",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_EX1_400",
    "name": "旋风斩",
    "class": "warrior",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "造成 1 点伤害。",
    "keywords": [],
    "effects": [
      {
        "type": "damage",
        "amount": 1,
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_CS2_108",
    "name": "斩杀",
    "class": "warrior",
    "type": "spell",
    "rarity": "common",
    "cost": 1,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_CS2_106",
    "name": "炽炎战斧",
    "class": "warrior",
    "type": "weapon",
    "rarity": "common",
    "cost": 2,
    "text": "装备武器。",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "durability": 0
  },
  {
    "id": "hsjson_CORE_EX1_606",
    "name": "盾牌格挡",
    "class": "warrior",
    "type": "spell",
    "rarity": "common",
    "cost": 2,
    "text": "抽 1 张牌。获得 5 点护甲。",
    "keywords": [],
    "effects": [
      {
        "type": "draw",
        "amount": 1,
        "trigger": "play"
      },
      {
        "type": "gain_armor",
        "amount": 5,
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_CORE_EX1_604",
    "name": "暴乱狂战士",
    "class": "warrior",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 4
  },
  {
    "id": "hsjson_DAL_060",
    "name": "发条地精",
    "class": "warrior",
    "type": "minion",
    "rarity": "rare",
    "cost": 3,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "health": 3
  },
  {
    "id": "hsjson_CORE_EX1_084",
    "name": "战歌指挥官",
    "class": "warrior",
    "type": "minion",
    "rarity": "common",
    "cost": 3,
    "text": "",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 2,
    "health": 3
  },
  {
    "id": "hsjson_DAL_063",
    "name": "圣剑扳手",
    "class": "warrior",
    "type": "weapon",
    "rarity": "epic",
    "cost": 4,
    "text": "装备武器。",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 3,
    "durability": 0
  },
  {
    "id": "hsjson_FP1_021",
    "name": "死亡之咬",
    "class": "warrior",
    "type": "weapon",
    "rarity": "common",
    "cost": 4,
    "text": "亡语。",
    "keywords": [
      "deathrattle"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 4,
    "durability": 0
  },
  {
    "id": "hsjson_CS2_112",
    "name": "奥金斧",
    "class": "warrior",
    "type": "weapon",
    "rarity": "common",
    "cost": 5,
    "text": "装备武器。",
    "keywords": [],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 5,
    "durability": 0
  },
  {
    "id": "hsjson_CORE_EX1_407",
    "name": "绝命乱斗",
    "class": "warrior",
    "type": "spell",
    "rarity": "epic",
    "cost": 5,
    "text": "消灭一个随从。",
    "keywords": [],
    "effects": [
      {
        "type": "destroy",
        "target": "selected",
        "trigger": "play"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_BOT_238",
    "name": "“科学狂人”砰砰博士",
    "class": "warrior",
    "type": "spell",
    "rarity": "legendary",
    "cost": 7,
    "text": "战吼。",
    "keywords": [
      "battlecry"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z"
  },
  {
    "id": "hsjson_DAL_064",
    "name": "爆破之王砰砰",
    "class": "warrior",
    "type": "minion",
    "rarity": "legendary",
    "cost": 7,
    "text": "战吼。召唤 2 个 1/1 构件。",
    "keywords": [
      "battlecry"
    ],
    "effects": [
      {
        "type": "summon",
        "cardId": "token_drone",
        "amount": 2,
        "trigger": "battlecry"
      }
    ],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 7,
    "health": 7
  },
  {
    "id": "hsjson_CORE_EX1_414",
    "name": "格罗玛什·地狱咆哮",
    "class": "warrior",
    "type": "minion",
    "rarity": "legendary",
    "cost": 8,
    "text": "冲锋。",
    "keywords": [
      "charge"
    ],
    "effects": [],
    "status": "published",
    "collectible": true,
    "version": 1,
    "updatedAt": "2026-05-21T10:34:49.126Z",
    "attack": 4,
    "health": 9
  }
];
