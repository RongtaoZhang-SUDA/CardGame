import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CLASS_LABELS, GAME_RULES, HERO_CLASS_PROFILES, legalCardsForClass, type CardDefinition, type CollectibleClass, type DeckTemplate } from "@dormstone/shared";
import { dragonHighlanderDruidTemplate } from "./dragonHighlanderDruid.js";
import { companionHunterTemplate } from "./companionHunter.js";
import { freezeMageTemplate } from "./freezeMage.js";
import { questRogueTemplate } from "./questRogue.js";
import { renathalPriestTemplate } from "./renathalPriest.js";

interface CsvDeckRow {
  id: string;
  "职业_中文": string;
  "职业_英文": string;
  "卡组中文名": string;
  "卡组英文名": string;
  "代表时期": string;
  "适用模式": string;
  "卡组类型": string;
  "标签": string;
  "历史知名度": string;
  "阴间度_1到5": string;
  "特别度_1到5": string;
  "代表核心卡_中文": string;
  "代表核心卡_英文": string;
  "主要取胜方式": string;
  "为什么值得收录": string;
  "推荐用途": string;
  "来源说明": string;
  "来源URL": string;
}

let cachedTemplates: DeckTemplate[] | undefined;

export function listDeckTemplates(): DeckTemplate[] {
  cachedTemplates ??= loadDeckTemplates();
  return cachedTemplates;
}

export function getDeckTemplate(id: string): DeckTemplate | undefined {
  return listDeckTemplates().find((template) => template.id === id);
}

export function buildDeckFromTemplate(template: DeckTemplate, cards: CardDefinition[], classOverride?: CollectibleClass): { class: CollectibleClass; cardIds: string[]; sideboardCardIds?: string[] } {
  const deckClass = classOverride ?? template.defaultClass;
  if (template.presetCardIds?.length) {
    const catalog = new Map(cards.map((card) => [card.id, card]));
    const cardIds = [...template.presetCardIds];
    const sideboardCardIds = [...(template.sideboardCardIds ?? [])];
    const missing = [...cardIds, ...sideboardCardIds].filter((cardId) => !catalog.has(cardId));
    if (missing.length > 0) throw new Error(`预设卡组缺少卡牌：${missing.join(", ")}`);
    return { class: deckClass, cardIds, sideboardCardIds };
  }
  const legal = legalCardsForClass(cards, deckClass).filter((card) => card.class === "neutral" || card.class === deckClass);
  const chosenCounts = new Map<string, number>();
  const cardIds: string[] = [];
  for (const card of orderedCoreCards(template, legal)) {
    addDeckCopies(cardIds, chosenCounts, card);
    if (cardIds.length === GAME_RULES.deckSize) break;
  }
  const scored = legal
    .filter((card) => card.type !== "hero_power")
    .filter((card) => (chosenCounts.get(card.id) ?? 0) < maxCopiesFor(card))
    .map((card) => ({ card, score: scoreCardForTemplate(card, template) + templateCardBias(template.id, card.id) }))
    .sort((a, b) => b.score - a.score || a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name, "zh-Hans-CN"));
  for (const { card } of scored) {
    addDeckCopies(cardIds, chosenCounts, card);
    if (cardIds.length === GAME_RULES.deckSize) break;
  }
  if (cardIds.length < GAME_RULES.deckSize) {
    throw new Error(`${CLASS_LABELS[deckClass]} 当前可用代理卡不足，无法生成 30 张模板卡组。`);
  }
  return { class: deckClass, cardIds };
}

function orderedCoreCards(template: DeckTemplate, legal: CardDefinition[]): CardDefinition[] {
  const byName = new Map<string, CardDefinition>();
  for (const card of legal.filter((item) => item.type !== "hero_power")) {
    byName.set(normalizeCardName(card.name), card);
    if (card.sourceNameEn) byName.set(normalizeCardName(card.sourceNameEn), card);
    if (card.sourceCardId) byName.set(normalizeCardName(card.sourceCardId), card);
  }
  const picked: CardDefinition[] = [];
  const seen = new Set<string>();
  for (const name of [...template.coreCardsZh, ...template.coreCardsEn]) {
    const card = byName.get(normalizeCardName(name));
    if (!card || seen.has(card.id)) continue;
    seen.add(card.id);
    picked.push(card);
  }
  return picked;
}

