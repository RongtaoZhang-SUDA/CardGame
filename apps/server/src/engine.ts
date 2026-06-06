import { randomUUID } from "node:crypto";
import { GAME_RULES, cardNeedsTarget, type BoardLocation, type BoardMinion, type BoardSpecial, type CardDefinition, type CardEffect, type CardInstance, type CollectibleClass, type DeckDefinition, type EffectTrigger, type GameAction, type GameLogEntry, type GameState, type IgnisWeaponData, type Keyword, type PlayedCardEntry, type PlayerGameState, type PublicGameState, type Seat, type TargetRef } from "@dormstone/shared";

interface GamePlayerInput {
  nickname: string;
  class: CollectibleClass;
  deck: DeckDefinition;
}

interface EffectContext {
  selectedTarget?: TargetRef;
  sourceCard: CardDefinition;
  sourceOwner: Seat;
  trigger: EffectTrigger;
}

interface DamageResult {
  dealt: number;
  blockedByDivineShield: boolean;
}

const KILJAEDEN_DEMON_CARD_IDS = [
  "reno_portal_voidwalker",
  "reno_portal_flame_imp",
  "reno_portal_succubus",
  "reno_portal_felguard",
  "reno_portal_voidcaller",
  "reno_portal_doomguard",
  "reno_portal_felsoul_jailer",
  "reno_portal_abyssal_enforcer",
  "reno_portal_illidari_inquisitor",
  "reno_portal_malganis",
  "reno_portal_lord_jaraxxus",
  "reno_portal_archimonde"
];

const IGNIS_BASE_OPTIONS: Record<string, IgnisWeaponData> = {
  reno_choice_ignis_base_1: { attack: 2, durability: 2 },
  reno_choice_ignis_base_5: { attack: 3, durability: 4 },
  reno_choice_ignis_base_10: { attack: 5, durability: 6 }
};

const IGNIS_TRAIT_CARD_IDS = [
  "reno_choice_ignis_trait_poisonous",
  "reno_choice_ignis_trait_lifesteal",
  "reno_choice_ignis_trait_windfury",
  "reno_choice_ignis_trait_adjacent",
  "reno_choice_ignis_trait_immune"
];

const IGNIS_SPECIAL_CARD_IDS = [
  "reno_choice_ignis_special_summon",
  "reno_choice_ignis_special_damage",
  "reno_choice_ignis_special_draw",
  "reno_choice_ignis_special_deathrattle",
  "reno_choice_ignis_special_armor"
];

export function createGame(roomCode: string, players: [GamePlayerInput, GamePlayerInput], cards: CardDefinition[], seed = Date.now()): GameState {
  const catalog = catalogFrom(cards);
  const firstSeat = randomStartingSeat(seed);
  const game: GameState = {
    id: randomUUID(),
    roomCode,
    phase: "mulligan",
    turn: 0,
    currentPlayer: firstSeat,
    seed,
    players: [
      createPlayerState(0, players[0], catalog),
      createPlayerState(1, players[1], catalog)
    ],
    logs: [],
    playedCards: []
  };
  applyStartOfGameRules(game, catalog);
  const openingQuestCounts = [
    putOpeningQuestsInHand(game, 0, catalog),
    putOpeningQuestsInHand(game, 1, catalog)
  ] as const;
  shuffle(game.players[0].deck, rng(seed + 11));
  shuffle(game.players[1].deck, rng(seed + 29));
  drawCards(game, firstSeat, Math.max(0, GAME_RULES.startingHand[0] - openingQuestCounts[firstSeat]), catalog, false);
  drawCards(game, other(firstSeat), Math.max(0, GAME_RULES.startingHand[1] - openingQuestCounts[other(firstSeat)]), catalog, false);
  game.players[other(firstSeat)].hand.push(createInstance("coin", other(firstSeat)));
  addLog(game, `${game.players[firstSeat].nickname} 随机获得先手，双方完成起手抽牌，等待换牌。`);
  return game;
}

export function applyGameAction(game: GameState, actorNickname: string, action: GameAction, cards: CardDefinition[]): GameState {
  if (game.phase === "finished") throw new Error("对局已经结束。");
  const catalog = catalogFrom(cards);
  const actorSeat = seatFor(game, actorNickname);
  for (const player of game.players) player.specials ??= [];

  if (action.type === "mulligan") {
    applyMulligan(game, actorSeat, action.cardInstanceIds, catalog);
    return game;
  }

  if (game.phase !== "playing") throw new Error("请先完成起手换牌。");
  if (game.pendingChoice) {
    if (action.type === "concede") {
      game.phase = "finished";
      game.winner = other(actorSeat);
      addLog(game, `${game.players[actorSeat].nickname} 投降。`);
      return game;
    }
    if (action.type === "cancel_choice") {
      cancelChoice(game, actorSeat, action.choiceId);
      return game;
    }
    if (action.type !== "choose") throw new Error("请先完成当前选择。");
    applyChoice(game, actorSeat, action.choiceId, action.optionInstanceId, action.target, catalog);
    checkGameOver(game);
    return game;
  }
  if (action.type === "choose" || action.type === "cancel_choice") throw new Error("当前没有待完成的选择。");
  if (actorSeat !== game.currentPlayer && action.type !== "concede") throw new Error("现在不是你的回合。");

  switch (action.type) {
    case "play_card":
      playCard(game, actorSeat, action.handInstanceId, action.target, catalog);
      break;
    case "trade_card":
      tradeCard(game, actorSeat, action.handInstanceId, catalog);
      break;
    case "forge_card":
      forgeCard(game, actorSeat, action.handInstanceId, catalog);
      break;
    case "use_location":
      useLocation(game, actorSeat, action.locationInstanceId, action.target, catalog);
      break;
    case "use_titan_ability":
      useTitanAbility(game, actorSeat, action.minionInstanceId, catalog);
      break;
    case "attack":
      attack(game, actorSeat, action.source, action.target, catalog);
      break;
    case "hero_power":
      heroPower(game, actorSeat, action.target, catalog);
      break;
    case "end_turn":
      endTurn(game, catalog);
      break;
    case "concede":
      game.phase = "finished";
      game.winner = other(actorSeat);
      addLog(game, `${game.players[actorSeat].nickname} 投降。`);
      break;
  }
  checkGameOver(game);
  return game;
}

export function toPublicGameState(game: GameState, viewerNickname: string): PublicGameState {
  const viewerSeat = seatFor(game, viewerNickname);
  const players = game.players.map((player) => ({
    ...player,
    board: player.board.map((minion) => ({
      ...minion,
      attack: minion.attack + player.board.filter((ally) => ally.instanceId !== minion.instanceId && !ally.silenced && ally.cardId === "companion_token_leokk").length
    })),
    specials: player.specials ?? [],
    animalCompanionReplacementPools: player.seat === viewerSeat ? player.animalCompanionReplacementPools : undefined,
    deck: undefined,
    deckCount: player.deck.length,
    sideboard: undefined,
    sideboardCount: player.sideboard?.length ?? 0,
    secrets: player.secrets.map((card) => (player.seat === viewerSeat ? card : { instanceId: card.instanceId, owner: card.owner, hidden: true })),
    hand: player.hand.map((card) => (player.seat === viewerSeat ? card : { instanceId: card.instanceId, owner: card.owner, hidden: true }))
  })) as unknown as PublicGameState["players"];
  const pendingChoice = game.pendingChoice
    ? {
      ...game.pendingChoice,
      options: game.pendingChoice.options.map((option) => game.pendingChoice?.seat === viewerSeat ? option : { instanceId: option.instanceId, owner: option.owner, hidden: true })
    }
    : undefined;
  const playedCards = (game.playedCards ?? []).map((entry) => publicPlayedCardEntry(entry, viewerSeat));
  return { ...game, pendingChoice, playedCards, viewerSeat, players };
}

function createPlayerState(seat: Seat, input: GamePlayerInput, catalog: Map<string, CardDefinition>): PlayerGameState {
  const deckCards = input.deck.cardIds.map((cardId) => getCard(catalog, cardId));
  const startingHealth = Math.max(GAME_RULES.heroHealth, ...deckCards.map((card) => card.deckRules?.startingHealth ?? 0));
  const hasBenedictus = deckCards.some((card) => hasRule(card, "priest_benedictus"));
  const hasBakuUpgrade = deckCards.some((card) => hasRule(card, "beast_baku")) && deckCards.every((card) => card.cost % 2 === 1);
  return {
    seat,
    nickname: input.nickname,
    class: input.class,
    hero: {
      health: startingHealth,
      maxHealth: startingHealth,
      armor: 0,
      temporaryAttack: 0,
      attacksThisTurn: 0,
      heroPowerUsed: false,
      heroPowerCardId: hasBenedictus ? "hero_power_mind_spike" : undefined,
      heroPowerCost: hasBakuUpgrade ? 1 : undefined
    },
    deck: input.deck.cardIds.map((cardId) => createInstance(cardId, seat, "starting_deck")),
    hand: [],
    secrets: [],
    sideboard: (input.deck.sideboardCardIds ?? []).map((cardId) => {
      if (!catalog.has(cardId)) throw new Error(`备牌包含未知卡牌：${cardId}`);
      return createInstance(cardId, seat, "sideboard");
    }),
    board: [],
    locations: [],
    specials: [],
    graveyard: [],
    maxMana: 0,
    manaCap: GAME_RULES.maxMana,
    mana: 0,
    fatigue: 0,
    mulliganDone: false,
    cardsPlayedThisTurn: 0,
    crystalCoreActive: false,
    spellsCastThisGame: 0,
    forgedThisGame: false
  };
}

function applyStartOfGameRules(game: GameState, catalog: Map<string, CardDefinition>): void {
  const hasEmeraldYsera = game.players.some((player) =>
    player.deck.some((instance) => hasRule(getCard(catalog, instance.cardId), "priest_ysera_emerald"))
  );
  if (hasEmeraldYsera) {
    for (const player of game.players) player.manaCap = GAME_RULES.maxMana + 5;
    addLog(game, "伊瑟拉，翡翠守护巨龙使双方玩家的法力水晶上限提高到 15。");
  }
}

function putOpeningQuestsInHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): number {
  const player = game.players[seat];
  const openingQuests = player.deck.filter((instance) => isOpeningQuest(instance, catalog));
  if (openingQuests.length === 0) return 0;
  const questIds = new Set(openingQuests.map((instance) => instance.instanceId));
  player.deck = player.deck.filter((instance) => !questIds.has(instance.instanceId));
  player.hand.push(...openingQuests);
  return openingQuests.length;
}

function isOpeningQuest(instance: CardInstance, catalog: Map<string, CardDefinition>): boolean {
  return hasRule(getCard(catalog, instance.cardId), "rogue_the_caverns_below");
}

function countCeaselessEvent(game: GameState, _reason: string): void {
  if (!game.ceaselessTrackingStarted) return;
  game.ceaselessEvents = (game.ceaselessEvents ?? 0) + 1;
}

function applyMulligan(game: GameState, seat: Seat, cardInstanceIds: string[], catalog: Map<string, CardDefinition>): void {
  if (game.phase !== "mulligan") throw new Error("当前不在换牌阶段。");
  const player = game.players[seat];
  if (player.mulliganDone) throw new Error("你已经完成换牌。");
  const selected = new Set(cardInstanceIds);
  const kept: CardInstance[] = [];
  const returned: CardInstance[] = [];
  for (const card of player.hand) {
    if (selected.has(card.instanceId) && card.cardId !== "coin" && !isOpeningQuest(card, catalog)) returned.push(card);
    else kept.push(card);
  }
  player.hand = kept;
  player.deck.push(...returned);
  shuffle(player.deck, rng(game.seed + game.turn + seat + returned.length + 101));
  drawCards(game, seat, returned.length, catalog, false);
  player.mulliganDone = true;
  addLog(game, `${player.nickname} 完成起手换牌。`);
  if (game.players.every((item) => item.mulliganDone)) {
    game.phase = "playing";
    startTurn(game, game.currentPlayer, catalog);
  }
}

function playCard(game: GameState, seat: Seat, handInstanceId: string, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const handIndex = player.hand.findIndex((card) => card.instanceId === handInstanceId);
  if (handIndex < 0) throw new Error("手牌不存在。");
  const instance = player.hand[handIndex];
  const card = getCard(catalog, instance.cardId);
  const cost = cardPlayCost(game, seat, instance, card, catalog);
  if (cost > player.mana) throw new Error("法力不足。");
  if (card.type !== "location" && cardNeedsTarget(card) && !target) throw new Error("这张牌需要选择目标。");

  const secretCard = isSecretCard(card);
  if ((card.type === "minion" || card.type === "location") && occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) throw new Error("战场已满。");
  if (secretCard && player.secrets.some((secret) => secret.cardId === card.id)) throw new Error("不能重复挂上同一个奥秘。");
  const consumedSpellDiscount = card.type === "spell" && player.nextSpellDiscount?.throughTurn === game.turn;
  player.comboActiveForCurrentCard = (player.cardsPlayedThisTurn ?? 0) > 0;
  player.mana -= cost;
  player.hand.splice(handIndex, 1);
  if (consumedSpellDiscount) delete player.nextSpellDiscount;
  game.ceaselessTrackingStarted = true;
  countCeaselessEvent(game, card.type === "spell" ? "法术被使用" : "卡牌被使用");
  addPlayedCardEntry(game, {
    seat,
    cardId: card.id,
    cardName: card.name,
    cardType: card.type,
    cardCost: cost,
    sourceInstanceId: instance.instanceId,
    kind: secretCard ? "secret_set" : "played",
    hidden: secretCard,
    revealed: !secretCard
  });
  if (card.type === "spell" && triggerOpponentSpellSecrets(game, seat, instance, card, catalog)) {
    recordCardPlayed(player);
    return;
  }
  if (card.type === "spell") {
    player.spellsCastThisGame = (player.spellsCastThisGame ?? 0) + 1;
    recordHunterSpellCast(player, card);
  }
  if (counterPlayedCard(game, seat, card, catalog)) {
    player.graveyard.push(card.id);
    recordCardPlayed(player);
    return;
  }
  if (secretCard) {
    player.secrets.push(instance);
    recordCardPlayed(player);
    addLog(game, `${player.nickname} 设下了一个奥秘。`);
    return;
  }

  if (card.type === "minion") {
    const minion = createBoardMinion(applyCrystalCoreToInstance(game, seat, instance, catalog), card, game.turn);
    applyBeastSummonState(game, seat, minion, card, catalog);
    player.board.push(minion);
    if (hasRule(card, "dragon_death_beetle") && player.maxMana >= 11) {
      applyStatEffect(minion, 4, 4);
      addKeyword(minion, "charge");
      minion.exhausted = false;
    }
    if (hasRule(card, "rogue_southsea_deckhand") && player.hero.weapon) {
      addKeyword(minion, "charge");
      minion.exhausted = false;
    }
    if (hunterNiriActive(game, seat, catalog) && card.cost === 1) {
      applyStatEffect(minion, minion.attack, minion.maxHealth);
      addLog(game, `${card.name} 被环形山的尼利翻倍了属性。`);
    }
    triggerColossalOnSummon(game, seat, card, catalog);
    addLog(game, `${player.nickname} 召唤了 ${card.name}。`);
    trackQuestMinionPlayed(game, seat, card, catalog);
    maybeSummonPatches(game, seat, card, catalog);
    const battlecryRepeats = !hasRule(card, "dragon_brann") && player.board.some((boardMinion) => !boardMinion.silenced && hasRule(getCard(catalog, boardMinion.cardId), "dragon_brann")) ? 2 : 1;
    for (let repeat = 0; repeat < battlecryRepeats; repeat += 1) {
      applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "battlecry" }, catalog);
      applyRuleBattlecry(game, seat, instance, card, target, catalog);
    }
    beginCardChoice(game, seat, card, catalog, minion.instanceId);
    updateFloopCopies(player, card, minion.instanceId);
    triggerSwampKingDred(game, seat, minion, catalog);
  } else if (card.type === "spell") {
    addLog(game, `${player.nickname} 使用了 ${card.name}。`);
    applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "play" }, catalog);
    applyRulePlay(game, seat, instance, card, target, catalog);
    if (hunterNiriActive(game, seat, catalog) && card.cost === 1 && !game.pendingChoice) {
      addLog(game, `环形山的尼利让 ${card.name} 再次施放。`);
      applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "play" }, catalog);
      applyRulePlay(game, seat, instance, card, target, catalog, true);
    }
    triggerBrollAfterSpell(game, seat, catalog, card.name);
    thawFrozenBeastsForFireSpell(game, seat, card, catalog);
    triggerBeastSpellburst(game, seat, catalog, card.name);
    beginCardChoice(game, seat, card, catalog);
    const remainingUses = instance.remainingUses ?? card.repeatableUses ?? 1;
    if (remainingUses > 1) player.hand.push({ ...instance, remainingUses: remainingUses - 1 });
    else player.graveyard.push(card.id);
  } else if (card.type === "weapon") {
    if (player.hero.weapon) destroyHeroWeapon(game, seat, catalog, card.name);
    player.hero.weapon = {
      cardId: card.id,
      attack: instance.ignisWeapon?.attack ?? card.attack ?? 0,
      durability: instance.ignisWeapon?.durability ?? card.durability ?? 1,
      keywords: instance.ignisWeapon?.keywords,
      ignisWeapon: instance.ignisWeapon
    };
    if (instance.ignisWeapon?.battlecryDamage) {
      if (!target) throw new Error("这把武器需要选择战吼伤害目标。");
      dealDamage(game, target, instance.ignisWeapon.battlecryDamage, seat, catalog, Boolean(instance.ignisWeapon.keywords?.includes("lifesteal")));
    }
    addLog(game, `${player.nickname} 装备了 ${card.name}。`);
    player.graveyard.push(card.id);
  } else if (card.type === "location") {
    player.locations.push(createBoardLocation(instance, card, game.turn));
    addLog(game, `${player.nickname} 放置了 ${card.name}。`);
  } else if (card.type === "hero") {
    addLog(game, `${player.nickname} 化身为 ${card.name}。`);
    applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "play" }, catalog);
    applyRulePlay(game, seat, instance, card, target, catalog);
    player.graveyard.push(card.id);
  }
  if (instance.drawnTurn === game.turn) {
    applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "quickdraw" }, catalog);
  }
  drawMoonlitOriginal(game, seat, instance, catalog);
  recordHunterOneCostCardPlayed(player, card);
  cleanupDeaths(game, catalog);
  recordCardPlayed(player);
}

function tradeCard(game: GameState, seat: Seat, handInstanceId: string, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const handIndex = player.hand.findIndex((card) => card.instanceId === handInstanceId);
  if (handIndex < 0) throw new Error("手牌不存在。");
  const instance = player.hand[handIndex];
  const card = getCard(catalog, instance.cardId);
  if (!isTradeable(card)) throw new Error("这张牌不能交易。");
  if (player.mana < 1) throw new Error("法力不足，无法交易。");
  player.mana -= 1;
  const [traded] = player.hand.splice(handIndex, 1);
  const deckCard = { ...traded, owner: seat };
  delete deckCard.drawnTurn;
  player.deck.push(deckCard);
  shuffle(player.deck, rng(game.seed + game.turn * 977 + seat * 173 + player.deck.length + game.logs.length));
  drawCards(game, seat, 1, catalog, true);
  addLog(game, `${game.players[seat].nickname} 交易了 ${card.name}。`);
}

function forgeCard(game: GameState, seat: Seat, handInstanceId: string, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const instance = player.hand.find((card) => card.instanceId === handInstanceId);
  if (!instance) throw new Error("找不到要锻造的手牌。");
  const card = getCard(catalog, instance.cardId);
  if (!card.forgeable) throw new Error("这张牌不能锻造。");
  if (instance.forged) throw new Error("这张牌已经锻造过。");
  if (player.mana < 2) throw new Error("法力不足，无法锻造。");
  player.mana -= 2;
  instance.forged = true;
  player.forgedThisGame = true;
  addPlayedCardEntry(game, {
    seat,
    cardId: card.id,
    cardName: card.name,
    cardType: card.type,
    cardCost: card.cost,
    sourceInstanceId: instance.instanceId,
    kind: "forged",
    revealed: true
  });
  addLog(game, `${player.nickname} 锻造了 ${card.name}。`);
}

function useLocation(game: GameState, seat: Seat, locationInstanceId: string, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const locationIndex = player.locations.findIndex((location) => location.instanceId === locationInstanceId);
  if (locationIndex < 0) throw new Error("找不到这个地标。");
  const location = player.locations[locationIndex];
  const card = getCard(catalog, location.cardId);
  if (card.type !== "location") throw new Error("这不是地标。");
  if (location.readyTurn > game.turn) throw new Error("这个地标还不能使用。");
  if (cardNeedsTarget(card) && !target) throw new Error("这个地标需要选择目标。");
  addPlayedCardEntry(game, {
    seat,
    cardId: card.id,
    cardName: card.name,
    cardType: card.type,
    cardCost: card.cost,
    sourceInstanceId: location.instanceId,
    kind: "location_used",
    revealed: true
  });
  addLog(game, `${player.nickname} 使用了地标 ${card.name}。`);
  applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "location" }, catalog);
  applyRuleLocation(game, seat, card, target, catalog);
  location.durability -= 1;
  location.readyTurn = game.turn + 4;
  if (location.durability <= 0) {
    player.locations.splice(locationIndex, 1);
    player.graveyard.push(card.id);
  }
  cleanupDeaths(game, catalog);
}

function useTitanAbility(game: GameState, seat: Seat, minionInstanceId: string, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const minion = player.board.find((item) => item.instanceId === minionInstanceId);
  if (!minion) throw new Error("娉板潶闅忎粠涓嶅湪鎴樺満銆?");
  if (minion.silenced) throw new Error("娉板潶宸茶娌夐粯銆?");
  if ((minion.frozenUntilTurn ?? -1) >= game.turn) throw new Error("娉板潶琚喕缁擄紝涓嶈兘浣跨敤鎶€鑳姐€?");
  if (minion.titanAbilityUsedTurn === game.turn) throw new Error("杩欎釜娉板潶鏈洖鍚堝凡缁忎娇鐢ㄨ繃鎶€鑳姐€?");
  const card = getCard(catalog, minion.cardId);
  const remaining = remainingTitanAbilityIds(minion, card);
  if (remaining.length === 0) throw new Error("杩欎釜娉板潶宸茬粡娌℃湁鍙敤鎶€鑳姐€?");
  const options = remaining.map((cardId) => createInstance(cardId, seat));
  beginChoice(game, seat, "titan_ability", `閫夋嫨 ${card.name} 鐨勬 泰坦技能。`, options, undefined, minion.instanceId);
}

function applyRuleBattlecry(game: GameState, seat: Seat, instance: CardInstance, card: CardDefinition, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const enemy = game.players[other(seat)];
  if (hasRule(card, "etc_band_manager")) {
    const options = player.sideboard ?? [];
    if (options.length === 0) addLog(game, `${card.name} 的乐队已经没有可选备牌。`);
    else beginChoice(game, seat, "etc_band", "从 E.T.C. 的乐队中选择一张牌加入手牌。", options);
  }
  if (hasRule(card, "theotar")) {
    if (player.hand.length === 0 || enemy.hand.length === 0) {
      addLog(game, `${card.name} 没有交换牌的目标。`);
    } else {
      beginChoice(game, seat, "theotar_friendly", "先从三张你的手牌中选择一张交给对手。", discoverHandOptions(game, seat, player.hand, "theotar_friendly"));
    }
  }
  if (hasRule(card, "rustrot_viper")) {
    const weapon = enemy.hero.weapon;
    if (!weapon) addLog(game, `${card.name} 没有找到可摧毁的敌方武器。`);
    else {
      destroyHeroWeapon(game, other(seat), catalog, card.name);
      addLog(game, `${card.name} 摧毁了 ${enemy.nickname} 的武器。`);
    }
  }
  if (hasRule(card, "steamcleaner")) {
    for (const target of game.players) {
      const kept = target.deck.filter((instance) => instance.origin === "starting_deck");
      const removed = target.deck.filter((instance) => instance.origin !== "starting_deck");
      target.deck = kept;
      target.graveyard.push(...removed.map((instance) => instance.cardId));
      if (removed.length > 0) addLog(game, `${card.name} 从 ${target.nickname} 的牌库清除了 ${removed.length} 张非起始牌。`);
    }
  }
  if (hasRule(card, "dirty_rat")) pullRandomEnemyMinion(game, seat, catalog, card.name);
  if (hasRule(card, "reno_jackson")) {
    if (hasDuplicateCardIds(player.deck)) addLog(game, `${card.name} 检查后发现牌库仍有重复牌。`);
    else heal(game, { type: "hero", seat }, player.hero.maxHealth, catalog);
  }
  if (hasRule(card, "priest_finley")) swapHandWithDeckBottom(game, seat, catalog, card.name);
  if (hasRule(card, "priest_zephrys")) addHighlanderAnswer(game, seat, catalog, card.name);
  if (hasRule(card, "priest_kaldorei_spirit")) buffKaldoreiSpirit(game, seat, card, catalog);
  if (hasRule(card, "priest_illucia")) swapHands(game, seat, catalog, card.name);
  if (hasRule(card, "priest_mixologist")) addCardToHand(game, seat, createInstance("reno_token_mixture", seat), catalog, "获得了一份定制药水。");
  if (hasRule(card, "priest_raza")) discountPriestHeroPower(game, seat, catalog, card.name);
  if (hasRule(card, "priest_magatha")) drawMagathaCards(game, seat, catalog, card.name);
  if (hasRule(card, "priest_psychic_conjurer")) copyRandomDeckCard(game, seat, catalog, card.name);
  if (hasRule(card, "priest_serena")) stealSerenaStats(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_cult_neophyte")) taxNextSpells(game, other(seat), 1, card.name);
  if (hasRule(card, "priest_lazul")) discoverEnemyHandCopy(game, seat, card.name);
  if (hasRule(card, "priest_harvester")) copyRandomHandCard(game, seat, catalog, card.name);
  if (hasRule(card, "priest_holmes")) copyRandomCards(game, seat, game.players[other(seat)].deck, 2, catalog, `${card.name} 复制了线索牌`);
  if (hasRule(card, "priest_banker")) benevolentBanker(game, seat, instance, catalog, card.name);
  if (hasRule(card, "priest_cozy_voljin")) beginVoljinSwap(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_zola")) zolaCopy(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_nameless_one")) namelessOne(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_najark")) borrowEnemyMinion(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_glowstone_gyreworm")) glowstoneGyreworm(game, seat, instance, target, catalog, card.name);
  if (hasRule(card, "priest_mind_control_tech")) mindControlTech(game, seat, catalog, card.name);
  if (hasRule(card, "priest_zilliax_twin_perfect")) twinPerfectZilliax(game, seat, instance.instanceId, catalog, card.name);
  if (hasRule(card, "priest_ignis")) ignisWeapon(game, seat, catalog, card.name);
  if (hasRule(card, "priest_elise_badlands")) eliseBadlands(game, seat, catalog, card.name);
  if (hasRule(card, "priest_marin_manager")) marinManager(game, seat, catalog, card.name);
  if (card.id === "reno_token_marin_kobold") marinGoldenKobold(game, seat, catalog, card.name);
  if (hasRule(card, "priest_loatheb")) taxNextSpells(game, other(seat), 5, card.name);
  if (hasRule(card, "priest_spawn_of_shadows")) damageBothHeroes(game, seat, 4, catalog);
  if (hasRule(card, "priest_aviana")) beginAvianaCountdown(game, seat, card.name);
  if (hasRule(card, "priest_ceaseless_expanse")) ceaselessExpanseBattlecry(game, seat, instance.instanceId, catalog, card.name);
  if (hasRule(card, "priest_ysera_emerald")) gainFullManaCrystals(game, seat, 3, card.name);
  if (hasRule(card, "priest_fizzle")) photographerFizzle(game, seat, catalog, card.name);
  if (hasRule(card, "priest_kiljaeden")) kiljaedenPortal(game, seat, catalog, card.name);
  if (hasRule(card, "dragon_astalor")) astalorBloodsworn(game, seat, catalog);
  if (hasRule(card, "dragon_astalor_protector")) astalorProtector(game, seat, catalog);
  if (hasRule(card, "dragon_astalor_flamebringer")) dealRandomEnemyDamage(game, seat, player.maxMana >= 10 ? 14 : 7, catalog, card.name);
  if (hasRule(card, "dragon_splish_splash_whelp") && hasDragonInHand(player, catalog)) gainEmptyMana(game, seat, 1, card.name);
  if (hasRule(card, "dragon_starfish")) silenceOtherMinions(game, seat, card.id, catalog);
  if (hasRule(card, "dragon_gem_tosser") && player.mana === 0) dealRandomEnemyDamage(game, seat, player.maxMana, catalog, card.name);
  if (hasRule(card, "dragon_timeline_accelerator")) drawRaceFromDeck(game, seat, "MECHANICAL", catalog, card.name, -2);
  if (hasRule(card, "dragon_desert_nestmatron") && hasDragonInHand(player, catalog)) refreshMana(game, seat, 4, card.name);
  if (hasRule(card, "dragon_prickly_drake")) pricklyDrake(game, seat, target, catalog, card.name);
  if (hasRule(card, "dragon_twilight_guardian")) twilightGuardian(game, seat, card.id, catalog, card.name);
  if (hasRule(card, "dragon_twilight_drake")) twilightDrake(game, seat, card.id, catalog, card.name);
  if (hasRule(card, "dragon_onyxian_warder")) onyxianWarder(game, seat, catalog, card.name);
  if (hasRule(card, "dragon_emerald_explorer")) discoverDragon(game, seat, catalog, card.name, 0);
  if (hasRule(card, "dragon_dragon_golem")) dragonGolem(game, seat, card.id, catalog, card.name);
  if (hasRule(card, "dragon_primordial_drake")) primordialDrake(game, seat, card.id, catalog, card.name);
  if (hasRule(card, "dragon_alexstrasza_lifebinder")) alexstraszaLifebinder(game, seat, target, catalog, card.name);
  if (hasRule(card, "dragon_deathwing")) deathwingBattlecry(game, seat, card.id, catalog, card.name);
  if (hasRule(card, "dragon_raid_boss_onyxia")) summonOnyxianWhelps(game, seat, 6, catalog, card.name);
  if (hasRule(card, "dragon_elise")) createEliseLandmark(game, seat, catalog, card.name);
  if (hasRule(card, "dragon_curator")) {
    drawRaceFromDeck(game, seat, "BEAST", catalog, card.name);
    drawRaceFromDeck(game, seat, "DRAGON", catalog, card.name);
    drawRaceFromDeck(game, seat, "MURLOC", catalog, card.name);
  }
  if (hasRule(card, "dragon_doomkin")) stealEmptyMana(game, seat, card.name);
  if (hasRule(card, "dragon_rheastrasza")) summonPureNest(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_mad_alchemist")) madAlchemist(game, target, catalog, card.name);
  if (hasRule(card, "hunter_raptor_nest_caretaker")) raptorNestCaretakerBattlecry(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_ranger_aurelia")) rangerAurelia(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_ranger_vereesa")) rangerVereesa(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_ranger_sylvanas")) rangerSylvanas(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_taya_runetotem")) tayaRunetotem(game, seat, card.name);
  if (hasRule(card, "hunter_migrating_elekk")) upgradeAnimalCompanions(game, seat, 1, card.name, catalog);
  if (hasRule(card, "hunter_archbishop_nelle")) archbishopNelle(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_glacial_shard")) freezeTarget(game, target, catalog, card.name);
  if (hasRule(card, "beast_generic_battlecry")) beastGenericBattlecry(game, seat, instance.instanceId, card, target, catalog);
  if (hasRule(card, "beast_kindred_attack")) beastKindredAttack(game, seat, instance.instanceId, target, catalog, card.name);
  if (hasRule(card, "rogue_fire_fly")) addCardToHand(game, seat, createInstance("quest_rogue_flame_elemental", seat), catalog, `获得了 ${getCard(catalog, "quest_rogue_flame_elemental").name}。`);
  if (hasRule(card, "rogue_swashburglar_huckster")) addRandomOpponentClassCard(game, seat, catalog, card.name);
  if (hasRule(card, "rogue_youthful_brewmaster")) returnFriendlyMinionToHand(game, seat, target, catalog, card.name, 0);
  if (hasRule(card, "rogue_gadgetzan_ferryman")) {
    if (player.comboActiveForCurrentCard) returnFriendlyMinionToHand(game, seat, target, catalog, card.name, 0);
    else addLog(game, `${card.name} 没有触发连击。`);
  }
  if (hasRule(card, "mage_alexstrasza")) alexstraszaClassic(game, target, catalog, card.name);
}

