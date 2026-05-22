import { randomUUID } from "node:crypto";
import { GAME_RULES, cardNeedsTarget, type BoardLocation, type BoardMinion, type CardDefinition, type CardEffect, type CardInstance, type CollectibleClass, type DeckDefinition, type EffectTrigger, type GameAction, type GameLogEntry, type GameState, type Keyword, type PlayerGameState, type PublicGameState, type Seat, type TargetRef } from "@dormstone/shared";

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
    logs: []
  };
  shuffle(game.players[0].deck, rng(seed + 11));
  shuffle(game.players[1].deck, rng(seed + 29));
  drawCards(game, firstSeat, GAME_RULES.startingHand[0], catalog, false);
  drawCards(game, other(firstSeat), GAME_RULES.startingHand[1], catalog, false);
  game.players[other(firstSeat)].hand.push(createInstance("coin", other(firstSeat)));
  addLog(game, `${game.players[firstSeat].nickname} 随机获得先手，双方完成起手抽牌，等待换牌。`);
  return game;
}

export function applyGameAction(game: GameState, actorNickname: string, action: GameAction, cards: CardDefinition[]): GameState {
  if (game.phase === "finished") throw new Error("对局已经结束。");
  const catalog = catalogFrom(cards);
  const actorSeat = seatFor(game, actorNickname);

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
    if (action.type !== "choose") throw new Error("请先完成当前选择。");
    applyChoice(game, actorSeat, action.choiceId, action.optionInstanceId, action.target, catalog);
    checkGameOver(game);
    return game;
  }
  if (action.type === "choose") throw new Error("当前没有待完成的选择。");
  if (actorSeat !== game.currentPlayer && action.type !== "concede") throw new Error("现在不是你的回合。");

  switch (action.type) {
    case "play_card":
      playCard(game, actorSeat, action.handInstanceId, action.target, catalog);
      break;
    case "use_location":
      useLocation(game, actorSeat, action.locationInstanceId, action.target, catalog);
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
    deck: undefined,
    deckCount: player.deck.length,
    sideboard: undefined,
    sideboardCount: player.sideboard?.length ?? 0,
    hand: player.hand.map((card) => (player.seat === viewerSeat ? card : { instanceId: card.instanceId, owner: card.owner, hidden: true }))
  })) as unknown as PublicGameState["players"];
  const pendingChoice = game.pendingChoice
    ? {
      ...game.pendingChoice,
      options: game.pendingChoice.options.map((option) => game.pendingChoice?.seat === viewerSeat ? option : { instanceId: option.instanceId, owner: option.owner, hidden: true })
    }
    : undefined;
  return { ...game, pendingChoice, viewerSeat, players };
}

function createPlayerState(seat: Seat, input: GamePlayerInput, catalog: Map<string, CardDefinition>): PlayerGameState {
  const deckCards = input.deck.cardIds.map((cardId) => getCard(catalog, cardId));
  const startingHealth = Math.max(GAME_RULES.heroHealth, ...deckCards.map((card) => card.deckRules?.startingHealth ?? 0));
  const hasBenedictus = deckCards.some((card) => hasRule(card, "priest_benedictus"));
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
      heroPowerCardId: hasBenedictus ? "hero_power_mind_spike" : undefined
    },
    deck: input.deck.cardIds.map((cardId) => createInstance(cardId, seat, "starting_deck")),
    hand: [],
    sideboard: (input.deck.sideboardCardIds ?? []).map((cardId) => {
      if (!catalog.has(cardId)) throw new Error(`备牌包含未知卡牌：${cardId}`);
      return createInstance(cardId, seat, "sideboard");
    }),
    board: [],
    locations: [],
    graveyard: [],
    maxMana: 0,
    mana: 0,
    fatigue: 0,
    mulliganDone: false
  };
}

