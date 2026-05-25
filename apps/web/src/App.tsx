import { Ban, CheckCircle2, DoorOpen, Hammer, LogIn, Plus, RefreshCcw, Save, Shield, Snowflake, Swords, Trash2, Upload, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { io, type Socket } from "socket.io-client";
import { CARD_CLASSES, CLASS_LABELS, cardNeedsTarget, validateCard, type CardDefinition, type CardEffect, type DeckTemplate, type GameAction, type PlayerProfile, type PublicGameState, type RoomState, type TargetRef } from "@dormstone/shared";

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };
type Tab = "lobby" | "decks" | "editor" | "battle";

const emptyCard: CardDefinition = {
  id: "",
  name: "",
  class: "neutral",
  type: "minion",
  rarity: "common",
  cost: 1,
  attack: 1,
  health: 1,
  text: "",
  keywords: [],
  effects: [],
  status: "draft",
  collectible: true,
  version: 1
};

export function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [nickname, setNickname] = useState(localStorage.getItem("dormstone.nickname") ?? "");
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [templates, setTemplates] = useState<DeckTemplate[]>([]);
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [game, setGame] = useState<PublicGameState | null>(null);
  const [tab, setTab] = useState<Tab>("lobby");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const nextSocket = io("/", { transports: ["websocket", "polling"] });
    nextSocket.on("lobby:state", setRooms);
    nextSocket.on("room:state", (nextRoom: RoomState) => {
      setRoom(nextRoom);
      if (nextRoom.status === "playing") setTab("battle");
    });
    nextSocket.on("game:state", (nextGame: PublicGameState) => {
      setGame(nextGame);
      setTab("battle");
    });
    nextSocket.on("room:deleted", (payload: { code: string }) => {
      setRoom((current) => current?.code === payload.code ? null : current);
      setGame((current) => current?.roomCode === payload.code ? null : current);
      setTab((current) => current === "battle" ? "lobby" : current);
    });
    setSocket(nextSocket);
    return () => {
      nextSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!profile || !socket) return;
    emitAck(socket, "profile:identify", { nickname: profile.nickname }).catch(showError(setNotice));
  }, [profile, socket]);

  async function login() {
    const clean = nickname.trim();
    if (!clean) return;
    const nextProfile = await api<PlayerProfile>("/api/profile", { method: "POST", body: JSON.stringify({ nickname: clean }) });
    localStorage.setItem("dormstone.nickname", nextProfile.nickname);
    setProfile(nextProfile);
    setNickname(nextProfile.nickname);
    await refreshAll(nextProfile);
  }

  async function refreshAll(activeProfile = profile) {
    if (!activeProfile) return;
    const [nextCards, nextTemplates] = await Promise.all([
      api<CardDefinition[]>(`/api/cards?nickname=${encodeURIComponent(activeProfile.nickname)}${activeProfile.isAdmin ? "&includeHidden=1" : ""}`),
      api<DeckTemplate[]>("/api/deck-templates")
    ]);
    setCards(nextCards);
    setTemplates(nextTemplates);
  }

  if (!profile) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">Dormstone</p>
            <h1>原创局域网卡牌对战</h1>
          </div>
          <div className="login-row">
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="输入宿舍昵称" onKeyDown={(event) => event.key === "Enter" && login().catch(showError(setNotice))} />
            <button onClick={() => login().catch(showError(setNotice))}>
              <LogIn size={18} /> 进入
            </button>
          </div>
          {notice && <p className="notice">{notice}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dormstone</p>
          <h1>局域网原创卡牌桌</h1>
        </div>
        <div className="profile-pill">
          <Shield size={16} />
          {profile.nickname}
          {profile.isAdmin && <span>管理员</span>}
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === "lobby" ? "active" : ""} onClick={() => setTab("lobby")}>大厅</button>
        <button className={tab === "decks" ? "active" : ""} onClick={() => setTab("decks")}>卡组模板</button>
        {profile.isAdmin && <button className={tab === "editor" ? "active" : ""} onClick={() => setTab("editor")}>卡牌编辑</button>}
        {game && <button className={tab === "battle" ? "active" : ""} onClick={() => setTab("battle")}>对战</button>}
        <button className="icon-button" title="刷新数据" onClick={() => refreshAll().catch(showError(setNotice))}>
          <RefreshCcw size={17} />
        </button>
      </nav>

      {notice && <div className="toast">{notice}</div>}

      {tab === "lobby" && socket && <Lobby socket={socket} profile={profile} templates={templates} rooms={rooms} room={room} setNotice={setNotice} />}
      {tab === "decks" && <TemplateDeckPicker templates={templates} />}
      {tab === "editor" && profile.isAdmin && <CardEditor profile={profile} cards={cards} onSaved={() => refreshAll().catch(showError(setNotice))} setNotice={setNotice} />}
      {tab === "battle" && game && socket && <Battlefield game={game} cards={cards} socket={socket} setNotice={setNotice} />}
    </main>
  );
}