function applyRulePlay(game: GameState, seat: Seat, instance: CardInstance, card: CardDefinition, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, _replayed = false): void {
  const player = game.players[seat];
  if (hasRule(card, "priest_raise_dead")) raiseDead(game, seat, catalog);
  if (hasRule(card, "priest_mend")) mend(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_power_word_barrier")) powerWordBarrier(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_creation_protocol")) creationProtocol(game, seat, instance, catalog, card.name);
  if (hasRule(card, "priest_identity_theft")) identityTheft(game, seat, catalog);
  if (hasRule(card, "priest_thoughtsteal")) copyRandomCards(game, seat, game.players[other(seat)].deck, 2, catalog, `${card.name} 窃取了对手牌库`);
  if (hasRule(card, "priest_shadow_word_death")) shadowWordDeath(game, target, catalog, card.name);
  if (hasRule(card, "priest_power_chord_synchronize")) powerChordSynchronize(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_twilight_torrent")) twilightTorrent(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_hysteria")) hysteria(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_shadow_word_ruin")) shadowWordRuin(game, catalog, card.name);
  if (hasRule(card, "priest_repackage")) repackageMinions(game, seat, catalog, card.name);
  if (hasRule(card, "priest_repackaged_box")) openRepackagedBox(game, seat, instance, catalog, card.name);
  if (hasRule(card, "priest_dragonfire_potion")) dragonfirePotion(game, seat, catalog, card.name);
  if (hasRule(card, "priest_harmonic_pop")) harmonicPop(game, seat, 3, "reno_token_harmonic_popstar", catalog, card.name);
  if (hasRule(card, "priest_dissonant_pop")) harmonicPop(game, seat, 6, "reno_token_dissonant_popstar", catalog, card.name);
  if (hasRule(card, "priest_lightbomb")) lightbomb(game, seat, catalog, card.name);
  if (hasRule(card, "priest_fizzle_snapshot")) fizzleSnapshot(game, seat, instance, catalog, card.name);
  if (card.id === "reno_token_marin_wand") marinWand(game, seat, catalog, card.name);
  if (card.id === "reno_token_marin_crown") marinCrown(game, seat, catalog, card.name);
  if (card.id === "reno_token_marin_goblet") marinGoblet(game, seat, catalog, card.name);
  if (hasRule(card, "priest_lone_ranger_reno")) {
    clearEnemyBoard(game, seat, catalog, card.name);
    equipRenoBullet(game, seat, catalog);
  }
  if (hasRule(card, "priest_shadowreaper")) becomeShadowreaper(game, seat, catalog, card.name);
  if (hasRule(card, "dragon_aquatic_form")) aquaticForm(game, seat);
  if (hasRule(card, "dragon_wave_shaper")) waveShaper(game, seat);
  if (hasRule(card, "dragon_breath_of_dreams") && hasDragonInHand(player, catalog)) gainEmptyMana(game, seat, 1, card.name);
  if (hasRule(card, "dragon_moonlit_guidance")) moonlitGuidance(game, seat);
  if (hasRule(card, "dragon_new_heights")) newHeights(game, seat, card.name);
  if (hasRule(card, "dragon_poison_seeds")) poisonSeeds(game, catalog);
  if (hasRule(card, "dragon_psychmelon")) psychmelon(game, seat, catalog, card.name);
  if (hasRule(card, "dragon_overgrowth")) gainEmptyMana(game, seat, 2, card.name);
  if (hasRule(card, "dragon_broken_mirror")) brokenMirror(game, seat, target, catalog, card.name);
  if (hasRule(card, "dragon_guff")) becomeGuff(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_tracking")) hunterTracking(game, seat);
  if (hasRule(card, "hunter_animal_companion")) summonAnimalCompanionCard(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_wound_prey")) woundPrey(game, seat, target, catalog, card.name);
  if (hasRule(card, "hunter_sands_of_time")) discoverSpell(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_face_the_tolvir")) faceTheTolvir(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_tame_beast")) upgradeAnimalCompanions(game, seat, 1, card.name, catalog);
  if (hasRule(card, "hunter_free_roam")) upgradeAnimalCompanions(game, seat, 2, card.name, catalog);
  if (hasRule(card, "hunter_call_of_the_wild")) callOfTheWild(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_beaststalker_tavish")) beaststalkerTavish(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_heart_of_stranglethorn")) heartOfStranglethorn(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_zuljin")) zuljinBattlecry(game, seat, catalog, card.name);
  if (hasRule(card, "hunter_deafening_roar")) deafeningRoar(game, seat, target, catalog, card.name);
  if (hasRule(card, "mage_ice_lance")) iceLance(game, seat, target, catalog, card);
  if (hasRule(card, "mage_arcane_missiles")) arcaneMissiles(game, seat, card, catalog);
  if (hasRule(card, "mage_frostbolt")) freezeTarget(game, target, catalog, card.name);
  if (hasRule(card, "mage_frost_nova")) freezeEnemyMinions(game, seat, catalog, card.name);
  if (hasRule(card, "mage_polymorph")) polymorph(game, target, catalog, card.name);
  if (hasRule(card, "mage_blizzard")) blizzard(game, seat, card, catalog);
  if (hasRule(card, "rogue_preparation")) prepareNextSpell(game, seat, card.name);
  if (hasRule(card, "rogue_shadowstep")) returnFriendlyMinionToHand(game, seat, target, catalog, card.name, -2);
  if (hasRule(card, "rogue_backstab")) backstab(game, seat, target, catalog, card.name);
  if (hasRule(card, "rogue_the_caverns_below")) activateQuestRogue(game, seat, card);
  if (hasRule(card, "rogue_eviscerate")) eviscerate(game, seat, target, catalog, card.name);
  if (hasRule(card, "rogue_mimic_pod")) mimicPod(game, seat, catalog, card.name);
  if (hasRule(card, "rogue_crystal_core")) activateCrystalCore(game, seat, catalog, card.name);
}

function applyRuleLocation(game: GameState, seat: Seat, card: CardDefinition, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  if (hasRule(card, "priest_puppet_theatre")) puppetTheatre(game, seat, target, catalog, card.name);
}

function beginCardChoice(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>, sourceInstanceId?: string): void {
  if (titanAbilityIds(card).length > 0) return;
  if (!card.choiceOptionCardIds?.length) return;
  const replacementCost = game.players[seat].animalCompanionReplacementCost;
  const animalCompanionPoolChoice = replacementCost && isAnimalCompanionChoiceCard(card);
  const optionIds = animalCompanionPoolChoice
    ? ensureAnimalCompanionReplacementPool(game, seat, catalog, replacementCost, card.name)
    : card.choiceOptionCardIds;
  if (!optionIds.length) return;
  const options = optionIds.map((cardId) => {
    getCard(catalog, cardId);
    return createInstance(cardId, seat);
  });
  beginChoice(game, seat, animalCompanionPoolChoice ? "animal_companion_pool" : "card_choice", `选择 ${card.name} 的抉择效果。`, options, undefined, sourceInstanceId);
}

function applyChoice(game: GameState, seat: Seat, choiceId: string, optionInstanceId: string, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const choice = game.pendingChoice;
  if (!choice || choice.id !== choiceId) throw new Error("选择已过期。");
  if (choice.seat !== seat) throw new Error("现在不是你的选择。");
  const option = choice.options.find((item) => item.instanceId === optionInstanceId);
  if (!option) throw new Error("选择项不存在。");

  if (choice.kind === "dragon_aquatic_form") {
    chooseAquaticFormCard(game, seat, option, catalog);
    delete game.pendingChoice;
    return;
  }

  if (choice.kind === "dragon_wave_shaper") {
    chooseWaveShaperCard(game, seat, option, choice.options, catalog);
    delete game.pendingChoice;
    return;
  }

  if (choice.kind === "dragon_moonlit_guidance") {
    chooseMoonlitCard(game, seat, option, catalog);
    delete game.pendingChoice;
    return;
  }

  if (choice.kind === "voljin_second_minion") {
    resolveVoljinSwap(game, seat, choice.chosenFriendlyInstanceId, option.instanceId, catalog);
    delete game.pendingChoice;
    return;
  }

  if (choice.kind === "amanthul_second_enemy") {
    resolveAmanthulSecondExile(game, seat, choice.chosenFriendlyInstanceId, option.instanceId, choice.sourceInstanceId, catalog);
    delete game.pendingChoice;
    cleanupDeaths(game, catalog);
    return;
  }

  if (choice.kind === "kiljaeden_demon") {
    chooseKiljaedenDemon(game, seat, option, catalog);
    const continues = choice.continuesStartTurn;
    delete game.pendingChoice;
    if (continues) advanceStartTurnQueue(game, catalog);
    return;
  }

  if (choice.kind === "ignis_base") {
    chooseIgnisBase(game, seat, option.cardId, catalog);
    return;
  }

  if (choice.kind === "ignis_trait") {
    chooseIgnisTrait(game, seat, option.cardId, choice.ignisWeapon, catalog);
    return;
  }

  if (choice.kind === "ignis_special") {
    chooseIgnisSpecial(game, seat, option.cardId, choice.ignisWeapon, catalog);
    delete game.pendingChoice;
    return;
  }

  if (choice.kind === "animal_companion_pool") {
    summonChosenAnimalCompanion(game, seat, option.cardId, catalog, getCard(catalog, option.cardId).name);
    addLog(game, `${game.players[seat].nickname} 选择了 ${getCard(catalog, option.cardId).name}。`);
    delete game.pendingChoice;
    cleanupDeaths(game, catalog);
    return;
  }

  if (choice.kind === "etc_band") {
    const player = game.players[seat];
    const sideboardIndex = (player.sideboard ?? []).findIndex((item) => item.instanceId === option.instanceId);
    if (sideboardIndex < 0) throw new Error("这张备牌已经不可选。");
    const [picked] = player.sideboard.splice(sideboardIndex, 1);
    addCardToHand(game, seat, { ...picked, owner: seat }, catalog, `${getCard(catalog, picked.cardId).name} 从乐队加入了手牌。`);
    delete game.pendingChoice;
    return;
  }

  if (choice.kind === "card_choice" || choice.kind === "titan_ability") {
    const optionCard = getCard(catalog, option.cardId);
    if (cardNeedsTarget(optionCard) && !target) throw new Error("这个抉择效果需要选择目标。");
    if (choice.kind === "titan_ability" && hasRule(optionCard, "priest_amanthul_exile")) {
      beginAmanthulSecondExile(game, seat, choice.sourceInstanceId, target, catalog, optionCard.name);
      return;
    }
    applyEffects(game, { sourceCard: optionCard, sourceOwner: seat, selectedTarget: target, trigger: "play" }, catalog);
    applyRuleChoice(game, seat, optionCard, choice.sourceInstanceId, target, catalog);
    if (choice.kind === "titan_ability") markTitanAbilityUsed(game, seat, choice.sourceInstanceId, optionCard.id, catalog);
    addLog(game, `${game.players[seat].nickname} 选择了 ${optionCard.name}。`);
    delete game.pendingChoice;
    cleanupDeaths(game, catalog);
    return;
  }

  if (choice.kind === "theotar_friendly") {
    const enemySeat = other(seat);
    beginChoice(game, seat, "theotar_enemy", "再从三张对手手牌中选择一张换来。", discoverHandOptions(game, seat, game.players[enemySeat].hand, "theotar_enemy"), option.instanceId);
    return;
  }

  if (choice.kind === "copy_enemy_hand") {
    const enemyCard = game.players[other(seat)].hand.find((item) => item.instanceId === option.instanceId);
    if (!enemyCard) throw new Error("这张敌方手牌已经不可复制。");
    addCardToHand(game, seat, createInstance(enemyCard.cardId, seat), catalog, `复制了 ${getCard(catalog, enemyCard.cardId).name}。`);
    delete game.pendingChoice;
    return;
  }

  if (choice.kind === "discover_to_hand") {
    const copies = choice.copiesToAdd ?? 1;
    for (let count = 0; count < copies; count += 1) {
      const copy = count === 0 ? { ...option, owner: seat } : cloneGeneratedChoiceOption(option, seat);
      addCardToHand(game, seat, copy, catalog, `选择了 ${getCard(catalog, option.cardId).name}。`);
    }
    const continues = choice.continuesStartTurn;
    delete game.pendingChoice;
    if (continues) advanceStartTurnQueue(game, catalog);
    return;
  }

  const friendlyId = choice.chosenFriendlyInstanceId;
  if (!friendlyId) throw new Error("缺少要交换的己方手牌。");
  const friendlyIndex = game.players[seat].hand.findIndex((item) => item.instanceId === friendlyId);
  const enemySeat = other(seat);
  const enemyIndex = game.players[enemySeat].hand.findIndex((item) => item.instanceId === option.instanceId);
  if (friendlyIndex < 0 || enemyIndex < 0) throw new Error("交换目标已经离开手牌。");
  const friendly = game.players[seat].hand[friendlyIndex];
  const enemy = game.players[enemySeat].hand[enemyIndex];
  game.players[seat].hand[friendlyIndex] = { ...enemy, owner: seat };
  game.players[enemySeat].hand[enemyIndex] = { ...friendly, owner: enemySeat };
  addLog(game, `${game.players[seat].nickname} 与 ${game.players[enemySeat].nickname} 交换了各一张手牌。`);
  delete game.pendingChoice;
}

function beginChoice(game: GameState, seat: Seat, kind: NonNullable<GameState["pendingChoice"]>["kind"], prompt: string, options: CardInstance[], chosenFriendlyInstanceId?: string, sourceInstanceId?: string, copiesToAdd?: number, ignisWeapon?: IgnisWeaponData, continuesStartTurn?: boolean): void {
  game.pendingChoice = {
    id: randomUUID(),
    seat,
    kind,
    prompt,
    options: [...options],
    chosenFriendlyInstanceId,
    sourceInstanceId,
    copiesToAdd,
    ignisWeapon,
    continuesStartTurn
  };
}

function cancelChoice(game: GameState, seat: Seat, choiceId: string): void {
  const choice = game.pendingChoice;
  if (!choice || choice.id !== choiceId || choice.seat !== seat) throw new Error("当前选择已经失效。");
  if (choice.kind !== "titan_ability") throw new Error("这个选择不能取消。");
  delete game.pendingChoice;
  addLog(game, `${game.players[seat].nickname} 取消了泰坦技能选择。`);
}

function discoverHandOptions(game: GameState, seat: Seat, hand: CardInstance[], salt: string): CardInstance[] {
  const random = rng(game.seed + game.turn * 257 + seat * 41 + hand.length * 13 + salt.length);
  const pool = [...hand];
  const options: CardInstance[] = [];
  while (pool.length > 0 && options.length < 3) {
    const index = Math.floor(random() * pool.length);
    const [picked] = pool.splice(index, 1);
    options.push(picked);
  }
  return options;
}

function addCardToHand(game: GameState, seat: Seat, instance: CardInstance, catalog: Map<string, CardDefinition>, message: string): void {
  const player = game.players[seat];
  applyCrystalCoreToInstance(game, seat, instance, catalog);
  if (player.hand.length >= GAME_RULES.maxHandSize) {
    player.graveyard.push(instance.cardId);
    countCeaselessEvent(game, "卡牌被摧毁");
    addLog(game, `${getCard(catalog, instance.cardId).name} 因手牌已满被弃置。`);
    return;
  }
  player.hand.push(instance);
  addLog(game, `${player.nickname} ${message}`);
}

function recordCardPlayed(player: PlayerGameState): void {
  player.cardsPlayedThisTurn = (player.cardsPlayedThisTurn ?? 0) + 1;
  delete player.comboActiveForCurrentCard;
}

function updateFloopCopies(player: PlayerGameState, playedCard: CardDefinition, playedInstanceId: string): void {
  if (playedCard.type !== "minion" || hasRule(playedCard, "dragon_floop")) return;
  for (const instance of player.hand) {
    if (instance.cardId !== "dragon_floop" && !instance.isFloopCopy) continue;
    if (instance.instanceId === playedInstanceId) continue;
    instance.cardId = playedCard.id;
    instance.attackOverride = 3;
    instance.healthOverride = 4;
    instance.isFloopCopy = true;
  }
}

function drawMoonlitOriginal(game: GameState, seat: Seat, instance: CardInstance, catalog: Map<string, CardDefinition>): void {
  if (!instance.moonlitOriginalInstanceId || instance.moonlitDrawTurn !== game.turn) return;
  const player = game.players[seat];
  const index = player.deck.findIndex((deckCard) => deckCard.instanceId === instance.moonlitOriginalInstanceId);
  if (index < 0) return;
  const [original] = player.deck.splice(index, 1);
  addCardToHand(game, seat, { ...original, drawnTurn: game.turn }, catalog, `抽取了 ${getCard(catalog, original.cardId).name} 的本体。`);
}

function chooseFromDeck(game: GameState, seat: Seat, kind: "dragon_aquatic_form" | "dragon_wave_shaper" | "dragon_moonlit_guidance", options: CardInstance[], prompt: string): void {
  if (options.length === 0) {
    addLog(game, `${game.players[seat].nickname} 的牌库没有可选择的牌。`);
    return;
  }
  beginChoice(game, seat, kind, prompt, options);
}

function aquaticForm(game: GameState, seat: Seat): void {
  chooseFromDeck(game, seat, "dragon_aquatic_form", game.players[seat].deck.slice(-3), "从牌库底选择一张牌进行探底。");
}

function chooseAquaticFormCard(game: GameState, seat: Seat, option: CardInstance, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const index = player.deck.findIndex((instance) => instance.instanceId === option.instanceId);
  if (index < 0) return;
  const [chosen] = player.deck.splice(index, 1);
  const cost = cardPlayCost(game, seat, chosen, getCard(catalog, chosen.cardId), catalog);
  if (cost <= player.mana) addCardToHand(game, seat, { ...chosen, drawnTurn: game.turn }, catalog, `用水栖形态抽取了 ${getCard(catalog, chosen.cardId).name}。`);
  else {
    player.deck.unshift(chosen);
    addLog(game, `${getCard(catalog, chosen.cardId).name} 被水栖形态置于牌库顶。`);
  }
}

function waveShaper(game: GameState, seat: Seat): void {
  chooseFromDeck(game, seat, "dragon_wave_shaper", discoverDeckOptions(game, seat, 3), "从牌库中发现一张牌，其余选项置于牌库底。");
}

function chooseWaveShaperCard(game: GameState, seat: Seat, option: CardInstance, options: CardInstance[], catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const optionIds = new Set(options.map((item) => item.instanceId));
  const removed = player.deck.filter((instance) => optionIds.has(instance.instanceId));
  player.deck = player.deck.filter((instance) => !optionIds.has(instance.instanceId));
  const chosen = removed.find((instance) => instance.instanceId === option.instanceId);
  if (chosen) addCardToHand(game, seat, { ...chosen, drawnTurn: game.turn }, catalog, `用波涛形塑发现了 ${getCard(catalog, chosen.cardId).name}。`);
  player.deck.push(...removed.filter((instance) => instance.instanceId !== option.instanceId));
}

function moonlitGuidance(game: GameState, seat: Seat): void {
  chooseFromDeck(game, seat, "dragon_moonlit_guidance", discoverDeckOptions(game, seat, 3), "发现牌库中一张牌的复制。");
}

function chooseMoonlitCard(game: GameState, seat: Seat, option: CardInstance, catalog: Map<string, CardDefinition>): void {
  const copy = {
    ...createInstance(option.cardId, seat),
    moonlitOriginalInstanceId: option.instanceId,
    moonlitDrawTurn: game.turn
  };
  addCardToHand(game, seat, copy, catalog, `用月光指引复制了 ${getCard(catalog, option.cardId).name}。`);
}

function discoverDeckOptions(game: GameState, seat: Seat, amount: number): CardInstance[] {
  const pool = [...game.players[seat].deck];
  const random = rng(game.seed + game.turn * 409 + seat * 79 + pool.length);
  const picks: CardInstance[] = [];
  while (pool.length > 0 && picks.length < amount) {
    const [picked] = pool.splice(Math.floor(random() * pool.length), 1);
    picks.push(picked);
  }
  return picks;
}

function hasDragonInHand(player: PlayerGameState, catalog: Map<string, CardDefinition>): boolean {
  return player.hand.some((instance) => hasRace(getCard(catalog, instance.cardId), "DRAGON"));
}

function hasRace(card: CardDefinition, race: string): boolean {
  return Boolean(card.races?.includes(race));
}

function recordHunterOneCostCardPlayed(player: PlayerGameState, card: CardDefinition): void {
  if (card.cost !== 1 || (card.class !== "hunter" && card.class !== "neutral")) return;
  player.hunterOneCostCardsPlayed = [...(player.hunterOneCostCardsPlayed ?? []), card.id];
}

function recordHunterSpellCast(player: PlayerGameState, card: CardDefinition): void {
  if (card.type !== "spell" || (card.class !== "hunter" && card.class !== "neutral")) return;
  player.hunterSpellsCastThisGame = [...(player.hunterSpellsCastThisGame ?? []), card.id];
}

function hunterNiriActive(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): boolean {
  return game.players[seat].board.some((minion) =>
    !minion.silenced && hasRule(getCard(catalog, minion.cardId), "hunter_niri_of_ungoro")
  );
}

function triggerBrollAfterSpell(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, spellName: string): void {
  const brolls = game.players[seat].board.filter((minion) =>
    !minion.silenced && hasRule(getCard(catalog, minion.cardId), "hunter_broll_bearmantle")
  );
  for (const _broll of brolls) summonAnimalCompanionCard(game, seat, catalog, `${getCard(catalog, "companion_hunter_broll").name}响应${spellName}`);
}

function hunterTracking(game: GameState, seat: Seat): void {
  chooseFromDeck(game, seat, "dragon_wave_shaper", discoverDeckOptions(game, seat, 3), "用追踪术从牌库中发现一张牌。");
}

function animalCompanionTokenIds(): string[] {
  return ["companion_token_misha", "companion_token_leokk", "companion_token_huffer"];
}

function animalCompanionChoiceIds(): string[] {
  return ["companion_choice_misha", "companion_choice_leokk", "companion_choice_huffer"];
}

function isAnimalCompanionChoiceCard(card: CardDefinition): boolean {
  const optionIds = card.choiceOptionCardIds ?? [];
  const companionChoices = new Set(animalCompanionChoiceIds());
  return optionIds.length === companionChoices.size && optionIds.every((cardId) => companionChoices.has(cardId));
}

function summonAnimalCompanionCard(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string, fixedCardId?: string): void {
  summonAnimalCompanionOnce(game, seat, catalog, sourceName, fixedCardId);
  const extras = game.players[seat].animalCompanionExtraSummons ?? 0;
  for (let index = 0; index < extras; index += 1) summonAnimalCompanionOnce(game, seat, catalog, `${sourceName}的额外伙伴`);
}

function summonChosenAnimalCompanion(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const card = getCard(catalog, cardId);
  if (card.type !== "minion") throw new Error("只能选择一个可召唤的野兽。");
  const summoned = summonMinionForRule(game, seat, cardId, catalog);
  if (summoned) addLog(game, `${sourceName} 召唤了 ${card.name}。`);
  const extras = game.players[seat].animalCompanionExtraSummons ?? 0;
  for (let index = 0; index < extras; index += 1) summonAnimalCompanionOnce(game, seat, catalog, `${sourceName}的额外伙伴`);
}

function summonAnimalCompanionOnce(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string, fixedCardId?: string): void {
  const player = game.players[seat];
  const replacementCost = player.animalCompanionReplacementCost;
  const roll = (player.animalCompanionRollCounter ?? 0) + 1;
  player.animalCompanionRollCounter = roll;
  const cardId = replacementCost
    ? randomBeastForCompanion(game, seat, catalog, replacementCost, sourceName, roll)
    : fixedCardId ?? randomFrom(game, seat, animalCompanionTokenIds(), `${sourceName}:${roll}`);
  const summoned = summonMinionForRule(game, seat, cardId, catalog);
  if (!summoned) return;
  addLog(game, `${sourceName} 召唤了 ${getCard(catalog, cardId).name}。`);
}

function randomFrom(game: GameState, seat: Seat, values: string[], salt: string): string {
  const random = rng(game.seed + game.turn * 983 + seat * 181 + values.length * 17 + salt.length + game.logs.length);
  return values[Math.floor(random() * values.length)];
}

function randomBeastForCompanion(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, cost: number, sourceName: string, roll: number): string {
  const poolIds = ensureAnimalCompanionReplacementPool(game, seat, catalog, cost, sourceName);
  if (poolIds.length > 0) {
    const random = rng(game.seed + game.turn * 983 + seat * 181 + poolIds.length * 17 + sourceName.length + cost * 37 + roll * 53 + game.logs.length);
    return poolIds[Math.floor(random() * poolIds.length)];
  }
  return randomFrom(game, seat, animalCompanionTokenIds(), `${sourceName}:${roll}`);
}

function ensureAnimalCompanionReplacementPool(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, cost: number, sourceName: string): string[] {
  const player = game.players[seat];
  const key = String(cost);
  player.animalCompanionReplacementPools ??= {};
  const existing = player.animalCompanionReplacementPools[key];
  if (existing?.length) return existing;
  const playerClass = game.players[seat].class;
  const beasts = [...catalog.values()].filter((card) =>
    card.collectible &&
    card.type === "minion" &&
    hasRace(card, "BEAST") &&
    (card.class === playerClass || card.class === "neutral")
  );
  const exact = beasts.filter((card) => card.cost === cost);
  const pool = exact.length > 0 ? exact : beasts.filter((card) => Math.abs(card.cost - cost) <= 1);
  const fallback = pool.length > 0 ? pool : beasts;
  if (fallback.length === 0) return [];
  const random = rng(game.seed + game.turn * 991 + seat * 191 + cost * 31 + fallback.length + game.logs.length);
  const candidates = [...fallback];
  const chosen: string[] = [];
  while (candidates.length > 0 && chosen.length < 3) {
    const index = Math.floor(random() * candidates.length);
    const [picked] = candidates.splice(index, 1);
    if (picked) chosen.push(picked.id);
  }
  player.animalCompanionReplacementPools[key] = chosen;
  addLog(game, `${sourceName} 生成了 ${cost} 费动物伙伴野兽池：${chosen.map((cardId) => getCard(catalog, cardId).name).join("、")}。`);
  return chosen;
}

function summonMinionForRule(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>): BoardMinion | undefined {
  const player = game.players[seat];
  if (occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) return undefined;
  const card = getCard(catalog, cardId);
  if (card.type !== "minion") throw new Error("只能召唤随从。");
  const minion = createBoardMinion(applyCrystalCoreToInstance(game, seat, createInstance(cardId, seat), catalog), card, game.turn);
  applyBeastSummonState(game, seat, minion, card, catalog);
  player.board.push(minion);
  triggerColossalOnSummon(game, seat, card, catalog);
  return minion;
}

function callOfTheWild(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const cardId of animalCompanionTokenIds()) summonAnimalCompanionOnce(game, seat, catalog, sourceName, cardId);
  const extras = game.players[seat].animalCompanionExtraSummons ?? 0;
  for (let index = 0; index < extras; index += 1) summonAnimalCompanionOnce(game, seat, catalog, `${sourceName}的额外伙伴`);
}