function applyMulligan(game: GameState, seat: Seat, cardInstanceIds: string[], catalog: Map<string, CardDefinition>): void {
  if (game.phase !== "mulligan") throw new Error("当前不在换牌阶段。");
  const player = game.players[seat];
  if (player.mulliganDone) throw new Error("你已经完成换牌。");
  const selected = new Set(cardInstanceIds);
  const kept: CardInstance[] = [];
  const returned: CardInstance[] = [];
  for (const card of player.hand) {
    if (selected.has(card.instanceId) && card.cardId !== "coin") returned.push(card);
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

  if ((card.type === "minion" || card.type === "location") && occupiedBoardSlots(player) >= GAME_RULES.maxBoardSize) throw new Error("战场已满。");
  player.mana -= cost;
  player.hand.splice(handIndex, 1);
  if (counterPlayedCard(game, seat, card, catalog)) {
    player.graveyard.push(card.id);
    return;
  }

  if (card.type === "minion") {
    const minion = createBoardMinion(instance, card, game.turn);
    player.board.push(minion);
    addLog(game, `${player.nickname} 召唤了 ${card.name}。`);
    applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "battlecry" }, catalog);
    applyRuleBattlecry(game, seat, card, target, catalog);
    beginCardChoice(game, seat, card, catalog, minion.instanceId);
  } else if (card.type === "spell") {
    addLog(game, `${player.nickname} 使用了 ${card.name}。`);
    applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "play" }, catalog);
    applyRulePlay(game, seat, card, target, catalog);
    beginCardChoice(game, seat, card, catalog);
    const remainingUses = instance.remainingUses ?? card.repeatableUses ?? 1;
    if (remainingUses > 1) player.hand.push({ ...instance, remainingUses: remainingUses - 1 });
    else player.graveyard.push(card.id);
  } else if (card.type === "weapon") {
    player.hero.weapon = { cardId: card.id, attack: card.attack ?? 0, durability: card.durability ?? 1 };
    addLog(game, `${player.nickname} 装备了 ${card.name}。`);
    player.graveyard.push(card.id);
  } else if (card.type === "location") {
    player.locations.push(createBoardLocation(instance, card, game.turn));
    addLog(game, `${player.nickname} 放置了 ${card.name}。`);
  } else if (card.type === "hero") {
    addLog(game, `${player.nickname} 化身为 ${card.name}。`);
    applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "play" }, catalog);
    applyRulePlay(game, seat, card, target, catalog);
    player.graveyard.push(card.id);
  }
  if (instance.drawnTurn === game.turn) {
    applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "quickdraw" }, catalog);
  }
  cleanupDeaths(game, catalog);
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
  addLog(game, `${player.nickname} 使用了地标 ${card.name}。`);
  applyEffects(game, { sourceCard: card, sourceOwner: seat, selectedTarget: target, trigger: "location" }, catalog);
  applyRuleLocation(game, seat, card, target, catalog);
  location.durability -= 1;
  location.readyTurn = game.turn + 2;
  if (location.durability <= 0) {
    player.locations.splice(locationIndex, 1);
    player.graveyard.push(card.id);
  }
  cleanupDeaths(game, catalog);
}