function normalizeCardName(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[’`´]/g, "'").replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

function maxCopiesFor(card: CardDefinition): number {
  return card.rarity === "legendary" ? GAME_RULES.maxLegendaryCopies : GAME_RULES.maxCopies;
}

function addDeckCopies(cardIds: string[], chosenCounts: Map<string, number>, card: CardDefinition): void {
  const limit = maxCopiesFor(card);
  while ((chosenCounts.get(card.id) ?? 0) < limit && cardIds.length < GAME_RULES.deckSize) {
    cardIds.push(card.id);
    chosenCounts.set(card.id, (chosenCounts.get(card.id) ?? 0) + 1);
  }
}

function loadDeckTemplates(): DeckTemplate[] {
  return [renathalPriestTemplate, dragonHighlanderDruidTemplate, companionHunterTemplate, freezeMageTemplate, questRogueTemplate];
}

function rowToTemplate(row: CsvDeckRow): DeckTemplate {
  const classId = mapClass(row["职业_英文"]);
  const defaultClass = classId ?? defaultClassForMulti(row);
  const hero = HERO_CLASS_PROFILES[defaultClass];
  return {
    id: `hs_${row.id.padStart(3, "0")}`,
    class: classId,
    defaultClass,
    classZh: row["职业_中文"],
    classEn: row["职业_英文"],
    nameZh: row["卡组中文名"],
    nameEn: row["卡组英文名"],
    era: row["代表时期"],
    mode: row["适用模式"],
    archetype: row["卡组类型"],
    tags: splitList(row["标签"], ","),
    fame: row["历史知名度"],
    annoyance: Number(row["阴间度_1到5"] || 0),
    uniqueness: Number(row["特别度_1到5"] || 0),
    coreCardsZh: splitList(row["代表核心卡_中文"], "；"),
    coreCardsEn: splitList(row["代表核心卡_英文"], ";"),
    winCondition: row["主要取胜方式"],
    whyIncluded: row["为什么值得收录"],
    recommendedUse: row["推荐用途"],
    sourceNote: row["来源说明"],
    sourceUrls: splitList(row["来源URL"], ";"),
    hero
  };
}

function scoreCardForTemplate(card: CardDefinition, template: DeckTemplate): number {
  const text = `${template.archetype} ${template.tags.join(" ")} ${template.nameEn} ${template.winCondition}`.toLowerCase();
  let score = 10 - card.cost * 0.35;
  if (/aggro|face|token|pirate|murloc|odd|tempo|zoo|board flood/.test(text)) {
    score += Math.max(0, 5 - card.cost) * 2 + (card.attack ?? 0);
    if (card.type === "weapon" || card.effects.some((effect) => effect.type === "damage")) score += 2;
    if (card.keywords.includes("charge") || card.keywords.includes("rush")) score += 2;
  }
  if (/control|fatigue|highlander|reno|n.?zoth|deathrattle/.test(text)) {
    score += card.cost * 0.8 + (card.health ?? 0);
    if (card.keywords.includes("taunt") || card.keywords.includes("deathrattle")) score += 3;
    if (card.effects.some((effect) => effect.type === "heal" || effect.type === "draw")) score += 2;
  }
  if (/combo|otk|apm|miracle|quest|special win/.test(text)) {
    if (card.type === "spell") score += 4;
    if (card.effects.some((effect) => effect.type === "draw" || effect.type === "damage" || effect.type === "gain_mana")) score += 3;
    score += Math.max(0, 4 - card.cost);
  }
  if (/ramp|jade|big/.test(text)) {
    if (card.effects.some((effect) => effect.type === "draw" || effect.type === "gain_mana")) score += 3;
    score += card.cost;
  }
  if (/weapon/.test(text) && card.type === "weapon") score += 4;
  return score;
}

function templateCardBias(templateId: string, cardId: string): number {
  let hash = 0;
  for (const char of `${templateId}:${cardId}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (hash % 1000) / 100000;
}

function resolveDeckTemplateCsv(): string | undefined {
  const candidates = [
    process.env.DECK_TEMPLATES_CSV,
    path.resolve(process.cwd(), "hearthstone_curated_famous_decks.csv"),
    path.resolve(process.cwd(), "..", "hearthstone_curated_famous_decks.csv"),
    path.resolve(process.cwd(), "..", "..", "hearthstone_curated_famous_decks.csv"),
    path.resolve(process.cwd(), "..", "..", "..", "hearthstone_curated_famous_decks.csv")
  ].filter(Boolean) as string[];
  return candidates.find((candidate) => existsSync(candidate));
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [rawHeaders = [], ...data] = rows.filter((line) => line.some((value) => value.trim()));
  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, "").trim());
  return data.map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] ?? ""])));
}