function Lobby({ socket, profile, templates, rooms, room, setNotice }: { socket: Socket; profile: PlayerProfile; templates: DeckTemplate[]; rooms: RoomState[]; room: RoomState | null; setNotice: (value: string) => void }) {
  const [joinCode, setJoinCode] = useState("");
  const ownSeat = room?.seats.find((seat) => seat.nickname === profile.nickname);
  const templateMap = useMemo(() => new Map(templates.map((template) => [template.id, template])), [templates]);
  const canDeleteCurrentRoom = Boolean(room && room.status !== "playing" && (profile.isAdmin || room.seats[0].nickname === profile.nickname));

  async function createRoom() {
    await emitAck(socket, "room:create", {});
  }

  async function joinRoom(code = joinCode) {
    await emitAck(socket, "room:join", { code });
  }

  async function deleteRoom(code = room?.code) {
    if (!code) return;
    if (!window.confirm(`删除房间 ${code}？`)) return;
    await emitAck(socket, "room:delete", { code });
    setNotice("房间已删除。");
  }

  async function selectDeck(deckId: string) {
    await emitAck(socket, "room:selectDeck", { deckId });
  }

  async function ready(next: boolean) {
    await emitAck(socket, "room:ready", { ready: next });
  }

  return (
    <section className="grid two">
      <div className="panel">
        <div className="section-title">
          <h2>房间</h2>
          <button onClick={() => createRoom().catch(showError(setNotice))}>
            <Plus size={17} /> 创建
          </button>
        </div>
        <div className="join-row">
          <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="房间码" />
          <button onClick={() => joinRoom().catch(showError(setNotice))}>
            <DoorOpen size={17} /> 加入
          </button>
        </div>
        <div className="room-list">
          {rooms.map((item) => {
            const canDelete = item.status !== "playing" && (profile.isAdmin || item.seats[0].nickname === profile.nickname);
            return (
              <div key={item.code} className="room-row">
                <button className="room-join" onClick={() => joinRoom(item.code).catch(showError(setNotice))}>
                  <strong>{item.code}</strong>
                  <span>{item.status === "waiting" ? "等待中" : item.status === "playing" ? "对战中" : "已结束"}</span>
                  <span>{item.seats.filter((seat) => seat.nickname).length}/2</span>
                </button>
                {canDelete && (
                  <button className="icon-button danger room-delete" title="删除房间" onClick={() => deleteRoom(item.code).catch(showError(setNotice))}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <h2>{room ? `当前房间 ${room.code}` : "当前房间"}</h2>
          {canDeleteCurrentRoom && (
            <button className="danger" onClick={() => deleteRoom().catch(showError(setNotice))}>
              <Trash2 size={17} /> 删除
            </button>
          )}
        </div>
        {!room && <p className="muted">创建或加入房间后，在这里选择卡组并准备。</p>}
        {room && (
          <>
            <div className="seat-list">
              {room.seats.map((seat) => (
                <div className="seat" key={seat.seat}>
                  <strong>{seat.nickname ?? "空位"}</strong>
                  <span>{seat.connected ? "在线" : "离线"}</span>
                  <span>{seat.ready ? "已准备" : "未准备"}</span>
                  {seat.deckId && <span>{templateMap.get(seat.deckId)?.nameZh ?? "预设卡组"}</span>}
                </div>
              ))}
            </div>
            <label className="field-label">选择预设卡组</label>
            <select value={ownSeat?.deckId ?? ""} onChange={(event) => selectDeck(event.target.value).catch(showError(setNotice))}>
              <option value="">选择一套预设卡组</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.nameZh} · {CLASS_LABELS[template.defaultClass]} · {template.fame}</option>
              ))}
            </select>
            <div className="action-row">
              <button disabled={!ownSeat?.deckId} onClick={() => ready(!ownSeat?.ready).catch(showError(setNotice))}>
                <CheckCircle2 size={17} /> {ownSeat?.ready ? "取消准备" : "准备"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function TemplateDeckPicker({ templates }: { templates: DeckTemplate[] }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState<DeckTemplate | null>(null);
  const templateClasses = useMemo(() => [...new Map(templates.map((template) => [template.classEn, template.classZh])).entries()], [templates]);
  const filtered = templates.filter((template) => {
    const haystack = `${template.nameZh}${template.nameEn}${template.classZh}${template.archetype}${template.tags.join("")}${template.coreCardsZh.join("")}`;
    const matchesSearch = !search.trim() || haystack.toLowerCase().includes(search.trim().toLowerCase());
    const matchesClass = classFilter === "all" || template.classEn === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <section className="grid template-grid">
      <div className="panel">
        <div className="section-title">
          <h2>卡组模板</h2>
          <span className="muted">{filtered.length}/{templates.length}</span>
        </div>
        <div className="filters">
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
            <option value="all">全部职业</option>
            {templateClasses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索模板、职业、核心卡" />
        </div>
        {templates.length === 0 && <p className="muted">未找到 CSV 模板。请确认 hearthstone_curated_famous_decks.csv 位于项目上级桌面目录，或设置 DECK_TEMPLATES_CSV。</p>}
        <div className="template-list">
          {filtered.map((template) => (
            <button key={template.id} className={`template-row ${selected?.id === template.id ? "selected" : ""}`} onClick={() => setSelected(template)}>
              <span className="rank">{template.fame}</span>
              <div>
                <strong>{template.nameZh}</strong>
                <small>{template.nameEn} · {template.era}</small>
              </div>
              <em>{template.classZh}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <h2>{selected ? selected.nameZh : "模板详情"}</h2>
          <span className="muted">大厅中直接选择</span>
        </div>
        {!selected && <p className="muted">选择一套历史模板后，可以查看职业技能、核心卡和取胜方式。对战时不需要创建卡组，直接在大厅选择一套预设即可。</p>}
        {selected && (
          <>
            <div className="template-hero">
              <div>
                <p className="eyebrow">{selected.hero.classZh} · {selected.hero.defaultHero}</p>
                <h3>{selected.hero.heroPowerName}</h3>
                <p>{selected.hero.heroPowerCost} 费：{selected.hero.heroPowerText}</p>
              </div>
              <div className="tag-row">{selected.hero.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
            </div>
            {!selected.class && (
              <p className="muted">这是多职业体系模板，当前默认按 {CLASS_LABELS[selected.defaultClass]} 生成对战代理卡组。</p>
            )}
            <div className="detail-grid">
              <div><span>类型</span><strong>{selected.archetype}</strong></div>
              <div><span>模式</span><strong>{selected.mode}</strong></div>
              <div><span>牌数</span><strong>{selected.expectedDeckSize ?? 30}</strong></div>
              <div><span>备牌</span><strong>{selected.sideboardCardIds?.length ?? 0}</strong></div>
              <div><span>阴间度</span><strong>{selected.annoyance}/5</strong></div>
              <div><span>特别度</span><strong>{selected.uniqueness}/5</strong></div>
            </div>
            <div className="template-copy">
              <h3>核心卡参考</h3>
              <p>{selected.coreCardsZh.join("；")}</p>
              <h3>主要取胜方式</h3>
              <p>{selected.winCondition}</p>
              <h3>为什么收录</h3>
              <p>{selected.whyIncluded}</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function CardEditor({ profile, cards, onSaved, setNotice }: { profile: PlayerProfile; cards: CardDefinition[]; onSaved: () => void; setNotice: (value: string) => void }) {
  const [draft, setDraft] = useState<CardDefinition>(emptyCard);
  const [effectsText, setEffectsText] = useState("[]");
  const parsedEffects = parseEffects(effectsText);
  const validation = validateCard({ ...draft, effects: parsedEffects.ok ? parsedEffects.effects : [] });

  async function save() {
    if (!parsedEffects.ok) throw new Error("效果 JSON 格式错误。");
    const card = await api<CardDefinition>("/api/cards", { method: "POST", body: JSON.stringify({ nickname: profile.nickname, card: { ...draft, effects: parsedEffects.effects } }) });
    setDraft(card);
    setEffectsText(JSON.stringify(card.effects, null, 2));
    setNotice("卡牌已保存。");
    onSaved();
  }

  function pick(card: CardDefinition) {
    setDraft(card);
    setEffectsText(JSON.stringify(card.effects, null, 2));
  }

  async function readAsset(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("读取素材失败。"));
      reader.readAsDataURL(file);
    });
    setDraft({ ...draft, assetUrl: dataUrl });
  }

  return (
    <section className="grid editor-grid">
      <div className="panel">
        <div className="section-title">
          <h2>卡牌库</h2>
          <button onClick={() => { setDraft({ ...emptyCard, id: `card_${Date.now()}` }); setEffectsText("[]"); }}>
            <Plus size={17} /> 新建
          </button>
        </div>
        <div className="card-list compact">
          {cards.map((card) => <CardTile key={card.id} card={card} onClick={() => pick(card)} />)}
        </div>
      </div>
      <div className="panel form-panel">
        <div className="section-title">
          <h2>编辑</h2>
          <button disabled={!validation.valid || !parsedEffects.ok} onClick={() => save().catch(showError(setNotice))}>
            <Save size={17} /> 保存
          </button>
        </div>
        <div className="form-grid">
          <label>卡牌 ID<input value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} /></label>
          <label>名称<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>职业<select value={draft.class} onChange={(event) => setDraft({ ...draft, class: event.target.value as CardDefinition["class"] })}>{CARD_CLASSES.map((value) => <option key={value} value={value}>{CLASS_LABELS[value]}</option>)}</select></label>
          <label>类型<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as CardDefinition["type"] })}><option value="minion">随从</option><option value="spell">法术</option><option value="weapon">武器</option><option value="location">地标</option><option value="hero">英雄牌</option><option value="hero_power">英雄技能</option></select></label>
          <label>稀有度<select value={draft.rarity} onChange={(event) => setDraft({ ...draft, rarity: event.target.value as CardDefinition["rarity"] })}><option value="common">普通</option><option value="rare">稀有</option><option value="epic">史诗</option><option value="legendary">传说</option></select></label>
          <label>状态<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CardDefinition["status"] })}><option value="draft">草稿</option><option value="published">发布</option><option value="disabled">禁用</option></select></label>
          <label>费用<input type="number" value={draft.cost} onChange={(event) => setDraft({ ...draft, cost: Number(event.target.value) })} /></label>
          <label>攻击<input type="number" value={draft.attack ?? 0} onChange={(event) => setDraft({ ...draft, attack: Number(event.target.value) })} /></label>
          <label>生命<input type="number" value={draft.health ?? 0} onChange={(event) => setDraft({ ...draft, health: Number(event.target.value) })} /></label>
          <label>耐久<input type="number" value={draft.durability ?? 0} onChange={(event) => setDraft({ ...draft, durability: Number(event.target.value) })} /></label>
        </div>
        <label className="wide-label">卡牌文本<textarea value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} /></label>
        <label className="wide-label">关键词<input value={draft.keywords.join(",")} onChange={(event) => setDraft({ ...draft, keywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) as CardDefinition["keywords"] })} /></label>
        <label className="wide-label">效果 JSON<textarea value={effectsText} onChange={(event) => setEffectsText(event.target.value)} /></label>
        <label className="asset-upload">
          <Upload size={17} /> 上传卡面素材
          <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && readAsset(event.target.files[0]).catch(showError(setNotice))} />
        </label>
        {draft.assetUrl && <img className="asset-preview" src={draft.assetUrl} alt={draft.name} />}
        <div className="validation">
          {!parsedEffects.ok && <p>效果 JSON 格式错误。</p>}
          {validation.errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      </div>
    </section>
  );
}

function Battlefield({ game, cards, socket, setNotice }: { game: PublicGameState; cards: CardDefinition[]; socket: Socket; setNotice: (value: string) => void }) {
  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const self = game.players[game.viewerSeat];
  const opponent = game.players[game.viewerSeat === 0 ? 1 : 0];
  const [mulligan, setMulligan] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<null | { kind: "play"; handInstanceId: string } | { kind: "location"; locationInstanceId: string } | { kind: "attack"; source: TargetRef } | { kind: "hero_power" } | { kind: "choice"; choiceId: string; optionInstanceId: string }>(null);
  const choiceForSelf = game.pendingChoice?.seat === game.viewerSeat ? game.pendingChoice : undefined;
  const hasBlockingChoice = Boolean(game.pendingChoice);
  const isTurn = game.phase === "playing" && game.currentPlayer === game.viewerSeat && !hasBlockingChoice;
  const heroPowerCard = cardMap.get(self.hero.heroPowerCardId ?? `hero_power_${self.class}`);
  const heroPowerCost = heroPowerPlayCost(self, heroPowerCard, cardMap);
  const selfHeroFrozen = (self.hero.frozenUntilTurn ?? -1) >= game.turn;
  const canHeroAttack = isTurn && heroAttackValue(self) > 0 && self.hero.attacksThisTurn === 0 && !selfHeroFrozen;
  const pendingChoiceCard = pending?.kind === "choice"
    ? cardMap.get(choiceForSelf?.options.find((option) => option.instanceId === pending.optionInstanceId)?.cardId ?? "")
    : undefined;
  const pendingLabel = pendingChoiceCard
    ? `已选择「${pendingChoiceCard.name}」，请选择目标`
    : pending?.kind === "play" ? "请选择这张牌的目标"
    : pending?.kind === "attack" ? "请选择攻击目标"
    : pending?.kind === "hero_power" ? "请选择英雄技能目标"
    : pending?.kind === "location" ? "请选择地标目标"
    : "";

  async function send(action: GameAction) {
    await emitAck(socket, "game:action", { action });
    setPending(null);
  }

  function chooseTarget(target: TargetRef) {
    if (!pending) return;
    if (pending.kind === "play") send({ type: "play_card", handInstanceId: pending.handInstanceId, target }).catch(showError(setNotice));
    if (pending.kind === "location") send({ type: "use_location", locationInstanceId: pending.locationInstanceId, target }).catch(showError(setNotice));
    if (pending.kind === "attack") send({ type: "attack", source: pending.source, target }).catch(showError(setNotice));
    if (pending.kind === "hero_power") send({ type: "hero_power", target }).catch(showError(setNotice));
    if (pending.kind === "choice") send({ type: "choose", choiceId: pending.choiceId, optionInstanceId: pending.optionInstanceId, target }).catch(showError(setNotice));
  }

  function handStyle(index: number, total: number): CSSProperties {
    const offset = index - (total - 1) / 2;
    const crowding = Math.max(0, total - 8);
    const rotation = Math.max(1.6, 4 - crowding * 0.9);
    return {
      transform: `translateY(${Math.abs(offset) * 3}px) rotate(${offset * rotation}deg)`,
      zIndex: index + 1
    };
  }

  function handRowStyle(total: number): CSSProperties {
    return { "--hand-count": Math.max(1, total) } as CSSProperties;
  }

  if (game.phase === "mulligan") {
    return (
      <section className="panel battle-panel mulligan-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Mulligan</p>
            <h2>起手换牌</h2>
          </div>
          <button className="end-turn-button" onClick={() => send({ type: "mulligan", cardInstanceIds: [...mulligan] }).catch(showError(setNotice))}>
            <CheckCircle2 size={17} /> 确认保留
          </button>
        </div>
        <p className="muted">点击不想保留的牌，它们会被标记出来；确认后进入对战。</p>
        <div className="hand-row mulligan-hand" style={handRowStyle(self.hand.length)}>
          {self.hand.map((instance, index) => {
            const card = cardMap.get(instance.cardId ?? "");
            if (!card) return null;
            return <CardTile key={instance.instanceId} card={card} selected={mulligan.has(instance.instanceId)} style={handStyle(index, self.hand.length)} onClick={() => setMulligan(toggleSet(mulligan, instance.instanceId))} />;
          })}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={`battle-layout ${pending ? "target-mode" : ""}`}>
        <div className="battle-main">
          <div className="opponent-hand-row" aria-label="对手手牌">
            {opponent.hand.map((_, index) => <div key={index} className="card-back">?</div>)}
          </div>

          <HeroBox label="对手" player={opponent} active={game.currentPlayer === opponent.seat} targetable={Boolean(pending)} turn={game.turn} cardMap={cardMap} onClick={() => chooseTarget({ type: "hero", seat: opponent.seat })} />

          <div className="board-row opponent-board">
            {(opponent.specials ?? []).map((special) => <SpecialTile key={special.instanceId} special={special} card={cardMap.get(special.cardId)} />)}
            {opponent.locations.map((location) => <LocationTile key={location.instanceId} location={location} card={cardMap.get(location.cardId)} cooldown={location.readyTurn > game.turn} targetable={false} />)}
            {opponent.board.map((minion) => <MinionTile key={minion.instanceId} minion={minion} card={cardMap.get(minion.cardId)} turn={game.turn} targetable={Boolean(pending)} onClick={() => chooseTarget({ type: "minion", seat: opponent.seat, instanceId: minion.instanceId })} />)}
          </div>

          <div className="center-line">
            <div className="turn-banner">
              {game.phase === "finished"
                ? <strong>{game.winner === undefined ? "平局" : `${game.players[game.winner].nickname} 获胜`}</strong>
                : <span>{pendingLabel || (isTurn ? "你的回合" : "等待对手")}</span>}
              {pending && <button className="ghost cancel-target" onClick={() => setPending(null)}><Ban size={16} /> 取消选择</button>}
            </div>
          </div>

          <div className="board-row own-board">
            {(self.specials ?? []).map((special) => <SpecialTile key={special.instanceId} special={special} card={cardMap.get(special.cardId)} />)}
            {self.locations.map((location) => {
              const card = cardMap.get(location.cardId);
              const ready = isTurn && location.readyTurn <= game.turn;
              return <LocationTile key={location.instanceId} location={location} card={card} ready={ready} cooldown={location.readyTurn > game.turn} targetable={false} onClick={() => {
                if (pending) return;
                if (!ready || !card) return;
                if (cardNeedsTarget(card)) setPending({ kind: "location", locationInstanceId: location.instanceId });
                else send({ type: "use_location", locationInstanceId: location.instanceId }).catch(showError(setNotice));
              }} />;
            })}
            {self.board.map((minion) => {
              const card = cardMap.get(minion.cardId);
              const abilityReady = titanAbilityReady(minion, card, game.turn, isTurn);
              const attackStatus = minionAttackStatus(minion, card, game.turn, isTurn);
              return <MinionTile key={minion.instanceId} minion={minion} card={card} attackStatus={attackStatus} turn={game.turn} targetable={Boolean(pending)} onClick={() => {
                if (pending) chooseTarget({ type: "minion", seat: self.seat, instanceId: minion.instanceId });
                else if (abilityReady) send({ type: "use_titan_ability", minionInstanceId: minion.instanceId }).catch(showError(setNotice));
                else if (attackStatus.ready) setPending({ kind: "attack", source: { type: "minion", seat: self.seat, instanceId: minion.instanceId } });
              }} />;
            })}
          </div>

          <HeroBox label="你" player={self} active={game.currentPlayer === self.seat} targetable={Boolean(pending)} turn={game.turn} cardMap={cardMap} onClick={() => chooseTarget({ type: "hero", seat: self.seat })} />

          <div className="hand-row" style={handRowStyle(self.hand.length)}>
            {self.hand.map((instance, index) => {
              const card = cardMap.get(instance.cardId ?? "");
              if (!card) return null;
              const playCost = cardPlayCost(card, instance.costOverride, self, opponent.board, game.turn, game.ceaselessEvents, cardMap);
              const playable = isTurn && playCost <= self.mana;
              const forgeable = isTurn && Boolean(card.forgeable) && !instance.forged && self.mana >= 2;
              return (
                <div key={instance.instanceId} className="hand-card-shell" style={handStyle(index, self.hand.length)}>
                  <CardTile
                    card={card}
                    cost={playCost}
                    count={instance.remainingUses ?? card.repeatableUses}
                    attack={instance.attackOverride}
                    health={instance.healthOverride}
                    forged={instance.forged}
                    disabled={!playable}
                    selected={pending?.kind === "play" && pending.handInstanceId === instance.instanceId}
                    className={`hand-card ${playable ? "playable" : "unplayable"}`}
                    onClick={() => {
                      if (!playable) return;
                      if (card.type !== "location" && cardNeedsTarget(card)) setPending({ kind: "play", handInstanceId: instance.instanceId });
                      else send({ type: "play_card", handInstanceId: instance.instanceId }).catch(showError(setNotice));
                    }}
                  />
                  {card.forgeable && (
                    <button className="forge-button" disabled={!forgeable} onClick={(event) => {
                      event.stopPropagation();
                      if (!forgeable) return;
                      send({ type: "forge_card", handInstanceId: instance.instanceId }).catch(showError(setNotice));
                    }}>
                      <Hammer size={13} /> {instance.forged ? "已锻造" : "锻造 2"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="battle-side">
          <div className="resource-box mana-orb">
            <strong>{self.mana}/{self.maxMana}</strong>
            <span>法力水晶</span>
          </div>
          <div className="side-stats">
            <span>我方牌库 <b>{self.deckCount}</b></span>
            <span>对手手牌 <b>{opponent.hand.length}</b></span>
            {self.sideboardCount > 0 && <span>乐队备牌 <b>{self.sideboardCount}</b></span>}
          </div>
          <button className="hero-power-button" disabled={!isTurn || self.hero.heroPowerUsed || self.mana < heroPowerCost} onClick={() => setPending({ kind: "hero_power" })}>
            <WandSparkles size={17} /> {heroPowerCard?.name ?? "英雄技能"} <b>{heroPowerCost}</b>
          </button>
          <button disabled={!canHeroAttack} onClick={() => setPending({ kind: "attack", source: { type: "hero", seat: self.seat } })}>
            <Swords size={17} /> 英雄攻击
          </button>
          <button className="end-turn-button" disabled={!isTurn} onClick={() => send({ type: "end_turn" }).catch(showError(setNotice))}>
            <CheckCircle2 size={17} /> 结束回合
          </button>
          <button className="danger" onClick={() => send({ type: "concede" }).catch(showError(setNotice))}>
            <Ban size={17} /> 投降
          </button>
          <details className="battle-log">
            <summary>战斗记录</summary>
            <div className="log-box">
              {game.logs.slice(-14).reverse().map((entry) => <p key={entry.id}>{entry.message}</p>)}
            </div>
          </details>
        </aside>
      </section>

      {game.pendingChoice && pending?.kind !== "choice" && (
        <div className="choice-overlay">
          <div className="choice-modal">
            <p className="eyebrow">Choose One</p>
            <h2>{choiceForSelf ? choiceForSelf.prompt : "等待对手完成选择"}</h2>
            {choiceForSelf && (
              <div className="choice-list">
                {choiceForSelf.options.map((option) => {
                  const optionCard = cardMap.get(option.cardId ?? "");
                  if (!optionCard) return null;
                  return (
                    <CardTile
                      key={option.instanceId}
                      card={optionCard}
                      className="choice-card"
                      onClick={() => {
                        if ((choiceForSelf.kind === "card_choice" || choiceForSelf.kind === "titan_ability") && cardNeedsTarget(optionCard)) {
                          setPending({ kind: "choice", choiceId: choiceForSelf.id, optionInstanceId: option.instanceId });
                          setNotice(`已选择 ${optionCard.name}，请点击目标。`);
                        }
                        else send({ type: "choose", choiceId: choiceForSelf.id, optionInstanceId: option.instanceId }).catch(showError(setNotice));
                      }}
                    />
                  );
                })}
              </div>
            )}
            {choiceForSelf?.kind === "titan_ability" && (
              <button className="ghost choice-cancel" onClick={() => send({ type: "cancel_choice", choiceId: choiceForSelf.id }).catch(showError(setNotice))}>
                <Ban size={16} /> 取消
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function HeroBox({ label, player, active, targetable, turn, cardMap, onClick }: { label: string; player: PublicGameState["players"][number]; active: boolean; targetable?: boolean; turn: number; cardMap: Map<string, CardDefinition>; onClick: () => void }) {
  const frozen = (player.hero.frozenUntilTurn ?? -1) >= turn;
  const secrets = player.secrets ?? [];
  return (
    <button className={`hero-box ${active ? "active" : ""} ${targetable ? "targetable" : ""} ${frozen ? "frozen" : ""}`} onClick={onClick}>
      {secrets.length > 0 && (
        <span className="secret-row" aria-label={`${secrets.length} 个奥秘`}>
          {secrets.map((secret) => {
            const card = secret.cardId ? cardMap.get(secret.cardId) : undefined;
            return (
              <span key={secret.instanceId} className={`secret-orb ${card ? "known" : "hidden"}`} title={card ? card.name : "奥秘"} onClick={(event) => event.stopPropagation()}>
                ?
                {card && (
                  <span className="secret-tooltip">
                    <strong>{card.name}</strong>
                    <small>{card.text}</small>
                  </span>
                )}
              </span>
            );
          })}
        </span>
      )}
      <span className="hero-name">{label} · {player.nickname}</span>
      <div className="hero-portrait">{CLASS_LABELS[player.class][0]}</div>
      <strong className="hero-health">{player.hero.health}</strong>
      <em>{CLASS_LABELS[player.class]}</em>
      <div className="hero-tags">
        {player.hero.armor > 0 && <small>护甲 {player.hero.armor}</small>}
        {player.hero.temporaryAttack > 0 && <small>攻击 +{player.hero.temporaryAttack}</small>}
        {player.hero.weapon && <small>武器 {player.hero.weapon.attack}/{player.hero.weapon.durability}</small>}
        {frozen && <small className="hero-frozen-tag"><Snowflake size={12} /> 冻结</small>}
      </div>
    </button>
  );
}

function useBoardCardPreview(card?: CardDefinition) {
  const hoverTimer = useRef<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState<null | { left: number; top: number }>(null);

  useEffect(() => () => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
  }, []);

  function clearPreview() {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setPreviewPosition(null);
  }

  function schedulePreview(event: MouseEvent<HTMLElement>) {
    if (!card) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 168;
    const height = 236;
    const margin = 16;
    const preferredLeft = rect.right + width + margin <= window.innerWidth ? rect.right + margin : rect.left - width - margin;
    const fallbackLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(window.innerWidth - width - margin, Math.max(margin, preferredLeft < margin ? fallbackLeft : preferredLeft));
    const preferredTop = rect.top + rect.height / 2 - height / 2;
    const top = Math.min(window.innerHeight - height - margin, Math.max(margin, preferredTop));
    hoverTimer.current = window.setTimeout(() => setPreviewPosition({ left, top }), 1000);
  }

  return { clearPreview, previewPosition, schedulePreview };
}

function MinionTile({ minion, card, attackStatus, turn, targetable, onClick }: { minion: PublicGameState["players"][number]["board"][number]; card?: CardDefinition; attackStatus?: { ready: boolean; label: string }; turn: number; targetable?: boolean; onClick: () => void }) {
  const keywordText = minion.keywords.map(keywordLabel).join(" ");
  const { clearPreview, previewPosition, schedulePreview } = useBoardCardPreview(card);
  const frozen = (minion.frozenUntilTurn ?? -1) >= turn;

  return (
    <button className={`minion ${attackStatus?.ready ? "ready" : ""} ${targetable ? "targetable" : ""} ${frozen ? "frozen" : ""}`} onClick={onClick} onMouseEnter={schedulePreview} onMouseLeave={clearPreview} onBlur={clearPreview}>
      <div className="minion-art">{card?.assetUrl ? <img src={card.assetUrl} alt={card.name} /> : <span>{(card?.name ?? minion.cardId).slice(0, 1)}</span>}</div>
      <strong>{card?.name ?? minion.cardId}</strong>
      <div className="minion-stats"><b>{minion.attack}</b><b>{minion.health}</b></div>
      {keywordText && <small>{keywordText}</small>}
      {attackStatus && <em>{attackStatus.label}</em>}
      {frozen && <span className="frozen-badge"><Snowflake size={12} /> 冻结</span>}
      {card && previewPosition && createPortal(
        <div className="board-card-detail-popover" style={{ left: previewPosition.left, top: previewPosition.top }} aria-hidden="true">
          <CardPreview card={card} attack={minion.attack} health={minion.health} className="board-card-preview-card" />
        </div>,
        document.body
      )}
    </button>
  );
}

function LocationTile({ location, card, ready, cooldown, targetable, onClick }: { location: PublicGameState["players"][number]["locations"][number]; card?: CardDefinition; ready?: boolean; cooldown?: boolean; targetable?: boolean; onClick?: () => void }) {
  const { clearPreview, previewPosition, schedulePreview } = useBoardCardPreview(card);
  return (
    <button className={`location ${ready ? "ready" : ""} ${targetable ? "targetable" : ""}`} disabled={!onClick && !targetable} onClick={onClick} onMouseEnter={schedulePreview} onMouseLeave={clearPreview} onBlur={clearPreview}>
      <div className="location-rune">◆</div>
      <strong>{card?.name ?? location.cardId}</strong>
      <span>{location.durability}</span>
      <small>{ready ? "可使用" : cooldown ? "冷却中" : "等待"}</small>
      {card && previewPosition && createPortal(
        <div className="board-card-detail-popover" style={{ left: previewPosition.left, top: previewPosition.top }} aria-hidden="true">
          <CardPreview card={card} className="board-card-preview-card" />
        </div>,
        document.body
      )}
    </button>
  );
}

function SpecialTile({ special, card }: { special: PublicGameState["players"][number]["specials"][number]; card?: CardDefinition }) {
  const { clearPreview, previewPosition, schedulePreview } = useBoardCardPreview(card);
  const detail = special.cardId === "reno_token_kiljaeden_portal" ? `+${special.bonus ?? 0}/+${special.bonus ?? 0}` : "永久";
  return (
    <button className="special-site" onMouseEnter={schedulePreview} onMouseLeave={clearPreview} onBlur={clearPreview}>
      <div className="location-rune">✦</div>
      <strong>{card?.name ?? special.cardId}</strong>
      <small>{detail}</small>
      {card && previewPosition && createPortal(
        <div className="board-card-detail-popover" style={{ left: previewPosition.left, top: previewPosition.top }} aria-hidden="true">
          <CardPreview card={card} className="board-card-preview-card" />
        </div>,
        document.body
      )}
    </button>
  );
}

function CardTile({ card, cost = card.cost, count, attack = card.attack, health = card.health, selected, disabled, forged, className = "", style, onClick }: { card: CardDefinition; cost?: number; count?: number; attack?: number; health?: number; selected?: boolean; disabled?: boolean; forged?: boolean; className?: string; style?: CSSProperties; onClick?: () => void }) {
  const hasStats = card.type === "minion" || card.type === "weapon" || card.type === "location";
  return (
    <button className={`card-tile rarity-${card.rarity} ${selected ? "selected" : ""} ${className}`} style={style} disabled={disabled} onClick={onClick}>
      <span className={`cost ${cost !== card.cost ? "modified" : ""}`}>{cost}</span>
      <div className="card-frame">
        {card.assetUrl ? <img src={card.assetUrl} alt={card.name} /> : <div className="card-art">{CLASS_LABELS[card.class][0]}</div>}
        <strong>{card.name}</strong>
        <small>{CLASS_LABELS[card.class]} · {typeLabel(card.type)}</small>
        <p>{card.text || keywordLine(card)}</p>
      </div>
      {hasStats && (
        <span className="card-stats">
          {card.type !== "location" && <b className="attack-stat">{attack ?? 0}</b>}
          <b className="health-stat">{card.type === "weapon" || card.type === "location" ? card.durability ?? 0 : health ?? 0}</b>
        </span>
      )}
      {count !== undefined && <em className="count">x{count}</em>}
      {forged && <em className="forged-mark">已锻造</em>}
    </button>
  );
}

function CardPreview({ card, cost = card.cost, count, attack = card.attack, health = card.health, className = "" }: { card: CardDefinition; cost?: number; count?: number; attack?: number; health?: number; className?: string }) {
  const hasStats = card.type === "minion" || card.type === "weapon" || card.type === "location";
  return (
    <div className={`card-tile rarity-${card.rarity} ${className}`}>
      <span className={`cost ${cost !== card.cost ? "modified" : ""}`}>{cost}</span>
      <div className="card-frame">
        {card.assetUrl ? <img src={card.assetUrl} alt={card.name} /> : <div className="card-art">{CLASS_LABELS[card.class][0]}</div>}
        <strong>{card.name}</strong>
        <small>{CLASS_LABELS[card.class]} 路 {typeLabel(card.type)}</small>
        <p>{card.text || keywordLine(card)}</p>
      </div>
      {hasStats && (
        <span className="card-stats">
          {card.type !== "location" && <b className="attack-stat">{attack ?? 0}</b>}
          <b className="health-stat">{card.type === "weapon" || card.type === "location" ? card.durability ?? 0 : health ?? 0}</b>
        </span>
      )}
      {count !== undefined && <em className="count">x{count}</em>}
    </div>
  );
}

async function api<T>(pathName: string, init?: RequestInit): Promise<T> {
  const response = await fetch(pathName, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!body.ok) throw new Error(body.error);
  return body.data;
}

function emitAck<T = unknown>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (body: ApiEnvelope<T>) => {
      if (body.ok) resolve(body.data);
      else reject(new Error(body.error));
    });
  });
}

function showError(setNotice: (value: string) => void) {
  return (error: unknown) => setNotice(error instanceof Error ? error.message : String(error));
}

function parseEffects(value: string): { ok: true; effects: CardEffect[] } | { ok: false } {
  try {
    const parsed = JSON.parse(value) as CardEffect[];
    return Array.isArray(parsed) ? { ok: true, effects: parsed } : { ok: false };
  } catch {
    return { ok: false };
  }
}

function toggleSet(source: Set<string>, value: string): Set<string> {
  const next = new Set(source);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function heroAttackValue(player: PublicGameState["players"][number]): number {
  return (player.hero.weapon?.attack ?? 0) + player.hero.temporaryAttack;
}

function cardPlayCost(card: CardDefinition, costOverride: number | undefined, player: PublicGameState["players"][number], opponentBoard: PublicGameState["players"][number]["board"], turn: number, ceaselessEvents: number | undefined, cardMap: Map<string, CardDefinition>): number {
  const hasRazorscale = opponentBoard.some((minion) => !minion.silenced && cardMap.get(minion.cardId)?.rules?.includes("razorscale"));
  const hasAviana = player.board.some((minion) => !minion.silenced && cardMap.get(minion.cardId)?.rules?.includes("dragon_aviana"));
  const spellTax = card.type === "spell" && player.spellCostIncrease?.throughTurn === turn ? player.spellCostIncrease.amount : 0;
  const dynamicCost = card.rules?.includes("priest_ceaseless_expanse") ? Math.max(0, card.cost - (ceaselessEvents ?? 0)) : card.cost;
  const printedOrOverriddenCost = costOverride ?? dynamicCost;
  const baseCost = player.avianaActive ? Math.min(printedOrOverriddenCost, 1) : card.type === "minion" && hasAviana ? 1 : printedOrOverriddenCost;
  const cost = baseCost + spellTax;
  return hasRazorscale ? Math.max(cost, 2) : cost;
}

function heroPowerPlayCost(player: PublicGameState["players"][number], card: CardDefinition | undefined, cardMap: Map<string, CardDefinition>): number {
  const papercraftAngel = player.board.some((minion) => !minion.silenced && cardMap.get(minion.cardId)?.rules?.includes("priest_papercraft_angel"));
  if (papercraftAngel) return 0;
  return player.hero.heroPowerCost ?? card?.cost ?? 2;
}

function titanAbilityIds(card: CardDefinition | undefined): string[] {
  if (card?.titanAbilityCardIds?.length) return card.titanAbilityCardIds;
  if (card?.races?.includes("TITAN") && card.choiceOptionCardIds?.length) return card.choiceOptionCardIds;
  return [];
}

function titanRemainingAbilityIds(minion: PublicGameState["players"][number]["board"][number], card: CardDefinition | undefined): string[] {
  const used = new Set(minion.usedTitanAbilityCardIds ?? []);
  return titanAbilityIds(card).filter((cardId) => !used.has(cardId));
}

function titanAbilityReady(minion: PublicGameState["players"][number]["board"][number], card: CardDefinition | undefined, turn: number, isTurn: boolean): boolean {
  return Boolean(isTurn && !minion.silenced && (minion.frozenUntilTurn ?? -1) < turn && minion.titanAbilityUsedTurn !== turn && titanRemainingAbilityIds(minion, card).length > 0);
}

function minionAttackStatus(minion: PublicGameState["players"][number]["board"][number], card: CardDefinition | undefined, turn: number, isTurn: boolean): { ready: boolean; label: string } {
  if (!isTurn) return { ready: false, label: "等待" };
  if (titanRemainingAbilityIds(minion, card).length > 0) return { ready: false, label: minion.titanAbilityUsedTurn === turn ? "技能已用" : "泰坦技能" };
  if (minion.cannotAttack) return { ready: false, label: "无法攻击" };
  if (minion.attack <= 0) return { ready: false, label: "无法攻击" };
  if ((minion.frozenUntilTurn ?? -1) >= turn) return { ready: false, label: "冻结" };
  const maxAttacks = minion.keywords.includes("windfury") ? 2 : 1;
  if (minion.attacksThisTurn >= maxAttacks) return { ready: false, label: "已攻击" };
  if (minion.summonedTurn === turn) {
    if (minion.keywords.includes("charge")) return { ready: true, label: "可攻击" };
    if (minion.keywords.includes("rush")) return { ready: true, label: "可突袭" };
    return { ready: false, label: "下回合" };
  }
  if (minion.exhausted) return { ready: false, label: "已耗尽" };
  return { ready: true, label: "可攻击" };
}

function keywordLine(card: CardDefinition): string {
  return card.keywords.map(keywordLabel).join(" ");
}

function keywordLabel(keyword: string): string {
  const labels: Record<string, string> = {
    taunt: "嘲讽",
    charge: "冲锋",
    rush: "突袭",
    divine_shield: "圣盾",
    lifesteal: "吸血",
    deathrattle: "亡语",
    battlecry: "战吼",
    windfury: "风怒",
    poisonous: "剧毒",
    spell_damage: "法强"
  };
  return labels[keyword] ?? keyword;
}

function typeLabel(type: CardDefinition["type"]): string {
  return { minion: "随从", spell: "法术", weapon: "武器", location: "地标", hero: "英雄牌", hero_power: "英雄技能" }[type];
}
