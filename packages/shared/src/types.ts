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
  | "poisonous"
  | "spell_damage";

export type CardRuleTag =
  | "etc_band_manager"
  | "theotar"
  | "rustrot_viper"
  | "steamcleaner"
  | "dirty_rat"
  | "reno_jackson"
  | "razorscale"
  | "priest_raise_dead"
  | "priest_chameleos"
  | "priest_mend"
  | "priest_power_word_barrier"
  | "priest_creation_protocol"
  | "priest_finley"
  | "priest_zephrys"
  | "priest_kaldorei_spirit"
  | "priest_identity_theft"
  | "priest_thoughtsteal"
  | "priest_shadow_word_death"
  | "priest_power_chord_synchronize"
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
  | "priest_cozy_voljin"
  | "priest_cult_neophyte"
  | "priest_papercraft_angel"
  | "priest_lazul"
  | "priest_zola"
  | "priest_harvester"
  | "priest_holmes"
  | "priest_banker"
  | "priest_twilight_torrent"
  | "priest_nameless_one"
  | "priest_puppet_theatre"
  | "priest_glowstone_gyreworm"
  | "priest_najark"
  | "priest_mind_control_tech"
  | "priest_shadow_word_ruin"
  | "priest_repackage"
  | "priest_repackaged_box"
  | "priest_zilliax_twin_perfect"
  | "priest_ignis"
  | "priest_ignis_weapon"
  | "priest_loatheb"
  | "priest_benedictus"
  | "priest_spawn_of_shadows"
  | "priest_dragonfire_potion"
  | "priest_harmonic_pop"
  | "priest_dissonant_pop"
  | "priest_lightbomb"
  | "priest_elise_badlands"
  | "priest_marin_manager"
  | "priest_amanthul_copy"
  | "priest_amanthul_exile"
  | "priest_amanthul_summon"
  | "priest_amanthul_legend"
  | "priest_amanthul_handbuff"
  | "priest_yogg_control"
  | "priest_yogg_tendrils"
  | "priest_yogg_madness"
  | "priest_yogg_unleashed"
  | "priest_ceaseless_expanse"
  | "priest_ysera_emerald"
  | "priest_fizzle"
  | "priest_fizzle_snapshot"
  | "priest_kiljaeden"
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
  | "dragon_seeded_green_drake"
  | "dragon_prickly_drake"
  | "dragon_emerald_explorer"
  | "dragon_dragon_golem"
  | "dragon_twilight_guardian"
  | "dragon_twilight_drake"
  | "dragon_onyxian_warder"
  | "dragon_bone_drake"
  | "dragon_primordial_drake"
  | "dragon_alexstrasza_lifebinder"
  | "dragon_deathwing"
  | "dragon_raid_boss_onyxia"
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
  | "dragon_eonar_refresh"
  | "hunter_tracking"
  | "hunter_animal_companion"
  | "hunter_companion_misha"
  | "hunter_companion_leokk"
  | "hunter_companion_huffer"
  | "hunter_broll_bearmantle"
  | "hunter_raptor_nest_caretaker"
  | "hunter_ranger_aurelia"
  | "hunter_ranger_vereesa"
  | "hunter_ranger_sylvanas"
  | "hunter_taya_runetotem"
  | "hunter_little_critter_caretaker"
  | "hunter_wound_prey"
  | "hunter_blazing_cinder"
  | "hunter_sands_of_time"
  | "hunter_face_the_tolvir"
  | "hunter_tame_beast"
  | "hunter_spirit_bond_hunter"
  | "hunter_migrating_elekk"
  | "hunter_free_roam"
  | "hunter_call_of_the_wild"
  | "hunter_glacial_shard"
  | "hunter_mad_alchemist"
  | "hunter_niri_of_ungoro"
  | "hunter_archbishop_nelle"
  | "hunter_beaststalker_tavish"
  | "hunter_heart_of_stranglethorn"
  | "hunter_zuljin"
  | "hunter_secret_improved_frost_trap"
  | "hunter_secret_improved_explosive_trap"
  | "hunter_secret_improved_snake_trap"
  | "hunter_secret_improved_pack_tactics"
  | "hunter_secret_improved_open_the_cages"
  | "hunter_deafening_roar"
  | "beast_generic_battlecry"
  | "beast_generic_deathrattle"
  | "beast_generic_damage"
  | "beast_generic_end_turn"
  | "beast_generic_attack"
  | "beast_red_herring"
  | "beast_magmaw_colossal"
  | "beast_magmaw_limb"
  | "beast_stealth"
  | "beast_tundra_rhino"
  | "beast_swamp_king_dred"
  | "beast_corridor_creeper"
  | "beast_cleave_attack"
  | "beast_spellburst_destroy"
  | "beast_loot_spellward"
  | "beast_inspire_team_buff"
  | "beast_octomasseuse"
  | "beast_knuckles"
  | "beast_frozen"
  | "beast_kindred_attack"
  | "beast_baku"
  | "beast_leokk_aura"
  | "mage_ice_lance"
  | "mage_arcane_missiles"
  | "mage_frostbolt"
  | "mage_doomsayer"
  | "mage_secret_ice_block"
  | "mage_frost_nova"
  | "mage_secret_ice_barrier"
  | "mage_acolyte_of_pain"
  | "mage_polymorph"
  | "mage_blizzard"
  | "mage_alexstrasza"
  | "rogue_preparation"
  | "rogue_shadowstep"
  | "rogue_backstab"
  | "rogue_the_caverns_below"
  | "rogue_fire_fly"
  | "rogue_southsea_deckhand"
  | "rogue_swashburglar_huckster"
  | "rogue_patches"
  | "rogue_youthful_brewmaster"
  | "rogue_gadgetzan_ferryman"
  | "rogue_eviscerate"
  | "rogue_igneous_elemental"
  | "rogue_mimic_pod"
  | "rogue_crystal_core";

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
  titanAbilityCardIds?: string[];
  forgeable?: boolean;
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
  forged?: boolean;
  moonlitOriginalInstanceId?: string;
  moonlitDrawTurn?: number;
  isFloopCopy?: boolean;
  chameleos?: boolean;
  storedCardIds?: string[];
  ignisWeapon?: IgnisWeaponData;
  kiljaedenDemon?: boolean;
}