function upgradeAnimalCompanions(game: GameState, seat: Seat, amount: number, sourceName: string, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  player.animalCompanionReplacementCost = Math.min(10, (player.animalCompanionReplacementCost ?? 3) + amount);
  ensureAnimalCompanionReplacementPool(game, seat, catalog, player.animalCompanionReplacementCost, sourceName);
  addLog(game, `${sourceName} 将此后的动物伙伴替换为 ${player.animalCompanionReplacementCost} 费随机野兽。`);
}

function woundPrey(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target) throw new Error(`${sourceName} 需要选择一个目标。`);
  dealDamage(game, target, 1, seat, catalog, false);
  summon(game, seat, "companion_token_hyena", 1, catalog);
}

function faceTheTolvir(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const played = [...new Set(game.players[seat].hunterOneCostCardsPlayed ?? [])];
  for (const cardId of played) replayHunterOneCostCard(game, seat, cardId, catalog, sourceName);
  addLog(game, `${sourceName} 重新使用了 ${played.length} 种1费牌。`);
}

function replayHunterOneCostCard(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const card = getCard(catalog, cardId);
  if (card.type === "minion") {
    const minion = summonMinionForRule(game, seat, cardId, catalog);
    if (minion && hasRule(card, "hunter_raptor_nest_caretaker")) raptorNestCaretakerBattlecry(game, seat, catalog, sourceName);
    return;
  }
  const target = defaultEnemyTarget(game, seat, card);
  if (hasRule(card, "hunter_tracking")) hunterTracking(game, seat);
  if (hasRule(card, "hunter_wound_prey")) woundPrey(game, seat, target, catalog, sourceName);
  if (hasRule(card, "hunter_sands_of_time")) discoverSpell(game, seat, catalog, sourceName);
  if (hasRule(card, "hunter_tame_beast")) {
    drawCards(game, seat, 1, catalog, true);
    upgradeAnimalCompanions(game, seat, 1, sourceName, catalog);
  }
  if (hasRule(card, "hunter_deafening_roar")) deafeningRoar(game, seat, target, catalog, sourceName);
}

function defaultEnemyTarget(game: GameState, seat: Seat, card: CardDefinition): TargetRef | undefined {
  if (!card.requiresTarget) return undefined;
  const enemySeat = other(seat);
  if (hasRule(card, "hunter_deafening_roar")) {
    const minion = game.players[enemySeat].board[0];
    return minion ? { type: "minion", seat: enemySeat, instanceId: minion.instanceId } : undefined;
  }
  return { type: "hero", seat: enemySeat };
}

function randomOneCostCardToHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, type: "minion" | "spell", sourceName: string): void {
  const playerClass = game.players[seat].class;
  const pool = [...catalog.values()].filter((card) =>
    card.collectible &&
    card.cost === 1 &&
    card.type === type &&
    (card.class === playerClass || card.class === "neutral")
  );
  if (pool.length === 0) return;
  const random = rng(game.seed + game.turn * 997 + seat * 197 + pool.length + sourceName.length);
  const picked = pool[Math.floor(random() * pool.length)];
  addCardToHand(game, seat, createInstance(picked.id, seat), catalog, `${sourceName} 获取了 ${picked.name}。`);
}

function raptorNestCaretakerBattlecry(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  randomOneCostCardToHand(game, seat, catalog, "minion", sourceName);
}

function raptorNestCaretakerDeathrattle(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  randomOneCostCardToHand(game, seat, catalog, "spell", sourceName);
}

function rangerMarks(player: PlayerGameState): NonNullable<PlayerGameState["hunterRangersPlayed"]> {
  player.hunterRangersPlayed ??= {};
  return player.hunterRangersPlayed;
}

function rangerRepeatCount(player: PlayerGameState, names: Array<keyof NonNullable<PlayerGameState["hunterRangersPlayed"]>>): number {
  const marks = rangerMarks(player);
  return 1 + names.filter((name) => marks[name]).length;
}

function rangerAurelia(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const copies = rangerRepeatCount(player, ["sylvanas", "vereesa"]);
  const spells = player.deck.filter((instance) => getCard(catalog, instance.cardId).type === "spell");
  discoverCardCopies(game, seat, spells, catalog, `${sourceName} 发现一张法术牌。`, 3, copies);
  rangerMarks(player).aurelia = true;
}

function rangerVereesa(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const repeats = rangerRepeatCount(player, ["aurelia", "sylvanas"]);
  for (let count = 0; count < repeats; count += 1) {
    for (const instance of player.deck) {
      const card = getCard(catalog, instance.cardId);
      if (card.type !== "minion") continue;
      instance.attackOverride = (instance.attackOverride ?? card.attack ?? 0) + 1;
      instance.healthOverride = (instance.healthOverride ?? card.health ?? 1) + 1;
    }
  }
  rangerMarks(player).vereesa = true;
  addLog(game, `${sourceName} 使牌库中的随从牌获得 ${repeats} 次 +1/+1。`);
}

function rangerSylvanas(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const repeats = rangerRepeatCount(player, ["aurelia", "vereesa"]);
  for (let count = 0; count < repeats; count += 1) damageAllEnemies(game, seat, 2, catalog);
  rangerMarks(player).sylvanas = true;
  addLog(game, `${sourceName} 对所有敌人造成了 ${repeats} 次伤害。`);
}

function damageAllEnemies(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>): void {
  const enemySeat = other(seat);
  const targets = [
    { type: "hero" as const, seat: enemySeat },
    ...game.players[enemySeat].board.map((minion) => ({ type: "minion" as const, seat: enemySeat, instanceId: minion.instanceId }))
  ];
  for (const target of targets) dealDamage(game, target, amount, seat, catalog, false);
  cleanupDeaths(game, catalog);
}

function tayaRunetotem(game: GameState, seat: Seat, sourceName: string): void {
  const player = game.players[seat];
  player.animalCompanionExtraSummons = (player.animalCompanionExtraSummons ?? 0) + 1;
  addLog(game, `${sourceName} 让此后召唤动物伙伴的卡牌额外召唤一个伙伴。`);
}

function archbishopNelle(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  player.hero.heroPowerCardId = "hero_power_hunter_tracking";
  player.hero.heroPowerCost = 1;
  addLog(game, `${sourceName} 将英雄技能替换为 ${getCard(catalog, "hero_power_hunter_tracking").name}。`);
}

function beaststalkerTavish(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  player.hero.heroPowerCardId = "hero_power_tavish_beast_companion";
  player.hero.heroPowerCost = 2;
  castImprovedHunterSecrets(game, seat, catalog, sourceName);
  addLog(game, `${sourceName} 将英雄技能替换为召唤动物伙伴。`);
}

function triggerColossalOnSummon(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  if (hasRule(card, "beast_magmaw_colossal")) summonMagmawLimbs(game, seat, catalog, card.name);
}

function summonMagmawLimbs(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  let summoned = 0;
  while (occupiedBoardSlots(player) < GAME_RULES.maxBoardSize) {
    const limbCard = getCard(catalog, "beast_token_magmaw_limb");
    const limb = createBoardMinion(applyCrystalCoreToInstance(game, seat, createInstance("beast_token_magmaw_limb", seat), catalog), limbCard, game.turn);
    player.board.push(limb);
    summoned += 1;
  }
  if (summoned > 0) addLog(game, `${sourceName} 的巨型效果召唤了 ${summoned} 个肢节。`);
}

function magmawLimbDeathrattle(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const candidates = game.players[seat].board.filter((minion) => minion.health > 0);
  if (candidates.length === 0) return;
  const random = rng(game.seed + game.turn * 379 + seat * 83 + candidates.length + game.logs.length);
  const target = candidates[Math.floor(random() * candidates.length)];
  if (!target) return;
  applyStatEffect(target, 2, 0);
  addLog(game, `${sourceName} 的亡语使 ${getCard(catalog, target.cardId).name} 获得+2攻击力。`);
}

function improvedHunterSecretIds(): string[] {
  return [
    "hunter_secret_improved_frost_trap",
    "hunter_secret_improved_explosive_trap",
    "hunter_secret_improved_snake_trap",
    "hunter_secret_improved_pack_tactics",
    "hunter_secret_improved_open_the_cages"
  ];
}

function castImprovedHunterSecrets(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const existing = new Set(player.secrets.map((secret) => secret.cardId));
  const pool = improvedHunterSecretIds().filter((cardId) => !existing.has(cardId));
  const random = rng(game.seed + game.turn * 373 + seat * 79 + player.secrets.length + game.logs.length);
  const chosen: string[] = [];
  while (pool.length > 0 && chosen.length < 2) {
    const index = Math.floor(random() * pool.length);
    const [cardId] = pool.splice(index, 1);
    if (cardId) chosen.push(cardId);
  }
  for (const cardId of chosen) {
    player.secrets.push(createInstance(cardId, seat));
    addLog(game, `${sourceName} 施放了 ${getCard(catalog, cardId).name}。`);
  }
}

function heartOfStranglethorn(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const deadBeasts = player.graveyard
    .map((cardId) => catalog.get(cardId))
    .filter((card): card is CardDefinition => card !== undefined && card.type === "minion" && hasRace(card, "BEAST") && (card.cost ?? 0) >= 5);
  let revived = 0;
  for (const card of deadBeasts) {
    if (occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) break;
    if (summonMinionForRule(game, seat, card.id, catalog)) revived += 1;
  }
  addLog(game, `${sourceName} 复活了 ${revived} 个法力值消耗大于或等于（5）的友方野兽。`);
}

function zuljinBattlecry(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const spells = [...(game.players[seat].hunterSpellsCastThisGame ?? [])];
  let replayed = 0;
  for (const cardId of spells) {
    const card = catalog.get(cardId);
    if (!card || card.type !== "spell") continue;
    replayHunterSpellForZuljin(game, seat, card, catalog, sourceName);
    replayed += 1;
  }
  addLog(game, `${sourceName} 重新施放了 ${replayed} 张本局对战中使用过的猎人法术。`);
}

function replayHunterSpellForZuljin(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const target = defaultEnemyTarget(game, seat, card);
  if (hasRule(card, "hunter_tracking")) drawCards(game, seat, 1, catalog, true);
  if (hasRule(card, "hunter_animal_companion")) summonAnimalCompanionCard(game, seat, catalog, sourceName);
  if (hasRule(card, "hunter_wound_prey")) woundPrey(game, seat, target, catalog, sourceName);
  if (hasRule(card, "hunter_sands_of_time")) addRandomSpellToHand(game, seat, catalog, sourceName);
  if (hasRule(card, "hunter_face_the_tolvir")) faceTheTolvir(game, seat, catalog, sourceName);
  if (hasRule(card, "hunter_tame_beast")) {
    drawCards(game, seat, 1, catalog, true);
    upgradeAnimalCompanions(game, seat, 1, sourceName, catalog);
  }
  if (hasRule(card, "hunter_free_roam")) {
    upgradeAnimalCompanions(game, seat, 2, sourceName, catalog);
    summonAnimalCompanionCard(game, seat, catalog, sourceName);
  }
  if (hasRule(card, "hunter_call_of_the_wild")) callOfTheWild(game, seat, catalog, sourceName);
  if (hasRule(card, "hunter_heart_of_stranglethorn")) heartOfStranglethorn(game, seat, catalog, sourceName);
  if (hasRule(card, "hunter_deafening_roar")) deafeningRoar(game, seat, target, catalog, sourceName);
}

function addRandomSpellToHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const pool = [...catalog.values()].filter((card) => card.collectible && card.type === "spell");
  if (pool.length === 0) return;
  const picked = pool[Math.floor(rng(game.seed + game.turn * 359 + seat * 73 + pool.length + game.logs.length)() * pool.length)];
  if (!picked) return;
  addCardToHand(game, seat, createInstance(picked.id, seat), catalog, `${sourceName} 获取了 ${picked.name}。`);
}

function madAlchemist(game: GameState, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  const minion = findMinion(game, target);
  if (!minion) throw new Error("目标随从已经离开战场。");
  const attack = minion.attack;
  const health = minion.health;
  setAttackByEffect(minion, health);
  setMaxHealthByEffect(minion, attack);
  minion.health = Math.min(minion.health, minion.maxHealth);
  addLog(game, `${sourceName} 交换了 ${targetName(game, target, catalog)} 的攻击力和生命值。`);
}

function deafeningRoar(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error(`${sourceName} 需要选择一个敌方随从。`);
  const minion = findMinion(game, target);
  if (!minion) return;
  setMaxHealthByEffect(minion, 1);
  minion.health = Math.min(minion.health, 1);
}

function beastGenericBattlecry(game: GameState, seat: Seat, sourceInstanceId: string, card: CardDefinition, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const text = card.text;
  const source = game.players[seat].board.find((minion) => minion.instanceId === sourceInstanceId);
  if (text.includes("如果它是战场上唯一的一个随从") && source && game.players[0].board.length + game.players[1].board.length === 1) applyStatEffect(source, 3, 3);
  if (text.includes("如果你没有其他手牌") && source && game.players[seat].hand.length === 0) applyStatEffect(source, 3, 3);
  if (text.includes("敌方英雄") && text.includes("造成3点伤害")) {
    dealDamage(game, { type: "hero", seat: other(seat) }, 3, seat, catalog, false);
    if (text.includes("恢复")) heal(game, { type: "hero", seat }, 3, catalog);
  }
  if (text.includes("造成3点伤害") && target) dealDamage(game, target, 3, seat, catalog, false);
  else if (text.includes("造成4点伤害") && target) dealDamage(game, target, 4, seat, catalog, false);
  else if (text.includes("造成5点伤害") && target) dealDamage(game, target, 5, seat, catalog, false);
  else if (text.includes("造成6点伤害") && target) dealDamage(game, target, 6, seat, catalog, false);
  if (text.includes("造成等同于本随从攻击力的伤害") && target && source) dealDamage(game, target, source.attack, seat, catalog, false);
  if (text.includes("对本随从造成6点伤害") && source) dealDamage(game, { type: "minion", seat, instanceId: source.instanceId }, 6, seat, catalog, false);
  if (text.includes("对本随从造成10点伤害") && source) dealDamage(game, { type: "minion", seat, instanceId: source.instanceId }, 10, seat, catalog, false);
  if (text.includes("你的对手每有一张手牌") && source) setMaxHealthByEffect(source, Math.max(1, source.maxHealth - game.players[other(seat)].hand.length));
  if (text.includes("抽一张")) drawCards(game, seat, 1, catalog, true);
  if (text.includes("抽五张不同的奥秘")) drawCards(game, seat, 5, catalog, true);
  if (text.includes("发现一张野兽牌")) discoverBeast(game, seat, catalog, card.name);
  if (text.includes("随机获取一张法力值消耗为（1）的随从牌")) randomOneCostCardToHand(game, seat, catalog, "minion", card.name);
  if (text.includes("用1/1并具有突袭") || text.includes("填满你的手牌")) {
    while (game.players[seat].hand.length < GAME_RULES.maxHandSize) addCardToHand(game, seat, createInstance("companion_token_hyena", seat), catalog, `${card.name} 获取了山猫。`);
  }
  if (text.includes("将两根香蕉置入你的手牌") || text.includes("获取一张无穷香蕉")) addBananasToHand(game, seat, catalog, text.includes("两根") ? 2 : 1, card.name);
  if (text.includes("用香蕉填满你对手的手牌")) {
    while (game.players[other(seat)].hand.length < GAME_RULES.maxHandSize) addCardToHand(game, other(seat), createInstance("beast_token_banana", other(seat)), catalog, `${card.name} 塞入了一根香蕉。`);
  }
  if (text.includes("召唤三只1/1并具有突袭")) summon(game, seat, "companion_token_hyena", 3, catalog);
  if (text.includes("召唤一个本随从的复制")) summon(game, seat, card.id, 1, catalog);
  if (text.includes("召唤一个它的复制") && source && source.attack >= 4) summon(game, seat, card.id, 1, catalog);
  if (text.includes("随机消灭一个攻击力小于或等于2的敌方随从")) destroyRandomEnemyMinion(game, seat, catalog, card.name, (minion) => minion.attack <= 2);
  if (text.includes("消灭攻击力最低的敌方随从")) destroyExtremeAttackEnemyMinion(game, seat, catalog, card.name, "min");
  if (text.includes("消灭攻击力最高的敌方随从")) destroyExtremeAttackEnemyMinion(game, seat, catalog, card.name, "max");
  if (text.includes("消灭一个随从") && target?.type === "minion") {
    const victim = findMinion(game, target);
    if (victim && source && text.includes("获得被消灭随从的属性值")) applyStatEffect(source, victim.attack, victim.maxHealth);
    destroy(game, target, catalog);
  }
  if (text.includes("获得+1攻击力和突袭") && source) {
    applyStatEffect(source, 1, 0);
    addKeyword(source, "rush");
  }
  if (text.includes("获得+3/+3") && source && !text.includes("唯一")) applyStatEffect(source, 3, 3);
  if (text.includes("获得嘲讽") && source) addKeyword(source, "taunt");
  if (text.includes("获得冲锋") && source) {
    addKeyword(source, "charge");
    source.exhausted = false;
  }
  if (text.includes("获得圣盾") && source) addKeyword(source, "divine_shield");
  if (text.includes("使一个友方随从获得+4/+4和嘲讽") && target?.type === "minion" && target.seat === seat) {
    buff(game, target, 4, 4, catalog);
    const minion = findMinion(game, target);
    if (minion) addKeyword(minion, "taunt");
  }
  if (text.includes("随机使另一个友方亡灵获得+5/+5和嘲讽") && source) buffRandomOtherFriendlyUndead(game, seat, source.instanceId, catalog, card.name);
  if (text.includes("交换攻击力") && target?.type === "minion" && source) swapMinionAttack(source, findMinion(game, target));
  if (text.includes("交换生命值") && target?.type === "minion" && source) swapMinionHealth(source, findMinion(game, target));
}

function applyBeastSummonState(game: GameState, seat: Seat, minion: BoardMinion, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  if (hasRule(card, "beast_stealth")) minion.untouchable = true;
  if (hasRule(card, "beast_frozen")) minion.frozenUntilTurn = Number.MAX_SAFE_INTEGER;
  if (hasTundraRhinoCharge(game, seat, minion, catalog)) {
    addKeyword(minion, "charge");
    minion.exhausted = false;
  }
  if (hasRule(card, "beast_tundra_rhino")) {
    for (const ally of game.players[seat].board) {
      if (!ally.silenced && hasRace(getCard(catalog, ally.cardId), "BEAST")) {
        addKeyword(ally, "charge");
        ally.exhausted = false;
      }
    }
  }
}

function hasTundraRhinoCharge(game: GameState, seat: Seat, minion: BoardMinion, catalog: Map<string, CardDefinition>): boolean {
  if (!hasRace(getCard(catalog, minion.cardId), "BEAST")) return false;
  return game.players[seat].board.some((ally) => !ally.silenced && hasRule(getCard(catalog, ally.cardId), "beast_tundra_rhino"));
}

function beastKindredAttack(game: GameState, seat: Seat, sourceInstanceId: string, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const source = game.players[seat].board.find((minion) => minion.instanceId === sourceInstanceId);
  if (!source || !target || target.type !== "minion" || target.seat !== other(seat)) return;
  dealDamage(game, target, source.attack, seat, catalog, false);
  addLog(game, `${sourceName} 对敌方随从造成了等同于自身攻击力的伤害。`);
}

function triggerBeastSpellburst(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, spellName: string): void {
  for (const minion of game.players[seat].board) {
    if (minion.silenced || minion.spellburstUsed) continue;
    const card = getCard(catalog, minion.cardId);
    if (!hasRule(card, "beast_spellburst_destroy")) continue;
    minion.spellburstUsed = true;
    destroyRandomEnemyMinion(game, seat, catalog, `${card.name} 的法术迸发`);
    addLog(game, `${card.name} 响应 ${spellName} 触发了法术迸发。`);
  }
}

function triggerBeastInspire(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  for (const source of game.players[seat].board) {
    if (source.silenced || !hasRule(getCard(catalog, source.cardId), "beast_inspire_team_buff")) continue;
    for (const minion of game.players[seat].board) {
      if (minion.instanceId !== source.instanceId) applyStatEffect(minion, 1, 1);
    }
    addLog(game, `${getCard(catalog, source.cardId).name} 的激励使其他友方随从获得+1/+1。`);
  }
}

function reduceCorridorCreepersInHands(game: GameState, catalog: Map<string, CardDefinition>): void {
  for (const player of game.players) {
    for (const instance of player.hand) {
      const card = getCard(catalog, instance.cardId);
      if (!hasRule(card, "beast_corridor_creeper")) continue;
      const currentCost = instance.costOverride ?? card.cost;
      instance.costOverride = Math.max(0, currentCost - 1);
    }
  }
}

function triggerSwampKingDred(game: GameState, playedSeat: Seat, playedMinion: BoardMinion, catalog: Map<string, CardDefinition>): void {
  const dredSeat = other(playedSeat);
  const dred = game.players[dredSeat].board.find((minion) => !minion.silenced && hasRule(getCard(catalog, minion.cardId), "beast_swamp_king_dred"));
  if (!dred || dred.health <= 0 || playedMinion.health <= 0) return;
  dealDamage(game, { type: "minion", seat: playedSeat, instanceId: playedMinion.instanceId }, minionAttackValue(game, dredSeat, dred, catalog), dredSeat, catalog, dred.keywords.includes("lifesteal"));
  dealDamage(game, { type: "minion", seat: dredSeat, instanceId: dred.instanceId }, minionAttackValue(game, playedSeat, playedMinion, catalog), playedSeat, catalog, playedMinion.keywords.includes("lifesteal"));
  dred.attacksThisTurn += 1;
  addLog(game, `${getCard(catalog, dred.cardId).name} 攻击了刚被使用的 ${getCard(catalog, playedMinion.cardId).name}。`);
}

function thawFrozenBeastsForFireSpell(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  if (!card.name.includes("火") && !card.text.includes("火")) return;
  for (const minion of game.players[seat].board) {
    if (!minion.silenced && hasRule(getCard(catalog, minion.cardId), "beast_frozen")) delete minion.frozenUntilTurn;
  }
}

