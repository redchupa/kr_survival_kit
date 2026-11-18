const KR_SURVIVAL_GROUPS = {
  water: new Set(["drinking-water", "water-container", "insulated-bottle", "portable-water-filter", "water-sanitation-kit"]),
  food: new Set(["shelf-stable-meal", "canned-food", "self-heating-ration", "portable-stove", "butane-canister", "lighter", "solid-fuel", "manual-can-opener", "cooler-ice-pack", "long-storage-snacks", "infant-formula", "ready-to-feed-formula", "infant-feeding-supplies"]),
  power: new Set(["flashlight", "batteries", "radio", "candles", "portable-solar-panel", "power-bank", "portable-power-station", "charging-cables", "door-alarm", "portable-radio-communication"]),
};


function krStockScale(item) {
  return item.id === "drinking-water" ? 1000 : 1;
}

function krStockUnit(item) {
  return item.id === "drinking-water" ? "L" : item.unit;
}

function krStockFormat(item, stored) {
  return String(Number(stored) / krStockScale(item));
}

function krStockText(item, stored) {
  return `${krStockFormat(item, stored)} ${krStockUnit(item)}`;
}

function krDateLabel(item) {
  if (item.id === "drinking-water") return "유통기한";
  return ["소비기한", "유통기한", "교체 점검일"].includes(item.date_label)
    ? item.date_label : "유통기한 또는 소비기한";
}

function krStockParse(item, shown, allowBlank = false) {
  const value = String(shown ?? "").trim();
  if (allowBlank && value === "") return null;
  const pattern = item.id === "drinking-water" ? /^\d+(?:\.\d{1,3})?$/ : /^\d+$/;
  if (!pattern.test(value)) return NaN;
  const stored = Math.round(Number(value) * krStockScale(item));
  return Number.isSafeInteger(stored) && stored <= 1_000_000_000 ? stored : NaN;
}

// One flat pictogram per catalog item. The text label remains the accessible source of truth.
const KR_READY_PICTOGRAMS = {
  "drinking-water": "💧", "shelf-stable-meal": "🥘", "canned-food": "🥫", hygiene: "🧼",
  flashlight: "🔦", batteries: "🔋", backpack: "🎒", blanket: "🧣",
  "first-aid-kit": "🏥", "infant-supplies": "🧸", "prescription-preparedness": "💊", radio: "📻",
  "water-container": "🚰", "portable-stove": "🍳", "butane-canister": "🛢", "self-heating-ration": "🍱",
  candles: "🕯", "hand-warmers": "♨", "large-plastic-bags": "🛍", lighter: "🔥",
  "solid-fuel": "🪵", "child-id-card": "🪪", "portable-solar-panel": "☀", "manual-can-opener": "🗝",
  "insulated-bottle": "🧴", "cooler-ice-pack": "🧊", "portable-water-filter": "⚗", "storage-bin": "📦",
  "long-storage-snacks": "🍪", "infant-formula": "🍼", "ready-to-feed-formula": "🥛", "infant-feeding-supplies": "🥄",
  "power-bank": "🔌", "portable-power-station": "⚡", "charging-cables": "〰", "warm-clothes": "🧥",
  raincoat: "☔", masks: "😷", "rubber-gloves": "🧤", "rubber-boots": "🥾",
  "sealing-tape": "🧷", "emergency-contact-card": "☎", "family-photo": "🖼", "sanitation-bags": "🗑",
  "thermal-mat": "🧘", "child-comfort-kit": "🧩", "basic-documents": "📁", "door-window-locks": "🔒",
  "door-alarm": "🔔", "child-carrier": "👶", "transport-cart": "🛒", "water-sanitation-kit": "🧽",
  "hot-water-bag": "🌡", "portable-radio-communication": "📡", "emergency-payment-check": "💳", "protective-goggles": "🥽",
};

const KR_READY_SHORT_NAMES = {
  "drinking-water": "생수", "shelf-stable-meal": "상온 간편식", "canned-food": "통조림", hygiene: "위생용품",
  flashlight: "손전등", batteries: "건전지", backpack: "대피 가방", blanket: "담요",
  "first-aid-kit": "구급 세트", "infant-supplies": "영유아 용품", "prescription-preparedness": "상비약", radio: "라디오",
  "water-container": "급수 용기", "portable-stove": "휴대 버너", "butane-canister": "부탄가스", "self-heating-ration": "발열식 비상식량",
  candles: "양초", "hand-warmers": "손난로", "large-plastic-bags": "대형 비닐", lighter: "라이터",
  "solid-fuel": "고체 연료", "child-id-card": "아이 인식표", "portable-solar-panel": "태양광 패널", "manual-can-opener": "캔 따개",
  "insulated-bottle": "보온병", "cooler-ice-pack": "냉매", "portable-water-filter": "정수 필터", "storage-bin": "보관함",
  "long-storage-snacks": "간식", "infant-formula": "분유", "ready-to-feed-formula": "액상 분유", "infant-feeding-supplies": "수유 용품",
  "power-bank": "보조배터리", "portable-power-station": "휴대 전원", "charging-cables": "충전선", "warm-clothes": "방한복",
  raincoat: "우비", masks: "마스크", "rubber-gloves": "고무장갑", "rubber-boots": "장화",
  "sealing-tape": "밀봉 테이프", "emergency-contact-card": "연락 카드", "family-photo": "가족 사진", "sanitation-bags": "위생 봉투",
  "thermal-mat": "단열 매트", "child-comfort-kit": "아이 안심 꾸러미", "basic-documents": "서류", "door-window-locks": "문·창 잠금",
  "door-alarm": "문 알림", "child-carrier": "아이 캐리어", "transport-cart": "운반 수레", "water-sanitation-kit": "물 위생 도구",
  "hot-water-bag": "온수 주머니", "portable-radio-communication": "무전기", "emergency-payment-check": "비상 결제", "protective-goggles": "보호 안경",
};

const KR_WATER_BOTTLE_ART = `<svg viewBox="0 0 48 48" width="44" height="44" focusable="false" aria-hidden="true"><rect x="18" y="3" width="12" height="6" rx="1" fill="#d7f1f5"/><path d="M18 10h12l4 5v27a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V15z" fill="#7bd2df" stroke="#d7f1f5" stroke-width="1.5"/><rect x="15" y="22" width="18" height="12" fill="#eaf8f6"/><path d="M19 28h10" stroke="#27829a" stroke-width="2"/></svg>`;

function krReadyItems(snapshot) {
  if (!snapshot) return [];
  return snapshot.catalog.filter((item) => {
    const record = snapshot.items[item.id];
    const status = snapshot.summary?.items?.[item.id];
    return Boolean(record?.applicable && status?.state === "sufficient" && status?.confirmed &&
      status?.verified_on && status?.stale === false && status?.target > 0 &&
      status?.usable >= status.target && !(status?.expiring_quantity > 0) &&
      !(status?.expired_quantity > 0) && !(status?.unknown_date_quantity > 0));
  });
}

function krIsSelectable(item) {
  return ["household", "optional"].includes(item.tier);
}

function krReadyGrid(snapshot, escape, visible = snapshot?.catalog.filter((item) =>
  !krIsSelectable(item) && snapshot.items[item.id]?.applicable !== false), editing = false) {
  if (!snapshot) return `<p class="ready-empty">재고를 불러오는 중입니다.</p>`;
  if (!visible.length) return `<p class="ready-empty">이 조건에 맞는 물품이 없습니다.</p>`;
  const readyIds = new Set(krReadyItems(snapshot).map((item) => item.id));
  return `<div class="ready-grid" role="list">${visible.map((item) => {
    const status = snapshot.summary.items[item.id];
    const ready = readyIds.has(item.id);
    const inactive = krIsSelectable(item) && !snapshot.items[item.id]?.applicable;
    const pictogram = item.id === "drinking-water" ? KR_WATER_BOTTLE_ART : KR_READY_PICTOGRAMS[item.id] || "◈";
    const current = status.usable ?? 0;
    const quantity = `${krStockText(item, current)} / ${status.target == null ? "목표 미설정" : krStockText(item, status.target)}`;
    const label = inactive ? "미사용" : ready ? "완비" : !status.confirmed || status.stale ? "실사 필요" :
      status.expiring_quantity > 0 ? "기한 임박" : status.expired_quantity > 0 ? "기한 경과" :
      status.unknown_date_quantity > 0 ? (status.next_label_check_on ? `기한 확인 ${status.next_label_check_on}` : "기한 확인") : status.state === "shortage" ? "부족" : "";
    const percent = status.target > 0 ? Math.floor(Math.min(1, current / status.target) * 100) : 0;
    const action = inactive ? "설정" : "수정";
    return `<div class="ready-item" data-item="${escape(item.id)}" data-complete="${ready}" role="listitem"><button type="button" class="shelf-edit" data-edit="${escape(item.id)}" aria-label="${escape([`${item.name} ${action}`, quantity, label].filter(Boolean).join(" · "))}" ${editing ? "disabled" : ""}><span class="shelf-action">${action}</span><span class="ready-art" aria-hidden="true">${pictogram}</span>` +
      `<span class="ready-name">${escape(KR_READY_SHORT_NAMES[item.id] || item.name)}</span><span class="ready-number">${escape(quantity)}</span><span aria-hidden="true" class="stock-meter"><span style="width:${percent}%"></span></span>${label ? `<span class="stock-label">${escape(label)}</span>` : ""}</button></div>`;
  }).join("")}</div>`;
}

const KR_STOCK_RANKS = [
  ["아이언", "#c0c8cd"], ["브론즈", "#ffc493"], ["실버", "#dbe8ff"],
  ["골드", "#ffe393"], ["플레티넘", "#8cf4de"], ["에메랄드", "#8cf2ad"],
  ["다이아", "#9adaff"], ["마스터", "#d4bbff"], ["그랜드마스터", "#ffa9b2"],
  ["챌린저", "#ffe39a"],
];

const KR_STOCK_WEIGHTS = {
  "drinking-water": 30, "shelf-stable-meal": 16, "canned-food": 12, hygiene: 7,
  flashlight: 10, batteries: 5, backpack: 5, blanket: 5, "first-aid-kit": 10,
};