function splitList(value: string, separator: string): string[] {
  return value.split(separator).map((item) => item.trim()).filter(Boolean);
}

function mapClass(value: string): CollectibleClass | undefined {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const mapped: Record<string, CollectibleClass> = {
    death_knight: "death_knight",
    demon_hunter: "demon_hunter",
    druid: "druid",
    hunter: "hunter",
    mage: "mage",
    paladin: "paladin",
    priest: "priest",
    rogue: "rogue",
    shaman: "shaman",
    warlock: "warlock",
    warrior: "warrior"
  };
  return mapped[normalized];
}

function defaultClassForMulti(row: CsvDeckRow): CollectibleClass {
  const name = `${row["卡组英文名"]} ${row["卡组中文名"]}`.toLowerCase();
  if (name.includes("reno")) return "mage";
  if (name.includes("odd")) return "paladin";
  if (name.includes("even")) return "shaman";
  if (name.includes("mecha")) return "warlock";
  if (name.includes("n’zoth") || name.includes("nzoth") || name.includes("恩佐斯")) return "paladin";
  if (name.includes("questline") || name.includes("任务线")) return "warlock";
  return "druid";
}

function fameRank(fame: string): number {
  return { S: 0, A: 1, B: 2, C: 3 }[fame] ?? 9;
}