function beastGenericDeathrattle(game: GameState, seat: Seat, minion: BoardMinion, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  const text = card.text;
  if (text.includes("召唤两只2/2的土狼")) summon(game, seat, "beast_token_hyena_2_2", 2, catalog);
  if (text.includes("召唤两只2/4并具有嘲讽")) summon(game, seat, "beast_token_bear_cub", 2, catalog);
  if (text.includes("召唤两只1/1并具有剧毒和突袭")) summon(game, seat, "beast_token_spider_poison_rush", 2, catalog);
  if (text.includes("召唤两只1/1的蜘蛛")) summon(game, seat, "beast_token_spider", 2, catalog);
  if (text.includes("召唤七只1/1的肉虫")) summon(game, seat, "beast_token_grub", 7, catalog);
  if (text.includes("召唤三个1/1的鱼人")) summon(game, seat, "beast_token_murloc_1_1", 3, catalog);
  if (text.includes("为你的对手召唤一个3/3")) summon(game, other(seat), "beast_token_pip_quickwit", 1, catalog);
  if (text.includes("奥的灰烬")) summon(game, seat, "beast_token_alar_ashes", 1, catalog);
  if (text.includes("抽八张牌")) drawCards(game, seat, 8, catalog, true);
  if (text.includes("你的对手抽两张牌")) drawCards(game, other(seat), 2, catalog, true);
  if (text.includes("对所有敌方随从造成2点伤害")) damageEnemyMinions(game, seat, 2, catalog);
  if (text.includes("对所有敌方随从造成3点")) damageEnemyMinions(game, seat, 3, catalog);
  if (text.includes("随机对一个敌人造成8点伤害")) damageRandomEnemyTarget(game, seat, 8, catalog, card.name);
  if (text.includes("随机对一个敌人造成7点伤害")) damageRandomEnemyTarget(game, seat, 7, catalog, card.name);
  if (text.includes("随机消灭一个敌方随从")) destroyRandomEnemyMinion(game, seat, catalog, card.name);
  if (text.includes("随机召唤一只法力值消耗为（3）的野兽")) summonRandomBeast(game, seat, 3, catalog, card.name);
  if (text.includes("随机召唤一只法力值消耗等同于本随从攻击力的")) summonRandomBeast(game, seat, Math.max(0, minion.attack), catalog, card.name);
  if (text.includes("随机获取一张亡语随从牌")) addRandomDeathrattleMinionToHand(game, seat, catalog, card.name, -2);
  if (text.includes("巫妖王牌")) addRandomLegendaryMinionToHand(game, seat, catalog, card.name);
  if (text.includes("随机使另一个友方亡灵获得+5/+5和嘲讽")) buffRandomOtherFriendlyUndead(game, seat, minion.instanceId, catalog, card.name);
}

function beastGenericDamageTrigger(game: GameState, seat: Seat, minion: BoardMinion, card: CardDefinition, amount: number, catalog: Map<string, CardDefinition>): void {
  if (amount <= 0) return;
  const text = card.text;
  if (text.includes("其攻击力翻倍")) applyStatEffect(minion, minion.attack, 0);
  if (text.includes("对你的英雄造成 3点伤害") || text.includes("对你的英雄造成3点伤害")) dealDamage(game, { type: "hero", seat }, 3, seat, catalog, false);
  if (text.includes("获取一张幸运币")) addCardToHand(game, seat, createInstance("coin", seat), catalog, `${card.name} 获取了一张幸运币。`);
}

function beastGenericEndTurn(game: GameState, seat: Seat, minion: BoardMinion, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  if (card.text.includes("将所有敌方随从的攻击力和生命值变为1")) {
    for (const enemy of game.players[other(seat)].board) {
      setAttackByEffect(enemy, 1);
      setMaxHealthByEffect(enemy, 1);
    }
  }
}

function beastGenericAttackTrigger(game: GameState, seat: Seat, minion: BoardMinion, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  const card = getCard(catalog, minion.cardId);
  const text = card.text;
  if (text.includes("使你的其他野兽获得+2/+2")) {
    for (const otherMinion of game.players[seat].board) {
      if (otherMinion.instanceId !== minion.instanceId && hasRace(getCard(catalog, otherMinion.cardId), "BEAST")) applyStatEffect(otherMinion, 2, 2);
    }
  }
  if (text.includes("抽一张野兽牌并获得其属性值")) {
    const drawn = drawRaceCard(game, seat, "BEAST", catalog);
    if (drawn) {
      const drawnCard = getCard(catalog, drawn.cardId);
      applyStatEffect(minion, drawnCard.attack ?? 0, drawnCard.health ?? 0);
    }
  }
  if (text.includes("获得一个仅限本回合可用的法力水晶")) game.players[seat].mana += 1;
  if (text.includes("造成等同于本随从攻击力的伤害，随机分配到所有敌人身上")) dealRandomEnemyDamage(game, seat, minion.attack, catalog, card.name);
  if (target.type === "minion" && text.includes("还会命中敌方英雄")) dealDamage(game, { type: "hero", seat: other(seat) }, minion.attack, seat, catalog, minion.keywords.includes("lifesteal"));
}

function addBananasToHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, amount: number, sourceName: string): void {
  for (let count = 0; count < amount; count += 1) addCardToHand(game, seat, createInstance("beast_token_banana", seat), catalog, `${sourceName} 获取了一根香蕉。`);
}

function buffRandomOtherFriendlyUndead(game: GameState, seat: Seat, sourceInstanceId: string | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const options = game.players[seat].board.filter((minion) =>
    minion.instanceId !== sourceInstanceId &&
    hasRace(getCard(catalog, minion.cardId), "UNDEAD")
  );
  if (options.length === 0) return;
  const random = rng(game.seed + game.turn * 1031 + seat * 239 + options.length + game.logs.length);
  const picked = options[Math.floor(random() * options.length)];
  applyStatEffect(picked, 5, 5);
  addKeyword(picked, "taunt");
  addLog(game, `${sourceName} 使 ${getCard(catalog, picked.cardId).name} 获得 +5/+5 和嘲讽。`);
}

function discoverBeast(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const pool = [...catalog.values()]
    .filter((card) => card.collectible && card.type === "minion" && hasRace(card, "BEAST") && (card.class === game.players[seat].class || card.class === "neutral"))
    .map((card) => createInstance(card.id, seat));
  discoverCardCopies(game, seat, pool, catalog, `${sourceName} 发现一张野兽牌。`);
}

function summonRandomBeast(game: GameState, seat: Seat, cost: number, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const pool = [...catalog.values()].filter((card) => card.collectible && card.type === "minion" && hasRace(card, "BEAST") && card.cost === cost && (card.class === game.players[seat].class || card.class === "neutral"));
  if (pool.length === 0) return;
  const random = rng(game.seed + game.turn * 1009 + seat * 211 + cost * 29 + pool.length);
  summon(game, seat, pool[Math.floor(random() * pool.length)].id, 1, catalog);
  addLog(game, `${sourceName} 随机召唤了一只 ${cost} 费野兽。`);
}

function drawRaceCard(game: GameState, seat: Seat, race: string, catalog: Map<string, CardDefinition>): CardInstance | undefined {
  const player = game.players[seat];
  const index = player.deck.findIndex((instance) => hasRace(getCard(catalog, instance.cardId), race));
  if (index < 0) return undefined;
  const [drawn] = player.deck.splice(index, 1);
  addCardToHand(game, seat, { ...drawn, drawnTurn: game.turn }, catalog, `抽取了 ${getCard(catalog, drawn.cardId).name}。`);
  return drawn;
}

function addRandomDeathrattleMinionToHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string, discount = 0): void {
  const pool = [...catalog.values()].filter((card) => card.collectible && card.type === "minion" && card.keywords.includes("deathrattle"));
  if (pool.length === 0) return;
  const random = rng(game.seed + game.turn * 1013 + seat * 223 + pool.length);
  const picked = pool[Math.floor(random() * pool.length)];
  addCardToHand(game, seat, { ...createInstance(picked.id, seat), costOverride: Math.max(0, picked.cost + discount) }, catalog, `${sourceName} 获取了 ${picked.name}。`);
}

function damageEnemyMinions(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>): void {
  for (const minion of [...game.players[other(seat)].board]) dealDamage(game, { type: "minion", seat: other(seat), instanceId: minion.instanceId }, amount, seat, catalog, false);
}

function damageRandomEnemyTarget(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const targets = [{ type: "hero" as const, seat: other(seat) }, ...game.players[other(seat)].board.map((minion) => ({ type: "minion" as const, seat: other(seat), instanceId: minion.instanceId }))];
  if (targets.length === 0) return;
  const random = rng(game.seed + game.turn * 1019 + seat * 227 + targets.length + amount);
  dealDamage(game, targets[Math.floor(random() * targets.length)], amount, seat, catalog, false);
  addLog(game, `${sourceName} 随机造成了 ${amount} 点伤害。`);
}

function destroyRandomEnemyMinion(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string, predicate: (minion: BoardMinion) => boolean = () => true): void {
  const options = game.players[other(seat)].board.filter(predicate);
  if (options.length === 0) return;
  const random = rng(game.seed + game.turn * 1021 + seat * 229 + options.length);
  const picked = options[Math.floor(random() * options.length)];
  destroy(game, { type: "minion", seat: other(seat), instanceId: picked.instanceId }, catalog);
  addLog(game, `${sourceName} 随机消灭了 ${getCard(catalog, picked.cardId).name}。`);
}

function destroyExtremeAttackEnemyMinion(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string, mode: "min" | "max"): void {
  const options = game.players[other(seat)].board;
  if (options.length === 0) return;
  const value = mode === "min" ? Math.min(...options.map((minion) => minion.attack)) : Math.max(...options.map((minion) => minion.attack));
  const picked = options.find((minion) => minion.attack === value);
  if (picked) destroy(game, { type: "minion", seat: other(seat), instanceId: picked.instanceId }, catalog);
  addLog(game, `${sourceName} 消灭了一个敌方随从。`);
}

function swapMinionAttack(a: BoardMinion, b: BoardMinion | undefined): void {
  if (!b) return;
  const oldA = a.attack;
  setAttackByEffect(a, b.attack);
  setAttackByEffect(b, oldA);
}

function swapMinionHealth(a: BoardMinion, b: BoardMinion | undefined): void {
  if (!b) return;
  const oldA = a.maxHealth;
  setMaxHealthByEffect(a, b.maxHealth);
  setMaxHealthByEffect(b, oldA);
}

function gainEmptyMana(game: GameState, seat: Seat, amount: number, sourceName: string): void {
  const player = game.players[seat];
  const before = player.maxMana;
  player.maxMana = Math.min(player.manaCap ?? GAME_RULES.maxMana, player.maxMana + amount);
  addLog(game, `${sourceName} 使 ${player.nickname} 获得 ${player.maxMana - before} 个空的法力水晶。`);
}

function gainFullManaCrystals(game: GameState, seat: Seat, amount: number, sourceName: string): void {
  const player = game.players[seat];
  const before = player.maxMana;
  player.maxMana = Math.min(player.manaCap ?? GAME_RULES.maxMana, player.maxMana + amount);
  const gained = player.maxMana - before;
  player.mana += gained;
  addLog(game, `${sourceName} 使 ${player.nickname} 获得 ${gained} 个法力水晶。`);
}

function refreshMana(game: GameState, seat: Seat, amount: number, sourceName: string): void {
  const player = game.players[seat];
  const before = player.mana;
  player.mana = Math.min(player.maxMana, player.mana + amount);
  addLog(game, `${sourceName} 为 ${player.nickname} 复原了 ${player.mana - before} 点法力。`);
}

function newHeights(game: GameState, seat: Seat, sourceName: string): void {
  const player = game.players[seat];
  player.manaCap = Math.min(20, (player.manaCap ?? GAME_RULES.maxMana) + 3);
  gainEmptyMana(game, seat, 1, sourceName);
}

function becomeGuff(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  player.manaCap = 20;
  player.hero.heroPowerCardId = "hero_power_guff_nurture";
  player.hero.heroPowerCost = 2;
  gainEmptyMana(game, seat, 1, sourceName);
  drawCards(game, seat, 1, catalog, true);
}

function astalorBloodsworn(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  addCardToHand(game, seat, createInstance("dragon_astalor_guard", seat), catalog, "获得了护卫阿斯塔洛。");
  if (game.players[seat].maxMana >= 5) dealRandomEnemyDamage(game, seat, 2, catalog, "阿斯塔洛·血誓");
}

function astalorProtector(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  addCardToHand(game, seat, createInstance("dragon_astalor_flamebringer", seat), catalog, "获得了火焰使者阿斯塔洛。");
  if (game.players[seat].maxMana >= 8) game.players[seat].hero.armor += 5;
}

function dealRandomEnemyDamage(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const random = rng(game.seed + game.turn * 421 + amount * 17 + game.players[other(seat)].board.length);
  for (let count = 0; count < amount; count += 1) {
    const targets = [
      { type: "hero" as const, seat: other(seat) },
      ...game.players[other(seat)].board.map((minion) => ({ type: "minion" as const, seat: other(seat), instanceId: minion.instanceId }))
    ];
    if (targets.length === 0) break;
    dealDamage(game, targets[Math.floor(random() * targets.length)], 1, seat, catalog, false);
    cleanupDeaths(game, catalog);
  }
  addLog(game, `${sourceName} 随机分配了 ${amount} 点伤害。`);
}

function silenceOtherMinions(game: GameState, seat: Seat, sourceCardId: string, catalog: Map<string, CardDefinition>): void {
  const source = [...game.players[seat].board].reverse().find((minion) => minion.cardId === sourceCardId);
  for (const player of game.players) {
    for (const minion of [...player.board]) {
      if (minion.instanceId !== source?.instanceId) silence(game, { type: "minion", seat: player.seat, instanceId: minion.instanceId }, catalog);
    }
  }
}

function drawRaceFromDeck(game: GameState, seat: Seat, race: string, catalog: Map<string, CardDefinition>, sourceName: string, discount = 0): void {
  const player = game.players[seat];
  const index = player.deck.findIndex((instance) => hasRace(getCard(catalog, instance.cardId), race));
  if (index < 0) return;
  const [drawn] = player.deck.splice(index, 1);
  const baseCost = getCard(catalog, drawn.cardId).cost;
  addCardToHand(game, seat, { ...drawn, drawnTurn: game.turn, costOverride: discount ? Math.max(0, baseCost + discount) : drawn.costOverride }, catalog, `${sourceName} 抽取了 ${getCard(catalog, drawn.cardId).name}。`);
}

function psychmelon(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const cost of [7, 8, 9, 10]) drawCostedMinion(game, seat, cost, catalog, sourceName);
}

function drawCostedMinion(game: GameState, seat: Seat, cost: number, catalog: Map<string, CardDefinition>, sourceName: string): CardInstance | undefined {
  const player = game.players[seat];
  const index = player.deck.findIndex((instance) => {
    const card = getCard(catalog, instance.cardId);
    return card.type === "minion" && card.cost === cost;
  });
  if (index < 0) return undefined;
  const [drawn] = player.deck.splice(index, 1);
  addCardToHand(game, seat, { ...drawn, drawnTurn: game.turn }, catalog, `${sourceName} 抽取了 ${getCard(catalog, drawn.cardId).name}。`);
  return drawn;
}

function poisonSeeds(game: GameState, catalog: Map<string, CardDefinition>): void {
  const counts = game.players.map((player) => player.board.length);
  for (const player of game.players) {
    for (const minion of [...player.board]) destroy(game, { type: "minion", seat: player.seat, instanceId: minion.instanceId }, catalog);
  }
  cleanupDeaths(game, catalog);
  summon(game, 0, "dragon_token_treant", counts[0], catalog);
  summon(game, 1, "dragon_token_treant", counts[1], catalog);
}

function brokenMirror(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  const minion = findMinion(game, target);
  if (!minion) throw new Error("破碎映像的目标已经离开战场。");
  const cardId = minion.cardId;
  addCardToHand(game, seat, createInstance(cardId, seat), catalog, `获得了 ${getCard(catalog, cardId).name} 的复制。`);
  game.players[seat].deck.push(createInstance(cardId, seat));
  summonBoardCopy(game, seat, minion, catalog);
}

function freezeEnemyMinions(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const minion of game.players[other(seat)].board) freezeTarget(game, { type: "minion", seat: other(seat), instanceId: minion.instanceId }, catalog);
  addLog(game, `${sourceName} 冻结了敌方随从。`);
}

function freezeTarget(game: GameState, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName?: string): void {
  if (!target) throw new Error(`${sourceName ?? "冻结效果"} 需要选择一个目标。`);
  if (isUntouchableTarget(game, target, catalog)) throw new Error("这个随从无法成为目标。");
  const untilTurn = game.turn + 1;
  if (target.type === "hero") {
    const hero = game.players[target.seat].hero;
    hero.frozenUntilTurn = Math.max(hero.frozenUntilTurn ?? -1, untilTurn);
  } else {
    const minion = findMinion(game, target);
    if (!minion) throw new Error("冻结目标已经离开战场。");
    minion.frozenUntilTurn = Math.max(minion.frozenUntilTurn ?? -1, untilTurn);
  }
  if (sourceName) addLog(game, `${sourceName} 冻结了 ${targetName(game, target, catalog)}。`);
}

function isFrozen(game: GameState, target: TargetRef | undefined): boolean {
  if (!target) return false;
  if (target.type === "hero") return (game.players[target.seat].hero.frozenUntilTurn ?? -1) >= game.turn;
  return (findMinion(game, target)?.frozenUntilTurn ?? -1) >= game.turn;
}

function iceLance(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, card: CardDefinition): void {
  if (!target) throw new Error("冰枪术需要选择一个目标。");
  if (isFrozen(game, target)) {
    const damage = 4 + spellDamageBonus(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "play" });
    dealDamage(game, target, damage, seat, catalog, keywordOnSource(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "play" }, "lifesteal"));
  } else {
    freezeTarget(game, target, catalog, card.name);
  }
}

function arcaneMissiles(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  const missileCount = 3 + spellDamageBonus(game, { sourceCard: card, sourceOwner: seat, trigger: "play" });
  const random = rng(game.seed + game.turn * 463 + seat * 97 + game.players[other(seat)].board.length);
  for (let count = 0; count < missileCount; count += 1) {
    const targets = [
      { type: "hero" as const, seat: other(seat) },
      ...touchableMinionTargets(game, other(seat), catalog)
    ];
    if (targets.length === 0) break;
    dealDamage(game, targets[Math.floor(random() * targets.length)], 1, seat, catalog, false);
    cleanupDeaths(game, catalog);
  }
  addLog(game, `${card.name} 随机分配了 ${missileCount} 点伤害。`);
}

function blizzard(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  const damage = 2 + spellDamageBonus(game, { sourceCard: card, sourceOwner: seat, trigger: "play" });
  const targets = touchableMinionTargets(game, other(seat), catalog);
  for (const target of targets) dealDamage(game, target, damage, seat, catalog, false);
  for (const target of targets) {
    if (findMinion(game, target)) freezeTarget(game, target, catalog);
  }
  addLog(game, `${card.name} 对所有敌方随从造成 ${damage} 点伤害并冻结。`);
}

function polymorph(game: GameState, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  if (isUntouchableTarget(game, target, catalog)) throw new Error("这个随从无法成为目标。");
  const minion = findMinion(game, target);
  if (!minion) throw new Error("变形术的目标已经离开战场。");
  minion.cardId = "freeze_token_sheep";
  minion.attack = 1;
  minion.health = 1;
  minion.maxHealth = 1;
  minion.keywords = [];
  minion.silenced = false;
  minion.temporaryAttack = 0;
  minion.statEffects = { attack: 0, health: 0 };
  minion.cannotAttack = false;
  minion.untouchable = false;
  delete minion.attackOverride;
  delete minion.healthOverride;
  delete minion.frozenUntilTurn;
  delete minion.counterNextCardType;
  delete minion.usedTitanAbilityCardIds;
  delete minion.titanAbilityUsedTurn;
  addLog(game, `${sourceName} 将目标变成了绵羊。`);
}

function alexstraszaClassic(game: GameState, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "hero") throw new Error(`${sourceName} 需要选择一个英雄。`);
  game.players[target.seat].hero.health = Math.min(15, game.players[target.seat].hero.maxHealth);
  addLog(game, `${sourceName} 将 ${targetName(game, target, catalog)} 的生命值变为15。`);
}

function recruitEnemyMinion(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error(`${sourceName} 需要选择一个敌方随从。`);
  const minion = findMinion(game, target);
  if (!minion) throw new Error("招募目标已经离开战场。");
  addCardToHand(game, seat, createInstance(minion.cardId, seat), catalog, `招募了 ${getCard(catalog, minion.cardId).name}。`);
  for (let count = 0; count < 3; count += 1) addCardToHand(game, other(seat), createInstance("coin", other(seat)), catalog, "获得一张幸运币。");
}

function bobRefreshTavern(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const options = [...catalog.values()]
    .filter((card) => card.collectible && card.type === "minion" && card.cost === 3);
  if (options.length > 0) {
    const random = rng(game.seed + game.turn * 439 + seat * 89 + options.length);
    const card = options[Math.floor(random() * options.length)];
    addCardToHand(game, seat, createInstance(card.id, seat), catalog, `从 ${sourceName} 刷新的酒馆中发现了 ${card.name}。`);
  }
  refreshMana(game, seat, 3, sourceName);
}

function bobFindTriple(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const index = player.deck.findIndex((instance) => getCard(catalog, instance.cardId).type === "minion");
  if (index < 0) return;
  const [drawn] = player.deck.splice(index, 1);
  addCardToHand(game, seat, { ...drawn, drawnTurn: game.turn }, catalog, `${sourceName} 抽取了 ${getCard(catalog, drawn.cardId).name}。`);
  addCardToHand(game, seat, createInstance(drawn.cardId, seat), catalog, `获得了 ${getCard(catalog, drawn.cardId).name} 的复制。`);
  addCardToHand(game, seat, createInstance(drawn.cardId, seat), catalog, `获得了 ${getCard(catalog, drawn.cardId).name} 的复制。`);
}

function timewindOtherMinions(game: GameState, sourceInstanceId: string | undefined, catalog: Map<string, CardDefinition>, stat: "attack" | "health"): void {
  for (const player of game.players) {
    for (const minion of player.board) {
      if (minion.instanceId === sourceInstanceId) continue;
      if (stat === "attack") setAttackByEffect(minion, 1);
      else {
        setMaxHealthByEffect(minion, 1);
      }
    }
  }
  addLog(game, `暮光时空撕裂者将其他随从的${stat === "attack" ? "攻击力" : "生命值"}压为1。`);
}

function drawUntilFull(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  while (game.players[seat].hand.length < GAME_RULES.maxHandSize && game.players[seat].deck.length > 0) drawCards(game, seat, 1, catalog, true);
}

function createEliseLandmark(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const costs = new Set(game.players[seat].deck.map((instance) => getCard(catalog, instance.cardId).cost));
  if (costs.size < 10) {
    addLog(game, `${sourceName} 没有找到10种法力值消耗。`);
    return;
  }
  addCardToHand(game, seat, createInstance("dragon_elise_location", seat), catalog, "制造了一个自定义地标。");
}

function stealEmptyMana(game: GameState, seat: Seat, sourceName: string): void {
  const enemy = game.players[other(seat)];
  if (enemy.maxMana <= 0) return;
  enemy.maxMana -= 1;
  enemy.mana = Math.min(enemy.mana, enemy.maxMana);
  gainEmptyMana(game, seat, 1, sourceName);
}

function summonPureNest(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (hasDuplicateCardIds(game.players[seat].deck)) {
    addLog(game, `${sourceName} 检查后发现牌库仍有重复牌。`);
    return;
  }
  game.players[seat].specials.push(createBoardSpecial(createInstance("dragon_pure_nest", seat)));
  addLog(game, `${sourceName} 召唤了一个纯净龙巢。`);
}

function discoverDragon(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string, discount: number, excludedCardIds: string[] = [], continuesStartTurn = false): void {
  const pool = dragonDiscoverPool(game, seat, catalog, excludedCardIds);
  if (pool.length === 0) return;
  const random = rng(game.seed + game.turn * 433 + seat * 83 + pool.length);
  const picks: CardInstance[] = [];
  while (pool.length > 0 && picks.length < 3) {
    const [card] = pool.splice(Math.floor(random() * pool.length), 1);
    picks.push({ ...createInstance(card.id, seat), costOverride: Math.max(0, card.cost + discount) });
  }
  beginChoice(game, seat, "discover_to_hand", `从 ${sourceName} 的龙牌中选择一张。`, picks, undefined, undefined, undefined, undefined, continuesStartTurn);
}

function dragonDiscoverPool(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, excludedCardIds: string[] = []): CardDefinition[] {
  const excluded = new Set(excludedCardIds);
  const playerClass = game.players[seat].class;
  return [...catalog.values()].filter((card) =>
    card.collectible &&
    card.type === "minion" &&
    hasRace(card, "DRAGON") &&
    (card.class === playerClass || card.class === "neutral") &&
    !excluded.has(card.id)
  );
}

function addRandomDragonToHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string, discount = 0, excludedCardIds: string[] = []): void {
  const pool = dragonDiscoverPool(game, seat, catalog, excludedCardIds);
  if (pool.length === 0) {
    addLog(game, `${sourceName} 没有可获取的龙牌。`);
    return;
  }
  const random = rng(game.seed + game.turn * 461 + seat * 97 + pool.length + game.logs.length);
  const picked = pool[Math.floor(random() * pool.length)];
  addCardToHand(game, seat, { ...createInstance(picked.id, seat), costOverride: Math.max(0, picked.cost + discount) }, catalog, `${sourceName} 获得了 ${picked.name}。`);
}

function sourceMinion(game: GameState, seat: Seat, cardId: string): BoardMinion | undefined {
  for (let index = game.players[seat].board.length - 1; index >= 0; index -= 1) {
    const minion = game.players[seat].board[index];
    if (minion.cardId === cardId) return minion;
  }
  return undefined;
}

function pricklyDrake(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!hasDragonInHand(game.players[seat], catalog)) {
    addLog(game, `${sourceName} 手牌中没有龙牌，没有造成伤害。`);
    return;
  }
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error("需要选择一个敌方随从。");
  dealDamage(game, target, 5, seat, catalog, false);
}

function twilightGuardian(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!hasDragonInHand(game.players[seat], catalog)) return;
  const minion = sourceMinion(game, seat, cardId);
  if (!minion) return;
  applyStatEffect(minion, 1, 0);
  addKeyword(minion, "taunt");
  addLog(game, `${sourceName} 获得 +1 攻击力和嘲讽。`);
}

function twilightDrake(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const minion = sourceMinion(game, seat, cardId);
  if (!minion) return;
  const bonus = game.players[seat].hand.length;
  applyStatEffect(minion, 0, bonus);
  addLog(game, `${sourceName} 获得 +${bonus} 生命值。`);
}

function onyxianWarder(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!hasDragonInHand(game.players[seat], catalog)) return;
  summonOnyxianWhelps(game, seat, 2, catalog, sourceName);
}

function summonOnyxianWhelps(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const before = game.players[seat].board.length;
  summon(game, seat, "dragon_token_onyxian_whelp", amount, catalog);
  const summoned = game.players[seat].board.length - before;
  if (summoned > 0) addLog(game, `${sourceName} 召唤了 ${summoned} 条奥妮克希亚雏龙。`);
}

function dragonGolem(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const amount = game.players[seat].hand.filter((instance) => hasRace(getCard(catalog, instance.cardId), "DRAGON")).length;
  if (amount <= 0) return;
  summon(game, seat, cardId, amount, catalog);
  addLog(game, `${sourceName} 根据手牌中的龙牌复制了自己。`);
}

function primordialDrake(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const source = sourceMinion(game, seat, cardId);
  const targets = game.players.flatMap((player) => player.board
    .filter((minion) => minion.instanceId !== source?.instanceId)
    .map((minion) => ({ type: "minion" as const, seat: player.seat, instanceId: minion.instanceId })));
  for (const target of targets) dealDamage(game, target, 2, seat, catalog, false);
  addLog(game, `${sourceName} 对所有其他随从造成了2点伤害。`);
}

function alexstraszaLifebinder(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target) throw new Error("需要选择一个角色。");
  if (target.seat === seat) heal(game, target, 8, catalog);
  else dealDamage(game, target, 8, seat, catalog, false);
  addLog(game, `${sourceName} 的战吼已经生效。`);
}

function deathwingBattlecry(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const source = sourceMinion(game, seat, cardId);
  for (const player of game.players) {
    for (const minion of player.board) {
      if (minion.instanceId !== source?.instanceId) minion.health = 0;
    }
  }
  const discarded = game.players[seat].hand.splice(0);
  game.players[seat].graveyard.push(...discarded.map((instance) => instance.cardId));
  addLog(game, `${sourceName} 消灭了所有其他随从，并弃掉了 ${discarded.length} 张手牌。`);
}