export interface BoardMinion extends CardInstance {
  attack: number;
  health: number;
  maxHealth: number;
  statEffects?: {
    attack: number;
    health: number;
  };
  keywords: Keyword[];
  exhausted: boolean;
  summonedTurn: number;
  attacksThisTurn: number;
  silenced: boolean;
  temporaryAttack: number;
  cannotAttack?: boolean;
  untouchable?: boolean;
  frozenUntilTurn?: number;
  expiresAtEndOfTurn?: boolean;
  counterNextCardType?: "minion" | "spell";
  spellburstUsed?: boolean;
  borrowedByInstanceId?: string;
  borrowedFromSeat?: Seat;
  usedTitanAbilityCardIds?: string[];
  titanAbilityUsedTurn?: number;
}

export interface BoardLocation extends CardInstance {
  durability: number;
  readyTurn: number;
}

export interface BoardSpecial extends CardInstance {
  bonus?: number;
  demonCardIds?: string[];
}

export interface WeaponState {
  cardId: string;
  attack: number;
  durability: number;
  keywords?: Keyword[];
  ignisWeapon?: IgnisWeaponData;
}

export interface IgnisWeaponData {
  attack: number;
  durability: number;
  keywords?: Keyword[];
  adjacentDamage?: boolean;
  immuneWhileAttacking?: boolean;
  afterAttackSummonCost?: number;
  afterAttackDraw?: number;
  afterAttackArmor?: number;
  battlecryDamage?: number;
  deathrattleAllEnemyDamage?: number;
}

export interface HeroState {
  health: number;
  maxHealth: number;
  armor: number;
  temporaryAttack: number;
  frozenUntilTurn?: number;
  immuneUntilTurn?: number;
  weapon?: WeaponState;
  attacksThisTurn: number;
  heroPowerUsed: boolean;
  heroPowerCardId?: string;
  heroPowerCost?: number;
}

export interface QuestState {
  cardId: string;
  name: string;
  progress: number;
  required: number;
  completed: boolean;
  rewardCardId: string;
  playedMinionNames: Record<string, number>;
  lastProgressCardName?: string;
  lastProgressLogId?: number;
}

export interface PlayerGameState {
  seat: Seat;
  nickname: string;
  class: CollectibleClass;
  hero: HeroState;
  deck: CardInstance[];
  hand: CardInstance[];
  secrets: CardInstance[];
  sideboard: CardInstance[];
  board: BoardMinion[];
  locations: BoardLocation[];
  specials: BoardSpecial[];
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
  nextSpellDiscount?: {
    amount: number;
    throughTurn: number;
  };
  cardsPlayedThisTurn?: number;
  comboActiveForCurrentCard?: boolean;
  quest?: QuestState;
  crystalCoreActive?: boolean;
  avianaCountdown?: number;
  avianaActive?: boolean;
  spellsCastThisGame?: number;
  forgedThisGame?: boolean;
  animalCompanionReplacementCost?: number;
  animalCompanionReplacementPools?: Record<string, string[]>;
  animalCompanionRollCounter?: number;
  animalCompanionExtraSummons?: number;
  hunterRangersPlayed?: {
    aurelia?: boolean;
    vereesa?: boolean;
    sylvanas?: boolean;
  };
  hunterOneCostCardsPlayed?: string[];
  hunterSpellsCastThisGame?: string[];
  kiljaedenPortal?: {
    bonus: number;
    demonCardIds: string[];
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
  forged?: boolean;
}

export interface PublicPlayerGameState extends Omit<PlayerGameState, "deck" | "hand" | "sideboard" | "secrets"> {
  deckCount: number;
  sideboardCount: number;
  hand: PublicCardInstance[];
  secrets: PublicCardInstance[];
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
  | "titan_ability"
  | "amanthul_second_enemy"
  | "kiljaeden_demon"
  | "ignis_base"
  | "ignis_trait"
  | "ignis_special"
  | "voljin_second_minion"
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
  copiesToAdd?: number;
  ignisWeapon?: IgnisWeaponData;
  continuesStartTurn?: boolean;
}

export interface StartTurnQueue {
  seat: Seat;
  effects: string[];
  index: number;
  drawAfter?: boolean;
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
  ceaselessEvents?: number;
  ceaselessTrackingStarted?: boolean;
  startTurnQueue?: StartTurnQueue;
}

export interface PublicGameState extends Omit<GameState, "players" | "pendingChoice"> {
  viewerSeat: Seat;
  players: [PublicPlayerGameState, PublicPlayerGameState];
  pendingChoice?: PublicPendingChoice;
}

export type GameAction =
  | { type: "mulligan"; cardInstanceIds: string[] }
  | { type: "play_card"; handInstanceId: string; target?: TargetRef }
  | { type: "forge_card"; handInstanceId: string }
  | { type: "use_location"; locationInstanceId: string; target?: TargetRef }
  | { type: "use_titan_ability"; minionInstanceId: string }
  | { type: "cancel_choice"; choiceId: string }
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
