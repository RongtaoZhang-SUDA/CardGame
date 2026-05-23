export type CardClass =
  | "death_knight"
  | "demon_hunter"
  | "druid"
  | "hunter"
  | "mage"
  | "paladin"
  | "priest"
  | "rogue"
  | "shaman"
  | "warlock"
  | "warrior"
  | "warden"
  | "arcanist"
  | "gearwright"
  | "neutral";
export type CollectibleClass = Exclude<CardClass, "neutral">;
export type CardType = "minion" | "spell" | "weapon" | "location" | "hero" | "hero_power";
export type CardRarity = "common" | "rare" | "epic" | "legendary";
export type CardStatus = "draft" | "published" | "disabled";
export type Seat = 0 | 1;

export type Keyword =
  | "taunt"
  | "charge"
  | "rush"
  | "divine_shield"
  | "lifesteal"
  | "deathrattle"
  | "battlecry"
  | "windfury"
  | "spell_damage";

export type CardRuleTag =
  | "etc_band_manager"
  | "theotar"
  | "rustrot_viper"
  | "steamcleaner"
  | "dirty_rat"
  | "reno_jackson"
  | "razorscale"
  | "savage_roar"
  | "force_of_nature"
  | "wild_growth"
  | "swipe"
  | "harrison_jones"
  | "big_game_hunter"
  | "black_knight"
  | "ragnaros"
  | "cenarius_buff"
  | "druid_claw_charge"
  | "druid_claw_taunt"
  | "ancient_war_attack"
  | "ancient_war_taunt"
  | "priest_raise_dead"
  | "priest_finley"
  | "priest_zephrys"
  | "priest_kaldorei_spirit"
  | "priest_identity_theft"
  | "priest_illucia"
  | "priest_mixologist"
  | "priest_hysteria"
  | "priest_okani_minion"
  | "priest_okani_spell"
  | "priest_raza"
  | "priest_magatha"
  | "priest_lone_ranger_reno"
  | "priest_psychic_conjurer"
  | "priest_serena"
  | "priest_cult_neophyte"
  | "priest_papercraft_angel"
  | "priest_lazul"
  | "priest_harvester"
  | "priest_holmes"
  | "priest_banker"
  | "priest_puppet_theatre"
  | "priest_najark"
  | "priest_loatheb"
  | "priest_benedictus"
  | "priest_spawn_of_shadows"
  | "priest_shadowreaper"
  | "priest_aviana"
  | "priest_reno_holy_bullet"
  | "priest_reno_nature_bullet"
  | "priest_reno_shadow_bullet"
  | "dragon_aquatic_form"
  | "dragon_wave_shaper"
  | "dragon_breath_of_dreams"
  | "dragon_moonlit_guidance"
  | "dragon_astalor"
  | "dragon_astalor_protector"
  | "dragon_astalor_flamebringer"
  | "dragon_splish_splash_whelp"
  | "dragon_lotus_seedling"
  | "dragon_new_heights"
  | "dragon_brann"
  | "dragon_starfish"
  | "dragon_gem_tosser"
  | "dragon_timeline_accelerator"
  | "dragon_poison_seeds"
  | "dragon_psychmelon"
  | "dragon_overgrowth"
  | "dragon_floop"
  | "dragon_desert_nestmatron"
  | "dragon_elise"
  | "dragon_broken_mirror"
  | "dragon_curator"
  | "dragon_guff"
  | "dragon_guff_ramp"
  | "dragon_doomkin"
  | "dragon_death_beetle"
  | "dragon_bob_recruit"
  | "dragon_bob_refresh"
  | "dragon_bob_triple"
  | "dragon_bob_freeze"
  | "dragon_timewinder_attack"
  | "dragon_timewinder_health"
  | "dragon_zilliax_haywire"
  | "dragon_rheastrasza"
  | "dragon_pure_nest"
  | "dragon_aviana"
  | "dragon_eonar_draw"
  | "dragon_eonar_heal"
  | "dragon_eonar_refresh";