function pullRandomEnemyMinion(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const enemy = game.players[other(seat)];
  if (occupiedBoardSlots(enemy) >= GAME_RULES.maxBoardSize) {
    addLog(game, `${sourceName} 没能拉出随从，敌方战场已满。`);
    return;
  }
  const minionOptions = enemy.hand.filter((instance) => getCard(catalog, instance.cardId).type === "minion");
  if (minionOptions.length === 0) {
    addLog(game, `${sourceName} 没能拉出随从，敌方手牌中没有随从。`);
    return;
  }
  const random = rng(game.seed + game.turn * 97 + enemy.hand.length * 17);
  const chosen = minionOptions[Math.floor(random() * minionOptions.length)];
  const index = enemy.hand.findIndex((instance) => instance.instanceId === chosen.instanceId);
  enemy.hand.splice(index, 1);
  enemy.board.push(createBoardMinion({ ...chosen, owner: enemy.seat }, getCard(catalog, chosen.cardId), game.turn));
  addLog(game, `${sourceName} 从 ${enemy.nickname} 的手牌拉出了 ${getCard(catalog, chosen.cardId).name}。`);
}

function applyRuleChoice(game: GameState, seat: Seat, optionCard: CardDefinition, sourceInstanceId: string | undefined, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const source = sourceInstanceId ? game.players[seat].board.find((minion) => minion.instanceId === sourceInstanceId) : undefined;
  if (hasRule(optionCard, "priest_okani_minion") || hasRule(optionCard, "priest_okani_spell")) {
    if (!source) throw new Error("剑圣奥卡尼已经不在战场。");
    source.counterNextCardType = hasRule(optionCard, "priest_okani_minion") ? "minion" : "spell";
    addLog(game, `${getCard(catalog, source.cardId).name} 准备反制下一张敌方${source.counterNextCardType === "minion" ? "随从牌" : "法术牌"}。`);
  }
  if (hasRule(optionCard, "priest_amanthul_copy")) {
    amanthulCopy(game, seat, target, catalog, optionCard.name);
    discoverLegendaryMinionToHand(game, seat, catalog, "阿曼苏尔");
  }
  if (hasRule(optionCard, "priest_amanthul_summon")) {
    amanthulSummon(game, seat, catalog, optionCard.name);
    discoverLegendaryMinionToHand(game, seat, catalog, "阿曼苏尔");
  }
  if (hasRule(optionCard, "priest_yogg_control")) {
    yoggMindControl(game, seat, target, catalog, optionCard.name);
    yoggRandomSpells(game, seat, catalog, "脱困古神尤格-萨隆");
  }
  if (hasRule(optionCard, "priest_yogg_tendrils")) {
    yoggTendrils(game, seat, catalog, optionCard.name);
    yoggRandomSpells(game, seat, catalog, "脱困古神尤格-萨隆");
  }
  if (hasRule(optionCard, "priest_yogg_madness")) {
    yoggMadness(game, seat, catalog, optionCard.name);
    yoggRandomSpells(game, seat, catalog, "脱困古神尤格-萨隆");
  }
  if (hasRule(optionCard, "dragon_guff_ramp")) gainEmptyMana(game, seat, 1, optionCard.name);
  if (hasRule(optionCard, "dragon_bob_freeze")) freezeEnemyMinions(game, seat, catalog, optionCard.name);
  if (hasRule(optionCard, "dragon_bob_recruit")) recruitEnemyMinion(game, seat, target, catalog, optionCard.name);
  if (hasRule(optionCard, "dragon_bob_refresh")) bobRefreshTavern(game, seat, catalog, optionCard.name);
  if (hasRule(optionCard, "dragon_bob_triple")) bobFindTriple(game, seat, catalog, optionCard.name);
  if (hasRule(optionCard, "dragon_timewinder_attack")) timewindOtherMinions(game, sourceInstanceId, catalog, "attack");
  if (hasRule(optionCard, "dragon_timewinder_health")) timewindOtherMinions(game, sourceInstanceId, catalog, "health");
  if (hasRule(optionCard, "hunter_companion_misha")) summonAnimalCompanionCard(game, seat, catalog, optionCard.name, "companion_token_misha");
  if (hasRule(optionCard, "hunter_companion_leokk")) summonAnimalCompanionCard(game, seat, catalog, optionCard.name, "companion_token_leokk");
  if (hasRule(optionCard, "hunter_companion_huffer")) summonAnimalCompanionCard(game, seat, catalog, optionCard.name, "companion_token_huffer");
  if (hasRule(optionCard, "dragon_eonar_draw")) {
    drawUntilFull(game, seat, catalog);
    summon(game, seat, "dragon_token_eonar_tree", 1, catalog);
  }
  if (hasRule(optionCard, "dragon_eonar_heal")) {
    heal(game, { type: "hero", seat }, game.players[seat].hero.maxHealth, catalog);
    summon(game, seat, "dragon_token_eonar_tree", 1, catalog);
  }
  if (hasRule(optionCard, "dragon_eonar_refresh")) {
    refreshMana(game, seat, game.players[seat].maxMana, optionCard.name);
    summon(game, seat, "dragon_token_eonar_tree", 1, catalog);
  }
}

function raiseDead(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const deadMinions = player.graveyard
    .map((cardId) => getCard(catalog, cardId))
    .filter((card) => card.type === "minion")
    .slice(-2);
  for (const card of deadMinions) addCardToHand(game, seat, createInstance(card.id, seat), catalog, `取回了 ${card.name}。`);
  dealDamage(game, { type: "hero", seat }, 3, seat, catalog, false);
}

function swapHandWithDeckBottom(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const oldHand = player.hand;
  const replacement = player.deck.splice(Math.max(0, player.deck.length - oldHand.length));
  player.deck.push(...oldHand);
  player.hand = replacement;
  addLog(game, `${sourceName} 让 ${player.nickname} 将手牌与牌库底部的 ${replacement.length} 张牌交换。`);
}

function addHighlanderAnswer(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (hasDuplicateCardIds(game.players[seat].deck)) {
    addLog(game, `${sourceName} 检查后发现牌库仍有重复牌。`);
    return;
  }
  addCardToHand(game, seat, createInstance("reno_token_wish", seat), catalog, "获得了一张应急愿望。");
}

function buffKaldoreiSpirit(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  if (!game.players[seat].hero.heroPowerUsed) return;
  const spirit = [...game.players[seat].board].reverse().find((minion) => minion.cardId === card.id);
  if (spirit) buff(game, { type: "minion", seat, instanceId: spirit.instanceId }, 3, 3, catalog);
}

function identityTheft(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const enemy = game.players[other(seat)];
  copyRandomCards(game, seat, enemy.hand, 1, catalog, "盗用了手牌");
  copyRandomCards(game, seat, enemy.deck, 1, catalog, "盗用了牌库资源");
}

function swapHands(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const enemy = game.players[other(seat)];
  const friendly = player.hand.map((card) => ({ ...card, owner: enemy.seat }));
  player.hand = enemy.hand.map((card) => ({ ...card, owner: player.seat }));
  enemy.hand = friendly;
  addLog(game, `${sourceName} 交换了 ${player.nickname} 与 ${enemy.nickname} 的手牌。`);
}

function hysteria(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  let attacker = findMinion(game, target);
  if (!attacker) throw new Error("狂乱目标已经离开战场。");
  for (let attackCount = 0; attackCount < 20 && attacker.health > 0; attackCount += 1) {
    const otherMinions = game.players
      .flatMap((player) => player.board.map((minion) => ({ seat: player.seat, minion })))
      .filter((item) => item.minion.instanceId !== attacker?.instanceId);
    if (otherMinions.length === 0) break;
    const random = rng(game.seed + game.turn * 173 + attackCount * 31 + attacker.instanceId.length);
    const defender = otherMinions[Math.floor(random() * otherMinions.length)];
    const defenderTarget: TargetRef = { type: "minion", seat: defender.seat, instanceId: defender.minion.instanceId };
    dealDamage(game, defenderTarget, attacker.attack, seat, catalog, attacker.keywords.includes("lifesteal"));
    dealDamage(game, target, defender.minion.attack, defender.seat, catalog, defender.minion.keywords.includes("lifesteal"));
    cleanupDeaths(game, catalog);
    attacker = findMinion(game, target);
    if (!attacker) break;
  }
  addLog(game, `${sourceName} 让一个随从陷入狂乱。`);
}

function discountPriestHeroPower(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  if (hasDuplicateCardIds(player.deck)) {
    addLog(game, `${sourceName} 检查后发现牌库仍有重复牌。`);
    return;
  }
  player.hero.heroPowerCost = 0;
  addLog(game, `${player.nickname} 的英雄技能消耗变为 0。`);
}

function drawMagathaCards(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const enemySeat = other(seat);
  for (let count = 0; count < 5; count += 1) {
    const drawn = player.deck.shift();
    if (!drawn) {
      drawCards(game, seat, 1, catalog, true);
      continue;
    }
    const card = getCard(catalog, drawn.cardId);
    if (card.type === "spell") addCardToHand(game, enemySeat, { ...drawn, owner: enemySeat }, catalog, `从 ${sourceName} 收下了 ${card.name}。`);
    else addCardToHand(game, seat, drawn, catalog, `抽到了 ${card.name}。`);
  }
}

function copyRandomDeckCard(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  copyRandomCards(game, seat, game.players[other(seat)].deck, 1, catalog, `${sourceName} 复制了牌库资源`);
}

function stealSerenaStats(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error(`${sourceName} 需要选择一个敌方随从。`);
  const victim = findMinion(game, target);
  const serena = [...game.players[seat].board].reverse().find((minion) => minion.cardId === "reno_priest_serena");
  if (!victim || !serena) throw new Error(`${sourceName} 没有可偷取的属性。`);
  let stolenAttack = 0;
  while (victim.attack > 0 && serena.attack <= victim.attack) {
    applyStatEffect(victim, -1, 0);
    applyStatEffect(serena, 1, 0);
    stolenAttack += 1;
  }

  let stolenHealth = 0;
  while (victim.health > 0 && serena.health <= victim.health) {
    applyStatEffect(victim, 0, -1);
    applyStatEffect(serena, 0, 1);
    stolenHealth += 1;
  }
  addLog(game, `${sourceName} 从 ${targetName(game, target, catalog)} 偷取了 ${stolenAttack}/${stolenHealth}。`);
}

function taxNextSpells(game: GameState, seat: Seat, amount: number, sourceName: string): void {
  const player = game.players[seat];
  const next = { amount, throughTurn: game.turn + 1 };
  if (!player.spellCostIncrease || player.spellCostIncrease.amount < amount || player.spellCostIncrease.throughTurn < next.throughTurn) {
    player.spellCostIncrease = next;
  }
  addLog(game, `${sourceName} 让 ${player.nickname} 下个回合的法术消耗增加 ${amount}。`);
}

function discoverEnemyHandCopy(game: GameState, seat: Seat, sourceName: string): void {
  const enemyHand = game.players[other(seat)].hand;
  if (enemyHand.length === 0) {
    addLog(game, `${sourceName} 没有找到可复制的敌方手牌。`);
    return;
  }
  const random = rng(game.seed + game.turn * 197 + seat * 31 + enemyHand.length);
  const pool = [...enemyHand];
  const options: CardInstance[] = [];
  while (pool.length > 0 && options.length < 3) {
    const index = Math.floor(random() * pool.length);
    const [picked] = pool.splice(index, 1);
    options.push(picked);
  }
  beginChoice(game, seat, "copy_enemy_hand", "从三张敌方手牌中选择一张复制加入你的手牌。", options);
}

function copyRandomSpell(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const spells = game.players[other(seat)].deck.filter((instance) => getCard(catalog, instance.cardId).type === "spell");
  copyRandomCards(game, seat, spells, 1, catalog, `${sourceName} 复制了敌方法术`);
}

function benevolentBanker(game: GameState, seat: Seat, instance: CardInstance, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const quickdraw = instance.drawnTurn === game.turn;
  const sourceSeat = quickdraw ? other(seat) : seat;
  const spells = game.players[sourceSeat].deck.filter((deckCard) => getCard(catalog, deckCard.cardId).type === "spell");
  discoverCardCopies(game, seat, spells, catalog, quickdraw ? `${sourceName} 从敌方牌库发现一张法术。` : `${sourceName} 从己方牌库发现一张法术。`);
}

function discoverCardCopies(game: GameState, seat: Seat, source: CardInstance[], catalog: Map<string, CardDefinition>, prompt: string, amount = 3, copiesToAdd = 1): void {
  const options = discoverInstanceOptions(game, seat, source, amount).map((option) => createInstance(option.cardId, seat));
  if (options.length === 0) {
    addLog(game, `${prompt} 但没有可选目标。`);
    return;
  }
  beginChoice(game, seat, "discover_to_hand", prompt, options, undefined, undefined, copiesToAdd);
}

function discoverInstanceOptions(game: GameState, seat: Seat, source: CardInstance[], amount: number): CardInstance[] {
  const random = rng(game.seed + game.turn * 617 + seat * 107 + source.length * 3 + game.logs.length);
  const pool = [...source];
  const options: CardInstance[] = [];
  while (pool.length > 0 && options.length < amount) {
    const [picked] = pool.splice(Math.floor(random() * pool.length), 1);
    options.push(picked);
  }
  return options;
}

function mend(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  const minion = findMinion(game, target);
  if (!minion) throw new Error("治疗目标已经离开战场。");
  heal(game, target, Math.max(0, minion.maxHealth - minion.health), catalog);
  drawCards(game, seat, 1, catalog, true);
}

function powerWordBarrier(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target) throw new Error(`${sourceName} 需要选择一个角色。`);
  if (target.type === "minion") {
    const minion = findMinion(game, target);
    if (!minion) throw new Error("目标随从已经离开战场。");
    addKeyword(minion, "divine_shield");
    addLog(game, `${targetName(game, target, catalog)} 获得圣盾。`);
  } else {
    game.players[target.seat].hero.armor += 2;
    addLog(game, `${targetName(game, target, catalog)} 获得 2 点护甲。`);
  }
  buffMinionsInHand(game, seat, 0, 2, catalog, sourceName);
}

function creationProtocol(game: GameState, seat: Seat, instance: CardInstance, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const minions = player.deck.filter((deckCard) => getCard(catalog, deckCard.cardId).type === "minion");
  const copies = instance.forged ? 2 : 1;
  discoverCardCopies(game, seat, minions, catalog, `${sourceName} 发现你牌库中一个随从的复制。`, 3, copies);
}

function shadowWordDeath(game: GameState, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  const minion = findMinion(game, target);
  if (!minion || minion.attack < 5) throw new Error(`${sourceName} 只能消灭攻击力至少为 5 的随从。`);
  destroy(game, target, catalog);
}

function powerChordSynchronize(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  const minion = findMinion(game, target);
  if (!minion) throw new Error("同步目标已经离开战场。");
  const copy = createInstance(minion.cardId, seat);
  if (game.players[seat].mana === 0) {
    buff(game, target, 1, 2, catalog);
    copy.attackOverride = minion.attack + 1;
    copy.healthOverride = minion.maxHealth + 2;
  }
  addCardToHand(game, seat, copy, catalog, `获得了 ${getCard(catalog, minion.cardId).name} 的复制。`);
}

function prepareNextSpell(game: GameState, seat: Seat, sourceName: string): void {
  game.players[seat].nextSpellDiscount = { amount: 3, throughTurn: game.turn };
  addLog(game, `${sourceName} 使下一个法术的法力值消耗减少（3）点。`);
}

function activateQuestRogue(game: GameState, seat: Seat, card: CardDefinition): void {
  const player = game.players[seat];
  player.quest = {
    cardId: card.id,
    name: card.name,
    progress: 0,
    required: 4,
    completed: false,
    rewardCardId: "quest_rogue_crystal_core",
    playedMinionNames: {}
  };
  addLog(game, `${player.nickname} 开始任务：${card.name}（0/4）。`);
}

function trackQuestMinionPlayed(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  const quest = game.players[seat].quest;
  if (!quest || quest.completed || quest.cardId !== "quest_rogue_the_caverns_below") return;
  const nextCount = (quest.playedMinionNames[card.name] ?? 0) + 1;
  quest.playedMinionNames[card.name] = nextCount;
  const nextProgress = Math.min(quest.required, Math.max(quest.progress, nextCount));
  if (nextProgress <= quest.progress) return;
  quest.progress = nextProgress;
  quest.lastProgressCardName = card.name;
  const entry = addLog(game, `任务进度提升：${quest.name} - ${card.name} ${quest.progress}/${quest.required}。`);
  quest.lastProgressLogId = entry.id;
  if (quest.progress >= quest.required) {
    quest.completed = true;
    addLog(game, `${quest.name} 完成，奖励 ${getCard(catalog, quest.rewardCardId).name}。`);
    addCardToHand(game, seat, createInstance(quest.rewardCardId, seat), catalog, `获得了任务奖励 ${getCard(catalog, quest.rewardCardId).name}。`);
  }
}

function returnFriendlyMinionToHand(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string, costAdjustment: number): void {
  if (!target || target.type !== "minion" || target.seat !== seat) throw new Error(`${sourceName} 需要选择一个友方随从。`);
  const player = game.players[seat];
  const index = player.board.findIndex((minion) => minion.instanceId === target.instanceId);
  if (index < 0) throw new Error(`${sourceName} 的目标已经离开战场。`);
  const [minion] = player.board.splice(index, 1);
  const card = getCard(catalog, minion.cardId);
  const returned = createInstance(minion.cardId, seat);
  if (costAdjustment !== 0) returned.costOverride = Math.max(0, card.cost + costAdjustment);
  addCardToHand(game, seat, returned, catalog, `${sourceName} 将 ${card.name} 移回了手牌。`);
}

function addRandomOpponentClassCard(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const opponentClass = game.players[other(seat)].class;
  const pool = [...catalog.values()].filter((card) => card.collectible && card.type !== "hero_power" && card.class === opponentClass);
  if (pool.length === 0) {
    addLog(game, `${sourceName} 没有找到对手职业的可生成卡牌。`);
    return;
  }
  const random = rng(game.seed + game.turn * 887 + seat * 131 + pool.length + game.logs.length);
  const picked = pool[Math.floor(random() * pool.length)];
  addCardToHand(game, seat, createInstance(picked.id, seat), catalog, `${sourceName} 获得了对手职业卡牌 ${picked.name}。`);
}

function maybeSummonPatches(game: GameState, seat: Seat, playedCard: CardDefinition, catalog: Map<string, CardDefinition>): void {
  if (!hasRace(playedCard, "PIRATE") || hasRule(playedCard, "rogue_patches")) return;
  const player = game.players[seat];
  if (occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) return;
  const index = player.deck.findIndex((instance) => instance.cardId === "quest_rogue_patches");
  if (index < 0) return;
  const [patches] = player.deck.splice(index, 1);
  const card = getCard(catalog, patches.cardId);
  const minion = createBoardMinion(applyCrystalCoreToInstance(game, seat, patches, catalog), card, game.turn);
  player.board.push(minion);
  addLog(game, `${card.name} 从牌库中冲上了战场。`);
}

function backstab(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  const minion = findMinion(game, target);
  if (!minion || minion.health < minion.maxHealth) throw new Error(`${sourceName} 只能以未受伤的随从为目标。`);
  dealDamage(game, target, 2, seat, catalog, false);
}

function eviscerate(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target) throw new Error(`${sourceName} 需要选择一个目标。`);
  const amount = game.players[seat].comboActiveForCurrentCard ? 4 : 2;
  dealDamage(game, target, amount, seat, catalog, false);
  addLog(game, `${sourceName} 造成了 ${amount} 点伤害。`);
}

function mimicPod(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const drawn = player.deck.shift();
  if (!drawn) {
    drawCards(game, seat, 1, catalog, true);
    return;
  }
  countCeaselessEvent(game, "抽牌");
  const handCard = applyCrystalCoreToInstance(game, seat, { ...drawn, drawnTurn: game.turn }, catalog);
  addCardToHand(game, seat, handCard, catalog, `${sourceName} 抽到了 ${getCard(catalog, drawn.cardId).name}。`);
  addCardToHand(game, seat, cloneGeneratedChoiceOption(handCard, seat), catalog, `${sourceName} 复制了 ${getCard(catalog, drawn.cardId).name}。`);
}

function addFlameElementals(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (let index = 0; index < amount; index += 1) {
    addCardToHand(game, seat, createInstance("quest_rogue_flame_elemental", seat), catalog, `${sourceName} 产生了 ${getCard(catalog, "quest_rogue_flame_elemental").name}。`);
  }
}

function activateCrystalCore(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  player.crystalCoreActive = true;
  for (const minion of player.board) setBoardMinionToCrystalCore(minion);
  for (const instance of player.hand) applyCrystalCoreToInstance(game, seat, instance, catalog);
  for (const instance of player.deck) applyCrystalCoreToInstance(game, seat, instance, catalog);
  addLog(game, `${sourceName} 生效：本局对战剩余时间内，${player.nickname} 的随从变为5/5。`);
}

function applyCrystalCoreToInstance(game: GameState, seat: Seat, instance: CardInstance, catalog: Map<string, CardDefinition>): CardInstance {
  if (!game.players[seat].crystalCoreActive) return instance;
  const card = getCard(catalog, instance.cardId);
  if (card.type !== "minion") return instance;
  instance.attackOverride = 5;
  instance.healthOverride = 5;
  return instance;
}

function setBoardMinionToCrystalCore(minion: BoardMinion): void {
  minion.attack = 5;
  minion.health = 5;
  minion.maxHealth = 5;
  minion.attackOverride = 5;
  minion.healthOverride = 5;
  minion.statEffects = { attack: 0, health: 0 };
}

function twilightTorrent(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target) throw new Error(`${sourceName} 需要选择一个角色。`);
  if (target.seat === seat) heal(game, target, 6, catalog);
  else dealDamage(game, target, 3, seat, catalog, false);
}

function shadowWordRuin(game: GameState, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const player of game.players) {
    for (const minion of [...player.board]) {
      if (minion.attack >= 5) destroy(game, { type: "minion", seat: player.seat, instanceId: minion.instanceId }, catalog);
    }
  }
  addLog(game, `${sourceName} 消灭了所有大型随从。`);
}

function repackageMinions(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const packedCardIds: string[] = [];
  for (const player of game.players) {
    const packed = player.board.splice(0);
    for (const minion of packed) {
      packedCardIds.push(minion.cardId);
      player.graveyard.push(minion.cardId);
      countCeaselessEvent(game, "随从被摧毁");
    }
  }
  if (packedCardIds.length === 0) {
    addLog(game, `${sourceName} 没有打包任何随从。`);
    return;
  }
  const box = { ...createInstance("reno_token_repackaged_box", other(seat)), storedCardIds: packedCardIds };
  game.players[other(seat)].deck.push(box);
  shuffle(game.players[other(seat)].deck, rng(game.seed + game.turn * 653 + packedCardIds.length));
  addLog(game, `${sourceName} 将 ${packedCardIds.length} 个随从塞进箱子并洗入对手牌库。`);
}

function openRepackagedBox(game: GameState, seat: Seat, instance: CardInstance, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const stored = instance.storedCardIds ?? [];
  for (const cardId of stored) {
    if (getCard(catalog, cardId).type === "minion") addCardToHand(game, seat, createInstance(cardId, seat, "generated"), catalog, `从 ${sourceName} 取回了 ${getCard(catalog, cardId).name}。`);
  }
  addLog(game, `${sourceName} 将 ${stored.length} 个被打包的随从放入手牌。`);
}

function dragonfirePotion(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const player of game.players) {
    for (const minion of [...player.board]) {
      if (!hasRace(getCard(catalog, minion.cardId), "DRAGON")) dealDamage(game, { type: "minion", seat: player.seat, instanceId: minion.instanceId }, 5, seat, catalog, false);
    }
  }
  addLog(game, `${sourceName} 灼烧了所有非龙随从。`);
}

function harmonicPop(game: GameState, seat: Seat, damage: number, popstarCardId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const player of game.players) {
    for (const minion of [...player.board]) {
      dealDamage(game, { type: "minion", seat: player.seat, instanceId: minion.instanceId }, damage, seat, catalog, false);
    }
  }
  cleanupDeaths(game, catalog);
  summon(game, seat, popstarCardId, 1, catalog);
  addLog(game, `${sourceName} 对所有随从造成 ${damage} 点伤害并召唤流行歌星。`);
}

function lightbomb(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const player of game.players) {
    for (const minion of [...player.board]) dealDamage(game, { type: "minion", seat: player.seat, instanceId: minion.instanceId }, minion.attack, seat, catalog, false);
  }
  addLog(game, `${sourceName} 对每个随从造成了等同于其攻击力的伤害。`);
}