function applyRuleBattlecry(game: GameState, seat: Seat, card: CardDefinition, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
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
      beginChoice(game, seat, "theotar_friendly", "先选择一张你要交给对手的手牌。", player.hand);
    }
  }
  if (hasRule(card, "rustrot_viper")) {
    const weapon = enemy.hero.weapon;
    if (!weapon) addLog(game, `${card.name} 没有找到可摧毁的敌方武器。`);
    else {
      enemy.graveyard.push(weapon.cardId);
      delete enemy.hero.weapon;
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
  if (hasRule(card, "harrison_jones")) {
    const weapon = enemy.hero.weapon;
    if (!weapon) addLog(game, `${card.name} 没有找到可摧毁的敌方武器。`);
    else {
      const durability = weapon.durability;
      enemy.graveyard.push(weapon.cardId);
      delete enemy.hero.weapon;
      addLog(game, `${card.name} 摧毁了 ${enemy.nickname} 的武器，并让 ${player.nickname} 抽 ${durability} 张牌。`);
      drawCards(game, seat, durability, catalog, true);
    }
  }
  if (hasRule(card, "big_game_hunter")) destroyLargeMinion(game, target, catalog, card.name);
  if (hasRule(card, "black_knight")) destroyEnemyTaunt(game, seat, target, catalog, card.name);
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
  if (hasRule(card, "priest_banker")) copyRandomSpell(game, seat, catalog, card.name);
  if (hasRule(card, "priest_najark")) borrowEnemyMinion(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_loatheb")) taxNextSpells(game, other(seat), 5, card.name);
  if (hasRule(card, "priest_spawn_of_shadows")) damageBothHeroes(game, seat, 4, catalog);
  if (hasRule(card, "priest_aviana")) setHandsToOneMana(game, catalog, card.name);
}

function applyRulePlay(game: GameState, seat: Seat, card: CardDefinition, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  if (hasRule(card, "savage_roar")) {
    player.hero.temporaryAttack += 2;
    for (const minion of player.board) {
      minion.attack += 2;
      minion.temporaryAttack += 2;
    }
    addLog(game, `${player.nickname} 的所有角色本回合获得 +2 攻击力。`);
  }
  if (hasRule(card, "force_of_nature")) summonForceTreants(game, seat, catalog);
  if (hasRule(card, "wild_growth")) {
    if (player.maxMana < GAME_RULES.maxMana) {
      player.maxMana += 1;
      addLog(game, `${player.nickname} 获得了一个空的法力水晶。`);
    } else {
      addCardToHand(game, seat, createInstance("roar_excess_mana", seat), catalog, "获得了一张过量法力。");
    }
  }
  if (hasRule(card, "swipe")) swipe(game, seat, target, catalog);
  if (hasRule(card, "priest_raise_dead")) raiseDead(game, seat, catalog);
  if (hasRule(card, "priest_identity_theft")) identityTheft(game, seat, catalog);
  if (hasRule(card, "priest_hysteria")) hysteria(game, seat, target, catalog, card.name);
  if (hasRule(card, "priest_lone_ranger_reno")) {
    clearEnemyBoard(game, seat, catalog, card.name);
    equipRenoBullet(game, seat, catalog);
  }
  if (hasRule(card, "priest_shadowreaper")) becomeShadowreaper(game, seat, catalog, card.name);
}

function applyRuleLocation(game: GameState, seat: Seat, card: CardDefinition, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  if (hasRule(card, "priest_puppet_theatre")) puppetTheatre(game, seat, target, catalog, card.name);
}

function beginCardChoice(game: GameState, seat: Seat, card: CardDefinition, catalog: Map<string, CardDefinition>, sourceInstanceId?: string): void {
  if (!card.choiceOptionCardIds?.length) return;
  const options = card.choiceOptionCardIds.map((cardId) => {
    getCard(catalog, cardId);
    return createInstance(cardId, seat);
  });
  beginChoice(game, seat, "card_choice", `选择 ${card.name} 的抉择效果。`, options, undefined, sourceInstanceId);
}

function applyChoice(game: GameState, seat: Seat, choiceId: string, optionInstanceId: string, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const choice = game.pendingChoice;
  if (!choice || choice.id !== choiceId) throw new Error("选择已过期。");
  if (choice.seat !== seat) throw new Error("现在不是你的选择。");
  const option = choice.options.find((item) => item.instanceId === optionInstanceId);
  if (!option) throw new Error("选择项不存在。");

  if (choice.kind === "etc_band") {
    const player = game.players[seat];
    const sideboardIndex = (player.sideboard ?? []).findIndex((item) => item.instanceId === option.instanceId);
    if (sideboardIndex < 0) throw new Error("这张备牌已经不可选。");
    const [picked] = player.sideboard.splice(sideboardIndex, 1);
    addCardToHand(game, seat, { ...picked, owner: seat }, catalog, `${getCard(catalog, picked.cardId).name} 从乐队加入了手牌。`);
    delete game.pendingChoice;
    return;
  }

  if (choice.kind === "card_choice") {
    const optionCard = getCard(catalog, option.cardId);
    if (cardNeedsTarget(optionCard) && !target) throw new Error("这个抉择效果需要选择目标。");
    applyEffects(game, { sourceCard: optionCard, sourceOwner: seat, selectedTarget: target, trigger: "play" }, catalog);
    applyRuleChoice(game, seat, optionCard, choice.sourceInstanceId, catalog);
    addLog(game, `${game.players[seat].nickname} 选择了 ${optionCard.name}。`);
    delete game.pendingChoice;
    cleanupDeaths(game, catalog);
    return;
  }

  if (choice.kind === "theotar_friendly") {
    beginChoice(game, seat, "theotar_enemy", "再选择一张要从对手手牌换来的牌。", game.players[other(seat)].hand, option.instanceId);
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
    addCardToHand(game, seat, createInstance(option.cardId, seat), catalog, `选择了 ${getCard(catalog, option.cardId).name}。`);
    delete game.pendingChoice;
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

function beginChoice(game: GameState, seat: Seat, kind: NonNullable<GameState["pendingChoice"]>["kind"], prompt: string, options: CardInstance[], chosenFriendlyInstanceId?: string, sourceInstanceId?: string): void {
  game.pendingChoice = {
    id: randomUUID(),
    seat,
    kind,
    prompt,
    options: [...options],
    chosenFriendlyInstanceId,
    sourceInstanceId
  };
}

function addCardToHand(game: GameState, seat: Seat, instance: CardInstance, catalog: Map<string, CardDefinition>, message: string): void {
  const player = game.players[seat];
  if (player.hand.length >= GAME_RULES.maxHandSize) {
    player.graveyard.push(instance.cardId);
    addLog(game, `${getCard(catalog, instance.cardId).name} 因手牌已满被弃置。`);
    return;
  }
  player.hand.push(instance);
  addLog(game, `${player.nickname} ${message}`);
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

function applyRuleChoice(game: GameState, seat: Seat, optionCard: CardDefinition, sourceInstanceId: string | undefined, catalog: Map<string, CardDefinition>): void {
  const source = sourceInstanceId ? game.players[seat].board.find((minion) => minion.instanceId === sourceInstanceId) : undefined;
  if (hasRule(optionCard, "druid_claw_charge")) {
    if (!source) throw new Error("利爪德鲁伊已经不在战场。");
    source.attack = 4;
    source.health = Math.min(source.health, 4);
    source.maxHealth = 4;
    addKeyword(source, "charge");
    source.exhausted = false;
    addLog(game, `${getCard(catalog, source.cardId).name} 进入猎豹形态。`);
  }
  if (hasRule(optionCard, "druid_claw_taunt")) {
    if (!source) throw new Error("利爪德鲁伊已经不在战场。");
    source.attack = 4;
    source.maxHealth = 6;
    source.health = 6;
    addKeyword(source, "taunt");
    addLog(game, `${getCard(catalog, source.cardId).name} 进入熊形态。`);
  }
  if (hasRule(optionCard, "ancient_war_attack")) {
    if (!source) throw new Error("战争古树已经不在战场。");
    source.attack += 5;
    addLog(game, `${getCard(catalog, source.cardId).name} 获得 +5 攻击力。`);
  }
  if (hasRule(optionCard, "ancient_war_taunt")) {
    if (!source) throw new Error("战争古树已经不在战场。");
    source.maxHealth += 5;
    source.health += 5;
    addKeyword(source, "taunt");
    addLog(game, `${getCard(catalog, source.cardId).name} 获得 +5 生命值和嘲讽。`);
  }
  if (hasRule(optionCard, "cenarius_buff")) {
    const others = game.players[seat].board.filter((minion) => minion.instanceId !== sourceInstanceId);
    for (const minion of others) buff(game, { type: "minion", seat, instanceId: minion.instanceId }, 2, 2, catalog);
    if (others.length === 0) addLog(game, `${optionCard.name} 没有可强化的其他友方随从。`);
  }
  if (hasRule(optionCard, "priest_okani_minion") || hasRule(optionCard, "priest_okani_spell")) {
    if (!source) throw new Error("剑圣奥卡尼已经不在战场。");
    source.counterNextCardType = hasRule(optionCard, "priest_okani_minion") ? "minion" : "spell";
    addLog(game, `${getCard(catalog, source.cardId).name} 准备反制下一张敌方${source.counterNextCardType === "minion" ? "随从牌" : "法术牌"}。`);
  }
}

function summonForceTreants(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const card = getCard(catalog, "roar_token_treant_charge");
  const player = game.players[seat];
  let count = 0;
  while (count < 3 && occupiedBoardSlots(player) < GAME_RULES.maxBoardSize) {
    const treant = createBoardMinion(createInstance(card.id, seat), card, game.turn);
    treant.expiresAtEndOfTurn = true;
    player.board.push(treant);
    count += 1;
  }
  addLog(game, `${player.nickname} 用自然之力召唤了 ${count} 个冲锋树人。`);
}

function swipe(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  if (!target || target.seat !== other(seat)) throw new Error("横扫需要选择一个敌方目标。");
  const context: EffectContext = { sourceCard: getCard(catalog, "roar_swipe"), sourceOwner: seat, selectedTarget: target, trigger: "play" };
  const damageBonus = spellDamageBonus(game, context);
  dealDamage(game, target, 4 + damageBonus, seat, catalog, false);
  const enemyTargets = [
    { type: "hero" as const, seat: other(seat) },
    ...game.players[other(seat)].board.map((minion) => ({ type: "minion" as const, seat: other(seat), instanceId: minion.instanceId }))
  ];
  for (const otherTarget of enemyTargets) {
    if (!sameTarget(otherTarget, target)) dealDamage(game, otherTarget, 1 + damageBonus, seat, catalog, false);
  }
}

function destroyLargeMinion(game: GameState, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion") throw new Error(`${sourceName} 需要选择一个随从。`);
  const minion = findMinion(game, target);
  if (!minion || minion.attack < 7) throw new Error(`${sourceName} 只能消灭攻击力至少为 7 的随从。`);
  destroy(game, target, catalog);
}

function destroyEnemyTaunt(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>, sourceName: string): void {
  if (!target || target.type !== "minion" || target.seat !== other(seat)) throw new Error(`${sourceName} 需要选择一个敌方嘲讽随从。`);
  const minion = findMinion(game, target);
  if (!minion?.keywords.includes("taunt")) throw new Error(`${sourceName} 只能消灭具有嘲讽的敌方随从。`);
  destroy(game, target, catalog);
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
  if (hasDuplicateCardIds(player.deck)) {
    addLog(game, `${sourceName} 检查后发现牌库仍有重复牌。`);
    return;
  }
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
  if (spirit) buff(game, { type: "minion", seat, instanceId: spirit.instanceId }, 1, 1, catalog);
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
  const attack = Math.max(0, victim.attack - 1);
  const health = Math.max(0, victim.health - 1);
  victim.attack -= attack;
  victim.maxHealth = Math.max(1, victim.maxHealth - health);
  victim.health = Math.max(1, victim.health - health);
  serena.attack += attack;
  serena.maxHealth += health;
  serena.health += health;
  addLog(game, `${sourceName} 从 ${targetName(game, target, catalog)} 偷取了 ${attack}/${health}。`);
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
  borrowed.borrowedFromSeat = enemy.seat;
  borrowed.borrowedByInstanceId = najark.instanceId;
  owner.board.push(borrowed);
  addLog(game, `${sourceName} 暂时夺取了 ${getCard(catalog, borrowed.cardId).name}。`);
}

function clearEnemyBoard(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>, sourceName: string): void {
  for (const minion of [...game.players[other(seat)].board]) destroy(game, { type: "minion", seat: other(seat), instanceId: minion.instanceId }, catalog);
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

function heroPower(game: GameState, seat: Seat, target: TargetRef | undefined, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  if (player.hero.heroPowerUsed) throw new Error("本回合已经使用过英雄技能。");
  const power = getCard(catalog, player.hero.heroPowerCardId ?? `hero_power_${player.class}`);
  const cost = heroPowerCost(game, seat, power, catalog);
  if (player.mana < cost) throw new Error("法力不足。");
  if (cardNeedsTarget(power) && !target) throw new Error("英雄技能需要选择目标。");
  player.mana -= cost;
  player.hero.heroPowerUsed = true;
  addLog(game, `${player.nickname} 使用了英雄技能 ${power.name}。`);
  applyEffects(game, { sourceCard: power, sourceOwner: seat, selectedTarget: target, trigger: "hero_power" }, catalog);
  applyRuleHeroPower(game, seat, power, catalog);
  if (player.board.some((minion) => !minion.silenced && hasRule(getCard(catalog, minion.cardId), "priest_spawn_of_shadows"))) {
    damageBothHeroes(game, seat, 4, catalog);
  }
  cleanupDeaths(game, catalog);
}

function attack(game: GameState, actorSeat: Seat, source: TargetRef, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  if (source.seat !== actorSeat) throw new Error("只能操作自己的角色。");
  if (target.seat === actorSeat) throw new Error("不能攻击己方角色。");
  enforceTaunt(game, actorSeat, target);

  if (source.type === "hero") {
    const player = game.players[actorSeat];
    const weapon = player.hero.weapon;
    const heroAttack = (weapon?.attack ?? 0) + player.hero.temporaryAttack;
    if (heroAttack <= 0) throw new Error("英雄没有可用攻击力。");
    if (player.hero.attacksThisTurn > 0) throw new Error("英雄本回合已经攻击过。");
    dealDamage(game, target, heroAttack, actorSeat, catalog, false);
    const defender = getTarget(game, target);
    if (defender.kind === "minion") dealDamage(game, source, defender.minion.attack, target.seat, catalog, false);
    player.hero.attacksThisTurn += 1;
    if (weapon) {
      weapon.durability -= 1;
      if (weapon.durability <= 0) {
        player.graveyard.push(weapon.cardId);
        delete player.hero.weapon;
      }
    }
    addLog(game, `${player.nickname} 的英雄发起攻击。`);
  } else {
    const minion = findMinion(game, source);
    if (!minion) throw new Error("攻击者不存在。");
    if (!canMinionAttack(minion, target, game.turn)) throw new Error("该随从现在不能攻击。");
    const defender = getTarget(game, target);
    dealDamage(game, target, minion.attack, actorSeat, catalog, minion.keywords.includes("lifesteal"));
    if (defender.kind === "minion") {
      dealDamage(game, source, defender.minion.attack, target.seat, catalog, defender.minion.keywords.includes("lifesteal"));
    }
    minion.attacksThisTurn += 1;
    addLog(game, `${game.players[actorSeat].nickname} 使用 ${getCard(catalog, minion.cardId).name} 发起攻击。`);
  }
  cleanupDeaths(game, catalog);
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
  player.maxMana = Math.min(GAME_RULES.maxMana, player.maxMana + 1);
  player.mana = player.maxMana;
  player.hero.heroPowerUsed = false;
  player.hero.attacksThisTurn = 0;
  player.hero.temporaryAttack = 0;
  rollRenoBullet(game, seat, catalog);
  for (const minion of player.board) {
    minion.exhausted = false;
    minion.attacksThisTurn = 0;
  }
  drawCards(game, seat, 1, catalog, true);
  addLog(game, `第 ${game.turn} 回合开始，轮到 ${player.nickname}。`);
}

function resolveEndTurnRules(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  for (const minion of player.board) {
    const card = getCard(catalog, minion.cardId);
    if (!minion.silenced && hasRule(card, "ragnaros")) {
      const enemies = [
        { type: "hero" as const, seat: other(seat) },
        ...game.players[other(seat)].board.map((enemy) => ({ type: "minion" as const, seat: other(seat), instanceId: enemy.instanceId }))
      ];
      const random = rng(game.seed + game.turn * 131 + minion.instanceId.length);
      const target = enemies[Math.floor(random() * enemies.length)];
      dealDamage(game, target, 8, seat, catalog, false);
      addLog(game, `${card.name} 在回合结束时喷发。`);
    }
  }
}

function expireTurnEffects(game: GameState, seat: Seat, catalog: Map<string, CardDefinition>): void {
  const player = game.players[seat];
  player.hero.temporaryAttack = 0;
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
    const targets = resolveEffectTargets(game, effect, context);
    if (effect.type === "gain_mana") {
      const player = game.players[context.sourceOwner];
      const before = player.mana;
      player.mana = Math.min(GAME_RULES.maxMana, player.mana + effect.amount);
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

function resolveEffectTargets(game: GameState, effect: CardEffect, context: EffectContext): TargetRef[] {
  const targetKind = effect.target ?? "none";
  const enemy = other(context.sourceOwner);
  if (targetKind === "none") return [];
  if (targetKind === "selected") {
    if (!context.selectedTarget) throw new Error("需要选择目标。");
    return [context.selectedTarget];
  }
  if (targetKind === "own_hero") return [{ type: "hero", seat: context.sourceOwner }];
  if (targetKind === "enemy_hero") return [{ type: "hero", seat: enemy }];
  if (targetKind === "all_enemies") return [{ type: "hero", seat: enemy }, ...game.players[enemy].board.map((minion) => ({ type: "minion" as const, seat: enemy, instanceId: minion.instanceId }))];
  if (targetKind === "all_enemy_minions") return game.players[enemy].board.map((minion) => ({ type: "minion" as const, seat: enemy, instanceId: minion.instanceId }));
  if (targetKind === "all_minions") return game.players.flatMap((player) => player.board.map((minion) => ({ type: "minion" as const, seat: player.seat, instanceId: minion.instanceId })));
  if (targetKind === "any_minion") {
    if (!context.selectedTarget || context.selectedTarget.type !== "minion") throw new Error("需要选择一个随从。");
    return [context.selectedTarget];
  }
  if (targetKind === "friendly_minion" || targetKind === "enemy_minion") {
    if (!context.selectedTarget || context.selectedTarget.type !== "minion") throw new Error("需要选择一个随从。");
    const expectedSeat = targetKind === "friendly_minion" ? context.sourceOwner : enemy;
    if (context.selectedTarget.seat !== expectedSeat) throw new Error("目标阵营不合法。");
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
      player.hero.health -= player.fatigue;
      if (withLog) addLog(game, `${player.nickname} 疲劳并受到 ${player.fatigue} 点伤害。`);
      continue;
    }
    if (player.hand.length >= GAME_RULES.maxHandSize) {
      player.graveyard.push(drawn.cardId);
      if (withLog) addLog(game, `${getCard(catalog, drawn.cardId).name} 因手牌已满被弃置。`);
    } else {
      player.hand.push({ ...drawn, drawnTurn: game.turn });
      if (withLog) addLog(game, `${player.nickname} 抽了一张牌。`);
    }
  }
}

function summon(game: GameState, seat: Seat, cardId: string, amount: number, catalog: Map<string, CardDefinition>): void {
  const card = getCard(catalog, cardId);
  if (card.type !== "minion") throw new Error("只能召唤随从。");
  const player = game.players[seat];
  for (let index = 0; index < amount && occupiedBoardSlots(player) < GAME_RULES.maxBoardSize; index += 1) {
    const minion = createBoardMinion(createInstance(cardId, seat), card, game.turn);
    player.board.push(minion);
    addLog(game, `${player.nickname} 召唤了 ${card.name}。`);
  }
}

function dealDamage(game: GameState, target: TargetRef, amount: number, sourceOwner: Seat, catalog: Map<string, CardDefinition>, lifesteal: boolean): void {
  if (amount <= 0) return;
  const resolved = getTarget(game, target);
  let dealt = amount;
  if (resolved.kind === "hero") {
    const hero = game.players[target.seat].hero;
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
      addLog(game, `${getCard(catalog, resolved.minion.cardId).name} 的圣盾抵消了伤害。`);
    } else {
      resolved.minion.health -= amount;
      addLog(game, `${game.players[sourceOwner].nickname} 对 ${targetName(game, target, catalog)} 造成 ${amount} 点伤害。`);
    }
  }
  if (lifesteal && dealt > 0) heal(game, { type: "hero", seat: sourceOwner }, dealt, catalog);
}

function heal(game: GameState, target: TargetRef, amount: number, catalog: Map<string, CardDefinition>): void {
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
  const resolved = getTarget(game, target);
  if (resolved.kind !== "minion") throw new Error("只能强化随从。");
  resolved.minion.attack += attack;
  resolved.minion.maxHealth += health;
  resolved.minion.health += health;
  addLog(game, `${targetName(game, target, catalog)} 获得 +${attack}/+${health}。`);
}

function destroy(game: GameState, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  const resolved = getTarget(game, target);
  if (resolved.kind === "hero") {
    resolved.hero.health = 0;
  } else {
    resolved.minion.health = 0;
  }
  addLog(game, `${targetName(game, target, catalog)} 被消灭。`);
}

function silence(game: GameState, target: TargetRef, catalog: Map<string, CardDefinition>): void {
  const resolved = getTarget(game, target);
  if (resolved.kind !== "minion") throw new Error("只能沉默随从。");
  const card = getCard(catalog, resolved.minion.cardId);
  resolved.minion.attack = resolved.minion.attackOverride ?? card.attack ?? resolved.minion.attack;
  resolved.minion.maxHealth = resolved.minion.healthOverride ?? card.health ?? resolved.minion.maxHealth;
  resolved.minion.health = Math.min(resolved.minion.health, resolved.minion.maxHealth);
  resolved.minion.keywords = [];
  resolved.minion.silenced = true;
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
        player.graveyard.push(card.id);
        addLog(game, `${card.name} 被消灭。`);
        if (!minion.silenced && hasRule(card, "priest_najark")) returnBorrowedMinions(game, minion.instanceId, catalog);
        if (!minion.silenced) applyEffects(game, { sourceCard: card, sourceOwner: player.seat, trigger: "deathrattle" }, catalog);
      }
      changed = true;
    }
  }
}

function enforceTaunt(game: GameState, attackerSeat: Seat, target: TargetRef): void {
  const defender = game.players[other(attackerSeat)];
  const hasTaunt = defender.board.some((minion) => minion.keywords.includes("taunt"));
  if (!hasTaunt) return;
  if (target.type !== "minion") throw new Error("必须优先攻击具有嘲讽的随从。");
  const minion = findMinion(game, target);
  if (!minion?.keywords.includes("taunt")) throw new Error("必须优先攻击具有嘲讽的随从。");
}

function canMinionAttack(minion: BoardMinion, target: TargetRef, turn: number): boolean {
  if (minion.cannotAttack) return false;
  if (minion.attack <= 0) return false;
  const limit = minion.keywords.includes("windfury") ? 2 : 1;
  if (minion.attacksThisTurn >= limit) return false;
  if (minion.summonedTurn === turn) {
    if (minion.keywords.includes("charge")) return true;
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

function createBoardMinion(instance: CardInstance, card: CardDefinition, turn: number): BoardMinion {
  const attack = instance.attackOverride ?? card.attack ?? 0;
  const health = instance.healthOverride ?? card.health ?? 1;
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
    cannotAttack: hasRule(card, "ragnaros")
  };
}

function createBoardLocation(instance: CardInstance, card: CardDefinition, turn: number): BoardLocation {
  return {
    ...instance,
    durability: card.durability ?? 1,
    readyTurn: turn
  };
}

function occupiedBoardSlots(player: PlayerGameState): number {
  return player.board.length + player.locations.length;
}

function createInstance(cardId: string, owner: Seat, origin: CardInstance["origin"] = "generated"): CardInstance {
  return { cardId, owner, origin, instanceId: randomUUID() };
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
  return game.players[context.sourceOwner].board.filter((minion) => minion.keywords.includes("spell_damage")).length;
}

function hasRule(card: CardDefinition, rule: NonNullable<CardDefinition["rules"]>[number]): boolean {
  return Boolean(card.rules?.includes(rule));
}

function cardPlayCost(game: GameState, seat: Seat, instance: CardInstance, card: CardDefinition, catalog: Map<string, CardDefinition>): number {
  const tax = card.type === "spell" && game.players[seat].spellCostIncrease?.throughTurn === game.turn
    ? game.players[seat].spellCostIncrease?.amount ?? 0
    : 0;
  const cost = (instance.costOverride ?? card.cost) + tax;
  return opponentHasRuleOnBoard(game, seat, "razorscale", catalog) ? Math.max(cost, 2) : cost;
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

function addLog(game: GameState, message: string): void {
  const entry: GameLogEntry = {
    id: game.logs.length + 1,
    at: new Date().toISOString(),
    message
  };
  game.logs = [...game.logs.slice(-80), entry];
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