export type TargetKind = "none" | "selected" | "enemy_hero" | "own_hero" | "all_enemies" | "all_enemy_minions" | "all_minions" | "any_minion" | "friendly_minion" | "enemy_minion";

export type EffectTrigger = "play" | "battlecry" | "deathrattle" | "hero_power" | "location" | "quickdraw";

export interface BaseEffect {
  id?: string;
  trigger?: EffectTrigger;
  target?: TargetKind;
}

export type CardEffect =
  | (BaseEffect & { type: "damage"; amount: number })
  | (BaseEffect & { type: "heal"; amount: number })
  | (BaseEffect & { type: "gain_armor"; amount: number })
  | (BaseEffect & { type: "hero_attack"; amount: number })
  | (BaseEffect & { type: "gain_mana"; amount: number })
  | (BaseEffect & { type: "draw"; amount: number })
  | (BaseEffect & { type: "summon"; cardId: string; amount: number })
  | (BaseEffect & { type: "buff"; attack: number; health: number })
  | (BaseEffect & { type: "equip_weapon"; attack: number; durability: number })
  | (BaseEffect & { type: "destroy" })
  | (BaseEffect & { type: "silence" });

export interface CardDefinition {
  id: string;
  name: string;
  class: CardClass;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  attack?: number;
  health?: number;
  durability?: number;
  text: string;
  keywords: Keyword[];
  effects: CardEffect[];
  sourceNameEn?: string;
  sourceCardId?: string;
  races?: string[];
  requiresTarget?: boolean;
  choiceOptionCardIds?: string[];
  deckRules?: {
    deckSize?: number;
    startingHealth?: number;
  };
  sideboardSlots?: number;
  repeatableUses?: number;
  rules?: CardRuleTag[];
  assetUrl?: string;
  status: CardStatus;
  collectible: boolean;
  version: number;
  updatedAt?: string;
}

export interface DeckDefinition {
  id: string;
  owner: string;
  name: string;
  class: CollectibleClass;
  cardIds: string[];
  sideboardCardIds?: string[];
  templateId?: string;
  updatedAt: string;
}

export interface HeroClassProfile {
  class: CollectibleClass;
  classZh: string;
  classEn: string;
  defaultHero: string;
  heroPowerName: string;
  heroPowerCost: number;
  heroPowerText: string;
  traits: string[];
  sourceUrls: string[];
}

export interface DeckTemplate {
  id: string;
  class?: CollectibleClass;
  defaultClass: CollectibleClass;
  classZh: string;
  classEn: string;
  nameZh: string;
  nameEn: string;
  era: string;
  mode: string;
  archetype: string;
  tags: string[];
  fame: string;
  annoyance: number;
  uniqueness: number;
  coreCardsZh: string[];
  coreCardsEn: string[];
  winCondition: string;
  whyIncluded: string;
  recommendedUse: string;
  sourceNote: string;
  sourceUrls: string[];
  hero: HeroClassProfile;
  presetCardIds?: string[];
  sideboardCardIds?: string[];
  expectedDeckSize?: number;
}