function beginVoljinSwap(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要先选择一个随从。`);
  const first = findMinion(game, target);
  if (!first) throw new Error("第一个沃金目标已经离开战场。");
  const options = game.players.flatMap((player) => player.board.filter((minion) => minion.instanceId !== first.instanceId));
  if (options.length === 0) {
    addLog(game, `${sourceName} 没有第二个随从可交换。`);
    return;
  }
  beginChoice(game, seat, "voljin_second_minion", "选择第二个随从与第一个随从交换属性值。", options, first.instanceId);
}

function resolveVoljinSwap(game: GameState, seat: Seat, firstInstanceId: string | undefined, secondInstanceId: string, catalog: Map<string, CardDefinition>): void {
  const first = firstInstanceId ? findAnyBoardMinion(game, firstInstanceId) : undefined;
  const second = findAnyBoardMinion(game, secondInstanceId);
  if (!first || !second) throw new Error("沃金的目标已经离开战场。");
  [first.minion.attack, second.minion.attack] = [second.minion.attack, first.minion.attack];
  [first.minion.health, second.minion.health] = [second.minion.health, first.minion.health];
  [first.minion.maxHealth, second.minion.maxHealth] = [second.minion.maxHealth, first.minion.maxHealth];
  addLog(game, `${game.players[seat].nickname} 交换了 ${getCard(catalog, first.minion.cardId).name} 与 ${getCard(catalog, second.minion.cardId).name} 的属性值。`);
}

function zolaCopy(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== seat) throw new Error(`${sourceName} 需要选择一个友方随从。`);
  const minion = findMinion(game, target);
  if (!minion) throw new Error("佐拉的目标已经离开战场。");
  addCardToHand(game, seat, copyMinionAsCard(minion, seat), catalog, `获得了 ${getCard(catalog, minion.cardId).name} 的金色复制。`);
}

function namelessOne(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  const targetMinion = findMinion(game, target);
  const source = sourceMinion(game, seat, "reno_priest_nameless_one");
  if (!targetMinion || !source) throw new Error(`${sourceName} 没有可复制的目标。`);
  source.cardId = targetMinion.cardId;
  source.attack = 4;
  source.health = 4;
  source.maxHealth = 4;
  source.attackOverride = 4;
  source.healthOverride = 4;
  source.keywords = [...targetMinion.keywords];
  source.silenced = false;
  silence(game, target, catalog);
  addLog(game, `${sourceName} 变成了 ${getCard(catalog, targetMinion.cardId).name} 的 4/4 复制。`);
}

function glowstoneGyreworm(game: GameState, seat: Seat, instance: CardInstance, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const active = instance.drawnTurn === game.turn || Boolean(instance.forged);
  if (!active) return;
  if (!target) throw new Error(`${sourceName} 需要选择伤害目标。`);
  dealDamage(game, target, 5, seat, catalog, true);
  addLog(game, `${sourceName} 的快枪效果造成了 5 点伤害。`);
}

function mindControlTech(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const enemySeat = other(seat);
  const enemy = game.players[enemySeat];
  if (enemy.board.length < 4 || occupiedBoardSlots(game.players[seat]) >= GAME_RULES.maxBoardSize) {
    addLog(game, `${sourceName} 没有找到可夺取的目标。`);
    return;
  }
  const random = rng(game.seed + game.turn * 673 + enemy.board.length);
  const index = Math.floor(random() * enemy.board.length);
  const [stolen] = enemy.board.splice(index, 1);
  stolen.owner = seat;
  delete stolen.titanAbilityUsedTurn;
  if (titanHasRemainingAbilities(stolen, catalog)) stolen.cannotAttack = true;
  game.players[seat].board.push(stolen);
  addLog(game, `${sourceName} 夺取了 ${getCard(catalog, stolen.cardId).name}。`);
}

function twinPerfectZilliax(game: GameState, seat: Seat, instanceId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const source = game.players[seat].board.find((minion) => minion.instanceId === instanceId);
  if (!source || occupiedBoardSlots(game.players[seat]) >= GAME_RULES.maxBoardSize) return;
  const copy: BoardMinion = {
    ...source,
    instanceId: randomUUID(),
    owner: seat,
    summonedTurn: game.turn,
    attacksThisTurn: 0,
    exhausted: !source.keywords.includes("charge"),
    keywords: [...source.keywords],
    statEffects: source.statEffects ? { ...source.statEffects } : { attack: 0, health: 0 }
  };
  game.players[seat].board.push(copy);
  addLog(game, `${sourceName} 召唤了一个复制。`);
}

function ignisWeapon(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!game.players[seat].forgedThisGame) {
    addLog(game, `${sourceName} 检查后发现你本局还没有锻造过卡牌。`);
    return;
  }
  const options = ["reno_choice_ignis_base_1", "reno_choice_ignis_base_5", "reno_choice_ignis_base_10"].map((cardId) => createInstance(cardId, seat));
  beginChoice(game, seat, "ignis_base", "第一步：选择武器费用和基础身材。", options);
}

function chooseIgnisBase(game: GameState, seat: Seat, cardId: string, catalog: Map<string, CardDefinition>): void {
  const base = IGNIS_BASE_OPTIONS[cardId];
  if (!base) throw new Error("伊格尼斯基础武器选项无效。");
  const options = randomCardIdOptions(game, seat, IGNIS_TRAIT_CARD_IDS, 3, "ignis_trait").map((id) => createInstance(id, seat));
  beginChoice(game, seat, "ignis_trait", "第二步：从随机出现的三种武器特性中选择一种。", options, undefined, undefined, undefined, { ...base });
}

function chooseIgnisTrait(game: GameState, seat: Seat, cardId: string, weapon: IgnisWeaponData | undefined, catalog: Map<string, CardDefinition>): void {
  if (!weapon) throw new Error("伊格尼斯武器缺少基础身材。");
  const next: IgnisWeaponData = { ...weapon, keywords: weapon.keywords ? [...weapon.keywords] : [] };
  if (cardId === "reno_choice_ignis_trait_poisonous") next.keywords = [...(next.keywords ?? []), "poisonous"];
  if (cardId === "reno_choice_ignis_trait_lifesteal") next.keywords = [...(next.keywords ?? []), "lifesteal"];
  if (cardId === "reno_choice_ignis_trait_windfury") next.keywords = [...(next.keywords ?? []), "windfury"];
  if (cardId === "reno_choice_ignis_trait_adjacent") next.adjacentDamage = true;
  if (cardId === "reno_choice_ignis_trait_immune") next.immuneWhileAttacking = true;
  const options = randomCardIdOptions(game, seat, IGNIS_SPECIAL_CARD_IDS, 3, "ignis_special").map((id) => createInstance(id, seat));
  beginChoice(game, seat, "ignis_special", "第三步：从随机出现的三种额外效果中选择一种。", options, undefined, undefined, undefined, next);
}

function chooseIgnisSpecial(game: GameState, seat: Seat, cardId: string, weapon: IgnisWeaponData | undefined, catalog: Map<string, CardDefinition>): void {
  if (!weapon) throw new Error("伊格尼斯武器缺少前置选择。");
  const tier = weapon.attack === 2 ? 0 : weapon.attack === 3 ? 1 : 2;
  const summonCosts = [2, 4, 8];
  const damage = [2, 4, 6];
  const draws = [1, 2, 3];
  const deathrattleDamage = [1, 2, 4];
  const armor = [2, 4, 8];
  const next: IgnisWeaponData = { ...weapon, keywords: weapon.keywords ? [...new Set(weapon.keywords)] : undefined };
  let tokenCardId = "reno_token_ignis_weapon";
  if (cardId === "reno_choice_ignis_special_summon") next.afterAttackSummonCost = summonCosts[tier];
  if (cardId === "reno_choice_ignis_special_damage") {
    next.battlecryDamage = damage[tier];
    tokenCardId = "reno_token_ignis_weapon_battlecry";
  }
  if (cardId === "reno_choice_ignis_special_draw") next.afterAttackDraw = draws[tier];
  if (cardId === "reno_choice_ignis_special_deathrattle") next.deathrattleAllEnemyDamage = deathrattleDamage[tier];
  if (cardId === "reno_choice_ignis_special_armor") next.afterAttackArmor = armor[tier];
  addCardToHand(game, seat, {
    ...createInstance(tokenCardId, seat),
    costOverride: tier === 0 ? 1 : tier === 1 ? 5 : 10,
    attackOverride: next.attack,
    healthOverride: next.durability,
    ignisWeapon: next
  }, catalog, "打造了一把自定义武器。");
}

function randomCardIdOptions(game: GameState, seat: Seat, source: string[], amount: number, salt: string): string[] {
  const random = rng(game.seed + game.turn * 719 + seat * 151 + salt.length + source.length);
  const pool = [...source];
  const options: string[] = [];
  while (pool.length > 0 && options.length < amount) {
    const [picked] = pool.splice(Math.floor(random() * pool.length), 1);
    options.push(picked);
  }
  return options;
}

function eliseBadlands(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  if (hasDuplicateCardIds(player.deck)) {
    addLog(game, `${sourceName} 检查后发现牌库仍有重复牌。`);
    return;
  }
  const minions = discoverInstanceOptions(game, seat, player.deck.filter((deckCard) => getCard(catalog, deckCard.cardId).type === "minion"), 4);
  let summoned = 0;
  for (const instance of minions) {
    if (occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) break;
    const card = getCard(catalog, instance.cardId);
    const minion = createBoardMinion({ ...createInstance(instance.cardId, seat), attackOverride: 5, healthOverride: 5 }, card, game.turn);
    applyBeastSummonState(game, seat, minion, card, catalog);
    player.board.push(minion);
    triggerColossalOnSummon(game, seat, card, catalog);
    summoned += 1;
  }
  addLog(game, `${sourceName} 召唤了 ${summoned} 个 5/5 复制。`);
}

function marinManager(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const options = ["reno_token_marin_wand", "reno_token_marin_crown", "reno_token_marin_goblet", "reno_token_marin_kobold"].map((cardId) => createInstance(cardId, seat));
  beginChoice(game, seat, "discover_to_hand", `从 ${sourceName} 的奇妙宝藏中选择一件。`, options);
}

function marinWand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  for (let count = 0; count < 3; count += 1) {
    const drawn = player.deck.shift();
    if (!drawn) {
      drawCards(game, seat, 1, catalog, true);
      continue;
    }
    countCeaselessEvent(game, "抽牌");
    addCardToHand(game, seat, { ...drawn, drawnTurn: game.turn, costOverride: 1 }, catalog, `${sourceName} 抽到了 ${getCard(catalog, drawn.cardId).name}。`);
  }
}

function marinCrown(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const legendary = randomLegendaryMinion(game, seat, catalog, sourceName);
  if (!legendary) return;
  summon(game, seat, legendary.id, 2, catalog);
}

function marinGoblet(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const drawn = player.deck.shift();
  if (!drawn) {
    drawCards(game, seat, 1, catalog, true);
    return;
  }
  countCeaselessEvent(game, "抽牌");
  addCardToHand(game, seat, { ...drawn, drawnTurn: game.turn }, catalog, `${sourceName} 抽到了 ${getCard(catalog, drawn.cardId).name}。`);
  while (player.hand.length < GAME_RULES.maxHandSize) addCardToHand(game, seat, createInstance(drawn.cardId, seat), catalog, `复制了 ${getCard(catalog, drawn.cardId).name}。`);
}

function marinGoldenKobold(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  player.graveyard.push(...player.hand.map((instance) => instance.cardId));
  player.hand = [];
  while (player.hand.length < GAME_RULES.maxHandSize) {
    const legendary = randomLegendaryMinion(game, seat, catalog, sourceName);
    if (!legendary) break;
    addCardToHand(game, seat, { ...createInstance(legendary.id, seat), costOverride: Math.max(0, legendary.cost - 1) }, catalog, `获得了 ${legendary.name}。`);
  }
}

function ceaselessExpanseBattlecry(game: GameState, seat: Seat, sourceInstanceId: string, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const player of game.players) {
    for (const minion of [...player.board]) {
      if (player.seat === seat && minion.instanceId === sourceInstanceId) continue;
      destroy(game, { type: "minion", seat: player.seat, instanceId: minion.instanceId }, catalog);
    }
  }
  addLog(game, `${sourceName} 摧毁了所有其他随从。`);
}

function photographerFizzle(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const snapshotIds = game.players[seat].hand.map((instance) => instance.cardId);
  const snapshot = { ...createInstance("reno_token_fizzle_snapshot", seat), storedCardIds: snapshotIds };
  game.players[seat].deck.push(snapshot);
  shuffle(game.players[seat].deck, rng(game.seed + game.turn * 691 + snapshotIds.length));
  addLog(game, `${sourceName} 将 ${snapshotIds.length} 张手牌拍成快照并洗入牌库。`);
}

function fizzleSnapshot(game: GameState, seat: Seat, instance: CardInstance, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const stored = instance.storedCardIds ?? [];
  for (const cardId of stored) addCardToHand(game, seat, createInstance(cardId, seat), catalog, `从 ${sourceName} 取回了 ${getCard(catalog, cardId).name}。`);
}

function kiljaedenPortal(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  player.deck = [];
  player.kiljaedenPortal = undefined;
  player.specials.push(createBoardSpecial(createInstance("reno_token_kiljaeden_portal", seat), {
    bonus: 0,
    demonCardIds: KILJAEDEN_DEMON_CARD_IDS.filter((cardId) => catalog.has(cardId))
  }));
  refillKiljaedenPortalDeck(game, seat, catalog);
  addLog(game, `${sourceName} 摧毁了牌库，并将其替换为无尽的恶魔传送门。`);
}

function beginKiljaedenPortalChoice(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const portal = player.specials.find((special) => special.cardId === "reno_token_kiljaeden_portal");
  if (!portal) return;
  portal.bonus = (portal.bonus ?? 0) + 2;
  buffKiljaedenDemons(player.hand, 2, catalog);
  buffKiljaedenDemons(player.deck, 2, catalog);
  refillKiljaedenPortalDeck(game, seat, catalog);
  const options = discoverInstanceOptions(game, seat, player.deck.filter((instance) => instance.kiljaedenDemon), 3);
  if (options.length === 0) return;
  beginChoice(game, seat, "kiljaeden_demon", "从恶魔传送门中选择一个恶魔。", options, undefined, undefined, undefined, undefined, true);
}

function chooseKiljaedenDemon(game: GameState, seat: Seat, option: CardInstance, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const index = player.deck.findIndex((instance) => instance.instanceId === option.instanceId);
  const picked = index >= 0 ? player.deck.splice(index, 1)[0] : option;
  addCardToHand(game, seat, { ...picked, owner: seat }, catalog, `从恶魔传送门中选择了 ${getCard(catalog, picked.cardId).name}。`);
  refillKiljaedenPortalDeck(game, seat, catalog);
}

function refillKiljaedenPortalDeck(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const portal = player.specials.find((special) => special.cardId === "reno_token_kiljaeden_portal");
  const demonCardIds = portal?.demonCardIds ?? [];
  const bonus = portal?.bonus ?? 0;
  if (!portal || demonCardIds.length === 0) return;
  const random = rng(game.seed + game.turn * 733 + seat * 167 + player.deck.length + bonus);
  while (player.deck.filter((instance) => instance.kiljaedenDemon).length < 30) {
    const cardId = demonCardIds[Math.floor(random() * demonCardIds.length)];
    const card = getCard(catalog, cardId);
    player.deck.push({
      ...createInstance(cardId, seat),
      attackOverride: (card.attack ?? 0) + bonus,
      healthOverride: (card.health ?? 1) + bonus,
      kiljaedenDemon: true
    });
  }
}

function buffKiljaedenDemons(instances: CardInstance[], amount: number, catalog: Map<string, CardDefinition>): void {
  for (const instance of instances) {
    if (!instance.kiljaedenDemon) continue;
    const card = getCard(catalog, instance.cardId);
    instance.attackOverride = (instance.attackOverride ?? card.attack ?? 0) + amount;
    instance.healthOverride = (instance.healthOverride ?? card.health ?? 1) + amount;
  }
}

function beginAmanthulSecondExile(game: GameState, seat: Seat, sourceInstanceId: string | undefined, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error(`${sourceName} 需要选择一个敌方随从。`);
  const enemy = game.players[other(seat)];
  const first = enemy.board.find((minion) => minion.instanceId === target.instanceId);
  if (!first) throw new Error("阿曼苏尔的第一个目标已经离开战场。");
  const secondOptions = enemy.board.filter((minion) => minion.instanceId !== first.instanceId);
  if (secondOptions.length === 0) {
    removeMinionWithoutDeathrattle(game, target, catalog, sourceName);
    markTitanAbilityUsed(game, seat, sourceInstanceId, "reno_choice_amanthul_exile", catalog);
    discoverLegendaryMinionToHand(game, seat, catalog, "阿曼苏尔");
    delete game.pendingChoice;
    cleanupDeaths(game, catalog);
    return;
  }
  beginChoice(game, seat, "amanthul_second_enemy", "选择第二个敌方随从，将两个目标移出对战。", secondOptions, first.instanceId, sourceInstanceId);
}

function resolveAmanthulSecondExile(game: GameState, seat: Seat, firstInstanceId: string | undefined, secondInstanceId: string, sourceInstanceId: string | undefined, catalog: Map<string, CardDefinition>): void {
  const enemySeat = other(seat);
  if (firstInstanceId) removeMinionWithoutDeathrattle(game, { type: "minion", seat: enemySeat, instanceId: firstInstanceId }, catalog, "阿曼苏尔");
  removeMinionWithoutDeathrattle(game, { type: "minion", seat: enemySeat, instanceId: secondInstanceId }, catalog, "阿曼苏尔");
  markTitanAbilityUsed(game, seat, sourceInstanceId, "reno_choice_amanthul_exile", catalog);
  discoverLegendaryMinionToHand(game, seat, catalog, "阿曼苏尔");
}

function amanthulCopy(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个非泰坦随从。`);
  const targetMinion = findMinion(game, target);
  if (!targetMinion) throw new Error("阿曼苏尔的复制目标已经离开战场。");
  if (titanAbilityIds(getCard(catalog, targetMinion.cardId)).length > 0) throw new Error(`${sourceName} 不能选择泰坦随从。`);
  const player = game.players[seat];
  if (occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) throw new Error("己方战场已满。");
  const card = getCard(catalog, targetMinion.cardId);
  const copy = createBoardMinion({
    ...createInstance(targetMinion.cardId, seat),
    attackOverride: targetMinion.attack + 2,
    healthOverride: targetMinion.maxHealth + 2
  }, card, game.turn);
  player.board.push(copy);
  addLog(game, `${sourceName} 召唤了 ${card.name} 的 +2/+2 复制。`);
}

function amanthulSummon(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  if (occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) throw new Error("己方战场已满。");
  const pool = [...catalog.values()].filter((card) => card.collectible && card.type === "minion" && card.cost === 6);
  if (pool.length === 0) {
    addLog(game, `${sourceName} 没有找到可召唤的 6 费随从。`);
    return;
  }
  const random = rng(game.seed + game.turn * 709 + seat * 137 + pool.length);
  const card = pool[Math.floor(random() * pool.length)];
  const minion = createBoardMinion(createInstance(card.id, seat), card, game.turn);
  addKeyword(minion, "taunt");
  addKeyword(minion, "lifesteal");
  player.board.push(minion);
  addLog(game, `${sourceName} 召唤了具有嘲讽和吸血的 ${card.name}。`);
}

function buffMinionsInHand(game: GameState, seat: Seat, attack: number, health: number, catalog: Map<string, CardDefinition>, sourceName: string): void {
  let count = 0;
  for (const instance of game.players[seat].hand) {
    const card = getCard(catalog, instance.cardId);
    if (card.type !== "minion") continue;
    instance.attackOverride = (instance.attackOverride ?? card.attack ?? 0) + attack;
    instance.healthOverride = (instance.healthOverride ?? card.health ?? 1) + health;
    count += 1;
  }
  addLog(game, `${sourceName} 强化了手牌中的 ${count} 个随从。`);
}

function yoggMindControl(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error(`${sourceName} 需要选择一个敌方随从。`);
  const enemy = game.players[target.seat];
  if (occupiedBoardSlots(game.players[seat]) >= GAME_RULES.maxBoardSize) throw new Error("己方战场已满。");
  const index = enemy.board.findIndex((minion) => minion.instanceId === target.instanceId);
  if (index < 0) throw new Error("尤格-萨隆的目标已经离开战场。");
  const [stolen] = enemy.board.splice(index, 1);
  stolen.owner = seat;
  delete stolen.titanAbilityUsedTurn;
  if (titanHasRemainingAbilities(stolen, catalog)) stolen.cannotAttack = true;
  game.players[seat].board.push(stolen);
  addLog(game, `${sourceName} 夺取了 ${getCard(catalog, stolen.cardId).name}。`);
}

function yoggTendrils(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  let count = 0;
  while (game.players[seat].hand.length < GAME_RULES.maxHandSize) {
    addCardToHand(game, seat, createInstance("reno_token_chaotic_tendril", seat), catalog, "获得了混乱触须。");
    count += 1;
  }
  addLog(game, `${sourceName} 填充了 ${count} 张混乱触须。`);
}

function yoggMadness(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const enemySeat = other(seat);
  const board = [...game.players[enemySeat].board];
  for (const attacker of board) {
    if (!findMinion(game, { type: "minion", seat: enemySeat, instanceId: attacker.instanceId })) continue;
    const defenders = game.players[enemySeat].board.filter((minion) => minion.instanceId !== attacker.instanceId);
    if (defenders.length === 0) break;
    const random = rng(game.seed + game.turn * 727 + attacker.instanceId.length);
    const defender = defenders[Math.floor(random() * defenders.length)];
    dealDamage(game, { type: "minion", seat: enemySeat, instanceId: defender.instanceId }, attacker.attack, enemySeat, catalog, attacker.keywords.includes("lifesteal"));
    dealDamage(game, { type: "minion", seat: enemySeat, instanceId: attacker.instanceId }, defender.attack, enemySeat, catalog, defender.keywords.includes("lifesteal"));
    cleanupDeaths(game, catalog);
  }
  addLog(game, `${sourceName} 让敌方随从陷入狂乱。`);
}

function yoggRandomSpells(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const spells = [
    {
      cast: () => {
        dealRandomEnemyDamage(game, seat, 2, catalog, `${sourceName} 的混乱箭`);
        addLog(game, `${sourceName} 额外施放了混乱箭：随机分配 2 点伤害。`);
      }
    },
    {
      cast: () => {
        const before = game.players[seat].hand.length;
        drawCards(game, seat, 1, catalog, true);
        addLog(game, `${sourceName} 额外施放了洞察：抽了 ${game.players[seat].hand.length - before} 张牌。`);
      }
    },
    {
      cast: () => {
        let hit = 0;
        for (const minion of [...game.players[other(seat)].board]) {
          dealDamage(game, { type: "minion", seat: other(seat), instanceId: minion.instanceId }, 2, seat, catalog, false);
          hit += 1;
        }
        cleanupDeaths(game, catalog);
        addLog(game, `${sourceName} 额外施放了暗影新星：对 ${hit} 个敌方随从造成 2 点伤害。`);
      }
    },
    {
      cast: () => {
        const before = game.players[seat].hero.health;
        heal(game, { type: "hero", seat }, 4, catalog);
        addLog(game, `${sourceName} 额外施放了治疗之触：恢复 ${game.players[seat].hero.health - before} 点生命值。`);
      }
    },
    {
      cast: () => {
        const before = game.players[seat].board.length;
        summon(game, seat, "reno_token_chaotic_tendril", 1, catalog);
        addLog(game, `${sourceName} 额外施放了触须召唤：召唤了 ${game.players[seat].board.length - before} 个混乱触须。`);
      }
    }
  ];
  const random = rng(game.seed + game.turn * 809 + seat * 173 + game.logs.length);
  for (let count = 0; count < 2; count += 1) {
    spells[Math.floor(random() * spells.length)].cast();
  }
}

function addRandomLegendaryMinionToHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const picked = randomLegendaryMinion(game, seat, catalog, sourceName);
  if (picked) addCardToHand(game, seat, createInstance(picked.id, seat), catalog, `${sourceName} 发现了 ${picked.name}。`);
}

function discoverLegendaryMinionToHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  addRandomLegendaryMinionToHand(game, seat, catalog, sourceName);
}

function randomLegendaryMinion(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): CardDefinition | undefined {
  const pool = [...catalog.values()].filter((card) => card.collectible && card.type === "minion" && card.rarity === "legendary");
  if (pool.length === 0) {
    addLog(game, `${sourceName} 没有找到传说随从。`);
    return undefined;
  }
  const random = rng(game.seed + game.turn * 743 + seat * 113 + pool.length + game.logs.length);
  return pool[Math.floor(random() * pool.length)];
}

function copyMinionAsCard(minion: BoardMinion, seat: Seat): CardInstance {
  return {
    ...createInstance(minion.cardId, seat),
    attackOverride: minion.attack,
    healthOverride: minion.maxHealth
  };
}

function cloneGeneratedChoiceOption(option: CardInstance, seat: Seat): CardInstance {
  return {
    ...createInstance(option.cardId, seat),
    costOverride: option.costOverride,
    attackOverride: option.attackOverride,
    healthOverride: option.healthOverride,
    remainingUses: option.remainingUses,
    forged: option.forged,
    storedCardIds: option.storedCardIds ? [...option.storedCardIds] : undefined,
    ignisWeapon: option.ignisWeapon ? { ...option.ignisWeapon, keywords: option.ignisWeapon.keywords ? [...option.ignisWeapon.keywords] : undefined } : undefined,
    kiljaedenDemon: option.kiljaedenDemon
  };
}

function findAnyBoardMinion(game: GameState, instanceId: string): { seat: Seat; minion: BoardMinion } | undefined {
  for (const player of game.players) {
    const minion = player.board.find((item) => item.instanceId === instanceId);
    if (minion) return { seat: player.seat, minion };
  }
  return undefined;
}

function removeMinionWithoutDeathrattle(game: GameState, target: TargetRef, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (target.type !== "minion" || !target.instanceId) throw new Error(`${sourceName} 需要选择一个随从。`);
  const player = game.players[target.seat];
  const index = player.board.findIndex((minion) => minion.instanceId === target.instanceId);
  if (index < 0) return;
  const [removed] = player.board.splice(index, 1);
  player.graveyard.push(removed.cardId);
  countCeaselessEvent(game, "随从被移出对战");
  addLog(game, `${sourceName} 将 ${getCard(catalog, removed.cardId).name} 移出了对战。`);
}

function copyRandomHandCard(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  copyRandomCards(game, seat, game.players[other(seat)].hand, 1, catalog, `${sourceName} 夺取了复制`);
}

function puppetTheatre(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error(`${sourceName} 需要选择一个敌方随从。`);
  const minion = findMinion(game, target);
  if (!minion) throw new Error("复制目标已经离开战场。");
  addCardToHand(game, seat, { ...createInstance(minion.cardId, seat), costOverride: 1, attackOverride: 1, healthOverride: 1 }, catalog, `制作了 ${getCard(catalog, minion.cardId).name} 的 1/1 木偶。`);
}

function borrowEnemyMinion(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error(`${sourceName} 需要选择一个敌方随从。`);
  const enemy = game.players[target.seat];
  const owner = game.players[seat];
  if (occupiedBoardSlots(owner) >= GAME_RULES.maxBoardSize) throw new Error("己方战场已满。");
  const targetIndex = enemy.board.findIndex((minion) => minion.instanceId === target.instanceId);
  const najark = [...owner.board].reverse().find((minion) => minion.cardId === "reno_priest_najark");
  if (targetIndex < 0 || !najark) throw new Error("夺取目标已经离开战场。");
  const [borrowed] = enemy.board.splice(targetIndex, 1);
  borrowed.owner = seat;
  delete borrowed.titanAbilityUsedTurn;
  if (titanHasRemainingAbilities(borrowed, catalog)) borrowed.cannotAttack = true;
  borrowed.borrowedFromSeat = enemy.seat;
  borrowed.borrowedByInstanceId = najark.instanceId;
  owner.board.push(borrowed);
  addLog(game, `${sourceName} 暂时夺取了 ${getCard(catalog, borrowed.cardId).name}。`);
}

function clearEnemyBoard(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const minion of [...game.players[other(seat)].board]) {
    removeMinionWithoutDeathrattle(game, { type: "minion", seat: other(seat), instanceId: minion.instanceId }, catalog, sourceName);
  }
  addLog(game, `${sourceName} 清理了敌方战场。`);
}

function becomeShadowreaper(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const enemy = game.players[other(seat)];
  for (const minion of [...enemy.board]) {
    if (minion.attack >= 5) destroy(game, { type: "minion", seat: enemy.seat, instanceId: minion.instanceId }, catalog);
  }
  game.players[seat].hero.heroPowerCardId = "hero_power_voidform";
  game.players[seat].hero.heroPowerCost ??= 2;
  addLog(game, `${sourceName} 将英雄技能换成了虚空形态。`);
}

function applyRuleHeroPower(game: GameState, seat: Seat, power: CardDefinition, catalog: Map<string, CardDefinition>): void {
  if (hasRule(power, "priest_reno_holy_bullet")) {
    const board = game.players[seat].board;
    if (board.length === 0) {
      addLog(game, `${power.name} 没有可强化的友方随从。`);
    } else {
      const random = rng(game.seed + game.turn * 241 + board.length * 19);
      const minion = board[Math.floor(random() * board.length)];
      buff(game, { type: "minion", seat, instanceId: minion.instanceId }, 2, 2, catalog);
    }
  }
  if (hasRule(power, "priest_reno_nature_bullet")) discoverSpell(game, seat, catalog, power.name);
  if (hasRule(power, "priest_reno_shadow_bullet")) summonRandomThreeCostMinion(game, seat, catalog, power.name);
  if (hasRule(power, "hunter_tracking")) hunterTracking(game, seat);
  if (hasRule(power, "hunter_animal_companion")) summonAnimalCompanionCard(game, seat, catalog, power.name);
}

function equipRenoBullet(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const bullets = renoBulletPowerIds(catalog);
  if (bullets.length === 0) throw new Error("雷诺手枪缺少英雄技能。");
  const random = rng(game.seed + game.turn * 307 + seat * 53);
  game.players[seat].hero.heroPowerCardId = bullets[Math.floor(random() * bullets.length)];
  game.players[seat].hero.heroPowerCost = 2;
}

function rollRenoBullet(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const current = player.hero.heroPowerCardId;
  if (!current?.startsWith("hero_power_reno_bullet_")) return;
  const bullets = renoBulletPowerIds(catalog).filter((cardId) => cardId !== current);
  if (bullets.length === 0) return;
  const random = rng(game.seed + game.turn * 283 + seat * 41 + current.length);
  player.hero.heroPowerCardId = bullets[Math.floor(random() * bullets.length)];
  addLog(game, `${player.nickname} 的雷诺手枪切换为 ${getCard(catalog, player.hero.heroPowerCardId).name}。`);
}