const fallbackDeckData = [
  ["2", "德鲁伊", "Druid", "青玉德", "Jade Druid", "加基森至冰封王座", "狂野怀旧", "成长控制", "成长,资源,后期", "S", "4", "5", "青玉体系；成长组件；护甲回复", "Jade package; ramp tools; armor recovery", "通过法力成长和无限资源压垮慢速对手。"],
  ["3", "德鲁伊", "Druid", "超生德 / Token 德", "Token Druid", "多个版本", "狂野/休闲", "铺场快攻", "铺场,快攻,增益", "A", "4", "4", "低费衍生物；群体增益；自然法术", "Low-cost tokens; board buffs; nature spells", "快速制造横向场面，再用增益滚雪球。"],
  ["4", "德鲁伊", "Druid", "墙德 / 嘲讽德", "Taunt Druid", "女巫森林前后", "狂野怀旧", "防守复活", "嘲讽,防守,复活", "A", "3", "4", "高生命嘲讽；复活组件；护甲", "High-health taunts; revival tools; armor", "用厚墙拖住节奏，再以大随从反推。"],
  ["5", "德鲁伊", "Druid", "换家德", "Togwaggle Druid", "狗头人与地下世界后", "狂野怀旧", "组合技", "组合技,特殊胜利,资源", "A", "5", "5", "过牌；法力成长；特殊资源交换", "Draw; ramp; resource-swap combo", "快速过牌和成长，凑齐组合件后改变双方资源结构。"],
  ["6", "猎人", "Hunter", "T7猎 / 打脸猎", "Face Hunter", "经典至多个版本", "狂野怀旧", "直伤快攻", "快攻,直伤,野兽", "S", "4", "4", "低费野兽；武器压力；英雄直伤", "Cheap beasts; weapon pressure; hero damage", "忽略复杂交换，持续压低敌方英雄生命。"],
  ["7", "猎人", "Hunter", "中速猎", "Midrange Hunter", "纳克萨玛斯至冠军试炼", "狂野怀旧", "曲线中速", "中速,野兽,节奏", "S", "2", "4", "野兽曲线；黏性随从；稳定英雄技能", "Beast curve; sticky minions; steady hero power", "按费用拍出高质量威胁，用英雄技能补足伤害。"],
  ["8", "猎人", "Hunter", "奥秘猎", "Secret Hunter", "多个版本", "狂野/休闲", "节奏压制", "奥秘,节奏,武器", "A", "3", "4", "奥秘体系；武器；抢节奏随从", "Secrets; weapons; tempo minions", "用隐藏信息扰乱对手回合，并保持场面压力。"],
  ["9", "猎人", "Hunter", "法术猎", "Spell Hunter", "狗头人与地下世界", "狂野怀旧", "法术控制", "法术,控制,爆发", "A", "3", "4", "纯法术组件；召唤兽群；爆发伤害", "Spell-only package; beast summons; burst damage", "依靠法术解场和召唤，后期用爆发收尾。"],
  ["10", "猎人", "Hunter", "亡语猎", "Deathrattle Hunter", "多个版本", "狂野/休闲", "亡语中速", "亡语,中速,野兽", "B", "3", "4", "亡语随从；触发器；野兽压力", "Deathrattle minions; triggers; beast pressure", "用难处理的亡语单位持续制造资源。"],
  ["11", "法师", "Mage", "冰法", "Freeze Mage", "经典至多个版本", "狂野怀旧", "控制斩杀", "冰冻,控制,斩杀", "S", "5", "5", "冻结控制；过牌；法术爆发", "Freeze control; draw; spell burst", "拖延对手进攻，积累法术后集中斩杀。"],
  ["12", "法师", "Mage", "机械法", "Mech Mage", "地精大战侏儒", "狂野怀旧", "机械节奏", "机械,节奏,快攻", "S", "3", "4", "机械铺场；低费随从；直伤法术", "Mech board; cheap minions; burn spells", "用机械协同快速建立场面并转化为伤害。"],
  ["13", "法师", "Mage", "宇宙法 / 雷诺法", "Reno Mage", "探险者协会后", "狂野怀旧", "宇宙控制", "宇宙,控制,回复", "S", "4", "5", "单卡构筑；回复；高价值法术", "Singleton build; recovery; high-value spells", "用高质量单卡和回复拖进后期。"],
  ["14", "法师", "Mage", "任务法", "Quest Mage", "安戈洛后", "狂野怀旧", "组合技", "任务,组合技,额外回合", "A", "5", "5", "大量法术；过牌；特殊回合爆发", "Many spells; draw; special-turn burst", "完成任务式条件后，用连续资源爆发结束比赛。"],
  ["15", "法师", "Mage", "奥秘法", "Secret Mage", "多个版本", "狂野常见", "节奏直伤", "奥秘,节奏,直伤", "A", "4", "4", "奥秘体系；法术直伤；节奏随从", "Secrets; burn spells; tempo minions", "用奥秘限制对手选择，同时持续打脸。"],
  ["16", "圣骑士", "Paladin", "佛祖骑", "Secret Paladin", "冠军的试炼", "狂野怀旧", "奥秘中速", "奥秘,中速,铺场", "S", "4", "5", "奥秘体系；曲线随从；群体增益", "Secrets; curve minions; board buffs", "按曲线铺场并用奥秘保护节奏。"],
  ["17", "圣骑士", "Paladin", "鱼人骑", "Murloc Paladin", "多个版本", "狂野/休闲", "鱼人快攻", "鱼人,快攻,铺场", "A", "4", "4", "鱼人铺场；部族增益；直伤收尾", "Murloc board; tribal buffs; reach", "快速铺满部族随从，通过增益滚雪球。"],
  ["18", "圣骑士", "Paladin", "奇数骑", "Odd Paladin", "女巫森林后", "狂野常见", "铺场快攻", "奇数,铺场,英雄技能", "A", "4", "4", "强化英雄技能；低费随从；群体增益", "Upgraded hero power; cheap minions; buffs", "不断制造小随从，逼迫对手持续解场。"],
  ["19", "圣骑士", "Paladin", "奶骑 / 控制骑", "Control Paladin", "多个版本", "狂野/休闲", "控制回复", "控制,治疗,嘲讽", "B", "2", "3", "治疗；嘲讽；高价值解场", "Healing; taunts; value removal", "用回复和解场拖长比赛，靠后期随从获胜。"],
  ["20", "圣骑士", "Paladin", "机械骑", "Mech Paladin", "砰砰计划后", "狂野/休闲", "机械节奏", "机械,节奏,增益", "B", "3", "3", "机械随从；贴磁式增益；武器压力", "Mech minions; attach-style buffs; weapon pressure", "用机械威胁保持场面，逐步扩大攻击力。"],
  ["21", "牧师", "Priest", "环牧", "Circle Priest", "经典至多个版本", "狂野怀旧", "治疗控场", "治疗,控场,随从交换", "S", "3", "5", "治疗联动；高生命随从；清场", "Healing synergies; high-health minions; clears", "利用治疗把随从交换变成资源优势。"],
  ["22", "牧师", "Priest", "龙牧", "Dragon Priest", "黑石山后", "狂野怀旧", "龙体系中速", "龙,中速,嘲讽", "A", "2", "4", "龙族曲线；嘲讽；控场法术", "Dragon curve; taunts; control spells", "靠龙体系优质身材站场，稳定压制。"],
  ["23", "牧师", "Priest", "宇宙牧", "Reno Priest", "冰封王座后", "狂野经典", "宇宙控制", "宇宙,控制,英雄技能", "S", "5", "5", "单卡构筑；回复；英雄技能联动", "Singleton build; healing; hero-power synergy", "活到后期后，通过重复技能和资源优势取胜。"],
  ["24", "牧师", "Priest", "复活牧", "Resurrect Priest", "多个版本", "狂野常见", "复活控制", "复活,控制,大型随从", "A", "5", "4", "大型随从；复活法术；嘲讽", "Big minions; resurrection spells; taunts", "反复召回高质量随从，压垮对手解牌。"],
  ["25", "牧师", "Priest", "心火牧", "Inner Fire Priest", "多个版本", "狂野怀旧", "组合爆发", "组合技,增益,高生命", "A", "4", "5", "高生命随从；属性转换；保护法术", "High-health minions; stat conversion; protection", "把生命值优势转换成攻击力后突然斩杀。"],
  ["26", "潜行者", "Rogue", "奇迹贼", "Miracle Rogue", "经典至多个版本", "狂野怀旧", "过牌连击", "连击,过牌,节奏", "S", "4", "5", "低费法术；连击；巨型节奏随从", "Cheap spells; combo; swing minions", "用低费牌高速循环，制造爆发性节奏回合。"],
  ["27", "潜行者", "Rogue", "刀油贼", "Oil Rogue", "地精大战侏儒", "狂野怀旧", "武器斩杀", "武器,连击,爆发", "S", "3", "5", "武器增益；连击法术；直伤", "Weapon buffs; combo spells; burn", "控住前期，后期用武器和法术完成爆发。"],
  ["28", "潜行者", "Rogue", "海盗贼", "Pirate Rogue", "多个版本", "狂野常见", "海盗快攻", "海盗,武器,快攻", "A", "4", "4", "海盗随从；武器；低费直伤", "Pirates; weapons; cheap damage", "快速铺场并用武器不断压低血线。"],
  ["29", "潜行者", "Rogue", "任务贼", "Quest Rogue", "安戈洛后", "狂野怀旧", "任务组合", "任务,组合技,回手", "A", "5", "5", "回手组件；低费随从；任务奖励", "Bounce tools; cheap minions; quest reward", "重复使用同类随从达成条件，再用强化随从终结。"],
  ["30", "潜行者", "Rogue", "节奏贼", "Tempo Rogue", "多个版本", "狂野/休闲", "节奏中速", "节奏,连击,武器", "A", "3", "3", "优质曲线；连击；武器", "Efficient curve; combo; weapons", "每回合制造更强节奏，迫使对手被动交换。"],
  ["31", "萨满", "Shaman", "中速萨", "Midrange Shaman", "上古之神至卡拉赞", "狂野怀旧", "图腾中速", "图腾,中速,铺场", "S", "3", "4", "图腾联动；超载节奏；群体增益", "Totem synergies; overload tempo; buffs", "通过高效率超载牌和图腾协同压制场面。"],
  ["32", "萨满", "Shaman", "青玉萨", "Jade Shaman", "加基森后", "狂野怀旧", "资源中速", "青玉,中速,资源", "A", "3", "4", "成长型召唤；武器；解场", "Scaling summons; weapons; removal", "边解场边制造越来越大的威胁。"],
  ["33", "萨满", "Shaman", "偶数萨", "Even Shaman", "女巫森林后", "狂野常见", "图腾节奏", "偶数,图腾,节奏", "A", "4", "4", "低费英雄技能；图腾增益；曲线随从", "Discounted hero power; totem buffs; curve minions", "用便宜技能补足每回合节奏并快速铺场。"],
  ["34", "萨满", "Shaman", "战吼萨", "Shudderwock Shaman", "女巫森林后", "狂野怀旧", "战吼组合", "战吼,组合技,控制", "A", "5", "5", "战吼随从；回手；回复控制", "Battlecry minions; bounce; healing control", "积累战吼效果，在后期用组合回合压倒对手。"],
  ["35", "萨满", "Shaman", "鱼人萨", "Murloc Shaman", "多个版本", "狂野/休闲", "鱼人快攻", "鱼人,快攻,铺场", "B", "4", "3", "鱼人铺场；部族增益；低费法术", "Murloc board; tribal buffs; cheap spells", "快速横向展开，依靠部族增益抢死对手。"],
  ["36", "术士", "Warlock", "动物园术", "Zoo Warlock", "经典至多个版本", "狂野怀旧", "铺场快攻", "铺场,快攻,生命换牌", "S", "3", "5", "低费随从；弃牌/自伤收益；英雄技能补牌", "Cheap minions; self-damage payoffs; hero-power draw", "通过英雄技能持续补牌，把小随从变成稳定压力。"],
  ["37", "术士", "Warlock", "手牌术", "Handlock", "经典至多个版本", "狂野怀旧", "控制巨人", "控制,大型随从,嘲讽", "S", "3", "5", "大量手牌；高身材随从；嘲讽架墙", "Large hand; big minions; taunt walls", "用生命和手牌换取低费巨型威胁。"],
  ["38", "术士", "Warlock", "宇宙术", "Reno Warlock", "探险者协会后", "狂野经典", "宇宙控制", "宇宙,控制,回复", "S", "4", "5", "单卡构筑；回复；恶魔资源", "Singleton build; healing; demon value", "靠全能解牌和回复拖进资源战。"],
  ["39", "术士", "Warlock", "模块术", "Cube Warlock", "狗头人与地下世界", "狂野怀旧", "恶魔控制", "恶魔,亡语,控制", "A", "5", "5", "恶魔召唤；亡语复制；回复", "Demon summons; deathrattle copying; recovery", "复制大型恶魔威胁，形成连续压迫。"],
  ["40", "术士", "Warlock", "弃牌术", "Discard Warlock", "多个版本", "狂野/休闲", "弃牌快攻", "弃牌,快攻,资源", "B", "4", "4", "弃牌收益；低费随从；补牌", "Discard payoffs; cheap minions; draw", "用弃牌代价换取超模节奏和持续伤害。"],
  ["41", "战士", "Warrior", "防战", "Control Warrior", "经典至多个版本", "狂野怀旧", "护甲控制", "控制,护甲,解场", "S", "3", "5", "护甲；武器解场；后期威胁", "Armor; weapon removal; late threats", "用护甲和解牌耗尽对手进攻资源。"],
  ["42", "战士", "Warrior", "奴隶战", "Patron Warrior", "黑石山后", "狂野怀旧", "组合铺场", "组合技,旋风,铺场", "S", "5", "5", "受伤触发；旋风效果；爆发铺场", "Damage triggers; whirlwinds; burst board", "通过群体伤害触发大量随从和伤害增益。"],
  ["43", "战士", "Warrior", "海盗战", "Pirate Warrior", "加基森后", "狂野常见", "武器快攻", "海盗,武器,快攻", "A", "4", "4", "海盗随从；武器；英雄攻击", "Pirates; weapons; hero attacks", "连续武器和海盗抢血，缩短比赛。"],
  ["44", "战士", "Warrior", "奇数战", "Odd Warrior", "女巫森林后", "狂野怀旧", "护甲控制", "奇数,护甲,控制", "A", "4", "4", "强化护甲技能；解场；疲劳资源", "Upgraded armor power; clears; fatigue resources", "通过超高护甲拖入疲劳和资源战。"],
  ["45", "战士", "Warrior", "炸弹战", "Bomb Warrior", "暗影崛起后", "狂野/休闲", "牌库伤害", "炸弹,武器,控制", "B", "4", "4", "武器；洗入伤害；护甲", "Weapons; shuffled damage; armor", "控制场面同时向对手牌库施压。"],
  ["46", "死亡骑士", "Death Knight", "彩虹 DK", "Rainbow Death Knight", "死亡骑士登场后", "狂野/休闲", "多符文中速", "符文,中速,资源", "A", "3", "4", "多系资源；亡灵随从；尸体消耗", "Multi-rune resources; undead minions; corpse spenders", "混合不同符文优势，靠资源和场面取胜。"],
  ["47", "死亡骑士", "Death Knight", "冰霜 DK", "Frost Death Knight", "死亡骑士登场后", "狂野/休闲", "法术直伤", "冰霜,直伤,节奏", "A", "4", "4", "冰霜法术；武器；直伤爆发", "Frost spells; weapons; burst damage", "用节奏和直伤快速压低敌方英雄。"],
  ["48", "死亡骑士", "Death Knight", "鲜血 DK", "Blood Death Knight", "死亡骑士登场后", "狂野/休闲", "生命控制", "鲜血,控制,回复", "A", "3", "4", "生命回复；清场；大型随从", "Life recovery; board clears; big minions", "用回复和解场延长比赛，靠后期资源取胜。"],
  ["49", "死亡骑士", "Death Knight", "邪恶 DK", "Unholy Death Knight", "死亡骑士登场后", "狂野/休闲", "亡灵铺场", "邪恶,铺场,亡灵", "B", "4", "3", "亡灵小随从；尸体收益；群体增益", "Undead swarms; corpse payoffs; board buffs", "持续铺场并通过尸体资源放大压力。"],
  ["50", "恶魔猎手", "Demon Hunter", "节奏瞎", "Tempo Demon Hunter", "外域的灰烬后", "狂野怀旧", "英雄攻击节奏", "节奏,武器,直伤", "S", "4", "4", "英雄攻击；低费随从；法术直伤", "Hero attacks; cheap minions; burn spells", "用高频英雄攻击和低费牌压垮对手。"],
  ["51", "恶魔猎手", "Demon Hunter", "吸血瞎", "Lifesteal Demon Hunter", "多个版本", "狂野/休闲", "组合回复", "吸血,组合技,法术", "A", "4", "5", "吸血法术；过牌；爆发组件", "Lifesteal spells; draw; burst pieces", "边回复边过牌，最终用法术链完成爆发。"],
  ["52", "恶魔猎手", "Demon Hunter", "快攻瞎", "Aggro Demon Hunter", "多个版本", "狂野/休闲", "低费快攻", "快攻,武器,英雄攻击", "A", "4", "3", "低费随从；武器；英雄攻击", "Cheap minions; weapons; hero attacks", "快速抢血，利用英雄攻击补足伤害。"],
  ["53", "恶魔猎手", "Demon Hunter", "大哥瞎", "Big Demon Hunter", "多个版本", "狂野/休闲", "大型恶魔", "大型随从,控制,恶魔", "B", "3", "3", "大型恶魔；减费；控场", "Big demons; discounts; control", "用控场撑到高费回合，连续拍出大型威胁。"],
  ["54", "中立/多职业", "Neutral/Multi", "宇宙体系代表", "Highlander Shell", "多个版本", "狂野常见", "单卡控制", "宇宙,控制,资源", "A", "4", "5", "单卡构筑；回复；高价值解牌", "Singleton build; recovery; premium removal", "牺牲重复牌稳定性，换取单卡构筑奖励。"],
  ["55", "中立/多职业", "Neutral/Multi", "奇数体系代表", "Odd Shell", "女巫森林后", "狂野常见", "强化技能节奏", "奇数,英雄技能,节奏", "A", "4", "5", "奇数费用曲线；强化英雄技能；低费压力", "Odd-cost curve; upgraded hero power; early pressure", "围绕强化英雄技能构建稳定回合节奏。"],
  ["56", "中立/多职业", "Neutral/Multi", "偶数体系代表", "Even Shell", "女巫森林后", "狂野常见", "低费技能节奏", "偶数,英雄技能,节奏", "A", "3", "4", "偶数费用曲线；低费英雄技能；中速随从", "Even-cost curve; cheaper hero power; midrange minions", "用便宜英雄技能填补费用并稳定铺场。"],
  ["57", "中立/多职业", "Neutral/Multi", "机械体系代表", "Mech Shell", "多个版本", "狂野/休闲", "机械节奏", "机械,铺场,增益", "B", "3", "4", "机械随从；属性增益；持续站场", "Mech minions; stat buffs; persistent board", "用机械协同制造连续威胁。"],
  ["58", "中立/多职业", "Neutral/Multi", "鱼人体系代表", "Murloc Shell", "多个版本", "狂野/休闲", "部族快攻", "鱼人,快攻,铺场", "B", "4", "4", "鱼人铺场；部族增益；低费曲线", "Murloc board; tribal buffs; low curve", "靠低费部族单位横向展开并快速滚雪球。"],
  ["59", "中立/多职业", "Neutral/Multi", "恩佐斯式亡语体系", "N'Zoth Deathrattle Shell", "探险者协会后", "狂野怀旧", "亡语控制", "亡语,控制,复活", "A", "4", "5", "亡语随从；复活回合；防守组件", "Deathrattle minions; revival turn; defense tools", "前期用亡语拖资源，后期一次性返场。"],
  ["60", "中立/多职业", "Neutral/Multi", "任务线体系代表", "Questline Shell", "多个版本", "狂野/休闲", "任务推进", "任务线,组合技,资源", "B", "4", "4", "任务进度；过牌；重复动作收益", "Quest progress; draw; repeat-action payoff", "围绕一条任务式条件推进，完成后获得持续优势。"]
] as const;

function fallbackDeckRows(): CsvDeckRow[] {
  return fallbackDeckData.map((item) => ({
    id: item[0],
    "职业_中文": item[1],
    "职业_英文": item[2],
    "卡组中文名": item[3],
    "卡组英文名": item[4],
    "代表时期": item[5],
    "适用模式": item[6],
    "卡组类型": item[7],
    "标签": item[8],
    "历史知名度": item[9],
    "阴间度_1到5": item[10],
    "特别度_1到5": item[11],
    "代表核心卡_中文": item[12],
    "代表核心卡_英文": item[13],
    "主要取胜方式": item[14],
    "为什么值得收录": "CSV 缺失时的内置后备模板；仅提供原创代理玩法参考，不包含官方卡面、音效或完整卡牌文本。",
    "推荐用途": "大厅直接选择预设卡组开局。",
    "来源说明": "内置后备模板；若提供 DECK_TEMPLATES_CSV 或桌面 CSV，将优先读取用户 CSV。",
    "来源URL": ""
  }));
}