export interface PlayerProfile {
  nickname: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface TargetRef {
  type: "hero" | "minion";
  seat: Seat;
  instanceId?: string;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  owner: Seat;
  origin?: "starting_deck" | "sideboard" | "generated";
  drawnTurn?: number;
  costOverride?: number;
  attackOverride?: number;
  healthOverride?: number;
  remainingUses?: number;
  moonlitOriginalInstanceId?: string;
  moonlitDrawTurn?: number;
  isFloopCopy?: boolean;
}

export interface BoardMinion extends CardInstance {
  attack: number;
  health: number;
  maxHealth: number;
  keywords: Keyword[];
  exhausted: boolean;
  summonedTurn: number;
  attacksThisTurn: number;
  silenced: boolean;
  temporaryAttack: number;
  cannotAttack?: boolean;
  frozenUntilTurn?: number;
  expiresAtEndOfTurn?: boolean;
  counterNextCardType?: "minion" | "spell";
  borrowedByInstanceId?: string;
  borrowedFromSeat?: Seat;
}

export interface BoardLocation extends CardInstance {
  durability: number;
  readyTurn: number;
}

export interface WeaponState {
  cardId: string;
  attack: number;
  durability: number;
}

export interface HeroState {
  health: number;
  maxHealth: number;
  armor: number;
  temporaryAttack: number;
  weapon?: WeaponState;
  attacksThisTurn: number;
  heroPowerUsed: boolean;
  heroPowerCardId?: string;
  heroPowerCost?: number;
}

export interface PlayerGameState {
  seat: Seat;
  nickname: string;
  class: CollectibleClass;
  hero: HeroState;
  deck: CardInstance[];
  hand: CardInstance[];
  sideboard: CardInstance[];
  board: BoardMinion[];
  locations: BoardLocation[];
  graveyard: string[];
  maxMana: number;
  manaCap?: number;
  mana: number;
  fatigue: number;
  mulliganDone: boolean;
  spellCostIncrease?: {
    amount: number;
    throughTurn: number;
  };
}

export interface PublicCardInstance {
  instanceId: string;
  cardId?: string;
  owner: Seat;
  hidden?: boolean;
  drawnTurn?: number;
  costOverride?: number;
  attackOverride?: number;
  healthOverride?: number;
  remainingUses?: number;
}

export interface PublicPlayerGameState extends Omit<PlayerGameState, "deck" | "hand" | "sideboard"> {
  deckCount: number;
  sideboardCount: number;
  hand: PublicCardInstance[];
}

export interface GameLogEntry {
  id: number;
  at: string;
  message: string;
}

export type GamePhase = "mulligan" | "playing" | "finished";

export type PendingChoiceKind =
  | "etc_band"
  | "theotar_friendly"
  | "theotar_enemy"
  | "copy_enemy_hand"
  | "discover_to_hand"
  | "card_choice"
  | "dragon_aquatic_form"
  | "dragon_wave_shaper"
  | "dragon_moonlit_guidance";

export interface PendingChoice {
  id: string;
  seat: Seat;
  kind: PendingChoiceKind;
  prompt: string;
  options: CardInstance[];
  chosenFriendlyInstanceId?: string;
  sourceInstanceId?: string;
}

export interface PublicPendingChoice extends Omit<PendingChoice, "options"> {
  options: PublicCardInstance[];
}

export interface GameState {
  id: string;
  roomCode: string;
  phase: GamePhase;
  turn: number;
  currentPlayer: Seat;
  winner?: Seat;
  seed: number;
  players: [PlayerGameState, PlayerGameState];
  pendingChoice?: PendingChoice;
  logs: GameLogEntry[];
}

export interface PublicGameState extends Omit<GameState, "players" | "pendingChoice"> {
  viewerSeat: Seat;
  players: [PublicPlayerGameState, PublicPlayerGameState];
  pendingChoice?: PublicPendingChoice;
}

export type GameAction =
  | { type: "mulligan"; cardInstanceIds: string[] }
  | { type: "play_card"; handInstanceId: string; target?: TargetRef }
  | { type: "use_location"; locationInstanceId: string; target?: TargetRef }
  | { type: "choose"; choiceId: string; optionInstanceId: string; target?: TargetRef }
  | { type: "attack"; source: TargetRef; target: TargetRef }
  | { type: "hero_power"; target?: TargetRef }
  | { type: "end_turn" }
  | { type: "concede" };

export interface RoomSeat {
  seat: Seat;
  nickname?: string;
  deckId?: string;
  ready: boolean;
  connected: boolean;
}

export type RoomStatus = "waiting" | "playing" | "finished";

export interface RoomState {
  code: string;
  status: RoomStatus;
  seats: [RoomSeat, RoomSeat];
  gameId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