function renoBulletPowerIds(catalog: Map<string, CardDefinition>): string[] {
  return [...catalog.keys()].filter((cardId) => cardId.startsWith("hero_power_reno_bullet_"));
}

function discoverSpell(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const spells = [...catalog.values()].filter((card) => card.collectible && card.type === "spell");
  if (spells.length === 0) {
    addLog(game, `${sourceName} 没有找到可发现的法术。`);
    return;
  }
  const random = rng(game.seed + game.turn * 331 + seat * 67 + spells.length);
  const pool = [...spells];
  const picks: CardInstance[] = [];
  while (pool.length > 0 && picks.length < 3) {
    const index = Math.floor(random() * pool.length);
    const [spell] = pool.splice(index, 1);
    picks.push(createInstance(spell.id, seat));
  }
  beginChoice(game, seat, "discover_to_hand", "从自然子弹发现的法术中选择一张加入手牌。", picks);
}

function summonRandomThreeCostMinion(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const minions = [...catalog.values()].filter((card) => card.collectible && card.type === "minion" && card.cost === 3);
  if (minions.length === 0) {
    addLog(game, `${sourceName} 没有找到可召唤的 3 费随从。`);
    return;
  }
  const random = rng(game.seed + game.turn * 347 + seat * 71 + minions.length);
  summon(game, seat, minions[Math.floor(random() * minions.length)].id, 1, catalog);
}

function damageBothHeroes(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>): void {
  dealDamage(game, { type: "hero", seat }, amount, seat, catalog, false);
  dealDamage(game, { type: "hero", seat: other(seat) }, amount, seat, catalog, false);
}

function beginAvianaCountdown(game: GameState, seat: Seat, sourceName: string): void {
  game.players[seat].avianaCountdown = 3;
  game.players[seat].avianaActive = false;
  addLog(game, `${sourceName} 唤起月相：3 个己方回合后，你的卡牌法力值消耗变为 1。`);
}

function tickAvianaCountdown(game: GameState, seat: Seat): void {
  const player = game.players[seat];
  if (player.avianaActive || player.avianaCountdown === undefined) return;
  player.avianaCountdown -= 1;
  if (player.avianaCountdown <= 0) {
    player.avianaActive = true;
    delete player.avianaCountdown;
    addLog(game, `${player.nickname} 的满月升起，卡牌法力值消耗变为 1。`);
  } else {
    addLog(game, `${player.nickname} 的艾维娜月相还剩 ${player.avianaCountdown} 个己方回合。`);
  }
}

function setHandsToOneMana(game: GameState, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const player of game.players) {
    for (const card of player.hand) card.costOverride = 1;
  }
  addLog(game, `${sourceName} 将双方手牌的消耗变为 1。`);
}

function copyRandomCards(game: GameState, seat: Seat, source: CardInstance[], amount: number, catalog: Map<string, CardDefinition>, prefix: string): void {
  if (source.length === 0) {
    addLog(game, `${prefix}，但没有可复制的牌。`);
    return;
  }
  const random = rng(game.seed + game.turn * 211 + source.length * 13 + game.players[seat].hand.length);
  for (let count = 0; count < amount; count += 1) {
    const chosen = source[Math.floor(random() * source.length)];
    addCardToHand(game, seat, createInstance(chosen.cardId, seat), catalog, `${prefix}：${getCard(catalog, chosen.cardId).name}。`);
  }
}

function returnBorrowedMinions(game: GameState, najarkInstanceId: string, catalog: Map<string, CardDefinition>): void {
  for (const player of game.players) {
    const borrowed = player.board.filter((minion) => minion.borrowedByInstanceId === najarkInstanceId && minion.borrowedFromSeat !== undefined);
    player.board = player.board.filter((minion) => !borrowed.includes(minion));
    for (const minion of borrowed) {
      const originalSeat = minion.borrowedFromSeat!;
      const originalBoard = game.players[originalSeat].board;
      if (occupiedBoardSlots(game.players[originalSeat]) >= GAME_RULES.maxBoardSize) {
        game.players[originalSeat].graveyard.push(minion.cardId);
        addLog(game, `${getCard(catalog, minion.cardId).name} 无处归还，被弃置。`);
        continue;
      }
      minion.owner = originalSeat;
      delete minion.borrowedByInstanceId;
      delete minion.borrowedFromSeat;
      originalBoard.push(minion);
      addLog(game, `${getCard(catalog, minion.cardId).name} 回到了原控制者战场。`);
    }
  }
}

function counterPlayedCard(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>): boolean {
  if (card.type !== "minion" && card.type !== "spell") return false;
  const counter = game.players[other(seat)].board.find((minion) => !minion.silenced && minion.counterNextCardType === card.type);
  if (!counter) return false;
  delete counter.counterNextCardType;
  addLog(game, `${getCard(catalog, counter.cardId).name} 反制了 ${card.name}。`);
  return true;
}

function isSecretCard(card: CardDefinition): boolean {
  return Boolean(card.rules?.some((rule) =>
    rule === "mage_secret_ice_block" ||
    rule === "mage_secret_ice_barrier" ||
    rule.startsWith("hunter_secret_")
  ));
}

function triggerSecret(game: GameState, seat: Seat, rule: NonNullable<CardDefinition["rules"]>[number], catalog: Map<string, CardDefinition>): CardDefinition | undefined {
  const player = game.players[seat];
  const index = player.secrets.findIndex((secret) => hasRule(getCard(catalog, secret.cardId), rule));
  if (index < 0) return undefined;
  const [secret] = player.secrets.splice(index, 1);
  player.graveyard.push(secret.cardId);
  const card = getCard(catalog, secret.cardId);
  revealSecretPlayedCardEntry(game, secret.instanceId, card);
  addPlayedCardEntry(game, {
    seat,
    cardId: card.id,
    cardName: card.name,
    cardType: card.type,
    cardCost: card.cost,
    sourceInstanceId: secret.instanceId,
    kind: "secret_triggered",
    revealed: true
  });
  return card;
}

function triggerOpponentSpellSecrets(game: GameState, casterSeat: Seat, instance: CardInstance, card: CardDefinition, catalog: Map<string, CardDefinition>): boolean {
  const secretSeat = other(casterSeat);
  const secret = triggerSecret(game, secretSeat, "hunter_secret_improved_frost_trap", catalog);
  if (!secret) return false;
  addCardToHand(game, casterSeat, { ...instance, owner: casterSeat, costOverride: (instance.costOverride ?? card.cost ?? 0) + 2 }, catalog, `${secret.name} 触发：${card.name} 被移回手牌，法力值消耗增加（2）点。`);
  return true;
}

function triggerHunterAttackSecrets(game: GameState, attackerSeat: Seat, source: TargetRef, target: TargetRef, catalog: Map<string, CardDefinition>): boolean {
  const defenderSeat = target.seat;
  if (target.type === "hero") triggerImprovedExplosiveTrap(game, defenderSeat, catalog);
  if (target.type === "minion") {
    triggerImprovedSnakeTrap(game, defenderSeat, catalog);
    triggerImprovedPackTactics(game, defenderSeat, target, catalog);
  }
  cleanupDeaths(game, catalog);
  if (source.type === "minion" && !findMinion(game, source)) return true;
  if (target.type === "minion" && !findMinion(game, target)) return true;
  return game.phase === "finished";
}

function triggerImprovedExplosiveTrap(game: GameState, secretSeat: Seat, catalog: Map<string, CardDefinition>): void {
  const secret = triggerSecret(game, secretSeat, "hunter_secret_improved_explosive_trap", catalog);
  if (!secret) return;
  const enemySeat = other(secretSeat);
  const targets = [{ type: "hero" as const, seat: enemySeat }, ...game.players[enemySeat].board.map((minion) => ({ type: "minion" as const, seat: enemySeat, instanceId: minion.instanceId }))];
  for (const target of targets) dealDamage(game, target, 2, secretSeat, catalog, false);
  addLog(game, `${secret.name}触发：对所有敌人造成2点伤害。`);
}

function triggerImprovedSnakeTrap(game: GameState, secretSeat: Seat, catalog: Map<string, CardDefinition>): void {
  const secret = triggerSecret(game, secretSeat, "hunter_secret_improved_snake_trap", catalog);
  if (!secret) return;
  summon(game, secretSeat, "hunter_token_improved_snake", 3, catalog);
  addLog(game, `${secret.name}触发：召唤三条2/2的蛇。`);
}

function triggerImprovedPackTactics(game: GameState, secretSeat: Seat, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  const attacked = findMinion(game, target);
  if (!attacked) return;
  const secret = triggerSecret(game, secretSeat, "hunter_secret_improved_pack_tactics", catalog);
  if (!secret) return;
  const card = getCard(catalog, attacked.cardId);
  let summoned = 0;
  for (let count = 0; count < 2; count += 1) {
    if (occupiedBoardSlots(game.players[secretSeat]) >= GAME_RULES.maxBoardSize) break;
    const copy = createBoardMinion({ ...createInstance(attacked.cardId, secretSeat), attackOverride: 3, healthOverride: 3 }, card, game.turn);
    game.players[secretSeat].board.push(copy);
    summoned += 1;
  }
  addLog(game, `${secret.name}触发：召唤了 ${summoned} 个 ${card.name} 的3/3复制。`);
}

function triggerImprovedOpenTheCages(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  if (occupiedBoardSlots(game.players[seat]) < 2) return;
  const secret = triggerSecret(game, seat, "hunter_secret_improved_open_the_cages", catalog);
  if (!secret) return;
  summonAnimalCompanionCard(game, seat, catalog, secret.name);
  summonAnimalCompanionCard(game, seat, catalog, secret.name);
  addLog(game, `${secret.name}触发：召唤两个动物伙伴。`);
}

function triggerIceBarrier(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const secret = triggerSecret(game, seat, "mage_secret_ice_barrier", catalog);
  if (!secret) return;
  game.players[seat].hero.armor += 8;
  addLog(game, `${secret.name}触发：${game.players[seat].nickname} 获得8点护甲。`);
}

function triggerIceBlock(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): boolean {
  const secret = triggerSecret(game, seat, "mage_secret_ice_block", catalog);
  if (!secret) return false;
  game.players[seat].hero.immuneUntilTurn = game.turn;
  addLog(game, `${secret.name}触发：防止了致命伤害，${game.players[seat].nickname} 本回合免疫。`);
  return true;
}

function heroPower(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  if (player.hero.heroPowerUsed) throw new Error("本回合已经使用过英雄技能。");
  const power = getCard(catalog, player.hero.heroPowerCardId ?? `hero_power_${player.class}`);
  const cost = heroPowerCost(game, seat, power, catalog);
  if (player.mana < cost) throw new Error("法力不足。");
  if (cardNeedsTarget(power) && !target) throw new Error("英雄技能需要选择目标。");
  player.mana -= cost;
  player.hero.heroPowerUsed = true;
  addPlayedCardEntry(game, {
    seat,
    cardId: power.id,
    cardName: power.name,
    cardType: power.type,
    cardCost: cost,
    kind: "hero_power",
    revealed: true
  });
  addLog(game, `${player.nickname} 使用了英雄技能 ${power.name}。`);
  applyEffects(game, { sourceCard: power, sourceOwner: seat, selectedTarget: target, trigger: "hero_power" }, catalog);
  applyRuleHeroPower(game, seat, power, catalog);
  beginCardChoice(game, seat, power, catalog);
  if (player.board.some((minion) => !minion.silenced && hasRule(getCard(catalog, minion.cardId), "priest_spawn_of_shadows"))) {
    damageBothHeroes(game, seat, 4, catalog);
  }
  triggerBeastInspire(game, seat, catalog);
  cleanupDeaths(game, catalog);
}

function attack(game: GameState, actorSeat: Seat, source: TargetRef, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  if (source.seat !== actorSeat) throw new Error("只能操作自己的角色。");
  if (target.seat === actorSeat) throw new Error("不能攻击己方角色。");
  enforceTaunt(game, actorSeat, target, catalog);
  if (isUntouchableTarget(game, target, catalog)) throw new Error("这个随从无法被攻击。");

  if (source.type === "hero") {
    const player = game.players[actorSeat];
    const weapon = player.hero.weapon;
    const heroAttack = (weapon?.attack ?? 0) + player.hero.temporaryAttack;
    if ((player.hero.frozenUntilTurn ?? -1) >= game.turn) throw new Error("英雄被冻结，不能攻击。");
    if (heroAttack <= 0) throw new Error("英雄没有可用攻击力。");
    const heroAttackLimit = weapon?.keywords?.includes("windfury") ? 2 : 1;
    if (player.hero.attacksThisTurn >= heroAttackLimit) throw new Error("英雄本回合已经攻击过。");
    const defender = getTarget(game, target);
    const adjacentTargets = weapon?.ignisWeapon?.adjacentDamage && target.type === "minion"
      ? adjacentMinionTargets(game, target)
      : [];
    if (triggerHunterAttackSecrets(game, actorSeat, source, target, catalog)) return;
    if (target.type === "hero") triggerIceBarrier(game, target.seat, catalog);
    const targetDamage = dealDamage(game, target, heroAttack, actorSeat, catalog, Boolean(weapon?.keywords?.includes("lifesteal")));
    if (weapon?.keywords?.includes("poisonous")) applyPoisonousDamage(game, target, targetDamage);
    for (const adjacent of adjacentTargets) {
      const adjacentDamage = dealDamage(game, adjacent, heroAttack, actorSeat, catalog, Boolean(weapon?.keywords?.includes("lifesteal")));
      if (weapon?.keywords?.includes("poisonous")) applyPoisonousDamage(game, adjacent, adjacentDamage);
    }
    if (defender.kind === "minion" && !weapon?.ignisWeapon?.immuneWhileAttacking) dealDamage(game, source, defender.minion.attack, target.seat, catalog, false);
    player.hero.attacksThisTurn += 1;
    resolveWeaponAfterAttack(game, actorSeat, catalog);
    if (weapon) {
      weapon.durability -= 1;
      if (weapon.durability <= 0) destroyHeroWeapon(game, actorSeat, catalog, weapon.cardId);
    }
    addLog(game, `${player.nickname} 的英雄发起攻击。`);
  } else {
    const minion = findMinion(game, source);
    if (!minion) throw new Error("攻击者不存在。");
    if (!canMinionAttack(game, actorSeat, minion, target, game.turn, catalog)) throw new Error("该随从现在不能攻击。");
    const minionCard = getCard(catalog, minion.cardId);
    const defender = getTarget(game, target);
    const adjacentTargets = !minion.silenced && hasRule(minionCard, "beast_cleave_attack") && target.type === "minion"
      ? adjacentMinionTargets(game, target)
      : [];
    if (triggerHunterAttackSecrets(game, actorSeat, source, target, catalog)) return;
    if (target.type === "hero") triggerIceBarrier(game, target.seat, catalog);
    const sourceAttack = minionAttackValue(game, actorSeat, minion, catalog);
    const attackDamage = !minion.silenced && hasRule(minionCard, "beast_octomasseuse") && target.type === "minion" ? sourceAttack * 8 : sourceAttack;
    const targetDamage = dealDamage(game, target, attackDamage, actorSeat, catalog, minion.keywords.includes("lifesteal"));
    if (minion.keywords.includes("poisonous")) applyPoisonousDamage(game, target, targetDamage);
    for (const adjacent of adjacentTargets) {
      const adjacentDamage = dealDamage(game, adjacent, attackDamage, actorSeat, catalog, minion.keywords.includes("lifesteal"));
      if (minion.keywords.includes("poisonous")) applyPoisonousDamage(game, adjacent, adjacentDamage);
    }
    if (defender.kind === "minion") {
      const sourceDamage = dealDamage(game, source, minionAttackValue(game, target.seat, defender.minion, catalog), target.seat, catalog, defender.minion.keywords.includes("lifesteal"));
      if (defender.minion.keywords.includes("poisonous")) applyPoisonousDamage(game, source, sourceDamage);
    }
    minion.attacksThisTurn += 1;
    if (!minion.silenced && hasRule(minionCard, "beast_knuckles") && target.type === "minion") dealDamage(game, { type: "hero", seat: other(actorSeat) }, sourceAttack, actorSeat, catalog, minion.keywords.includes("lifesteal"));
    if (!minion.silenced && hasRule(getCard(catalog, minion.cardId), "beast_generic_attack")) beastGenericAttackTrigger(game, actorSeat, minion, target, catalog);
    addLog(game, `${game.players[actorSeat].nickname} 使用 ${getCard(catalog, minion.cardId).name} 发起攻击。`);
  }
  cleanupDeaths(game, catalog);
}

function adjacentMinionTargets(game: GameState, target: TargetRef): TargetRef[] {
  if (target.type !== "minion" || target.instanceId === undefined) return [];
  const board = game.players[target.seat].board;
  const index = board.findIndex((minion) => minion.instanceId === target.instanceId);
  if (index < 0) return [];
  return [board[index - 1], board[index + 1]]
    .filter(Boolean)
    .map((minion) => ({ type: "minion" as const, seat: target.seat, instanceId: minion.instanceId }));
}

function resolveWeaponAfterAttack(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const weapon = game.players[seat].hero.weapon;
  const ignis = weapon?.ignisWeapon;
  if (!weapon || !ignis) return;
  if (ignis.afterAttackSummonCost) summonRandomCostMinion(game, seat, ignis.afterAttackSummonCost, catalog, "伊格尼斯的武器");
  if (ignis.afterAttackDraw) drawCards(game, seat, ignis.afterAttackDraw, catalog, true);
  if (ignis.afterAttackArmor) game.players[seat].hero.armor += ignis.afterAttackArmor;
}

function summonRandomCostMinion(game: GameState, seat: Seat, cost: number, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const minions = [...catalog.values()].filter((card) => card.collectible && card.type === "minion" && card.cost === cost);
  if (minions.length === 0) return;
  const random = rng(game.seed + game.turn * 811 + seat * 163 + cost * 17 + minions.length);
  summon(game, seat, minions[Math.floor(random() * minions.length)].id, 1, catalog);
  addLog(game, `${sourceName} 召唤了一个 ${cost} 费随从。`);
}

function destroyHeroWeapon(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  const player = game.players[seat];
  const weapon = player.hero.weapon;
  if (!weapon) return;
  const deathrattleDamage = weapon.ignisWeapon?.deathrattleAllEnemyDamage;
  player.graveyard.push(weapon.cardId);
  delete player.hero.weapon;
  if (deathrattleDamage) {
    const targets = [{ type: "hero" as const, seat: other(seat) }, ...game.players[other(seat)].board.map((minion) => ({ type: "minion" as const, seat: other(seat), instanceId: minion.instanceId }))];
    for (const target of targets) dealDamage(game, target, deathrattleDamage, seat, catalog, Boolean(weapon.keywords?.includes("lifesteal")));
    addLog(game, `${sourceName} 触发武器亡语，对所有敌人造成 ${deathrattleDamage} 点伤害。`);
  }
}

function endTurn(game: GameState, catalog: Map<string, CardDefinition>): void {
  resolveEndTurnRules(game, game.currentPlayer, catalog);
  expireTurnEffects(game, game.currentPlayer, catalog);
  cleanupDeaths(game, catalog);
  startTurn(game, other(game.currentPlayer), catalog);
}

function startTurn(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  game.currentPlayer = seat;
  game.turn += 1;
  const player = game.players[seat];
  player.maxMana = Math.min(player.manaCap ?? GAME_RULES.maxMana, player.maxMana + 1);
  player.mana = player.maxMana;
  player.hero.heroPowerUsed = false;
  player.hero.attacksThisTurn = 0;
  player.hero.temporaryAttack = 0;
  player.cardsPlayedThisTurn = 0;
  delete player.comboActiveForCurrentCard;
  rollRenoBullet(game, seat, catalog);
  tickAvianaCountdown(game, seat);
  transformChameleosInHand(game, seat, catalog);
  transformHarmonicPopInHand(game, seat);
  resolveStartTurnRules(game, seat, catalog);
  const handledStartChoices = beginStartTurnQueue(game, seat, catalog);
  for (const minion of player.board) {
    minion.exhausted = false;
    minion.attacksThisTurn = 0;
  }
  if (!handledStartChoices) drawCards(game, seat, 1, catalog, true);
  addLog(game, `第 ${game.turn} 回合开始，轮到 ${player.nickname}。`);
}

function resolveStartTurnRules(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const activeDoomsayers = game.players[seat].board.filter((minion) => !minion.silenced && hasRule(getCard(catalog, minion.cardId), "mage_doomsayer"));
  if (activeDoomsayers.length > 0) {
    for (const player of game.players) {
      for (const minion of player.board) minion.health = 0;
    }
    addLog(game, `${getCard(catalog, activeDoomsayers[0].cardId).name} 触发，消灭了所有随从。`);
    cleanupDeaths(game, catalog);
  }
  triggerImprovedOpenTheCages(game, seat, catalog);
}

function resolveEndTurnRules(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  for (const minion of player.board) {
    const card = getCard(catalog, minion.cardId);
    if (!minion.silenced && hasRule(card, "dragon_zilliax_haywire")) {
      dealDamage(game, { type: "hero", seat }, 3, seat, catalog, false);
    }
    if (!minion.silenced && hasRule(card, "hunter_little_critter_caretaker")) {
      heal(game, { type: "hero", seat }, 3, catalog);
      heal(game, { type: "hero", seat: other(seat) }, 3, catalog);
    }
    if (!minion.silenced && hasRule(card, "beast_generic_end_turn")) beastGenericEndTurn(game, seat, minion, card, catalog);
  }
}

function beginStartTurnQueue(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): boolean {
  if (game.pendingChoice) return false;
  const effects = game.players[seat].specials
    .filter((special) => special.cardId === "dragon_pure_nest" || special.cardId === "reno_token_kiljaeden_portal")
    .map((special) => special.instanceId);
  if (effects.length === 0) return false;
  game.startTurnQueue = { seat, effects, index: 0, drawAfter: !effects.some((instanceId) => game.players[seat].specials.find((special) => special.instanceId === instanceId)?.cardId === "reno_token_kiljaeden_portal") };
  advanceStartTurnQueue(game, catalog);
  return true;
}

function advanceStartTurnQueue(game: GameState, catalog: Map<string, CardDefinition>): void {
  const queue = game.startTurnQueue;
  if (!queue) return;
  const player = game.players[queue.seat];
  while (queue.index < queue.effects.length) {
    const instanceId = queue.effects[queue.index];
    queue.index += 1;
    const special = player.specials.find((item) => item.instanceId === instanceId);
    if (!special) continue;
    if (special.cardId === "reno_token_kiljaeden_portal") {
      beginKiljaedenPortalChoice(game, queue.seat, catalog);
      if (game.pendingChoice) return;
    }
    if (special.cardId === "dragon_pure_nest") {
      discoverDragon(game, queue.seat, catalog, "纯净龙巢", -4, ["dragon_rheastrasza"], true);
      if (game.pendingChoice) return;
    }
  }
  delete game.startTurnQueue;
  if (queue.drawAfter) drawCards(game, queue.seat, 1, catalog, true);
}

function expireTurnEffects(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  player.hero.temporaryAttack = 0;
  delete player.nextSpellDiscount;
  delete player.comboActiveForCurrentCard;
  for (const minion of player.board) {
    if (minion.temporaryAttack > 0) {
      minion.attack -= minion.temporaryAttack;
      minion.temporaryAttack = 0;
    }
    if (minion.expiresAtEndOfTurn) minion.health = 0;
  }
  if (player.board.some((minion) => minion.expiresAtEndOfTurn)) addLog(game, `${player.nickname} 的临时树人在回合结束时消散。`);
}

function applyEffects(game: GameState, context: EffectContext, catalog: Map<string, CardDefinition>): void {
  for (const effect of context.sourceCard.effects) {
    const trigger = effect.trigger ?? "play";
    if (trigger !== context.trigger) continue;
    const targets = resolveEffectTargets(game, effect, context, catalog);
    if (effect.type === "gain_mana") {
      const player = game.players[context.sourceOwner];
      const before = player.mana;
      player.mana += effect.amount;
      addLog(game, `${player.nickname} 获得了 ${player.mana - before} 点临时法力。`);
      continue;
    }
    if (effect.type === "gain_armor") {
      const player = game.players[context.sourceOwner];
      player.hero.armor += effect.amount;
      addLog(game, `${player.nickname} 获得 ${effect.amount} 点护甲。`);
      continue;
    }
    if (effect.type === "hero_attack") {
      const player = game.players[context.sourceOwner];
      player.hero.temporaryAttack += effect.amount;
      addLog(game, `${player.nickname} 的英雄本回合获得 +${effect.amount} 攻击力。`);
      continue;
    }
    if (effect.type === "draw") {
      drawCards(game, context.sourceOwner, effect.amount, catalog, true);
      continue;
    }
    if (effect.type === "summon") {
      summon(game, context.sourceOwner, effect.cardId, effect.amount, catalog);
      continue;
    }
    if (effect.type === "equip_weapon") {
      const player = game.players[context.sourceOwner];
      if (player.hero.weapon) destroyHeroWeapon(game, context.sourceOwner, catalog, context.sourceCard.name);
      player.hero.weapon = { cardId: context.sourceCard.id, attack: effect.attack, durability: effect.durability };
      addLog(game, `${player.nickname} 装备了 ${effect.attack}/${effect.durability} 武器。`);
      continue;
    }
    for (const target of targets) {
      if (effect.type === "damage") dealDamage(game, target, effect.amount + spellDamageBonus(game, context), context.sourceOwner, catalog, keywordOnSource(game, context, "lifesteal"));
      if (effect.type === "heal") heal(game, target, effect.amount, catalog);
      if (effect.type === "buff") buff(game, target, effect.attack, effect.health, catalog);
      if (effect.type === "destroy") destroy(game, target, catalog);
      if (effect.type === "silence") silence(game, target, catalog);
    }
  }
}

function resolveEffectTargets(game: GameState, effect: CardEffect, context: EffectContext, catalog: Map<string, CardDefinition>): TargetRef[] {
  const targetKind = effect.target ?? "none";
  const enemy = other(context.sourceOwner);
  if (targetKind === "none") return [];
  if (targetKind === "selected") {
    if (!context.selectedTarget) throw new Error("需要选择目标。");
    if (isUntouchableTarget(game, context.selectedTarget, catalog)) throw new Error("这个随从无法成为目标。");
    return [context.selectedTarget];
  }
  if (targetKind === "own_hero") return [{ type: "hero", seat: context.sourceOwner }];
  if (targetKind === "enemy_hero") return [{ type: "hero", seat: enemy }];
  if (targetKind === "all_enemies") return [{ type: "hero", seat: enemy }, ...touchableMinionTargets(game, enemy, catalog)];
  if (targetKind === "all_enemy_minions") return touchableMinionTargets(game, enemy, catalog);
  if (targetKind === "all_minions") return game.players.flatMap((player) => touchableMinionTargets(game, player.seat, catalog));
  if (targetKind === "any_minion") {
    if (!context.selectedTarget || context.selectedTarget.type !== "minion") throw new Error("需要选择一个随从。");
    if (isUntouchableTarget(game, context.selectedTarget, catalog)) throw new Error("这个随从无法成为目标。");
    return [context.selectedTarget];
  }
  if (targetKind === "friendly_minion" || targetKind === "enemy_minion") {
    if (!context.selectedTarget || context.selectedTarget.type !== "minion") throw new Error("需要选择一个随从。");
    const expectedSeat = targetKind === "friendly_minion" ? context.sourceOwner : enemy;
    if (context.selectedTarget.seat !== expectedSeat) throw new Error("目标阵营不合法。");
    if (isUntouchableTarget(game, context.selectedTarget, catalog)) throw new Error("这个随从无法成为目标。");
    return [context.selectedTarget];
  }
  return [];
}

