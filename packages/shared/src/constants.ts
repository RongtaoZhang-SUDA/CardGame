export const GAME_RULES = {
  heroHealth: 30,
  deckSize: 30,
  maxCopies: 2,
  maxLegendaryCopies: 1,
  startingHand: [3, 4],
  maxMana: 10,
  maxHandSize: 10,
  maxBoardSize: 7,
  defaultHeroPowerCost: 2
} as const;

export const CARD_CLASSES = [
  "death_knight",
  "demon_hunter",
  "druid",
  "hunter",
  "mage",
  "paladin",
  "priest",
  "rogue",
  "shaman",
  "warlock",
  "warrior",
  "warden",
  "arcanist",
  "gearwright",
  "neutral"
] as const;

export const CLASS_LABELS: Record<(typeof CARD_CLASSES)[number], string> = {
  death_knight: "死亡骑士",
  demon_hunter: "恶魔猎手",
  druid: "德鲁伊",
  hunter: "猎人",
  mage: "法师",
  paladin: "圣骑士",
  priest: "牧师",
  rogue: "潜行者",
  shaman: "萨满祭司",
  warlock: "术士",
  warrior: "战士",
  warden: "守誓者",
  arcanist: "星术师",
  gearwright: "机巧师",
  neutral: "中立"
};

export const TEMPLATE_CLASSES = [
  "death_knight",
  "demon_hunter",
  "druid",
  "hunter",
  "mage",
  "paladin",
  "priest",
  "rogue",
  "shaman",
  "warlock",
  "warrior"
] as const;

export const COLLECTIBLE_CLASSES = CARD_CLASSES.filter((value) => value !== "neutral");