function krStockScore(snapshot) {
  let possible = 0;
  let earned = 0;
  for (const item of snapshot.catalog) {
    const weight = KR_STOCK_WEIGHTS[item.id];
    if (!weight) continue;
    possible += weight;
    const status = snapshot.summary.items[item.id];
    if (snapshot.items[item.id]?.applicable === false || !status.confirmed ||
        !status.verified_on || status.stale !== false || !(status.target > 0)) continue;
    const usable = Math.max(0, status.usable - (status.expiring_quantity ?? 0));
    earned += weight * Math.min(1, usable / status.target);
  }
  return possible ? Math.floor(earned * 100 / possible + 1e-9) : 0;
}

function krStockRankView(snapshot, open = false) {
  if (!snapshot) return "";
  const score = krStockScore(snapshot);
  const index = Math.min(KR_STOCK_RANKS.length - 1, Math.floor(score / 10));
  const [rank, color] = KR_STOCK_RANKS[index];
  const next = KR_STOCK_RANKS[index + 1];
  const message = next ? `${next[0]}까지 ${(index + 1) * 10 - score}점` : "최고 등급 달성";
  return `<details class="stock-rank compact-detail" ${open ? "open" : ""}>
    <summary><span>비축 등급</span><strong class="rank-badge" style="--rank-color:${color}">${rank}</strong><span class="stock-score">${score} / 100점</span></summary>
    <div class="rank-detail"><progress aria-label="비축 점수" value="${score}" max="100"></progress>
    <p>${message}</p><p>배점은 생수 30점, 간편식 16점, 통조림 12점, 손전등과 구급함 각 10점, 위생용품 7점, 건전지·배낭·담요 각 5점입니다. 유효한 보유량이 목표에 가까울수록 점수가 올라갑니다. 선택 물품과 퀴즈 점수는 별도입니다.</p></div>
    </details>`;
}

function krStockShelves(snapshot, escape, showInactive, editing, filter) {
  const optional = snapshot?.catalog.filter(krIsSelectable) ?? [];
  const matches = (item) => {
    if (filter === "all") return true;
    const status = snapshot.summary.items[item.id];
    return filter === "expiring" ? status.expiring_quantity > 0 : status.state === filter;
  };
  const essentials = snapshot?.catalog.filter((item) => !krIsSelectable(item) &&
    snapshot.items[item.id]?.applicable !== false && matches(item));
  const active = optional.filter((item) => snapshot.items[item.id]?.applicable && matches(item));
  const inactive = optional.filter((item) => !snapshot.items[item.id]?.applicable);
  const ready = krReadyItems(snapshot);
  const shelves = `<section class="ready-panel" aria-labelledby="essentials-shelf"><h3 id="essentials-shelf" tabindex="-1">기본 비축 물품 <span>완비 ${ready.filter((item) => !krIsSelectable(item)).length}종</span></h3>${krReadyGrid(snapshot, escape, essentials, editing)}</section>`;
  if (!optional.length) return shelves;
  return shelves + `<section class="ready-panel" aria-labelledby="optional-shelf-title"><h3 id="optional-shelf-title">선택 물품 <span>사용 중 ${active.length}종 · 완비 ${ready.filter(krIsSelectable).length}종</span></h3>
    ${active.length ? krReadyGrid(snapshot, escape, active, editing) : '<p class="ready-empty">표시할 선택 물품이 없습니다.</p>'}
    ${inactive.length && filter === "all" ? `<details id="optional-shelf" ${showInactive ? "open" : ""}><summary>아직 사용하지 않는 물품 ${inactive.length}종 보기</summary>${krReadyGrid(snapshot, escape, inactive, editing)}</details>` : ""}</section>`;
}

const KR_RECORD_MISSIONS = [
  { id: "water", title: "마실 물 기록", ids: ["drinking-water"], mode: "all", art: "💧" },
  { id: "food", title: "먹을거리 기록", ids: ["shelf-stable-meal", "canned-food", "self-heating-ration"], mode: "any", art: "🥫" },
  { id: "light", title: "빛·전원 기록", ids: ["flashlight", "batteries", "power-bank"], mode: "any", art: "🔦" },
  { id: "care", title: "구급품 기록", ids: ["first-aid-kit"], mode: "all", art: "🏥" },
];

function krMissionState(snapshot) {
  const readyIds = new Set(krReadyItems(snapshot).map((item) => item.id));
  return KR_RECORD_MISSIONS.map((mission) => {
    const count = mission.ids.filter((id) => readyIds.has(id)).length;
    return { ...mission, count, complete: mission.mode === "any" ? count > 0 : count === mission.ids.length };
  });
}

function krMissionView(snapshot, escape, animate = false, open = false) {
  const missions = krMissionState(snapshot);
  const complete = missions.filter((mission) => mission.complete).length;
  const names = ["기록 시작", "기록 진행", "기록 확장", "기록 강화", "4분야 기록"];
  return `<details class="mission-panel compact-detail" ${open ? "open" : ""}><summary class="mission-head"><span>기록 미션</span><strong>준비 기록 단계 ${complete}/4 · ${names[complete]}</strong></summary><div class="mission-detail">` +
    `<div class="mission-progress" role="progressbar" aria-label="준비 기록 단계" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${complete}"><span style="width:${complete * 25}%"></span></div>` +
    `<p>이 단계는 재고 기록과 실사 상태를 보여줍니다. 생존 확률을 뜻하지 않습니다.</p>` +
    `<div class="mission-grid">${missions.map((mission) => `<div class="mission-item ${mission.complete ? `done${animate ? " unlock" : ""}` : "pending"}">` +
      `<span class="mission-art" aria-hidden="true">${mission.complete ? mission.art : "○"}</span>` +
      `<span class="mission-title">${escape(mission.title)}</span><span class="mission-state">${mission.complete ? "기록 달성" : mission.mode === "any" ? "대상 중 완비 0개" : `완비 ${mission.count}/${mission.ids.length}개`}</span></div>`).join("")}</div></div></details>`;
}

class KrSurvivalKitInventoryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._snapshot = null;
    this._draft = null;
    this._message = "";
    this._loading = false;
    this._loadError = false;
    this._optionalShelfOpen = false;
    this._statusFilter = "all";
  }

  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._snapshot && !this._loading) this._load();
    this._updateAtmosphere();
  }

  connectedCallback() {
    this._timer = window.setInterval(() => { if (!this._draft) this._load(); }, 30000);
    this._clockTimer = window.setInterval(() => this._updateAtmosphere(), 30000);
  }

  disconnectedCallback() {
    window.clearInterval(this._timer);
    window.clearInterval(this._clockTimer);
  }

  getCardSize() { return 8; }

  _updateAtmosphere() {
    const hero = this.shadowRoot.querySelector(".hero");
    if (!hero) return;
    const zone = this._hass?.config?.time_zone;
    let parts;
    try {
      parts = new Intl.DateTimeFormat("ko-KR", {
        timeZone: zone || undefined, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
      }).formatToParts(new Date());
    } catch (_error) {
      parts = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    }
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = parts.find((part) => part.type === "minute")?.value || "00";
    hero.dataset.daypart = hour >= 7 && hour < 19 ? "day" : "night";
    const clock = this.shadowRoot.querySelector("#local-clock");
    if (clock) clock.textContent = `${String(hour).padStart(2, "0")}:${minute}`;
    const source = this.shadowRoot.querySelector("#time-source");
    if (source) source.textContent = zone ? "HA 시간대 · 시각 기준 주야 테마" : "기기 시각 · 시각 기준 주야 테마";
    const weather = this.shadowRoot.querySelector("#local-weather");
    const entityId = this._config?.weather_entity;
    const validEntity = typeof entityId === "string" && /^weather\.[a-z0-9_]+$/.test(entityId);
    const state = validEntity ? this._hass?.states?.[entityId] : undefined;
    const updated = state?.last_updated ? new Date(state.last_updated) : null;
    const age = updated && Number.isFinite(updated.getTime()) ? Date.now() - updated.getTime() : Infinity;
    const stale = age > 120 * 60 * 1000 || age < -5 * 60 * 1000;
    const updatedText = updated && Number.isFinite(updated.getTime()) ? updated.toLocaleString("ko-KR", {
      timeZone: zone || undefined, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
    }) : "갱신 시각 없음";
    const names = {
      "clear-night": "맑음", cloudy: "흐림", exceptional: "기상 특이", fog: "안개",
      hail: "우박", lightning: "뇌우", "lightning-rainy": "뇌우·비", partlycloudy: "구름 조금",
      pouring: "강한 비", rainy: "비", snowy: "눈", "snowy-rainy": "진눈깨비", sunny: "맑음", windy: "바람", "windy-variant": "바람·구름",
    };
    const temperature = Number(state?.attributes?.temperature);
    const unit = state?.attributes?.temperature_unit || this._hass?.config?.unit_system?.temperature || "";
    const temperatureText = Number.isFinite(temperature) && state?.attributes?.temperature !== null && state?.attributes?.temperature !== undefined
      ? ` · ${Math.round(temperature)}${unit}` : "";
    if (weather) weather.textContent = entityId && !validEntity ? "날씨 설정 확인" : !validEntity ? "날씨 연동 안 됨" : !state || ["unknown", "unavailable"].includes(state.state)
      ? "날씨 확인 불가" : stale ? `날씨 갱신 지연 · ${updatedText}` : `${names[state.state] || "날씨 상태 확인"}${temperatureText}`;
    hero.dataset.weather = validEntity && state && !stale && ["rainy", "pouring", "lightning-rainy", "snowy-rainy"].includes(state.state)
      ? "rain" : validEntity && state && !stale && state.state === "snowy" ? "snow" : "normal";
  }

  async _call(service, service_data = {}) {
    const result = await this._hass.connection.sendMessagePromise({
      type: "call_service",
      domain: "kr_survival_kit",
      service,
      service_data,
      return_response: true,
    });
    return result.response;
  }

  async _load() {
    if (!this._hass || this._loading) return;
    if (this._draft) this._captureDraft();
    this._loading = true;
    try {
      this._snapshot = await this._call("get_inventory");
      this._loadError = false;
      if (!this._draft) this._message = "";
    } catch (error) {
      this._loadError = true;
      this._message = `재고를 읽지 못했습니다. 관리자 계정으로 로그인하고 통합 상태를 확인하세요. ${error.message || ""}`;
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _edit(item, fromShelf) {
    if (this._draft || this._saving) return;
    this._shelfEditId = fromShelf ? item.id : null;
    const saved = this._snapshot.items[item.id];
    this._draft = {
      id: item.id,
      applicable: saved?.applicable ?? true,
      target: saved?.target === null || saved?.target === undefined ? "" : krStockFormat(item, saved.target),
      lots: (saved?.lots || []).map((lot) => ({ ...lot, quantity: krStockFormat(item, lot.quantity),
        ...(lot.bottle_ml ? { capacity: krStockFormat(item, lot.bottle_ml), count: String(lot.bottle_count) } : {}),
      })),
      review_interval_days: saved?.review_interval_days ?? "",
    };
    if (!this._draft.lots.length) {
      this._draft.lots.push({ lot_id: "lot-1", quantity: "0", expires_on: null, received_on: null,
        ...(item.id === "drinking-water" ? { capacity: "2", count: "0" } : {}) });
    }
    this._message = "";
    this._render();

  }

  _returnToShelf() {
    if (!this._shelfEditId) return;
    const selector = `.shelf-edit[data-edit="${CSS.escape(this._shelfEditId)}"]`;
    this._shelfEditId = null;
    window.requestAnimationFrame(() => {
      if (this._draft) return;
      const trigger = this.shadowRoot.querySelector(selector);
      const details = trigger?.closest("details");
      const target = (details && !details.open ? details.querySelector("summary") : trigger)
        || this.shadowRoot.querySelector("#essentials-shelf");
      target?.focus({ preventScroll: true });
    });
  }

  _captureDraft() {
    if (!this._draft || !this.shadowRoot.querySelector("#editor")) return;
    const root = this.shadowRoot;
    this._draft.applicable = root.querySelector("#applicable").checked;
    this._draft.target = root.querySelector("#target").value;
    this._draft.review_interval_days = root.querySelector("#review-interval").value;
    this._draft.settingsOpen = root.querySelector("#item-settings").open;
    this._draft.lots = [...root.querySelectorAll(".lot-edit")].map((row, index) => ({
      lot_id: this._draft.lots[index].lot_id,
      quantity: row.querySelector(".quantity")?.value,
      capacity: row.querySelector(".capacity")?.value,
      count: row.querySelector(".bottle-count")?.value,
      expires_on: row.querySelector(".expiry")?.value || null,
      received_on: row.querySelector(".received-on")?.value || null,
    }));
  }

  async _save() {
    if (this._saving) return;
    this._saving = true;
    this._captureDraft();
    const item = this._snapshot.catalog.find((candidate) => candidate.id === this._draft.id);
    const target = krStockParse(item, this._draft.target, true);
    const lots = this._draft.lots.map((lot) => {
      const bottle = lot.capacity !== undefined;
      const capacity = bottle ? krStockParse(item, lot.capacity) : null;
      const count = bottle ? krStockParse({}, lot.count) : null;
      const quantity = bottle ? capacity * count : krStockParse(item, lot.quantity);
      return {
        lot_id: lot.lot_id,
        quantity: bottle && !(capacity > 0 && Number.isInteger(count)) ? NaN : quantity,
        expires_on: item.date_kind === "expiry" ? lot.expires_on : null,
        received_on: lot.received_on || null,
        ...(bottle ? { bottle_ml: capacity, bottle_count: count } : {}),
      };
    });
    const reviewInterval = this._draft.review_interval_days === "" ? null : Number(this._draft.review_interval_days);
    if ((target !== null && (!Number.isInteger(target) || target < 0)) ||
        lots.some((lot) => !lot.lot_id || !Number.isInteger(lot.quantity) || lot.quantity < 0 || lot.quantity > 1_000_000_000) ||
        (reviewInterval !== null && (!Number.isInteger(reviewInterval) || reviewInterval < 1 || reviewInterval > 3650))) {
      this._message = item.id === "drinking-water"
        ? "병 용량은 0보다 큰 L 값, 병 수는 0 이상의 정수로 입력하세요. 생수 총량 한도는 1,000,000 L입니다."
        : "목표량과 수량은 0 이상의 정수로 입력하세요.";
      this._saving = false;
      this._render();
      return;
    }
    try {
      await this._call("set_item", {
        item_id: item.id,
        revision: this._snapshot.revision,
        applicable: this._draft.applicable,
        target,
        lots,
        review_interval_days: reviewInterval,
        confirm: true,
        apply_date_defaults: true,
      });
      this._draft = null;
      await this._load();
      this._message = `${item.name} 기록을 저장했습니다.`;
    } catch (error) {
      const detail = error.message || "";
      if (/changed|revision/i.test(detail)) {
        await this._load();
        this._message = "다른 수정이 먼저 저장됐습니다. 최신 재고를 확인한 뒤 다시 저장하세요. 입력한 값은 유지했습니다.";
      } else {
        this._message = "저장하지 못했습니다. 입력한 값은 유지했습니다. 저장 공간과 HA 로그를 확인한 뒤 다시 시도하세요.";
      }
    }
    this._saving = false;
    this._render();
    if (!this._draft) this._returnToShelf();
  }

  async _delete() {
    if (this._saving) return;
    if (!window.confirm("이 품목의 가구 재고 기록을 삭제할까요?")) return;
    this._saving = true;
    try {
      await this._call("delete_item", {
        item_id: this._draft.id,
        revision: this._snapshot.revision,
      });
      this._draft = null;
      await this._load();
      this._message = "재고 기록을 삭제했습니다.";
    } catch (error) {
      this._message = /changed|revision/i.test(error.message || "")
        ? "다른 수정이 먼저 저장됐습니다. 최신 재고를 확인하고 삭제를 다시 선택하세요."
        : "삭제하지 못했습니다. HA 로그를 확인한 뒤 다시 시도하세요.";
      await this._load();
    }
    this._saving = false;
    this._render();
    if (!this._draft) this._returnToShelf();
  }

  _render() {
    this._rankOpen = this.shadowRoot.querySelector(".stock-rank")?.open ?? this._rankOpen;
    this._missionOpen = this.shadowRoot.querySelector(".mission-panel")?.open ?? this._missionOpen;
    this._optionalShelfOpen = this.shadowRoot.querySelector("#optional-shelf")?.open ?? this._optionalShelfOpen;
    const previousDialog = this.shadowRoot.querySelector("#item-dialog");
    const dialogScroll = previousDialog?.scrollTop ?? 0;
    const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
    const snapshot = this._snapshot;
    const people = snapshot?.household_size ?? 4;
    const states = { shortage: "부족", needs_check: "확인 필요", sufficient: "충족", not_applicable: "해당 없음" };
    const items = snapshot?.catalog.map((item) => ({ ...item, status: snapshot.summary.items[item.id] })) ?? [];
    const recommendations = new Map([
      ...(snapshot?.household?.items || []), ...(snapshot?.household?.optional_items || []),
    ].map((entry) => [entry.item_id, entry]));
    const draftItem = items.find((item) => item.id === this._draft?.id);
    const draftRecommendation = recommendations.get(this._draft?.id);
    const noteCoveredByBasis = draftItem?.note && draftRecommendation?.basis?.includes(draftItem.note);
    const labelCheckDays = snapshot?.label_check_days?.[draftItem?.id] ?? 7;
    const edit = this._draft && draftItem ? `<form id="editor"><h3 id="item-dialog-title" tabindex="-1">${escape(draftItem.name)} 수정</h3>` +
      (draftItem.examples ? `<p class="item-note">${escape(draftItem.examples)}</p>` : "") +
      (draftItem.note && !noteCoveredByBasis ? `<p class="item-note">${escape(draftItem.note)}</p>` : "") +
      (draftRecommendation?.basis ? `<details class="item-reference"><summary>품목 참고 기준</summary><p>${escape(draftRecommendation.basis)}</p></details>` : "") +
      `<p>현재 기록 ${escape(krStockText(draftItem, draftItem.status.usable))} · ${states[draftItem.status.state]} · 마지막 실사 ${escape(draftItem.status.verified_on || "기록 없음")}${draftItem.status.next_review_on ? ` · 다음 점검 ${escape(draftItem.status.next_review_on)}` : ""}</p>` +
      (draftItem.status.target != null ? `<p class="recommendation">${people}인 가구 목표 <strong>${escape(krStockText(draftItem, draftItem.status.target))}</strong></p>` : "") +
      (draftItem.id === "drinking-water" ? `<p class="item-note">2 L 생수 12병이면 병 용량에 2, 병 수에 12를 입력하세요.</p>` : "") +
      (this._draft.lots.length > 1 ? `<p class="item-note">이전에 저장한 날짜별 기록입니다. 기존 날짜를 확인하며 각 수량을 수정할 수 있습니다.</p>` : "") +
      this._draft.lots.map((lot, index) =>
        `<fieldset class="lot-edit"><legend>${this._draft.lots.length > 1 ? `기존 재고 ${index + 1}` : "수량과 날짜"}</legend>` +
        (lot.capacity !== undefined
          ? `<label>병 하나의 용량 (L)<input class="capacity" type="number" min="0.001" max="1000000" step="0.001" value="${escape(lot.capacity)}" required></label>` +
            `<label>병 수 (병)<input class="bottle-count" type="number" min="0" max="1000000000" step="1" value="${escape(lot.count)}" required></label>` +
            `<output class="lot-total" aria-live="polite"></output>`
          : `<label>${draftItem.id === "drinking-water" ? "보유량 합계 (L)" : `보유 수량 (${escape(krStockUnit(draftItem))})`}<input class="quantity" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(lot.quantity)}" required></label>`) +
        `<label>입고일<input class="received-on" type="date" value="${escape(lot.received_on || snapshot.today || "")}"></label>` +
        (draftItem.date_kind === "expiry" ? `<label>${escape(krDateLabel(draftItem))} (포장 기준)<input class="expiry" type="date" value="${escape(lot.expires_on || "")}" aria-describedby="expiry-help"></label>${lot.label_check_on ? `<small>포장 기한 확인일 ${escape(lot.label_check_on)}</small>` : ""}` : "") +
        `</fieldset>`
      ).join("") + `<p class="item-note">입고일을 비우면 오늘로 저장합니다. 저장한 날을 마지막 실사일로 기록합니다.</p>` +
      (draftItem.date_kind === "expiry" ? `<p id="expiry-help" class="item-note">포장 날짜가 여러 개면 가장 빠른 날짜를 입력하세요. 비워 두면 입고 후 ${labelCheckDays}일을 포장 기한 확인일로 등록합니다. 확인 전에는 준비 완료 수량에 포함하지 않습니다.</p>` : "") +
      `<label for="target">목표량 (${escape(krStockUnit(draftItem))})</label><input id="target" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(this._draft.target)}" placeholder="${draftItem.status.recommended_target == null ? "미설정" : escape(krStockText(draftItem, draftItem.status.recommended_target)) + " 자동"}">` +
      `<details id="item-settings" ${this._draft.settingsOpen ? "open" : ""}><summary>점검 및 관리 설정</summary>` +
      `<label><input id="applicable" type="checkbox" ${this._draft.applicable ? "checked" : ""}> 우리 집에서 관리</label>` +
      `<label for="review-interval">재고 점검 주기 (일)</label><input id="review-interval" type="number" min="1" max="3650" step="1" value="${escape(this._draft.review_interval_days)}" placeholder="기본 ${escape(snapshot.default_review_interval_days ?? 30)}일"><p class="item-note">마지막으로 저장한 날부터 이 기간이 지나면 수량과 상태를 다시 확인하라는 표시가 뜹니다. 자주 쓰는 물품은 짧게 정하세요. 예를 들어 7일은 매주 재고를 확인한다는 뜻입니다.</p></details>` +
      `<div class="actions"><button type="submit" class="primary">저장</button><button type="button" id="cancel">취소</button>` +
      `<button type="button" id="delete">기록 삭제</button></div></form>` : "";
    const counts = snapshot?.summary;
    const filters = [["all", "전체", null], ["shortage", "부족", counts?.shortage_count],
      ["needs_check", "확인 필요", counts?.needs_check_count], ["expiring", "기한 임박", counts?.expiring_count]];
    const signals = counts ? `<div class="signals" aria-label="선반 필터">${filters.map(([id, label, count]) =>
      `<button type="button" data-status="${id}" aria-pressed="${this._statusFilter === id}"><span>${label}</span>${count == null ? "" : `<strong>${count}</strong>`}</button>`).join("")}</div>` : "";
    const missionSignature = krMissionState(snapshot).map((mission) => mission.complete).join("");
    const animateMission = Boolean(snapshot && missionSignature !== this._missionSignature);
    this._missionSignature = missionSignature;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color,#173048);font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif}
      ha-card{display:block;padding:1.2rem;background:var(--card-background-color,#fff);border-radius:14px}
      h2{font-size:1.25rem;margin:0 0 .3rem}h3{font-size:1rem;margin:0 0 .35rem}h4{font-size:.95rem;margin:1rem 0 .4rem}
      p{margin:.35rem 0;color:var(--secondary-text-color,#405564);line-height:1.5}ul{margin:.35rem 0;padding-left:1.25rem;line-height:1.55}
      .recommendation{padding:.55rem .7rem;background:rgba(25,127,131,.08);border-radius:7px}
      .item-note{font-size:.9rem}
      button{font:inherit;min-height:44px;padding:.45rem .75rem;border:1px solid #197f83;background:transparent;color:var(--primary-text-color,#173048);border-radius:8px;cursor:pointer}
      button:hover{background:rgba(25,127,131,.1)}button:focus-visible,input:focus-visible{outline:3px solid #d28b24;outline-offset:2px}
      .primary{background:#156d73;color:#fff}.message{padding:.7rem;border-radius:8px;background:rgba(210,139,36,.16);line-height:1.5}
      form{border-top:3px solid #197f83;padding-top:1rem}label{display:block;margin:.7rem 0 .3rem;font-weight:600}input:not([type=checkbox]){box-sizing:border-box;width:100%;min-height:42px;padding:.5rem;font:inherit;color:var(--primary-text-color,#173048);background:var(--card-background-color,#fff);border:1px solid #718893;border-radius:7px}
      .lot-edit{border:1px solid var(--divider-color,#d7e1e7);border-radius:8px;padding:.75rem;margin:.6rem 0}.actions{display:flex;gap:.5rem;flex-wrap:wrap}
      details{border-top:1px solid var(--divider-color,#d7e1e7);margin-top:.5rem}summary{min-height:44px;padding:.75rem .25rem;cursor:pointer;font-weight:700}summary:focus-visible{outline:3px solid #d28b24;outline-offset:2px}
      ha-card{padding:0;max-width:1480px;margin:0 auto;overflow:hidden;box-shadow:0 22px 60px rgba(8,24,34,.17)}
      .hero{background:linear-gradient(125deg,#111d28 0%,#1b3445 58%,#294858 100%);color:#edf7f8;padding:clamp(1.1rem,3vw,2.5rem);display:grid;grid-template-columns:minmax(16rem,.82fr) minmax(0,1.18fr);gap:clamp(1rem,3vw,2.5rem);align-items:center}
      .hero h2{font-size:clamp(1.65rem,3vw,2.45rem);line-height:1.18;letter-spacing:-.045em;margin:0 0 .8rem;color:#f3fafb}
      .hero p{color:#c6d9df;max-width:35rem}.hero .hero-copy{font-size:1rem;line-height:1.6}
      .signals{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.25rem}.signals button{display:flex;gap:.7rem;align-items:baseline;background:rgba(7,19,29,.42);color:#eef7f8;border:1px solid #668b9c;min-width:6.5rem;justify-content:space-between}.signals strong{font-size:1.3rem;font-variant-numeric:tabular-nums}.signals button:hover{background:#2a5369}
      button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #e0a950;outline-offset:2px}
      #refresh{min-width:44px;padding:0 .4rem;font-size:1.15rem;color:inherit;border-color:var(--kr-line,#79b3c0)}
      @media(max-width:560px){.signals{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.3rem;margin-top:.7rem}.signals button{min-width:0;display:grid;justify-items:center;justify-content:center;align-content:center;gap:.12rem;padding:.32rem .16rem;font-size:.76rem;text-align:center}.signals strong{font-size:1rem}.hero h2{margin-bottom:.25rem}.hero-head{gap:8px}}
      .household-strip{display:flex;align-items:center;flex-wrap:wrap;gap:.4rem 1rem;padding:.75rem 1rem;border:1px solid #78aebe;border-radius:14px;background:#0b2636;margin-block:1rem}.household-strip strong{color:#a4fff0}.household-strip p{margin:0}.lot-edit{min-inline-size:0}.lot-edit legend,.lot-total{font-weight:750}.lot-total{align-self:center}#item-settings summary{cursor:pointer;padding:.5rem 0}.lot-edit input{box-sizing:border-box;max-width:100%}
      .hero{position:relative;display:block;background:linear-gradient(135deg,#1b3a4c,#102432 65%,#0d1c2a);transition:background .5s ease}
      .hero[data-daypart="day"]{background:linear-gradient(135deg,#27566a,#173b4e 55%,#132b3a)}
      .hero[data-daypart="night"]{background:linear-gradient(135deg,#172e42,#0b1c2d 62%,#0b1724)}
      .hero::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0}
      .hero[data-weather="rain"]::after{opacity:.18;background:repeating-linear-gradient(108deg,transparent 0 26px,#9fdfe8 27px 28px,transparent 29px 49px);animation:krSkyDrift 18s linear infinite}
      .hero[data-weather="snow"]::after{opacity:.17;background:radial-gradient(circle at 15% 22%,#fff 0 2px,transparent 3px),radial-gradient(circle at 78% 55%,#fff 0 2px,transparent 3px),radial-gradient(circle at 46% 81%,#fff 0 2px,transparent 3px);background-size:110px 100px;animation:krSkyDrift 28s linear infinite}
      .hero>*{position:relative;z-index:1}.hero-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
      .atmosphere{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.atmosphere span{display:inline-flex;min-height:35px;align-items:center;padding:5px 10px;border:1px solid #79b3c082;border-radius:8px;background:#07192768;color:#d9f1f4;font-size:.84rem;font-variant-numeric:tabular-nums}
      .atmosphere-note{font-size:.76rem!important;color:var(--kr-muted,#accbd5)!important;margin-top:0!important}
      .status-disclosures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;margin-top:.9rem;align-items:start}.compact-detail{min-width:0;border:1px solid var(--kr-line,#476c80);border-radius:10px;background:var(--kr-surface,#122e40)}.compact-detail summary,.quiz-head{min-height:44px;cursor:pointer;list-style:none}.compact-detail summary::-webkit-details-marker,.quiz-head::-webkit-details-marker{display:none}.compact-detail summary{display:flex;align-items:center;flex-wrap:wrap;gap:.35rem .65rem;padding:.55rem .7rem}.compact-detail summary::after,.quiz-head::after{content:"＋";margin-inline-start:auto;color:var(--kr-accent,#a9dce2);font-weight:700}.compact-detail[open] summary::after,.quiz-panel[open] .quiz-head::after{content:"−"}.rank-badge{padding:.14rem .45rem;border-radius:6px;color:#141d28;background:var(--rank-color);font-size:.86rem}.stock-score{font-size:.83rem;font-variant-numeric:tabular-nums;color:var(--kr-muted,#dceff1)}.rank-detail,.mission-detail{padding:.15rem .7rem .7rem}.rank-detail progress{display:block;width:100%;height:.55rem;accent-color:var(--kr-accent,#a9dce2)}.rank-detail p,.mission-detail p{font-size:.83rem;color:var(--kr-muted,#dceff1)}#optional-shelf summary{cursor:pointer;padding:.4rem 0}.ready-panel details .ready-grid{margin-top:.65rem}@media(max-width:560px){.status-disclosures{grid-template-columns:1fr}}
      #item-dialog{box-sizing:border-box;width:min(42rem,calc(100% - 24px));max-height:min(88dvh,54rem);margin:auto;padding:clamp(.9rem,3vw,1.55rem);overflow:auto;overscroll-behavior:contain;border:1px solid var(--kr-line,#547a8b);border-radius:16px;background:var(--kr-surface,#fff);color:var(--kr-text,#173048);color-scheme:var(--kr-scheme,light);box-shadow:0 24px 60px #0007}#item-dialog::backdrop{background:#08121cc4}#item-dialog h3{font-size:1.25rem;margin:0 0 .5rem}#item-dialog .actions{margin-top:.7rem}#item-dialog input{background:var(--kr-bg,#fff);color:inherit}#item-dialog button{color:inherit}#item-dialog button.primary{background:var(--kr-accent,#197f83);color:var(--kr-accent-ink,#fff)}.shelf-message{font-size:.85rem}#item-dialog .item-note{max-width:64ch}.item-reference{margin:.5rem 0}

      .ready-panel{margin-top:1.5rem;padding:1rem;border:1px solid #719aaa80;border-radius:12px;background:#102b3aab}
      .ready-panel h3{margin:0 0 .85rem;color:#ecf8f9;font-size:1.03rem}.ready-panel h3 span{color:#a9dce2;font-variant-numeric:tabular-nums}
      .ready-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:.5rem}
      .ready-item{min-width:0}.ready-item .shelf-edit{position:relative;display:flex;flex-direction:column;align-items:center;gap:.34rem;width:100%;height:100%;min-width:0;padding:.56rem .4rem .72rem;border:1px solid #6f9ca9;border-radius:10px;background:#25485b;color:#f4fafa;text-align:center}
      .ready-item .shelf-edit:hover:not(:disabled){border-color:#abdfe9;background:#30586b}.ready-item .shelf-edit:focus-visible{outline:3px solid #ffd899;outline-offset:3px}.shelf-edit:disabled{cursor:default}.shelf-action{align-self:end;padding:.13rem .35rem;border:1px solid #7ea7b4;border-radius:4px;color:#f0f8fb;font-size:.72rem;line-height:1.3}
      .ready-art{display:grid;place-items:center;min-height:3rem;font-size:2.35rem;line-height:1;filter:none}.ready-name{font-size:.86rem;font-weight:750;line-height:1.25;overflow-wrap:anywhere}.ready-number{font-size:.8rem;font-weight:650;color:#e6f5f7;line-height:1.3;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
      .ready-empty{margin:.15rem 0!important;padding:.7rem 0;color:#d9e9eb!important;line-height:1.55}
      .ready-item[data-complete="true"] .shelf-edit{border-color:#8bd8bb;background:#23564f}.stock-meter{display:block;width:80%;height:4px;border-radius:999px;background:#18303d;overflow:hidden}.stock-meter span{display:block;height:100%;background:#8ed4df;border-radius:inherit}.ready-item[data-complete="true"] .stock-meter span{background:#9de8be}.stock-label{font-size:.75rem;color:#e1eff2}
      .ready-art svg{display:block;width:44px;height:44px}
      @keyframes krSkyDrift{from{background-position:0 0}to{background-position:100px 180px}}
      @media(prefers-reduced-motion:reduce){.hero,.mission-progress span{transition:none!important}.hero[data-weather]::after,.mission-item.unlock .mission-art{animation:none!important}}
      @media(max-width:1100px){.ready-grid{grid-template-columns:repeat(8,minmax(0,1fr))}}
      @media(max-width:850px){.ready-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}
      @media(max-width:650px){.ready-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
      @media(max-width:450px){.ready-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ready-panel{padding:.8rem}}
      .mission-head{display:flex;gap:.5rem 1rem;align-items:baseline;justify-content:space-between;flex-wrap:wrap}.mission-head h3{margin:0;color:#f0f9fa}.mission-head strong{color:#bde9e9;font-size:.84rem}.mission-panel>p{max-width:none;font-size:.8rem;color:#c3dce1}
      .mission-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.55rem;margin-top:.6rem}.mission-item{display:grid;grid-template-columns:2.6rem minmax(0,1fr);gap:.15rem .55rem;align-items:center;min-width:0;padding:.55rem .7rem;border:1px solid #537d8d;border-radius:8px;background:#18394a}.mission-item.done{border-color:#84c5cb;background:#21566a}.mission-art{grid-row:1/3;display:grid;place-items:center;font-size:1.6rem}.mission-item.pending .mission-art{font-size:1.2rem;color:#a6c7ce}.mission-title{font-size:.81rem;font-weight:700}.mission-state{font-size:.72rem;color:#c7dfe3}
      .mission-progress{height:8px;margin:.65rem 0 .55rem;overflow:hidden;border:1px solid #6e9baa;border-radius:999px;background:#0e2a39}.mission-progress span{display:block;height:100%;background:#83d4d2;border-radius:999px;transition:width .45s ease}
      .mission-item{position:relative}.mission-item.done::after{content:"✓";position:absolute;right:.55rem;top:.35rem;display:grid;place-items:center;width:1.1rem;height:1.1rem;border-radius:50%;background:#c5f1e9;color:#145269;font-size:.72rem;font-weight:900}.mission-item.unlock .mission-art{animation:krMissionUnlock .5s ease-out both}@keyframes krMissionUnlock{from{transform:scale(.65);opacity:.25}to{transform:scale(1);opacity:1}}

      @media(max-width:650px){.mission-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:400px){.mission-item{grid-template-columns:1fr;text-align:center}.mission-art{grid-row:auto}}
      :host([data-kr-themed]){color:var(--kr-text);--primary-text-color:var(--kr-text);--secondary-text-color:var(--kr-muted);--divider-color:var(--kr-line)}
      :host([data-kr-themed]) ha-card{background:var(--kr-bg)}:host([data-kr-themed]) .hero{color:var(--kr-text);background:radial-gradient(ellipse at top right,var(--kr-glow),transparent 58%),var(--kr-bg)}
      :host([data-kr-themed]) .hero h2,:host([data-kr-themed]) .hero p,:host([data-kr-themed]) .atmosphere,:host([data-kr-themed]) .atmosphere span,:host([data-kr-themed]) .household-strip strong,:host([data-kr-themed]) .ready-panel h3,:host([data-kr-themed]) .ready-name{color:var(--kr-text)}
      :host([data-kr-themed]) .atmosphere span,:host([data-kr-themed]) .household-strip,:host([data-kr-themed]) .ready-panel,:host([data-kr-themed]) .signals button,:host([data-kr-themed]) .ready-item .shelf-edit,:host([data-kr-themed]) .mission-item{background:var(--kr-surface);border-color:var(--kr-line);color:var(--kr-text)}
      :host([data-kr-themed]) .signals button[aria-pressed="true"],:host([data-kr-themed]) .ready-item .shelf-edit:hover:not(:disabled){background:var(--kr-glow);border-color:var(--kr-accent)}
      :host([data-kr-themed]) .ready-panel h3 span,:host([data-kr-themed]) .signals button strong,:host([data-kr-themed]) .mission-head strong,:host([data-kr-themed]) .mission-art,:host([data-kr-themed]) .shelf-action{color:var(--kr-accent)}
      :host([data-kr-themed]) .ready-number,:host([data-kr-themed]) .stock-label,:host([data-kr-themed]) .mission-state,:host([data-kr-themed]) .ready-empty{color:var(--kr-muted)!important}
      :host([data-kr-themed]) .stock-meter,:host([data-kr-themed]) .mission-progress{background:var(--kr-line)}:host([data-kr-themed]) .stock-meter span,:host([data-kr-themed]) .mission-progress span{background:var(--kr-accent)}
      :host([data-kr-themed]) .ready-item[data-complete="true"] .shelf-edit,:host([data-kr-themed]) .mission-item.done{border-color:var(--kr-accent)}
    </style><ha-card>${edit ? `<dialog id="item-dialog" aria-labelledby="item-dialog-title">${this._message ? `<p class="message" role="status">${escape(this._message)}</p>` : ""}${edit}</dialog>` : ""}<section class="hero" aria-label="비축 관리 개요"><div class="hero-intro"><div class="hero-head"><h2>우리 집 비축 관리</h2><div class="atmosphere" aria-label="시각과 날씨"><span id="local-clock">--:--</span><span id="local-weather">날씨 연동 안 됨</span><button type="button" id="refresh" aria-label="재고 새로고침" title="재고 새로고침">↻</button></div></div><p class="atmosphere-note" id="time-source">HA 시간대 · 시각 기준 주야 테마</p>` +
      (!snapshot ? `<p class="hero-copy">${this._loadError ? "재고를 읽지 못했습니다. 새로고침으로 다시 시도하세요." : "재고를 불러오는 중입니다."}</p>` : "") +
      (snapshot ? `<div class="household-strip"><strong>${people}인 가구 · 3일</strong><p>생수 ${people * 6} L · 식사 ${people * 9}인분</p></div>` : "") +
      `${signals}</div><div class="status-disclosures">${krStockRankView(snapshot, this._rankOpen)}${krMissionView(snapshot, escape, animateMission, this._missionOpen)}</div>` +
      (!edit && this._message ? `<p class="shelf-message" role="status">${escape(this._message)}</p>` : "") +
      `${krStockShelves(snapshot, escape, this._optionalShelfOpen, Boolean(this._draft), this._statusFilter)}</section></ha-card>`;
    for (const [selector, state] of [[".stock-rank", "_rankOpen"], [".mission-panel", "_missionOpen"], ["#optional-shelf", "_optionalShelfOpen"]]) {
      this.shadowRoot.querySelector(selector)?.addEventListener("toggle", (event) => { this[state] = event.currentTarget.open; });
    }
    const dialog = this.shadowRoot.querySelector("#item-dialog");
    if (dialog) {
      dialog.showModal();
      dialog.scrollTop = dialogScroll;
      if (!previousDialog) dialog.querySelector("h3")?.focus({ preventScroll: true });
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        dialog.querySelector("#cancel").click();
      });
    }
    this.shadowRoot.querySelectorAll(".lot-edit").forEach((row) => {
      const output = row.querySelector(".lot-total");
      if (!output) return;
      const update = () => {
        const capacity = krStockParse(draftItem, row.querySelector(".capacity").value);
        const count = krStockParse({}, row.querySelector(".bottle-count").value);
        const total = capacity * count;
        output.textContent = capacity > 0 && Number.isInteger(total) && total <= 1_000_000_000
          ? `합계 ${krStockText(draftItem, total)}` : "병 용량과 병 수를 확인하세요.";
      };
      row.addEventListener("input", update);
      update();
    });
    this.shadowRoot.querySelector("#refresh")?.addEventListener("click", () => this._load());
    this.shadowRoot.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => {
      this._statusFilter = button.dataset.status;
      this._render();
      this.shadowRoot.querySelector(`[data-status="${this._statusFilter}"]`)?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () =>
      this._edit(snapshot.catalog.find((item) => item.id === button.dataset.edit), button.classList.contains("shelf-edit"))));
    this.shadowRoot.querySelector("#editor")?.addEventListener("submit", (event) => { event.preventDefault(); this._save(); });
    this.shadowRoot.querySelector("#cancel")?.addEventListener("click", () => {
      if (this._saving) return;
      this._draft = null;
      this._message = "";
      this._render();
      this._returnToShelf();
    });
    this.shadowRoot.querySelector("#delete")?.addEventListener("click", () => this._delete());
    this._updateAtmosphere();
  }
}

if (!customElements.get("kr-survival-kit-inventory-card")) {
  customElements.define("kr-survival-kit-inventory-card", KrSurvivalKitInventoryCard);
}
window.customCards = window.customCards || [];
window.customCards.push({ type: "kr-survival-kit-inventory-card", name: "KR Survival Kit 재고", description: "가구 비상 물품 재고" });

// The guide is deliberately read-only. Its text comes from the same reviewed
// content file as the offline HTML and printable A4 card.
class KrSurvivalKitGuideCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._scenario = "prepare";
    this._sheet = "first-day";
    this._quizData = null;
    this._quizSources = {};
    this._quizAnswers = {};
    this._quizIndex = 0;
  }

  setConfig(config) {
    this._assetPath = config.asset_path || "/local";
    this._guide = typeof config.guide_data === "string" ? JSON.parse(config.guide_data) : config.guide_data;
    if (!this._guide?.scenarios?.length || !this._guide?.playbook?.length) throw new Error("상황 안내 자료가 없습니다.");
    this._loadQuiz(config.quiz_data);
    this._render();
  }

  _loadQuiz(quiz) {
    try {
      const data = typeof quiz === "string" ? JSON.parse(quiz) : quiz;
      this._quizData = data?.schema_version === 1 && Array.isArray(data?.questions) && Array.isArray(data?.levels) ? data : null;
      this._quizSources = this._guide.sources;
    } catch (_error) {
      this._quizData = null;
      this._quizSources = {};
    }
    let saved = null;
    try { saved = JSON.parse(window.localStorage?.getItem("kr_survival_kit_quiz_v1") || "null"); } catch (_error) { /* local storage can be unavailable */ }
    this._quizAnswers = {};
    if (saved?.version === this._quizData?.content_version) {
      for (const question of this._quizData?.questions || []) {
        const answer = saved?.answers?.[question.id];
        if (question.choices.some((choice) => choice.id === answer)) this._quizAnswers[question.id] = answer;
      }
    }
    this._quizIndex = Math.max(0, this._quizData?.questions?.findIndex((question) => !this._quizAnswers[question.id]) ?? 0);
  }

  _saveQuizAnswers() {
    if (!this._quizData) return;
    try {
      window.localStorage?.setItem("kr_survival_kit_quiz_v1", JSON.stringify({
        version: this._quizData.content_version, answers: this._quizAnswers,
      }));
    } catch (_error) { /* private browsing may disable local storage; the quiz still works in memory */ }
  }

  _quizView(escape) {
    const data = this._quizData;
    if (!data?.questions?.length) return "";
    const index = Math.min(this._quizIndex, data.questions.length - 1);
    const question = data.questions[index];
    const level = data.levels.find((entry) => entry.id === question.level_id);
    const selected = this._quizAnswers[question.id];
    const correct = data.questions.filter((entry) => this._quizAnswers[entry.id] === entry.answer_id).length;
    const answered = data.questions.filter((entry) => this._quizAnswers[entry.id]).length;
    const choice = question.choices.find((entry) => entry.id === selected);
    const answer = question.choices.find((entry) => entry.id === question.answer_id);
    const sourceLinks = (question.source_ids || []).map((id) => {
      const source = this._quizSources[id];
      let url;
      try { url = new URL(source?.url); } catch (_error) { return ""; }
      if (url.protocol !== "https:") return "";
      return `<a href="${escape(url.href)}" target="_blank" rel="noopener noreferrer">${escape(source.publisher || source.title || id)}</a>`;
    }).filter(Boolean).join(" · ");
    return `<details class="quiz-panel" ${this._quizOpen ? "open" : ""}><summary class="quiz-head"><strong>${escape(data.title || "상황 판단 연습")}</strong><span>학습 진도 ${answered}/${data.questions.length} · 정답 ${correct}/${data.questions.length}</span></summary>` +
      `<p>학습 기록은 이 브라우저에만 저장됩니다. 실제 대피 판단이나 생존 가능성 점수가 아닙니다.</p>` +
      `<div class="quiz-question"><small>${escape(level?.title || "학습 문제")} · ${index + 1}/${data.questions.length}</small><h4>${escape(question.prompt)}</h4>` +
      `<div class="quiz-choices">${question.choices.map((entry) => `<button type="button" data-quiz-choice="${escape(entry.id)}" aria-pressed="${selected === entry.id}">${escape(entry.text)}</button>`).join("")}</div>` +
      (choice ? `<div class="quiz-feedback" role="status"><p><strong>${selected === question.answer_id ? "맞았습니다." : "다시 확인해 보세요."}</strong> ${escape(choice.feedback)}</p>` +
        `<p><strong>정답: ${escape(answer?.text || "자료 확인 필요")}</strong> ${escape(answer?.feedback || "")}</p>` +
        `<p class="quiz-sources">${sourceLinks ? `공식 출처: ${sourceLinks}` : `공식 참고 자료를 확인하세요.`}</p></div>` : "") +
      `<div class="quiz-nav"><button type="button" data-quiz-nav="prev" ${index === 0 ? "disabled" : ""}>이전</button><button type="button" data-quiz-nav="next" ${index === data.questions.length - 1 ? "disabled" : ""}>다음 문제</button></div><button type="button" data-quiz-reset>학습 기록 지우고 다시 풀기</button></div></details>`;
  }

  set hass(value) { this._hass = value; }
  getCardSize() { return 10; }

  _render() {
    this._quizOpen = this.shadowRoot.querySelector(".quiz-panel")?.open ?? this._quizOpen;
    const guide = this._guide;
    if (!guide) return;
    const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    const scenarios = guide.scenarios;
    const scenario = scenarios.find((item) => item.id === this._scenario) || scenarios[0];
    const sheet = guide.playbook.find((item) => item.id === this._sheet) || guide.playbook[0];
    const scenarioGroups = [
      ["평시", scenarios.filter((item) => item.id === "prepare")],
      ["민방공 경보", scenarios.filter((item) => item.kind === "민방공 경보")],
      ["생활 기반 장애", scenarios.filter((item) => item.kind === "생활 기반 장애")],
    ];
    const scenarioNav = scenarioGroups.map(([title, items]) => `<div class="nav-group"><h3>${esc(title)}</h3><div class="nav-items">${items.map((item) =>
      `<button type="button" data-scenario="${esc(item.id)}" aria-pressed="${item.id === scenario.id}" class="${item.id === scenario.id ? "active" : ""}">${esc(item.title)}</button>`).join("")}</div></div>`).join("");
    const sheetNav = guide.playbook.map((item) => `<button type="button" role="tab" id="tab-${esc(item.id)}" aria-controls="sheet-panel" aria-selected="${item.id === sheet.id}" tabindex="${item.id === sheet.id ? 0 : -1}" data-sheet="${esc(item.id)}">${esc(item.label || item.title)}</button>`).join("");
    const detail = scenario.details?.length ? `<ul>${scenario.details.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p>${esc(scenario.paper_note)}</p>`;
    const household = scenario.id === "prepare" ? `<p class="household">${esc(guide.household_summary)}</p>` : "";
    const rows = sheet.layout === "reference" ? sheet.rows.map((row) =>
      `<article class="reference-item"><span>${esc(row.when)}</span><h4>${esc(row.title)}</h4><p>${esc(row.text)}</p></article>`).join("") :
      sheet.rows.map((row) => `<li class="time-row"><div class="time-rail"><span class="time-dot" aria-hidden="true"></span><span class="time-when">${esc(row.when)}</span></div><div class="time-copy"><h4>${esc(row.title)}</h4><p>${esc(row.text)}</p></div></li>`).join("");
    const sheetHeading = sheet.id === "field-skills" ? "이동·위생 점검" : sheet.layout === "reference" ? "장비 사용 점검" : "상황이 이어질 때";
    const sheetSummary = sheet.id === "field-skills" ? "평시에 경로와 시설을 확인하고, 현장에서는 공식 지시를 먼저 따르세요." : sheet.layout === "reference" ? "제품 설명서와 표시를 먼저 확인하세요." : "새 경보와 현장 지시가 나오면 그 안내를 먼저 따르세요.";
    const sources = Object.values(guide.sources).filter((source) => source.url);
    const uniqueSources = [...new Map(sources.map((source) => [source.url.replace("https://www.", "https://"), source])).values()];
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:#e7f3f6;font-family:"Malgun Gothic","Apple SD Gothic Neo",system-ui,sans-serif;--cyan:#91d9e5;--line:#345064;--muted:#b5c9d1}
      *{box-sizing:border-box}ha-card{display:block;overflow:hidden;background:#101c28;color:inherit;border:0;border-radius:0;min-height:100vh}
      .shell{max-width:1500px;margin:auto;padding:clamp(18px,3vw,48px)}.hero{position:relative;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(250px,.65fr);gap:24px;align-items:center;overflow:hidden;padding:clamp(24px,4vw,58px);min-height:300px;border:1px solid #416274;border-radius:22px;background:radial-gradient(circle at 78% 38%,#28627a 0,#183c50 23%,transparent 49%),linear-gradient(130deg,#142b3b,#0e1925 70%)}
      .hero:after{content:"";position:absolute;right:-70px;top:-175px;width:500px;height:500px;border:1px solid #6bb8ca55;border-radius:50%;box-shadow:0 0 0 42px #5bb4cb12,0 0 0 94px #5bb4cb0b;pointer-events:none}.hero-content{z-index:1}.hero h2{font-size:clamp(2rem,4vw,4.2rem);line-height:1.16;letter-spacing:-.055em;margin:0 0 18px}.hero p{max-width:58ch;font-size:clamp(1rem,1.3vw,1.22rem);line-height:1.72;margin:0;color:#d3e8ed}.hero strong{color:#fff}.hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}.hero-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 17px;border:1px solid #82c8d9;border-radius:10px;color:#e7f8fb;text-decoration:none;font-weight:700;background:#21566c}.hero-actions a.secondary{background:#152c3b;border-color:#537487}.hero-actions a:hover{text-decoration:underline;background:#2c7189}
      .orb{z-index:1;justify-self:center;display:grid;place-items:center;width:min(28vw,255px);aspect-ratio:1;border-radius:50%;border:1px solid #9de2ea77;background:radial-gradient(circle,#9bdce425 0 23%,#092837 24% 27%,transparent 28%),repeating-radial-gradient(circle,#83d9e42b 0 1px,transparent 1px 37px);box-shadow:inset 0 0 45px #57b9d12c,0 0 90px #3b9ecb33;transform:rotateX(24deg) rotateZ(-12deg)}.orb svg{width:42%;filter:drop-shadow(0 7px 9px #0008)}
      .layout{display:grid;grid-template-columns:minmax(210px,270px) minmax(0,1fr);gap:24px;margin-top:24px}.rail,.action,.timeline,.references{border:1px solid var(--line);border-radius:18px;background:#172938}.rail{padding:21px;align-self:start}.rail h2,.timeline h2{font-size:1.2rem;letter-spacing:-.025em;margin:0 0 17px}.nav-group+.nav-group{margin-top:22px}.nav-group h3{font-size:.85rem;color:var(--muted);font-weight:600;margin:0 0 9px}.nav-items{display:grid;gap:7px}.nav-items button,.sheet-tabs button{cursor:pointer;font:inherit;text-align:left;color:#dcecf0;border:1px solid transparent;border-radius:9px;background:transparent;min-height:45px;padding:10px 13px}.nav-items button:hover,.sheet-tabs button:hover{background:#28495a}.nav-items button.active{background:#235b6d;border-color:#78c9d9;color:#fff;font-weight:700;box-shadow:inset 3px 0 #9be4ee}.action{overflow:hidden}.action-top{padding:clamp(20px,3vw,36px);background:linear-gradient(135deg,#244b60,#1b3444 63%,#162939);border-bottom:1px solid var(--line)}.action-top .kind{font-size:.84rem;font-weight:700;color:#bddde5;margin:0 0 11px}.action-top h2{font-size:clamp(1.7rem,2.7vw,2.65rem);letter-spacing:-.04em;margin:0 0 20px}.action-top h3{color:#a4e4ed;font-size:.88rem;font-weight:700;margin:0 0 9px}.first-action{font-size:clamp(1.15rem,1.6vw,1.45rem);font-weight:700;line-height:1.6;max-width:58ch;margin:0}.action-body{padding:clamp(20px,3vw,36px)}.action-body h3{font-size:1rem;margin:0 0 14px}.action-body ul{padding-left:1.3rem;margin:0;max-width:75ch}.action-body li,.action-body p{line-height:1.75;color:#d0e0e5;margin:0 0 12px}.action-body li:last-child{margin-bottom:0}.comms{margin-top:22px;padding:18px 20px;border-left:3px solid #8ed4dd;background:#213e4d;border-radius:0 9px 9px 0;line-height:1.7}.comms strong{display:block;color:#bdebf1;margin-bottom:4px}
      .action-body .household{margin:18px 0 0;padding:16px 18px;border:1px solid #527b8d;border-radius:10px;color:#effbfd;background:#244353;font-weight:700}
      .timeline{margin-top:24px;padding:clamp(22px,3vw,36px)}.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}.section-head p{color:var(--muted);margin:0 0 17px}.sheet-tabs{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:24px;border-bottom:1px solid var(--line);padding-bottom:14px}.sheet-tabs button{border-color:#446273;min-height:43px}.sheet-tabs button[aria-selected="true"]{background:#8bd2dd;color:#0d2430;border-color:#8bd2dd;font-weight:800}.sheet-intro{max-width:75ch;line-height:1.7;color:#c5d9df;margin:0 0 28px}.time-list{list-style:none;padding:0;margin:0}.time-row{display:grid;grid-template-columns:minmax(112px,158px) minmax(0,1fr);gap:20px}.time-rail{position:relative;border-right:1px solid #467487;padding:0 21px 25px 0}.time-dot{position:absolute;right:-5px;top:5px;width:9px;height:9px;border-radius:50%;background:#a5e8ed;box-shadow:0 0 0 5px #366779}.time-when{display:block;font-weight:800;color:#a6e1e9}.time-copy{padding-bottom:26px;max-width:78ch}.time-copy h4{font-size:1.06rem;margin:0 0 6px;color:#f2f8f9}.time-copy p{line-height:1.72;color:#c5d8df;margin:0}.time-row:last-child .time-rail{border-color:transparent}.time-row:last-child .time-copy{padding-bottom:0}
      .reference-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.reference-item{padding:18px;border:1px solid #466b7d;border-radius:12px;background:#1e3949}.reference-item span{color:#b4e5ea;font-size:.84rem;font-weight:700}.reference-item h4{margin:8px 0;color:#f2f8f9}.reference-item p{margin:0;line-height:1.7;color:#c5d8df}@media(max-width:700px){.reference-grid{grid-template-columns:1fr}}
      .references{padding:20px 25px;margin-top:24px}.references summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700}.references p{color:var(--muted);line-height:1.6}.references ul{columns:2;column-gap:30px;padding-left:1.2rem}.references li{break-inside:avoid;line-height:1.6;margin:0 0 10px}.references a{color:#a9e1ec}.references a:hover{text-decoration:none}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #f3c77b;outline-offset:3px}
      @media(max-width:760px){.hero{grid-template-columns:1fr;min-height:0}.orb{display:none}.layout{grid-template-columns:1fr}.rail{padding:18px}.nav-items{grid-template-columns:repeat(auto-fit,minmax(125px,1fr))}.references ul{columns:1}}@media(max-width:420px){.shell{padding:12px}.hero{padding:22px;border-radius:15px}.layout{gap:12px;margin-top:12px}.action-top,.action-body,.timeline{padding:20px}.timeline{margin-top:12px}.time-row{grid-template-columns:80px minmax(0,1fr);gap:13px}.time-rail{padding-right:12px}.time-when{font-size:.82rem}.time-copy{padding-bottom:22px}.rail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:14px}.rail h2{grid-column:1/-1;margin:0 0 4px}.nav-group,.nav-items{display:contents}.nav-group h3{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.nav-items button{min-height:42px;text-align:center;font-size:.84rem;padding:8px 2px}.references{margin-top:12px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
      .quiz-panel{margin-top:24px;border-radius:18px;padding:1.2rem clamp(1rem,2.4vw,2rem);border:1px solid var(--line);background:#172938;color:#e7f3f6}.quiz-panel h3{margin:0}.quiz-panel p{max-width:60rem}.quiz-head{display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap}.quiz-head span{font-size:.84rem;font-weight:700}.quiz-question{max-width:65rem;margin-top:1rem;padding:1rem;border:1px solid var(--divider-color,#9cabb2);border-radius:10px}.quiz-question small{color:var(--muted)}.quiz-question h4{font-size:1rem;line-height:1.5}.quiz-choices{display:grid;gap:.5rem}.quiz-choices button{text-align:left}.quiz-choices button[aria-pressed="true"]{border-color:#197f83;background:#dff2f1;color:#113d49;font-weight:700}.quiz-feedback{padding:.65rem .8rem;border-left:3px solid #197f83;background:#e5f3f2;color:#173b45!important}.quiz-feedback p{margin:.3rem 0;color:#173b45}.quiz-sources a{color:#075c72;text-decoration:underline;font-weight:700}.quiz-sources a:focus-visible{outline:3px solid #d28b24;outline-offset:2px}.quiz-nav{display:flex;justify-content:space-between;gap:.5rem;margin-top:.8rem}.quiz-nav button:disabled{opacity:.5;cursor:default}
      .quiz-panel button{font:inherit;color:#e7f3f6;background:#213e4d;border:1px solid #547b8e;border-radius:8px;padding:10px 12px;min-height:44px;cursor:pointer}.quiz-panel [data-quiz-reset]{margin-top:10px}
      .quiz-head{display:flex;align-items:center;flex-wrap:wrap;gap:.35rem .75rem}.quiz-head span{margin-inline-start:auto}.quiz-head::after{content:"＋"}.quiz-panel[open] .quiz-head::after{content:"−"}.quiz-panel[open] .quiz-head{margin-bottom:.6rem}
      :host([data-kr-themed]){color:var(--kr-text);--cyan:var(--kr-accent);--line:var(--kr-line);--muted:var(--kr-muted)}:host([data-kr-themed]) ha-card{background:var(--kr-bg)}
      :host([data-kr-themed]) .hero{background:radial-gradient(ellipse at 78% 38%,var(--kr-glow),transparent 60%),var(--kr-surface);border-color:var(--kr-line)}
      :host([data-kr-themed]) .rail,:host([data-kr-themed]) .action,:host([data-kr-themed]) .timeline,:host([data-kr-themed]) .references,:host([data-kr-themed]) .quiz-panel{background:var(--kr-surface);color:var(--kr-text);border-color:var(--kr-line)}
      :host([data-kr-themed]) .action-top,:host([data-kr-themed]) .reference-item,:host([data-kr-themed]) .comms,:host([data-kr-themed]) .action-body .household{background:var(--kr-glow);color:var(--kr-text);border-color:var(--kr-line)}
      :host([data-kr-themed]) .hero p,:host([data-kr-themed]) .action-body li,:host([data-kr-themed]) .action-body p,:host([data-kr-themed]) .sheet-intro,:host([data-kr-themed]) .time-copy p,:host([data-kr-themed]) .reference-item p{color:var(--kr-muted)}
      :host([data-kr-themed]) .hero strong,:host([data-kr-themed]) .time-copy h4,:host([data-kr-themed]) .reference-item h4,:host([data-kr-themed]) .nav-items button,:host([data-kr-themed]) .sheet-tabs button{color:var(--kr-text)}
      :host([data-kr-themed]) .kind,:host([data-kr-themed]) .action-top h3,:host([data-kr-themed]) .references a,:host([data-kr-themed]) .comms strong,:host([data-kr-themed]) .time-when,:host([data-kr-themed]) .reference-item span{color:var(--kr-accent)}
      :host([data-kr-themed]) .hero-actions a,:host([data-kr-themed]) .quiz-panel button,:host([data-kr-themed]) .nav-items button.active,:host([data-kr-themed]) .sheet-tabs button[aria-selected="true"]{border-color:var(--kr-line);background:var(--kr-glow);color:var(--kr-text)}
      :host([data-kr-themed]) .nav-items button:hover,:host([data-kr-themed]) .sheet-tabs button:hover{background:var(--kr-glow)}
    </style><ha-card><main class="shell"><header class="hero"><div class="hero-content"><h2>상황 안내</h2><p><strong>${esc(guide.official_first)}</strong> 받은 경보를 선택하면 첫 행동을 바로 확인할 수 있습니다.</p><div class="hero-actions"><a href="${esc(this._assetPath)}/kr-survival-kit-a4.pdf" target="_blank" rel="noopener">A4 행동 카드 열기</a><a class="secondary" href="${esc(this._assetPath)}/kr-survival-kit-offline.html" target="_blank" rel="noopener">오프라인 안내 열기</a><a class="secondary" href="/kr-survival-kit/home">비축 관리로</a></div></div><div class="orb" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 8 82 21v25c0 23-13 36-32 47C31 82 18 69 18 46V21z" fill="#7bc8d9" stroke="#dafaff" stroke-width="2"/><path d="M50 18 73 27v19c0 17-8 28-23 37-15-9-23-20-23-37V27z" fill="#22506a"/><path d="M50 30v34M33 47h34" stroke="#bbf1f3" stroke-width="7" stroke-linecap="round"/></svg></div></header>
    <div class="layout"><nav class="rail" aria-label="상황 선택"><h2>상황별 첫 행동</h2>${scenarioNav}</nav><section class="action" aria-live="polite"><div class="action-top"><p class="kind">${esc(scenario.kind)}</p><h2>${esc(scenario.title)}</h2><h3>먼저 할 일</h3><p class="first-action">${esc(scenario.first_action)}</p></div><div class="action-body"><h3>이어 확인할 일</h3>${detail}${household}<div class="comms"><strong>전화·인터넷이 끊기면</strong>${esc(guide.communication_loss.first_action)} ${esc(guide.communication_loss.paper_note)}</div></div></section></div>
    <section class="timeline" aria-labelledby="timeline-title"><div class="section-head"><h2 id="timeline-title">${sheetHeading}</h2><p>${sheetSummary}</p></div><div class="sheet-tabs" role="tablist" aria-label="상세 행동 안내">${sheetNav}</div><div id="sheet-panel" role="tabpanel" aria-labelledby="tab-${esc(sheet.id)}" tabindex="0"><h3>${esc(sheet.title)}</h3><p class="sheet-intro">${esc(sheet.intro)}</p>${sheet.layout === "reference" ? `<div class="reference-grid">${rows}</div>` : `<ol class="time-list">${rows}</ol>`}</div></section>
    ${this._quizView(esc)}
    <details class="references"><summary>공식 참고 자료와 파일 보관 방법</summary><p>외부 출처는 인터넷 연결이 필요합니다. PDF는 열린 화면에서 인쇄·다운로드하고, HTML은 브라우저의 ‘다른 이름으로 저장’으로 미리 보관하세요.</p><ul>${uniqueSources.map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.publisher)} · ${esc(source.title)}</a></li>`).join("")}</ul></details></main></ha-card>`;
    this.shadowRoot.querySelector(".quiz-panel")?.addEventListener("toggle", (event) => {
      this._quizOpen = event.currentTarget.open;
    });
    this.shadowRoot.querySelectorAll("[data-quiz-choice]").forEach((button) => button.addEventListener("click", () => {
      const question = this._quizData?.questions?.[this._quizIndex];
      if (!question?.choices?.some((choice) => choice.id === button.dataset.quizChoice)) return;
      this._quizAnswers[question.id] = button.dataset.quizChoice;
      this._saveQuizAnswers();
      this._render();
      [...this.shadowRoot.querySelectorAll("[data-quiz-choice]")].find((entry) => entry.dataset.quizChoice === button.dataset.quizChoice)?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelectorAll("[data-quiz-nav]").forEach((button) => button.addEventListener("click", () => {
      this._quizIndex = Math.max(0, Math.min(this._quizData.questions.length - 1, this._quizIndex + (button.dataset.quizNav === "next" ? 1 : -1)));
      this._render();
      this.shadowRoot.querySelector("[data-quiz-choice]")?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelector("[data-quiz-reset]")?.addEventListener("click", () => {
      this._quizAnswers = {};
      this._quizIndex = 0;
      this._saveQuizAnswers();
      this._render();
      this.shadowRoot.querySelector("[data-quiz-choice]")?.focus({ preventScroll: true });
    });
    this.shadowRoot.querySelectorAll("[data-scenario]").forEach((button) => button.addEventListener("click", () => {
      this._scenario = button.dataset.scenario;
      this._render();
      this.shadowRoot.querySelector(`[data-scenario="${this._scenario}"]`)?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelectorAll("[data-sheet]").forEach((button) => button.addEventListener("click", () => {
      this._sheet = button.dataset.sheet;
      this._render();
      this.shadowRoot.querySelector(`[data-sheet="${this._sheet}"]`)?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelector(".sheet-tabs")?.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const index = guide.playbook.findIndex((item) => item.id === this._sheet);
      const next = event.key === "Home" ? 0 : event.key === "End" ? guide.playbook.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + guide.playbook.length) % guide.playbook.length;
      this._sheet = guide.playbook[next].id;
      this._render();
      this.shadowRoot.querySelector(`[data-sheet="${this._sheet}"]`)?.focus({ preventScroll: true });
    });
  }
}

if (!customElements.get("kr-survival-kit-guide-card")) {
  customElements.define("kr-survival-kit-guide-card", KrSurvivalKitGuideCard);
}
window.customCards.push({ type: "kr-survival-kit-guide-card", name: "KR Survival Kit 상황 안내", description: "경보별 첫 행동과 시간순 안내" });

const KR_PANEL_THEMES = {
  black: {name: "블랙", scheme:"dark", bg: "#101215", surface: "#1c2026", glow: "#272f36", text: "#f1f4f5", muted: "#c0cbd0", line: "#49535d", accent: "#96e4da", "accent-ink": "#102021"},
  white: {name: "화이트", scheme:"light", bg: "#f3f6f8", surface: "#ffffff", glow: "#e1ebf1", text: "#152b3a", muted: "#405763", line: "#aabfc9", accent: "#075d70", "accent-ink": "#ffffff"},
  blue: {name: "블루", scheme:"dark", bg: "#101d38", surface: "#182d4f", glow: "#234568", text: "#eef6ff", muted: "#c6daf0", line: "#56769c", accent: "#8bd8ff", "accent-ink": "#112540"},
  ivory: {name: "아이보리", scheme:"light", bg: "#f2e9d7", surface: "#fff9ec", glow: "#ece0c5", text: "#362b20", muted: "#5d5040", line: "#b6a387", accent: "#714619", "accent-ink": "#ffffff"},
};

class KrSurvivalKitPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host { display:block; color:var(--kr-text); background:var(--kr-bg); min-height:100%; }
        header { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px;
          padding: 8px 16px; background:var(--kr-surface); border-bottom:1px solid var(--kr-line); }
        nav { display: flex; flex-wrap: wrap; gap: 8px; }
        a { color: inherit; padding: 10px 12px; border-radius: 8px; text-decoration: none; }
        a[aria-current="page"] { color:var(--kr-text); font-weight:700;
          box-shadow: inset 0 -3px var(--kr-accent); }
        a:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
        .theme-switch{display:flex;flex-wrap:wrap;gap:5px;margin-inline-start:auto}.theme-switch button{min-height:36px;padding:.3rem .5rem;border:1px solid var(--kr-line);border-radius:7px;color:var(--kr-text);background:var(--kr-bg);cursor:pointer;font:inherit;font-size:.84rem}.theme-switch button[aria-pressed="true"]{background:var(--kr-accent);color:var(--kr-accent-ink);border-color:var(--kr-accent)}.theme-switch button:focus-visible{outline:2px solid var(--kr-accent);outline-offset:2px}@media(max-width:600px){.theme-switch{width:100%;margin-inline-start:0}}
        main { padding: clamp(4px, 2vw, 20px); }
      </style>
      <header>
        <ha-menu-button></ha-menu-button>
        <strong>KR Survival Kit</strong>
        <nav aria-label="KR Survival Kit 메뉴">
          <a href="/kr-survival-kit/home">비축 관리</a>
          <a href="/kr-survival-kit/guide">상황 안내</a>
        </nav>
        <div class="theme-switch" role="group" aria-label="화면 테마">${Object.entries(KR_PANEL_THEMES).map(([id, theme]) =>
          `<button type="button" data-theme="${id}" aria-pressed="false">${theme.name}</button>`).join("")}</div>
      </header>
      <main></main>`;
    let saved;
    try { saved = window.localStorage.getItem("kr_survival_kit_theme"); } catch { /* storage is optional */ }
    this._theme = Object.hasOwn(KR_PANEL_THEMES, saved) ? saved : "black";
    this.shadowRoot.querySelectorAll("[data-theme]").forEach((button) => button.addEventListener("click", () => {
      this._applyTheme(button.dataset.theme);
      try { window.localStorage.setItem("kr_survival_kit_theme", button.dataset.theme); } catch { /* storage is optional */ }
    }));
  }

  connectedCallback() {
    this._applyTheme(this._theme);
  }

  _applyTheme(name) {
    this._theme = name;
    for (const [key, value] of Object.entries(KR_PANEL_THEMES[name])) {
      if (key !== "name") this.style.setProperty(`--kr-${key}`, value);
    }
    for (const button of this.shadowRoot.querySelectorAll("[data-theme]")) {
      button.setAttribute("aria-pressed", String(button.dataset.theme === name));
    }
  }

  set hass(value) {
    this._hass = value;
    if (this._card) this._card.hass = value;
  }

  set route(value) {
    this._route = value;
    this._renderView();
  }

  set panel(value) {
    this._config = value.config;
    this._renderView();
  }

  _renderView() {
    if (!this._config || !this._route) return;
    const view = this._route.path === "/guide" ? "guide" : "home";
    if (view === this._view) return;
    this._view = view;
    const isGuide = view === "guide";
    const { guide, quiz, asset_path } = this._config;
    const card = document.createElement(isGuide ? "kr-survival-kit-panel-guide" : "kr-survival-kit-panel-inventory");
    card.toggleAttribute("data-kr-themed", true);
    card.setConfig(isGuide
      ? { guide_data: guide, asset_path, quiz_data: quiz }
      : {});
    this.shadowRoot.querySelector("main").replaceChildren(card);
    this._card = card;
    if (this._hass) card.hass = this._hass;
    for (const link of this.shadowRoot.querySelectorAll("nav a")) {
      if (link.pathname.endsWith(`/${view}`)) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  }
}

customElements.define("kr-survival-kit-panel-guide", class extends KrSurvivalKitGuideCard {});
customElements.define("kr-survival-kit-panel-inventory", class extends KrSurvivalKitInventoryCard {});
customElements.define("kr-survival-kit-panel", KrSurvivalKitPanel);