function drawCards(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>, withLog: boolean): void {
  const player = game.players[seat];
  for (let index = 0; index < amount; index += 1) {
    const drawn = player.deck.shift();
    if (!drawn) {
      player.fatigue += 1;
      dealFatigueDamage(game, seat, player.fatigue, catalog, withLog);
      continue;
    }
    countCeaselessEvent(game, "抽牌");
    if (player.hand.length >= GAME_RULES.maxHandSize) {
      player.graveyard.push(drawn.cardId);
      countCeaselessEvent(game, "卡牌被摧毁");
      if (withLog) addLog(game, `${getCard(catalog, drawn.cardId).name} 因手牌已满被弃置。`);
    } else {
      const handCard = applyCrystalCoreToInstance(game, seat, { ...drawn, drawnTurn: game.turn }, catalog);
      if (handCard.cardId === "reno_priest_chameleos") handCard.chameleos = true;
      player.hand.push(handCard);
      if (withLog) addLog(game, `${player.nickname} 抽了一张牌。`);
    }
  }
}

function dealFatigueDamage(game: GameState, seat: Seat, amount: number, catalog: Map<string, CardDefinition>, withLog: boolean): void {
  const player = game.players[seat];
  const hero = player.hero;
  if ((hero.immuneUntilTurn ?? -1) >= game.turn) {
    if (withLog) addLog(game, `${player.nickname} 疲劳，但英雄处于免疫状态。`);
    return;
  }
  if (amount > hero.armor && amount - hero.armor >= hero.health && triggerIceBlock(game, seat, catalog)) return;
  const armorBlock = Math.min(hero.armor, amount);
  hero.armor -= armorBlock;
  const healthDamage = amount - armorBlock;
  hero.health -= healthDamage;
  if (!withLog) return;
  const suffix = armorBlock > 0 ? `，护甲抵消 ${armorBlock} 点` : "";
  addLog(game, `${player.nickname} 疲劳并受到 ${amount} 点伤害${suffix}。`);
}

function transformChameleosInHand(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  const enemyHand = game.players[other(seat)].hand;
  for (const instance of player.hand) {
    if (!instance.chameleos) continue;
    if (enemyHand.length === 0) {
      instance.cardId = "reno_priest_chameleos";
      delete instance.costOverride;
      delete instance.attackOverride;
      delete instance.healthOverride;
      continue;
    }
    const random = rng(game.seed + game.turn * 761 + seat * 127 + instance.instanceId.length + enemyHand.length);
    const copied = enemyHand[Math.floor(random() * enemyHand.length)];
    const copiedCard = getCard(catalog, copied.cardId);
    instance.cardId = copied.cardId;
    instance.costOverride = copied.costOverride ?? copiedCard.cost;
    instance.attackOverride = copied.attackOverride;
    instance.healthOverride = copied.healthOverride;
    instance.storedCardIds = copied.storedCardIds ? [...copied.storedCardIds] : undefined;
    addLog(game, `变色龙卡米洛斯变成了 ${copiedCard.name}。`);
  }
}

function transformHarmonicPopInHand(game: GameState, seat: Seat): void {
  for (const instance of game.players[seat].hand) {
    if (instance.cardId === "reno_priest_harmonic_pop") instance.cardId = "reno_token_dissonant_pop";
    else if (instance.cardId === "reno_token_dissonant_pop") instance.cardId = "reno_priest_harmonic_pop";
  }
}

function summon(game: GameState, seat: Seat, cardId: string, amount: number, catalog: Map<string, CardDefinition>): void {
  const card = getCard(catalog, cardId);
  if (card.type !== "minion") throw new Error("只能召唤随从。");
  const player = game.players[seat];
  for (let index = 0; index < amount && occupiedBoardSlots(player) < GAME_RULES.maxBoardSize; index += 1) {
    const minion = createBoardMinion(applyCrystalCoreToInstance(game, seat, createInstance(cardId, seat), catalog), card, game.turn);
    applyBeastSummonState(game, seat, minion, card, catalog);
    player.board.push(minion);
    triggerColossalOnSummon(game, seat, card, catalog);
    addLog(game, `${player.nickname} 召唤了 ${card.name}。`);
  }
}

function summonBoardCopy(game: GameState, seat: Seat, source: BoardMinion, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  if (occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) return;
  const card = getCard(catalog, source.cardId);
  const copy: BoardMinion = {
    ...source,
    instanceId: randomUUID(),
    owner: seat,
    origin: "generated",
    summonedTurn: game.turn,
    attacksThisTurn: 0,
    exhausted: true,
    keywords: [...source.keywords],
    statEffects: source.statEffects ? { ...source.statEffects } : { attack: 0, health: 0 },
    usedTitanAbilityCardIds: source.usedTitanAbilityCardIds ? [...source.usedTitanAbilityCardIds] : undefined,
    borrowedByInstanceId: undefined,
    borrowedFromSeat: undefined
  };
  player.board.push(copy);
  addLog(game, `${player.nickname} 召唤了 ${card.name} 的复制。`);
}

function dealDamage(game: GameState, target: TargetRef, amount: number, sourceOwner: Seat, catalog: Map<string, CardDefinition>, lifesteal: boolean): DamageResult {
  if (amount <= 0) return { dealt: 0, blockedByDivineShield: false };
  if (isUntouchableTarget(game, target, catalog)) return { dealt: 0, blockedByDivineShield: false };
  const resolved = getTarget(game, target);
  let dealt = amount;
  let blockedByDivineShield = false;
  if (resolved.kind === "hero") {
    const hero = game.players[target.seat].hero;
    if ((hero.immuneUntilTurn ?? -1) >= game.turn) {
      addLog(game, `${targetName(game, target, catalog)} 处于免疫状态，未受到伤害。`);
      return { dealt: 0, blockedByDivineShield: false };
    }
    if (amount > hero.armor && amount - hero.armor >= hero.health && triggerIceBlock(game, target.seat, catalog)) return { dealt: 0, blockedByDivineShield: false };
    const armorBlock = Math.min(hero.armor, amount);
    hero.armor -= armorBlock;
    dealt = amount - armorBlock;
    hero.health -= dealt;
    if (dealt > 0) {
      const suffix = armorBlock > 0 ? `（护甲抵消 ${armorBlock} 点）` : "";
      addLog(game, `${game.players[sourceOwner].nickname} 对 ${targetName(game, target, catalog)} 造成 ${dealt} 点伤害${suffix}。`);
    } else {
      addLog(game, `${targetName(game, target, catalog)} 的护甲抵消了 ${amount} 点伤害。`);
    }
  } else {
    const shieldIndex = resolved.minion.keywords.indexOf("divine_shield");
    if (shieldIndex >= 0) {
      resolved.minion.keywords.splice(shieldIndex, 1);
      dealt = 0;
      blockedByDivineShield = true;
      addLog(game, `${getCard(catalog, resolved.minion.cardId).name} 的圣盾抵消了伤害。`);
    } else {
      const minionCard = getCard(catalog, resolved.minion.cardId);
      const actualAmount = !resolved.minion.silenced && hasRule(minionCard, "beast_generic_damage") && minionCard.text.includes("每次只能受到1点") ? Math.min(1, amount) : amount;
      resolved.minion.health -= actualAmount;
      dealt = actualAmount;
      addLog(game, `${game.players[sourceOwner].nickname} 对 ${targetName(game, target, catalog)} 造成 ${actualAmount} 点伤害。`);
      if (!resolved.minion.silenced && hasRule(getCard(catalog, resolved.minion.cardId), "mage_acolyte_of_pain")) {
        drawCards(game, resolved.minion.owner, 1, catalog, true);
      }
      if (!resolved.minion.silenced && hasRule(minionCard, "beast_generic_damage")) beastGenericDamageTrigger(game, resolved.minion.owner, resolved.minion, minionCard, actualAmount, catalog);
    }
  }
  if (lifesteal && dealt > 0) heal(game, { type: "hero", seat: sourceOwner }, dealt, catalog);
  return { dealt, blockedByDivineShield };
}

function applyPoisonousDamage(game: GameState, target: TargetRef, damage: DamageResult): void {
  if (target.type !== "minion" || damage.blockedByDivineShield) return;
  const poisoned = findMinion(game, target);
  if (!poisoned || poisoned.keywords.includes("divine_shield")) return;
  poisoned.health = 0;
}

function heal(game: GameState, target: TargetRef, amount: number, catalog: Map<string, CardDefinition>): void {
  if (isUntouchableTarget(game, target, catalog)) return;
  const resolved = getTarget(game, target);
  let restored = 0;
  if (resolved.kind === "hero") {
    const before = resolved.hero.health;
    resolved.hero.health = Math.min(resolved.hero.maxHealth ?? GAME_RULES.heroHealth, resolved.hero.health + amount);
    restored = resolved.hero.health - before;
  } else {
    const card = getCard(catalog, resolved.minion.cardId);
    const baseHealth = resolved.minion.healthOverride ?? card.health ?? resolved.minion.maxHealth;
    const before = resolved.minion.health;
    resolved.minion.health = Math.min(Math.max(resolved.minion.maxHealth, baseHealth), resolved.minion.health + amount);
    restored = resolved.minion.health - before;
  }
  addLog(game, `${targetName(game, target, catalog)} 恢复 ${restored} 点生命值。`);
}

function buff(game: GameState, target: TargetRef, attack: number, health: number, catalog: Map<string, CardDefinition>): void {
  if (isUntouchableTarget(game, target, catalog)) return;
  const resolved = getTarget(game, target);
  if (resolved.kind !== "minion") throw new Error("只能强化随从。");
  applyStatEffect(resolved.minion, attack, health);
  addLog(game, `${targetName(game, target, catalog)} 获得 +${attack}/+${health}。`);
}

function destroy(game: GameState, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  if (isUntouchableTarget(game, target, catalog)) return;
  const resolved = getTarget(game, target);
  if (resolved.kind === "hero") {
    resolved.hero.health = 0;
  } else {
    resolved.minion.health = 0;
  }
  addLog(game, `${targetName(game, target, catalog)} 被消灭。`);
}

function silence(game: GameState, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  if (isUntouchableTarget(game, target, catalog)) return;
  const resolved = getTarget(game, target);
  if (resolved.kind !== "minion") throw new Error("只能沉默随从。");
  const card = getCard(catalog, resolved.minion.cardId);
  resolved.minion.attack = baseAttack(resolved.minion, card);
  resolved.minion.maxHealth = baseHealth(resolved.minion, card);
  resolved.minion.health = Math.min(resolved.minion.health, resolved.minion.maxHealth);
  resolved.minion.statEffects = { attack: 0, health: 0 };
  resolved.minion.keywords = [];
  resolved.minion.silenced = true;
  resolved.minion.temporaryAttack = 0;
  resolved.minion.cannotAttack = false;
  addLog(game, `${card.name} 被沉默。`);
}

function cleanupDeaths(game: GameState, catalog: Map<string, CardDefinition>): void {
  let changed = true;
  let guard = 0;
  while (changed && guard < 20) {
    changed = false;
    guard += 1;
    for (const player of game.players) {
      const dead = player.board.filter((minion) => minion.health <= 0);
      if (dead.length === 0) continue;
      player.board = player.board.filter((minion) => minion.health > 0);
      for (const minion of dead) {
        const card = getCard(catalog, minion.cardId);
        reduceCorridorCreepersInHands(game, catalog);
        player.graveyard.push(card.id);
        countCeaselessEvent(game, "随从被摧毁");
        addLog(game, `${card.name} 被消灭。`);
        if (!minion.silenced && hasRule(card, "priest_najark")) returnBorrowedMinions(game, minion.instanceId, catalog);
        if (!minion.silenced) applyEffects(game, { sourceCard: card, sourceOwner: player.seat, trigger: "deathrattle" }, catalog);
        if (!minion.silenced && hasRule(card, "dragon_seeded_green_drake")) addRandomDragonToHand(game, player.seat, catalog, card.name, -2);
        if (!minion.silenced && hasRule(card, "dragon_bone_drake")) addRandomDragonToHand(game, player.seat, catalog, card.name);
        if (!minion.silenced && hasRule(card, "rogue_igneous_elemental")) addFlameElementals(game, player.seat, 2, catalog, card.name);
        if (!minion.silenced && hasRule(card, "hunter_raptor_nest_caretaker")) raptorNestCaretakerDeathrattle(game, player.seat, catalog, card.name);
        if (!minion.silenced && hasRule(card, "hunter_blazing_cinder")) dealRandomEnemyDamage(game, player.seat, 2, catalog, card.name);
        if (!minion.silenced && card.id === "companion_beast_savannah_highmane") summon(game, player.seat, "companion_token_hyena", 2, catalog);
        if (!minion.silenced && hasRule(card, "beast_magmaw_limb")) magmawLimbDeathrattle(game, player.seat, catalog, card.name);
        if (!minion.silenced && hasRule(card, "beast_generic_deathrattle")) beastGenericDeathrattle(game, player.seat, minion, card, catalog);
        if (shouldReborn(minion)) rebornMinion(game, player.seat, card, catalog);
      }
      changed = true;
    }
  }
}

function shouldReborn(minion: BoardMinion): boolean {
  return !minion.silenced && !minion.rebornUsed && minion.keywords.includes("reborn");
}

function rebornMinion(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  if (occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) return;
  const reborn = createBoardMinion(createInstance(card.id, seat), card, game.turn);
  reborn.keywords = reborn.keywords.filter((keyword) => keyword !== "reborn");
  reborn.rebornUsed = true;
  reborn.health = Math.min(1, reborn.maxHealth);
  applyBeastSummonState(game, seat, reborn, card, catalog);
  player.board.push(reborn);
  addLog(game, `${card.name} 复生了。`);
}

function enforceTaunt(game: GameState, attackerSeat: Seat, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  const defender = game.players[other(attackerSeat)];
  const hasTaunt = defender.board.some((minion) => minion.keywords.includes("taunt") && !isMinionUntouchable(game, defender.seat, minion, catalog));
  if (!hasTaunt) return;
  if (target.type !== "minion") throw new Error("必须优先攻击具有嘲讽的随从。");
  const minion = findMinion(game, target);
  if (!minion?.keywords.includes("taunt")) throw new Error("必须优先攻击具有嘲讽的随从。");
}

function titanAbilityIds(card: CardDefinition): string[] {
  if (card.titanAbilityCardIds?.length) return card.titanAbilityCardIds;
  if (card.races?.includes("TITAN") && card.choiceOptionCardIds?.length) return card.choiceOptionCardIds;
  return [];
}

function remainingTitanAbilityIds(minion: BoardMinion, card: CardDefinition): string[] {
  const used = new Set(minion.usedTitanAbilityCardIds ?? []);
  return titanAbilityIds(card).filter((cardId) => !used.has(cardId));
}

function titanHasRemainingAbilities(minion: BoardMinion, catalog: Map<string, CardDefinition>): boolean {
  if (minion.silenced) return false;
  return remainingTitanAbilityIds(minion, getCard(catalog, minion.cardId)).length > 0;
}

function markTitanAbilityUsed(game: GameState, seat: Seat, sourceInstanceId: string | undefined, abilityCardId: string, catalog: Map<string, CardDefinition>): void {
  if (!sourceInstanceId) return;
  const source = game.players[seat].board.find((minion) => minion.instanceId === sourceInstanceId);
  if (!source) return;
  source.usedTitanAbilityCardIds = [...new Set([...(source.usedTitanAbilityCardIds ?? []), abilityCardId])];
  source.titanAbilityUsedTurn = game.turn;
  if (!titanHasRemainingAbilities(source, catalog)) source.cannotAttack = false;
}

function canMinionAttack(game: GameState, seat: Seat, minion: BoardMinion, target: TargetRef, turn: number, catalog: Map<string, CardDefinition>): boolean {
  if (titanHasRemainingAbilities(minion, catalog)) return false;
  if (minion.cannotAttack) return false;
  if ((minion.frozenUntilTurn ?? -1) >= turn) return false;
  if (minionAttackValue(game, seat, minion, catalog) <= 0) return false;
  const limit = minion.keywords.includes("windfury") ? 2 : 1;
  if (minion.attacksThisTurn >= limit) return false;
  if (minion.summonedTurn === turn) {
    if (minion.keywords.includes("charge") || hasTundraRhinoCharge(game, seat, minion, catalog)) return true;
    if (minion.keywords.includes("rush")) return target.type === "minion";
    return false;
  }
  return true;
}

function checkGameOver(game: GameState): void {
  const dead = game.players.map((player) => player.hero.health <= 0);
  if (!dead[0] && !dead[1]) return;
  game.phase = "finished";
  if (dead[0] && !dead[1]) game.winner = 1;
  if (dead[1] && !dead[0]) game.winner = 0;
  addLog(game, game.winner === undefined ? "对局以平局结束。" : `${game.players[game.winner].nickname} 获胜。`);
}

function baseAttack(minion: BoardMinion, card: CardDefinition): number {
  return minion.attackOverride ?? card.attack ?? 0;
}

function baseHealth(minion: BoardMinion, card: CardDefinition): number {
  return minion.healthOverride ?? card.health ?? 1;
}

function ensureStatEffects(minion: BoardMinion): { attack: number; health: number } {
  minion.statEffects ??= { attack: 0, health: 0 };
  return minion.statEffects;
}

function applyStatEffect(minion: BoardMinion, attack: number, health: number): void {
  const effects = ensureStatEffects(minion);
  effects.attack += attack;
  effects.health += health;
  minion.attack += attack;
  minion.maxHealth = Math.max(0, minion.maxHealth + health);
  minion.health = Math.min(Math.max(0, minion.health + health), minion.maxHealth);
}

function minionAttackValue(game: GameState, seat: Seat, minion: BoardMinion, catalog: Map<string, CardDefinition>): number {
  const leokkBonus = game.players[seat].board.filter((ally) =>
    ally.instanceId !== minion.instanceId &&
    !ally.silenced &&
    hasRule(getCard(catalog, ally.cardId), "beast_leokk_aura")
  ).length;
  return minion.attack + leokkBonus;
}

function setAttackByEffect(minion: BoardMinion, attack: number): void {
  applyStatEffect(minion, attack - minion.attack, 0);
}

function setMaxHealthByEffect(minion: BoardMinion, health: number): void {
  applyStatEffect(minion, 0, health - minion.maxHealth);
}

function createBoardMinion(instance: CardInstance, card: CardDefinition, turn: number): BoardMinion {
  const attack = instance.attackOverride ?? card.attack ?? 0;
  const health = instance.healthOverride ?? card.health ?? 1;
  const isPureNest = hasRule(card, "dragon_pure_nest");
  const isTitan = titanAbilityIds(card).length > 0;
  return {
    ...instance,
    attack,
    health,
    maxHealth: health,
    keywords: [...card.keywords],
    exhausted: !card.keywords.includes("charge"),
    summonedTurn: turn,
    attacksThisTurn: 0,
    silenced: false,
    temporaryAttack: 0,
    statEffects: { attack: 0, health: 0 },
    cannotAttack: isPureNest || isTitan,
    untouchable: isPureNest
  };
}

function createBoardLocation(instance: CardInstance, card: CardDefinition, turn: number): BoardLocation {
  return {
    ...instance,
    durability: card.durability ?? 1,
    readyTurn: turn
  };
}

function createBoardSpecial(instance: CardInstance, extra: Partial<BoardSpecial> = {}): BoardSpecial {
  return {
    ...instance,
    ...extra
  };
}

function occupiedBoardSlots(player: PlayerGameState): number {
  return player.board.length + player.locations.length;
}

function createInstance(cardId: string, owner: Seat, origin: CardInstance["origin"] = "generated"): CardInstance {
  return {
    cardId,
    owner,
    origin,
    instanceId: randomUUID(),
    chameleos: cardId === "reno_priest_chameleos" ? true : undefined
  };
}

function catalogFrom(cards: CardDefinition[]): Map<string, CardDefinition> {
  return new Map(cards.map((card) => [card.id, card]));
}

function getCard(catalog: Map<string, CardDefinition>, id: string): CardDefinition {
  const card = catalog.get(id);
  if (!card) throw new Error(`找不到卡牌：${id}`);
  return card;
}

function findMinion(game: GameState, target: TargetRef): BoardMinion | undefined {
  if (target.type !== "minion" || !target.instanceId) return undefined;
  return game.players[target.seat].board.find((minion) => minion.instanceId === target.instanceId);
}

function isUntouchableTarget(game: GameState, target: TargetRef, catalog?: Map<string, CardDefinition>): boolean {
  if (target.type !== "minion") return false;
  const minion = findMinion(game, target);
  return Boolean(minion && isMinionUntouchable(game, target.seat, minion, catalog));
}

function touchableMinionTargets(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): TargetRef[] {
  return game.players[seat].board.filter((minion) => !isMinionUntouchable(game, seat, minion, catalog)).map((minion) => ({ type: "minion" as const, seat, instanceId: minion.instanceId }));
}

function isMinionUntouchable(game: GameState | undefined, seat: Seat, minion: BoardMinion, catalog: Map<string, CardDefinition> | undefined): boolean {
  if (minion.untouchable) return true;
  if (!game || !catalog) return false;
  if (!minion.silenced && game.currentPlayer !== seat && hasRule(getCard(catalog, minion.cardId), "beast_loot_spellward")) return true;
  return game.players[seat].board.some((otherMinion) =>
    otherMinion.instanceId !== minion.instanceId &&
    !otherMinion.silenced &&
    hasRule(getCard(catalog, otherMinion.cardId), "beast_red_herring") &&
    !hasRule(getCard(catalog, minion.cardId), "beast_red_herring")
  );
}

function getTarget(game: GameState, target: TargetRef): { kind: "hero"; hero: PlayerGameState["hero"] } | { kind: "minion"; minion: BoardMinion } {
  if (target.type === "hero") return { kind: "hero", hero: game.players[target.seat].hero };
  const minion = findMinion(game, target);
  if (!minion) throw new Error("目标随从不存在。");
  return { kind: "minion", minion };
}

function targetName(game: GameState, target: TargetRef, catalog: Map<string, CardDefinition>): string {
  if (target.type === "hero") return `${game.players[target.seat].nickname} 的英雄`;
  const minion = findMinion(game, target);
  return minion ? getCard(catalog, minion.cardId).name : "一个随从";
}

function keywordOnSource(game: GameState, context: EffectContext, keyword: Keyword): boolean {
  const source = game.players[context.sourceOwner].board.find((minion) => minion.cardId === context.sourceCard.id);
  return Boolean(source?.keywords.includes(keyword));
}

function spellDamageBonus(game: GameState, context: EffectContext): number {
  if (context.sourceCard.type !== "spell") return 0;
  return game.players[context.sourceOwner].board.reduce((total, minion) => {
    if (!minion.keywords.includes("spell_damage")) return total;
    return total + (minion.cardId === "dragon_malygos" ? 5 : 1);
  }, 0);
}

function hasRule(card: CardDefinition, rule: NonNullable<CardDefinition["rules"]>[number]): boolean {
  return Boolean(card.rules?.includes(rule));
}

function cardPlayCost(game: GameState, seat: Seat, instance: CardInstance, card: CardDefinition, catalog: Map<string, CardDefinition>): number {
  const tax = card.type === "spell" && game.players[seat].spellCostIncrease?.throughTurn === game.turn
    ? game.players[seat].spellCostIncrease?.amount ?? 0
    : 0;
  const player = game.players[seat];
  const printedOrOverriddenCost = instance.costOverride ?? card.cost;
  const dynamicCost = hasRule(card, "priest_ceaseless_expanse")
    ? Math.max(0, printedOrOverriddenCost - (game.ceaselessEvents ?? 0))
    : printedOrOverriddenCost;
  const baseCost = player.avianaActive
    ? Math.min(dynamicCost, 1)
    : card.type === "minion" && player.board.some((minion) => !minion.silenced && hasRule(getCard(catalog, minion.cardId), "dragon_aviana"))
      ? 1
      : dynamicCost;
  const discount = card.type === "spell" && player.nextSpellDiscount?.throughTurn === game.turn
    ? player.nextSpellDiscount.amount
    : 0;
  const cost = Math.max(0, baseCost + tax - discount);
  return opponentHasRuleOnBoard(game, seat, "razorscale", catalog) ? Math.max(cost, 2) : cost;
}

function isTradeable(card: CardDefinition): boolean {
  return card.text.includes("可交易") || /tradeable/i.test(card.text);
}

function heroPowerCost(game: GameState, seat: Seat, power: CardDefinition, catalog: Map<string, CardDefinition>): number {
  if (game.players[seat].board.some((minion) => !minion.silenced && hasRule(getCard(catalog, minion.cardId), "priest_papercraft_angel"))) return 0;
  return game.players[seat].hero.heroPowerCost ?? power.cost;
}

function opponentHasRuleOnBoard(game: GameState, seat: Seat, rule: NonNullable<CardDefinition["rules"]>[number], catalog: Map<string, CardDefinition>): boolean {
  return game.players[other(seat)].board.some((minion) => !minion.silenced && hasRule(getCard(catalog, minion.cardId), rule));
}

function hasDuplicateCardIds(instances: CardInstance[]): boolean {
  const seen = new Set<string>();
  for (const instance of instances) {
    if (seen.has(instance.cardId)) return true;
    seen.add(instance.cardId);
  }
  return false;
}

function addKeyword(minion: BoardMinion, keyword: Keyword): void {
  if (!minion.keywords.includes(keyword)) minion.keywords.push(keyword);
}

function sameTarget(left: TargetRef, right: TargetRef): boolean {
  return left.type === right.type && left.seat === right.seat && left.instanceId === right.instanceId;
}

function seatFor(game: GameState, nickname: string): Seat {
  const seat = game.players.findIndex((player) => player.nickname === nickname);
  if (seat !== 0 && seat !== 1) throw new Error("你不在这局对战中。");
  return seat as Seat;
}

function other(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

function publicPlayedCardEntry(entry: PlayedCardEntry, viewerSeat: Seat): PlayedCardEntry {
  const hiddenSecret = entry.kind === "secret_set" && entry.hidden && !entry.revealed && entry.seat !== viewerSeat;
  if (hiddenSecret) {
    return {
      id: entry.id,
      at: entry.at,
      turn: entry.turn,
      seat: entry.seat,
      sourceInstanceId: entry.sourceInstanceId,
      kind: entry.kind,
      hidden: true,
      revealed: false
    };
  }
  return { ...entry, hidden: false };
}

function addPlayedCardEntry(game: GameState, entry: Omit<PlayedCardEntry, "id" | "at" | "turn">): PlayedCardEntry {
  const current = game.playedCards ?? [];
  const id = current.reduce((largest, item) => Math.max(largest, item.id), 0) + 1;
  const next: PlayedCardEntry = {
    ...entry,
    id,
    at: new Date().toISOString(),
    turn: game.turn
  };
  game.playedCards = [...current.slice(-39), next];
  return next;
}

function revealSecretPlayedCardEntry(game: GameState, sourceInstanceId: string, card: CardDefinition): void {
  game.playedCards = (game.playedCards ?? []).map((entry) => {
    if (entry.kind !== "secret_set" || entry.sourceInstanceId !== sourceInstanceId) return entry;
    return {
      ...entry,
      cardId: card.id,
      cardName: card.name,
      cardType: card.type,
      cardCost: card.cost,
      hidden: false,
      revealed: true
    };
  });
}

function addLog(game: GameState, message: string): GameLogEntry {
  const entry: GameLogEntry = {
    id: game.logs.length + 1,
    at: new Date().toISOString(),
    message
  };
  game.logs = [...game.logs.slice(-80), entry];
  return entry;
}

function rng(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomStartingSeat(seed: number): Seat {
  return rng(seed + 47)() < 0.5 ? 0 : 1;
}

function shuffle<T>(items: T[], random: () => number): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
}
