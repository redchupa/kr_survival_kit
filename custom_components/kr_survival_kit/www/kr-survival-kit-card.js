const KR_SURVIVAL_GROUPS = {
  water: new Set(["drinking-water", "water-container", "insulated-bottle", "portable-water-filter", "water-sanitation-kit"]),
  food: new Set(["shelf-stable-meal", "canned-food", "self-heating-ration", "portable-stove", "butane-canister", "lighter", "solid-fuel", "manual-can-opener", "cooler-ice-pack", "long-storage-snacks", "infant-formula", "ready-to-feed-formula", "infant-feeding-supplies"]),
  power: new Set(["flashlight", "batteries", "radio", "candles", "portable-solar-panel", "power-bank", "portable-power-station", "charging-cables", "door-alarm", "portable-radio-communication"]),
};

function krSurvivalGroup(item) {
  return Object.keys(KR_SURVIVAL_GROUPS).find((group) => KR_SURVIVAL_GROUPS[group].has(item.id)) || "living";
}

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

function krReadyGrid(snapshot, escape) {
  const ready = krReadyItems(snapshot);
  if (!snapshot) return `<p class="ready-empty">재고를 불러오는 중입니다.</p>`;
  if (!ready.length) return `<p class="ready-empty">재고가 완비로 확인된 품목이 없습니다. 아래에서 목표량·기한·실사를 기록하세요.</p>`;
  return `<div class="ready-grid" role="list">${ready.map((item) => {
    const status = snapshot.summary.items[item.id];
    const pictogram = item.id === "drinking-water" ? KR_WATER_BOTTLE_ART : KR_READY_PICTOGRAMS[item.id] || "◈";
    return `<div class="ready-item" role="listitem" aria-label="${escape(item.name)} · ${escape(krStockText(item, status.usable))} / ${escape(krStockText(item, status.target))}"><span class="ready-art" aria-hidden="true">${pictogram}</span>` +
      `<span class="ready-name">${escape(KR_READY_SHORT_NAMES[item.id] || item.name)}</span><span class="ready-number">${escape(krStockText(item, status.usable))} / ${escape(krStockText(item, status.target))}</span></div>`;
  }).join("")}</div>`;
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

function krMissionView(snapshot, escape, animate = false) {
  const missions = krMissionState(snapshot);
  const complete = missions.filter((mission) => mission.complete).length;
  const names = ["기록 시작", "기록 진행", "기록 확장", "기록 강화", "4분야 기록"];
  return `<section class="mission-panel" aria-label="비축 기록 미션"><div class="mission-head"><h3>기록 미션</h3><strong>준비 기록 단계 ${complete}/4 · ${names[complete]}</strong></div>` +
    `<div class="mission-progress" role="progressbar" aria-label="준비 기록 단계" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${complete}"><span style="width:${complete * 25}%"></span></div>` +
    `<p>이 단계는 재고 기록과 실사 상태를 보여줍니다. 생존 확률을 뜻하지 않습니다.</p>` +
    `<div class="mission-grid">${missions.map((mission) => `<div class="mission-item ${mission.complete ? `done${animate ? " unlock" : ""}` : "pending"}">` +
      `<span class="mission-art" aria-hidden="true">${mission.complete ? mission.art : "○"}</span>` +
      `<span class="mission-title">${escape(mission.title)}</span><span class="mission-state">${mission.complete ? "기록 달성" : mission.mode === "any" ? "대상 중 완비 0개" : `완비 ${mission.count}/${mission.ids.length}개`}</span></div>`).join("")}</div></section>`;
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
    this._optionalOpen = false;
    this._optionalQuery = "";
    this._focusOptionalSearch = false;
    this._categoryFilter = "all";
    this._statusFilter = "attention";
    this._quizData = null;
    this._quizSources = {};
    this._quizAnswers = {};
    this._quizIndex = 0;
  }

  setConfig(config) {
    this._config = config || {};
    try {
      const data = typeof this._config.quiz_data === "string" ? JSON.parse(this._config.quiz_data) : this._config.quiz_data;
      this._quizData = data?.schema_version === 1 && Array.isArray(data?.questions) && Array.isArray(data?.levels) ? data : null;
      const guideData = typeof this._config.guide_data === "string" ? JSON.parse(this._config.guide_data) : this._config.guide_data;
      const sources = this._config.quiz_sources || guideData?.sources || data?.sources || {};
      this._quizSources = typeof sources === "string" ? JSON.parse(sources) : sources;
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
    this._render();
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
    if (!data?.questions?.length) return `<section class="quiz-panel" aria-label="상황 판단 연습"><h3>상황 판단 연습</h3><p>학습 퀴즈 자료가 연결되지 않았습니다. 상황 안내에서 공식 행동요령을 확인하세요.</p></section>`;
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
    return `<section class="quiz-panel" aria-label="상황 판단 연습"><div class="quiz-head"><h3>${escape(data.title || "상황 판단 연습")}</h3><span>학습 진도 ${answered}/${data.questions.length} · 정답 ${correct}/${data.questions.length}</span></div>` +
      `<p>학습 기록은 이 브라우저에만 저장됩니다. 실제 대피 판단이나 생존 가능성 점수가 아닙니다.</p>` +
      `<div class="quiz-question"><small>${escape(level?.title || "학습 문제")} · ${index + 1}/${data.questions.length}</small><h4>${escape(question.prompt)}</h4>` +
      `<div class="quiz-choices">${question.choices.map((entry) => `<button type="button" data-quiz-choice="${escape(entry.id)}" aria-pressed="${selected === entry.id}">${escape(entry.text)}</button>`).join("")}</div>` +
      (choice ? `<div class="quiz-feedback" role="status"><p><strong>${selected === question.answer_id ? "맞았습니다." : "다시 확인해 보세요."}</strong> ${escape(choice.feedback)}</p>` +
        `<p><strong>정답: ${escape(answer?.text || "자료 확인 필요")}</strong> ${escape(answer?.feedback || "")}</p>` +
        `<p class="quiz-sources">${sourceLinks ? `공식 출처: ${sourceLinks}` : `<a href="${escape(this._config?.guide_path || "/kr-survival-kit/guide")}">상황 안내의 출처 확인</a>`}</p></div>` : "") +
      `<div class="quiz-nav"><button type="button" data-quiz-nav="prev" ${index === 0 ? "disabled" : ""}>이전</button><button type="button" data-quiz-nav="next" ${index === data.questions.length - 1 ? "disabled" : ""}>다음 문제</button></div><button type="button" data-quiz-reset>학습 기록 지우고 다시 풀기</button></div></section>`;
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

  async _saveHousehold(form) {
    if (this._saving || this._loading) return;
    const people = Number(form.querySelector("#household-size").value);
    this._saving = true;
    try {
      await this._call("set_household_size", { revision: this._snapshot.revision, household_size: people });
      await this._load();
      this._householdMessage = this._loadError ? "저장했습니다. 새로고침해 권장량을 확인하세요." : "가구 인원과 권장량을 업데이트했습니다.";
    } catch (error) {
      if (/changed|revision/i.test(error.message || "")) {
        await this._load();
        this._householdMessage = "다른 변경을 불러왔습니다. 적용할 인원을 다시 선택하세요.";
      } else {
        this._householdMessage = "인원을 저장할 수 없습니다. 잠시 뒤 다시 시도하세요.";
      }
    } finally {
      this._saving = false;
      this._render();
      this.shadowRoot.querySelector("#household-size")?.focus({ preventScroll: true });
    }
  }

  _addLot(item) {
    const lots = this._draft.lots;
    let number = lots.length + 1;
    while (lots.some((lot) => lot.lot_id === `lot-${number}`)) number += 1;
    lots.push({ lot_id: `lot-${number}`, quantity: "0", expires_on: null, received_on: null,
      ...(item.id === "drinking-water" ? { capacity: "2", count: "0" } : {}) });
  }

  _edit(item) {
    const saved = this._snapshot.items[item.id];
    if (item.tier === "optional") this._optionalOpen = true;
    this._draft = {
      id: item.id,
      applicable: saved?.applicable ?? true,
      target: saved?.target === null || saved?.target === undefined ? "" : krStockFormat(item, saved.target),
      lots: (saved?.lots || []).map((lot) => ({ ...lot, quantity: krStockFormat(item, lot.quantity),
        ...(lot.bottle_ml ? { capacity: krStockFormat(item, lot.bottle_ml), count: String(lot.bottle_count) } : {}),
      })),
      review_interval_days: saved?.review_interval_days ?? "",
      confirm: false,
    };
    if (!this._draft.lots.length) this._addLot(item);
    this._message = "";
    this._render();
    this.shadowRoot.querySelector(".lot-edit input")?.focus();
  }

  _captureDraft() {
    if (!this._draft || !this.shadowRoot.querySelector("#editor")) return;
    const root = this.shadowRoot;
    this._draft.applicable = root.querySelector("#applicable").checked;
    this._draft.target = root.querySelector("#target").value;
    this._draft.review_interval_days = root.querySelector("#review-interval").value;
    this._draft.confirm = root.querySelector("#confirm").checked;
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
        confirm: this._draft.confirm,
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
  }

  async _delete() {
    if (!window.confirm("이 품목의 가구 재고 기록을 삭제할까요?")) return;
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
    this._render();
  }

  _filterOptionalItems() {
    const query = this._optionalQuery.trim().toLocaleLowerCase("ko");
    let found = 0;
    this.shadowRoot.querySelectorAll("#optional-items .item").forEach((row) => {
      row.hidden = !row.dataset.name.toLocaleLowerCase("ko").includes(query);
      if (!row.hidden) found += 1;
    });
    const noMatch = this.shadowRoot.querySelector("#optional-no-match");
    if (noMatch) noMatch.hidden = !query || found !== 0;
  }

  _render() {
    const restoreOptionalSearchFocus = this._focusOptionalSearch || this.shadowRoot.activeElement?.id === "optional-search";
    const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
    const snapshot = this._snapshot;
    const people = snapshot?.household_size ?? 4;
    const states = { shortage: "부족", needs_check: "확인 필요", sufficient: "충족", not_applicable: "해당 없음" };
    const priority = { shortage: 0, needs_check: 1, sufficient: 2, not_applicable: 3 };
    const items = snapshot?.catalog.map((item) => ({ ...item, status: snapshot.summary.items[item.id] }))
      .sort((left, right) => priority[left.status.state] - priority[right.status.state]) || [];
    const recommendations = new Map([
      ...(snapshot?.household?.items || []),
      ...(snapshot?.household?.optional_items || []),
    ].map((entry) => [entry.item_id, entry]));
    const expiring = (item) => (snapshot.items[item.id]?.applicable ?? !["household", "optional"].includes(item.tier)) && item.status.expiring_quantity > 0;
    const attention = (item) => item.status.state === "shortage" || item.status.state === "needs_check" || expiring(item);
    const filteredItems = items.filter((item) => {
      if (this._categoryFilter !== "all" && krSurvivalGroup(item) !== this._categoryFilter) return false;
      if (this._statusFilter === "attention") return attention(item);
      if (this._statusFilter === "expiring") return expiring(item);
      if (this._statusFilter === "optional") return item.tier === "optional";
      return this._statusFilter === "all" || item.status.state === this._statusFilter;
    });
    const renderRows = (listedItems) => listedItems.map((item) => {
      const status = item.status;
      const recommendation = recommendations.get(item.id);
      const saved = snapshot.items[item.id];
      const newOptional = item.tier === "optional" && !saved;
      const lots = saved?.lots || [];
      const recorded = lots.reduce((sum, lot) => sum + lot.quantity, 0);
      const dateLabel = krDateLabel(item);
      const noteCoveredByBasis = item.note && recommendation?.basis?.includes(item.note);
      const lotText = lots.length ? lots.map((lot, index) =>
        `<li>묶음 ${index + 1} · ${lot.bottle_ml ? `${escape(krStockText(item, lot.bottle_ml))} × ${escape(lot.bottle_count)}병 = ` : ""}${escape(krStockText(item, lot.quantity))}` +
        ` · 입고일 ${escape(lot.received_on || "미상")}` +
        (item.date_kind === "expiry" ? ` · ${escape(dateLabel)} ${escape(lot.expires_on || "미확인")}` : "") + "</li>"
      ).join("") : "<li>기록된 묶음 없음</li>";
      return `<article class="item" data-name="${escape(item.name)}"><div class="item-head"><div class="item-title"><h3>${escape(item.name)}</h3>` +
        `<span class="state ${escape(status.state)}">${states[status.state]}</span>` +
        (expiring(item) ? `<span class="expiry-state">기한 임박</span>` : "") + `</div>` +
        `<button type="button" data-edit="${escape(item.id)}">${newOptional ? "설정" : "수정"}</button></div>` +
        `<p class="row-meta">${newOptional ? "가구에 필요하면 설정" : saved ? status.confirmed && status.verified_on ? `사용 가능 집계 ${escape(krStockText(item, status.usable))}` : "수량 확인 필요" : "수량 미기록"}` +
        (status.target != null ? ` <span>목표 ${escape(krStockText(item, status.target))}</span>` : "") + `</p>` +
        (saved && item.date_kind === "expiry" ? `<p class="rotation-meta">${status.expired_quantity ? `${escape(dateLabel)} 경과 ${escape(krStockText(item, status.expired_quantity))} · ` : ""}${status.unknown_date_quantity ? `${escape(dateLabel)} 미확인 ${escape(krStockText(item, status.unknown_date_quantity))} · ` : ""}다음 ${escape(dateLabel)} ${escape(status.next_expiry_on || "확인 필요")}</p>` : "") +
        `<details class="item-more"><summary>기록과 참고 보기</summary>` +
        (item.examples ? `<p>${escape(item.examples)}</p>` : "") +
        (item.note && !noteCoveredByBasis ? `<p>${escape(item.note)}</p>` : "") +
        (recommendation ? `<p>참고 기준 · ${escape(recommendation.basis)}</p>` : "") +
        (item.id === "water-container" && recommendation ? `<p>안전수 보관 용량 예시와 급수 용기 개수 목표는 단위가 다릅니다.</p>` : "") +
        (saved ? `<p>기록 총수량 ${escape(krStockText(item, recorded))}${item.date_kind === "expiry" ? " (기한 미확인·경과분 포함)" : ""} · 가구 목표 ${status.target === null ? "미설정" : escape(krStockText(item, status.target))} · 마지막 실사 ${escape(status.verified_on || "기록 없음")}${status.confirmed ? "" : " · 현재 수량 미확인"}</p><p>점검 주기 ${escape(status.review_interval_days ?? snapshot.default_review_interval_days ?? 30)}일 · 다음 점검일 ${escape(status.next_review_on || "미정")}</p><ul>${lotText}</ul>` : "") +
        `</details></article>`;
    }).join("");
    const regularItems = filteredItems.filter((item) => item.tier !== "optional");
    const allOptionalItems = items.filter((item) => item.tier === "optional");
    const optionalItems = filteredItems.filter((item) => item.tier === "optional");
    const activeOptionalCount = allOptionalItems.filter((item) => item.status.state !== "not_applicable").length;
    const rows = renderRows(regularItems);
    const optionalRows = allOptionalItems.length
      ? `<details id="optional-items" ${this._optionalOpen ? "open" : ""}><summary>선택 물품 ${allOptionalItems.length}개 · 사용 중 ${activeOptionalCount}개</summary>` +
        `<p>기본은 해당 없음입니다. 필요한 품목만 설정하세요.</p>` +
        (this._statusFilter !== "optional" ? `<button type="button" id="show-all-optional">선택 물품 모두 보기</button><p>현재 필터에 맞는 선택 물품 ${optionalItems.length}개</p>` : "") +
        `<label for="optional-search">선택 물품 찾기</label><input id="optional-search" type="search" placeholder="이름으로 찾기" value="${escape(this._optionalQuery)}">` +
        `<details class="optional-guidance"><summary>선택·사용 기준</summary>` +
        `<p>${escape(snapshot?.household?.optional_intro || "품목별 사용 조건과 수량을 확인하세요.")}</p>` +
        (snapshot?.household?.optional_safety ? `<p class="optional-safety">${escape(snapshot.household.optional_safety)}</p>` : "") +
        `</details>` +
        `<p id="optional-no-match" hidden>일치하는 선택 물품이 없습니다.</p>${renderRows(optionalItems)}</details>`
      : "";
    const draftItem = items.find((item) => item.id === this._draft?.id);
    const draftRecommendation = recommendations.get(this._draft?.id);
    const noteCoveredByBasis = draftItem?.note && draftRecommendation?.basis?.includes(draftItem.note);
    const edit = this._draft && draftItem ? `<form id="editor"><h3>${escape(draftItem.name)} 수정</h3>` +
      (draftItem.examples ? `<p class="item-note">${escape(draftItem.examples)}</p>` : "") +
      (draftItem.note && !noteCoveredByBasis ? `<p class="item-note">${escape(draftItem.note)}</p>` : "") +
      `<p>현재 기록 ${escape(krStockText(draftItem, draftItem.status.usable))} · ${states[draftItem.status.state]} · 마지막 실사 ${escape(draftItem.status.verified_on || "기록 없음")}</p>` +
      (draftItem.status.target != null ? `<p class="recommendation">${people}인 가구 목표 <strong>${escape(krStockText(draftItem, draftItem.status.target))}</strong></p>` : "") +
      (draftItem.id === "drinking-water" ? `<p class="item-note">2 L 생수 12병이면 병 용량에 2, 병 수에 12를 입력하세요.</p>` : "") +
      this._draft.lots.map((lot, index) =>
        `<fieldset class="lot-edit"><legend>묶음 ${index + 1}</legend>` +
        (lot.capacity !== undefined
          ? `<label>병 하나의 용량 (L)<input class="capacity" type="number" min="0.001" max="1000000" step="0.001" value="${escape(lot.capacity)}" required></label>` +
            `<label>병 수 (병)<input class="bottle-count" type="number" min="0" max="1000000000" step="1" value="${escape(lot.count)}" required></label>` +
            `<output class="lot-total" aria-live="polite"></output>`
          : `<label>${draftItem.id === "drinking-water" ? "기존 기록의 총량 (L)" : `보유 수량 (${escape(krStockUnit(draftItem))})`}<input class="quantity" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(lot.quantity)}" required></label>`) +
        (draftItem.date_kind === "expiry" ? `<label>${escape(krDateLabel(draftItem))} (포장 기준)<input class="expiry" type="date" value="${escape(lot.expires_on || "")}"></label>` : "") +
        `<details><summary>입고일 ${lot.received_on ? escape(lot.received_on) : "(선택)"}</summary><label>입고일<input class="received-on" type="date" value="${escape(lot.received_on || "")}"></label></details>` +
        `<button type="button" data-remove="${index}" aria-label="묶음 ${index + 1} 빼기">묶음 빼기</button></fieldset>`
      ).join("") + `<button type="button" id="add-lot">다른 묶음 추가</button>` +
      `<details id="item-settings" ${this._draft.settingsOpen ? "open" : ""}><summary>목표와 점검 설정</summary>` +
      `<label><input id="applicable" type="checkbox" ${this._draft.applicable ? "checked" : ""}> 우리 집에서 관리</label>` +
      `<label for="target">목표량 직접 설정 (${escape(krStockUnit(draftItem))})</label><input id="target" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(this._draft.target)}" placeholder="${draftItem.status.recommended_target == null ? "미설정" : escape(krStockText(draftItem, draftItem.status.recommended_target)) + " 자동"}">` +
      `<label for="review-interval">재고 점검 주기 (일)</label><input id="review-interval" type="number" min="1" max="3650" step="1" value="${escape(this._draft.review_interval_days)}" placeholder="기본 ${escape(snapshot.default_review_interval_days ?? 30)}일"></details>` +
      `<label class="confirm"><input id="confirm" type="checkbox" ${this._draft.confirm ? "checked" : ""}> 실제 재고를 확인했고 오늘 실사했습니다</label>` +
      `<div class="actions"><button type="submit" class="primary">저장</button><button type="button" id="cancel">취소</button>` +
      `<button type="button" id="delete">기록 삭제</button></div></form>` : "";
    const categoryLabels = { water: "물", food: "식품·조리", power: "전원·통신", living: "생활·보호" };
    const categoryButtons = Object.entries(categoryLabels).map(([group, label]) =>
      `<button type="button" data-category="${group}" aria-pressed="${this._categoryFilter === group}">${label}</button>`
    ).join("");
    const counts = snapshot?.summary;
    const signals = counts ? `<div class="signals" aria-label="재고 점검 현황">` +
      `<button type="button" data-status="shortage"><span>부족</span><strong>${counts.shortage_count}</strong></button>` +
      `<button type="button" data-status="needs_check"><span>확인 필요</span><strong>${counts.needs_check_count}</strong></button>` +
      `<button type="button" data-status="expiring"><span>기한 임박</span><strong>${counts.expiring_count}</strong></button></div>` : "";
    const statusLabels = { attention: "점검 필요", shortage: "부족", needs_check: "확인 필요", expiring: "기한 임박", optional: "선택 물품", all: "전체" };
    const statusButtons = Object.entries(statusLabels).map(([value, label]) =>
      `<button type="button" data-status="${value}" aria-pressed="${this._statusFilter === value}">${label}</button>`
    ).join("");
    const listTitle = statusLabels[this._statusFilter] || "품목";
    const guidePath = escape(this._config?.guide_path || "/kr-survival-kit/guide");
    const missionSignature = krMissionState(snapshot).map((mission) => mission.complete).join("");
    const animateMission = Boolean(snapshot && missionSignature !== this._missionSignature);
    this._missionSignature = missionSignature;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color,#173048);font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif}
      ha-card{display:block;padding:1.2rem;background:var(--card-background-color,#fff);border-radius:14px}
      h2{font-size:1.25rem;margin:0 0 .3rem}h3{font-size:1rem;margin:0 0 .35rem}h4{font-size:.95rem;margin:1rem 0 .4rem}
      p{margin:.35rem 0;color:var(--secondary-text-color,#405564);line-height:1.5}ul{margin:.35rem 0;padding-left:1.25rem;line-height:1.55}
      .intro{border-left:4px solid #197f83;padding-left:.8rem;margin:.75rem 0 1rem}
      .recommendation{padding:.55rem .7rem;background:rgba(25,127,131,.08);border-radius:7px}
      .item-note{font-size:.9rem}
      .optional-safety{border-left:3px solid #a9670e;padding-left:.7rem}
      .item{padding:1rem 0;border-top:1px solid var(--divider-color,#d7e1e7)}.item-head{display:flex;justify-content:space-between;gap:.8rem;align-items:start}
      .state{display:inline-block;font-weight:700;font-size:.82rem}.shortage{color:#ad342d}.needs_check{color:#a9670e}.sufficient{color:#13777b}
      button{font:inherit;min-height:44px;padding:.45rem .75rem;border:1px solid #197f83;background:transparent;color:var(--primary-text-color,#173048);border-radius:8px;cursor:pointer}
      button:hover{background:rgba(25,127,131,.1)}button:focus-visible,input:focus-visible{outline:3px solid #d28b24;outline-offset:2px}
      .primary{background:#156d73;color:#fff}.message{padding:.7rem;border-radius:8px;background:rgba(210,139,36,.16);line-height:1.5}
      form{border-top:3px solid #197f83;padding-top:1rem}label{display:block;margin:.7rem 0 .3rem;font-weight:600}input:not([type=checkbox]){box-sizing:border-box;width:100%;min-height:42px;padding:.5rem;font:inherit;color:var(--primary-text-color,#173048);background:var(--card-background-color,#fff);border:1px solid #718893;border-radius:7px}
      .lot-edit{border:1px solid var(--divider-color,#d7e1e7);border-radius:8px;padding:.75rem;margin:.6rem 0}.confirm{margin:1.2rem 0}.actions{display:flex;gap:.5rem;flex-wrap:wrap}
      details{border-top:1px solid var(--divider-color,#d7e1e7);margin-top:.5rem}summary{min-height:44px;padding:.75rem .25rem;cursor:pointer;font-weight:700}summary:focus-visible{outline:3px solid #d28b24;outline-offset:2px}
      ha-card{padding:0;max-width:1480px;margin:0 auto;overflow:hidden;box-shadow:0 22px 60px rgba(8,24,34,.17)}
      .hero{background:linear-gradient(125deg,#111d28 0%,#1b3445 58%,#294858 100%);color:#edf7f8;padding:clamp(1.1rem,3vw,2.5rem);display:grid;grid-template-columns:minmax(16rem,.82fr) minmax(0,1.18fr);gap:clamp(1rem,3vw,2.5rem);align-items:center}
      .hero h2{font-size:clamp(1.65rem,3vw,2.45rem);line-height:1.18;letter-spacing:-.045em;margin:0 0 .8rem;color:#f3fafb}
      .hero p{color:#c6d9df;max-width:35rem}.hero .hero-copy{font-size:1rem;line-height:1.6}
      .hero-links{margin-top:1.2rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
      .guide-link{display:inline-flex;align-items:center;min-height:44px;padding:.55rem .9rem;border:1px solid #83cadb;border-radius:8px;color:#e4f8fb;font-weight:700;text-decoration:none}
      .guide-link:hover{text-decoration:underline}.guide-link:focus-visible{outline:3px solid #f2c77c;outline-offset:3px}
      .signals{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.25rem}.signals button{display:flex;gap:.7rem;align-items:baseline;background:rgba(7,19,29,.42);color:#eef7f8;border:1px solid #668b9c;min-width:6.5rem;justify-content:space-between}.signals strong{font-size:1.3rem;font-variant-numeric:tabular-nums}.signals button:hover{background:#2a5369}
      .inventory-panel{padding:clamp(1rem,2.4vw,2rem);background:var(--card-background-color,#fff);color:var(--primary-text-color,#173048)}
      .inventory-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}.inventory-heading h2{margin:0;font-size:1.32rem;color:var(--primary-text-color,#173048)}
      .inventory-heading p{margin:0}.filter-bar{display:flex;gap:.45rem;flex-wrap:wrap;margin:1rem 0}.filter-bar button{border-color:var(--divider-color,#9cabb2);border-radius:999px;padding:.45rem .85rem}.filter-bar button[aria-pressed="true"]{background:#176d86;border-color:#176d86;color:#fff}
      .filter-note{font-size:.9rem}.items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;align-items:start}.items>.item,.items>#optional-items{border:1px solid var(--divider-color,#d7e1e7);border-radius:10px;padding:.8rem 1rem;margin:0;min-width:0}
      .item{padding:.8rem 1rem;border-top:0}.item h3{margin:0;font-size:1rem;line-height:1.35}.item-head{align-items:center}.item-title{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap}.item-head button{flex:none}
      .state,.expiry-state{font-size:.77rem;border-radius:999px;padding:.13rem .48rem;border:1px solid currentColor}.expiry-state{color:#a9670e}.row-meta{font-size:.9rem;margin:.4rem 0}.row-meta span{display:block;color:var(--secondary-text-color,#405564)}
      .item-more{margin-top:.45rem}.item-more summary{font-weight:600;font-size:.88rem}.item-more p{margin:.6rem 0}.items>#optional-items{grid-column:1/-1}.items>#optional-items>.item{border-top:1px solid var(--divider-color,#d7e1e7)}
      .empty{grid-column:1/-1;padding:1.25rem;border:1px dashed var(--divider-color,#8da3ad);border-radius:10px}.items>form{grid-column:1/-1;width:100%;box-sizing:border-box}.inventory-panel form{max-width:48rem;margin:0 auto}
      button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #e0a950;outline-offset:2px}
      @media(max-width:620px){.items{grid-template-columns:1fr}.hero{padding:1.15rem}.inventory-panel{padding:1rem}}
      @media(prefers-color-scheme:dark){.shortage{color:#ff9d94}.needs_check{color:#f0b76d}.sufficient{color:#78d8d2}}
      @media(max-width:400px){.item-head{flex-wrap:wrap}}
      .household-strip{display:grid;grid-template-columns:1fr auto;gap:.65rem 1rem;align-items:center;padding:1rem;border:1px solid #78aebe;border-radius:14px;background:#0b2636;margin-block:1rem}.household-strip strong{color:#a4fff0}.household-strip form{display:flex;align-items:end;flex-wrap:wrap;gap:.45rem}.household-strip label{display:grid;gap:.2rem;font-size:.85rem}.household-strip input{width:5rem;color:#e9fbff;background:#163c4e;border:1px solid #85c9d0}.household-strip p{margin:0;grid-column:1/-1}.household-strip button{background:#a4fff0;color:#123544;font-weight:750}.lot-edit{min-inline-size:0}.lot-edit legend{font-weight:750}.lot-total{font-weight:750;align-self:center}.lot-edit summary,#item-settings summary{cursor:pointer;padding:.5rem 0}.lot-edit input{box-sizing:border-box;max-width:100%}@media(max-width:530px){.household-strip{grid-template-columns:1fr}.household-strip form{justify-content:flex-start}}
      .hero{position:relative;display:block;background:linear-gradient(135deg,#1b3a4c,#102432 65%,#0d1c2a);transition:background .5s ease}
      .hero[data-daypart="day"]{background:linear-gradient(135deg,#27566a,#173b4e 55%,#132b3a)}
      .hero[data-daypart="night"]{background:linear-gradient(135deg,#172e42,#0b1c2d 62%,#0b1724)}
      .hero::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0}
      .hero[data-weather="rain"]::after{opacity:.18;background:repeating-linear-gradient(108deg,transparent 0 26px,#9fdfe8 27px 28px,transparent 29px 49px);animation:krSkyDrift 18s linear infinite}
      .hero[data-weather="snow"]::after{opacity:.17;background:radial-gradient(circle at 15% 22%,#fff 0 2px,transparent 3px),radial-gradient(circle at 78% 55%,#fff 0 2px,transparent 3px),radial-gradient(circle at 46% 81%,#fff 0 2px,transparent 3px);background-size:110px 100px;animation:krSkyDrift 28s linear infinite}
      .hero>*{position:relative;z-index:1}.hero-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
      .atmosphere{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.atmosphere span{display:inline-flex;min-height:35px;align-items:center;padding:5px 10px;border:1px solid #79b3c082;border-radius:8px;background:#07192768;color:#d9f1f4;font-size:.84rem;font-variant-numeric:tabular-nums}
      .atmosphere-note{font-size:.76rem!important;color:#accbd5!important;margin-top:0!important}
      .rotation-meta{font-size:.83rem;color:#8b5c0b;font-weight:650}
      .ready-panel{margin-top:1.5rem;padding:1rem;border:1px solid #719aaa80;border-radius:12px;background:#102b3aab}
      .ready-panel h3{margin:0 0 .85rem;color:#ecf8f9;font-size:1.03rem}.ready-panel h3 span{color:#a9dce2;font-variant-numeric:tabular-nums}
      .ready-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:.5rem}
      .ready-item{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:start;gap:.27rem;min-width:0;padding:.72rem .3rem .64rem;border:1px solid #547d8e;border-radius:9px;background:#25485b;color:#f4fafa;text-align:center}
      .ready-art{display:grid;place-items:center;min-height:3rem;font-size:2.35rem;line-height:1;filter:none}.ready-name{font-size:.76rem;font-weight:750;line-height:1.25;overflow-wrap:anywhere}.ready-number{font-size:.66rem;color:#d3e9ec;line-height:1.25;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
      .ready-empty{margin:.15rem 0!important;padding:.7rem 0;color:#d9e9eb!important;line-height:1.55}
      .ready-art svg{display:block;width:44px;height:44px}
      @keyframes krSkyDrift{from{background-position:0 0}to{background-position:100px 180px}}
      @media(prefers-reduced-motion:reduce){.hero,.mission-progress span{transition:none!important}.hero[data-weather]::after,.mission-item.unlock .mission-art{animation:none!important}}
      @media(max-width:1100px){.ready-grid{grid-template-columns:repeat(8,minmax(0,1fr))}}
      @media(max-width:850px){.ready-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}
      @media(max-width:650px){.ready-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
      @media(max-width:450px){.ready-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ready-panel{padding:.8rem}}
      .mission-panel{margin-top:1.25rem}.mission-head{display:flex;gap:.5rem 1rem;align-items:baseline;justify-content:space-between;flex-wrap:wrap}.mission-head h3{margin:0;color:#f0f9fa}.mission-head strong{color:#bde9e9;font-size:.84rem}.mission-panel>p{max-width:none;font-size:.8rem;color:#c3dce1}
      .mission-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.55rem;margin-top:.6rem}.mission-item{display:grid;grid-template-columns:2.6rem minmax(0,1fr);gap:.15rem .55rem;align-items:center;min-width:0;padding:.55rem .7rem;border:1px solid #537d8d;border-radius:8px;background:#18394a}.mission-item.done{border-color:#84c5cb;background:#21566a}.mission-art{grid-row:1/3;display:grid;place-items:center;font-size:1.6rem}.mission-item.pending .mission-art{font-size:1.2rem;color:#a6c7ce}.mission-title{font-size:.81rem;font-weight:700}.mission-state{font-size:.72rem;color:#c7dfe3}
      .mission-progress{height:8px;margin:.65rem 0 .55rem;overflow:hidden;border:1px solid #6e9baa;border-radius:999px;background:#0e2a39}.mission-progress span{display:block;height:100%;background:#83d4d2;border-radius:999px;transition:width .45s ease}
      .mission-item{position:relative}.mission-item.done::after{content:"✓";position:absolute;right:.55rem;top:.35rem;display:grid;place-items:center;width:1.1rem;height:1.1rem;border-radius:50%;background:#c5f1e9;color:#145269;font-size:.72rem;font-weight:900}.mission-item.unlock .mission-art{animation:krMissionUnlock .5s ease-out both}@keyframes krMissionUnlock{from{transform:scale(.65);opacity:.25}to{transform:scale(1);opacity:1}}
      .quiz-panel{padding:1.2rem clamp(1rem,2.4vw,2rem);border-top:1px solid var(--divider-color,#d7e1e7);background:var(--card-background-color,#fff);color:var(--primary-text-color,#173048)}.quiz-panel h3{margin:0}.quiz-panel p{max-width:60rem}.quiz-head{display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap}.quiz-head span{font-size:.84rem;font-weight:700}.quiz-question{max-width:65rem;margin-top:1rem;padding:1rem;border:1px solid var(--divider-color,#9cabb2);border-radius:10px}.quiz-question small{color:var(--secondary-text-color,#405564)}.quiz-question h4{font-size:1rem;line-height:1.5}.quiz-choices{display:grid;gap:.5rem}.quiz-choices button{text-align:left}.quiz-choices button[aria-pressed="true"]{border-color:#197f83;background:#dff2f1;color:#113d49;font-weight:700}.quiz-feedback{padding:.65rem .8rem;border-left:3px solid #197f83;background:#e5f3f2;color:#173b45!important}.quiz-feedback p{margin:.3rem 0;color:#173b45}.quiz-sources a{color:#075c72;text-decoration:underline;font-weight:700}.quiz-sources a:focus-visible{outline:3px solid #d28b24;outline-offset:2px}.quiz-nav{display:flex;justify-content:space-between;gap:.5rem;margin-top:.8rem}.quiz-nav button:disabled{opacity:.5;cursor:default}
      @media(max-width:650px){.mission-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:400px){.mission-item{grid-template-columns:1fr;text-align:center}.mission-art{grid-row:auto}}
    </style><ha-card><section class="hero" aria-label="비축 관리 개요"><div class="hero-intro"><div class="hero-head"><h2>우리 집 비축 관리</h2><div class="atmosphere" aria-label="시각과 날씨"><span id="local-clock">--:--</span><span id="local-weather">날씨 연동 안 됨</span></div></div><p class="atmosphere-note" id="time-source">HA 시간대 · 시각 기준 주야 테마</p>` +
      `<p class="hero-copy">${snapshot ? Object.keys(snapshot.items).length ? "기록된 품목의 상태를 살펴보고 필요한 것부터 점검하세요." : "저장된 재고 기록이 없습니다. 품목을 열어 실제 수량과 목표를 확인하세요." : this._loadError ? "재고를 읽지 못했습니다. 새로고침으로 다시 시도하세요." : "재고를 불러오는 중입니다."}</p>` +
      (snapshot ? `<div class="household-strip"><div><strong>${people}인 가구 · 3일</strong><p>생수 ${people * 6} L · 식사 ${people * 9}인분</p></div><form id="household-form"><label>가구 인원 (명)<input id="household-size" type="number" required min="1" max="99" value="${escape(people)}" ${this._draft ? "disabled" : ""}></label><button type="submit" ${this._draft || this._saving ? "disabled" : ""}>인원 적용</button></form>${this._householdMessage ? `<p role="status">${escape(this._householdMessage)}</p>` : ""}</div>` : "") +
      `<div class="hero-links"><a class="guide-link" href="${guidePath}">상황 안내 보기</a></div>${signals}` +
      (counts ? `<p class="filter-note">부족·확인 필요·기한 임박 수치는 서로 겹칠 수 있습니다. 부족 0건이 준비 완료를 뜻하지 않습니다.</p>` : "") +
      `</div>${krMissionView(snapshot, escape, animateMission)}<section class="ready-panel" aria-label="목표량을 채우고 확인한 품목"><h3>완비한 물품 <span>${krReadyItems(snapshot).length}개</span></h3>${krReadyGrid(snapshot, escape)}</section></section>` +
      `<section class="inventory-panel" id="inventory-list"><div class="inventory-heading"><h2>${listTitle} <span>${filteredItems.length}개</span></h2><button type="button" id="refresh">새로고침</button></div>` +
      `<div class="filter-bar" aria-label="품목 분류 필터">${categoryButtons}</div><div class="filter-bar" aria-label="품목 상태 필터">${statusButtons}</div>` +
      `<p class="filter-note">인원을 바꾸면 기본 목표가 갱신됩니다. 직접 저장한 목표는 품목의 목표 설정에서 비우면 기본값을 다시 따릅니다.</p>` +
      (this._message ? `<p class="message" role="status">${escape(this._message)}</p>` : "") +
      `<div class="items">${snapshot ? (edit || (filteredItems.length ? rows : `<p class="empty">조건에 맞는 품목이 없습니다. 다른 필터를 선택하세요.</p>`) + optionalRows) : `<p class="empty">${this._loading ? "재고를 불러오는 중입니다." : "재고를 표시할 수 없습니다."}</p>`}</div></section>${this._quizView(escape)}</ha-card>`;
    this.shadowRoot.querySelector("#optional-items")?.addEventListener("toggle", (event) => {
      this._optionalOpen = event.currentTarget.open;
    });
    this.shadowRoot.querySelector("#optional-search")?.addEventListener("input", (event) => {
      this._optionalQuery = event.currentTarget.value;
      this._filterOptionalItems();
    });
    this._filterOptionalItems();
    if (restoreOptionalSearchFocus) window.requestAnimationFrame(() => {
      const details = this.shadowRoot.querySelector("#optional-items");
      const search = this.shadowRoot.querySelector("#optional-search");
      if (details?.open && search) {
        search.focus({ preventScroll: true });
        search.scrollIntoView({ block: "nearest" });
        this._focusOptionalSearch = false;
      }
    });
    this.shadowRoot.querySelector("#household-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      this._saveHousehold(event.currentTarget);
    });
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
    this.shadowRoot.querySelectorAll("[data-quiz-choice]").forEach((button) => button.addEventListener("click", () => {
      this._captureDraft();
      const question = this._quizData?.questions?.[this._quizIndex];
      if (!question?.choices?.some((choice) => choice.id === button.dataset.quizChoice)) return;
      this._quizAnswers[question.id] = button.dataset.quizChoice;
      this._saveQuizAnswers();
      this._render();
      [...this.shadowRoot.querySelectorAll("[data-quiz-choice]")].find((entry) => entry.dataset.quizChoice === button.dataset.quizChoice)?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelectorAll("[data-quiz-nav]").forEach((button) => button.addEventListener("click", () => {
      this._captureDraft();
      this._quizIndex = Math.max(0, Math.min(this._quizData.questions.length - 1, this._quizIndex + (button.dataset.quizNav === "next" ? 1 : -1)));
      this._render();
      this.shadowRoot.querySelector("[data-quiz-choice]")?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelector("[data-quiz-reset]")?.addEventListener("click", () => {
      this._captureDraft();
      this._quizAnswers = {};
      this._quizIndex = 0;
      this._saveQuizAnswers();
      this._render();
      this.shadowRoot.querySelector("[data-quiz-choice]")?.focus({ preventScroll: true });
    });
    this.shadowRoot.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", (event) => {
      const category = button.dataset.category;
      this._categoryFilter = this._categoryFilter === category ? "all" : category;
      this._render();
      if (event.detail === 0) {
        this.shadowRoot.querySelector(`[data-category="${category}"]`)?.focus({ preventScroll: true });
      } else {
        this.shadowRoot.querySelector("#refresh")?.focus({ preventScroll: true });
        this.shadowRoot.querySelector("#inventory-list")?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }));
    this.shadowRoot.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => {
      const status = button.dataset.status;
      this._statusFilter = status;
      this._optionalOpen ||= this._statusFilter === "optional";
      this._render();
      window.requestAnimationFrame(() => this.shadowRoot.querySelector(`[data-status="${status}"]`)?.focus({ preventScroll: true }));
    }));
    this.shadowRoot.querySelector("#show-all-optional")?.addEventListener("click", () => {
      this._categoryFilter = "all";
      this._statusFilter = "optional";
      this._optionalOpen = true;
      this._focusOptionalSearch = true;
      this._render();
    });
    this.shadowRoot.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () =>
      this._edit(snapshot.catalog.find((item) => item.id === button.dataset.edit))));
    this.shadowRoot.querySelector("#editor")?.addEventListener("submit", (event) => { event.preventDefault(); this._save(); });
    this.shadowRoot.querySelector("#cancel")?.addEventListener("click", () => {
      const wasOptional = draftItem?.tier === "optional";
      this._draft = null;
      this._message = "";
      this._focusOptionalSearch = wasOptional;
      this._render();
    });
    this.shadowRoot.querySelector("#delete")?.addEventListener("click", () => this._delete());
    this.shadowRoot.querySelector("#add-lot")?.addEventListener("click", () => {
      this._captureDraft(); this._addLot(draftItem); this._render();
      this.shadowRoot.querySelector(".lot-edit:last-of-type input")?.focus();
    });
    this.shadowRoot.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => {
      this._captureDraft(); this._draft.lots.splice(Number(button.dataset.remove), 1); this._render();
    }));
    this._updateAtmosphere();
  }
}

customElements.define("kr-survival-kit-inventory-card", KrSurvivalKitInventoryCard);
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
  }

  setConfig(config) {
    this._guide = typeof config.guide_data === "string" ? JSON.parse(config.guide_data) : config.guide_data;
    if (!this._guide?.scenarios?.length || !this._guide?.playbook?.length) throw new Error("상황 안내 자료가 없습니다.");
    this._render();
  }

  set hass(value) { this._hass = value; }
  getCardSize() { return 10; }

  _render() {
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
    </style><ha-card><main class="shell"><header class="hero"><div class="hero-content"><h2>상황 안내</h2><p><strong>${esc(guide.official_first)}</strong> 받은 경보를 선택하면 첫 행동을 바로 확인할 수 있습니다.</p><div class="hero-actions"><a href="/local/kr-survival-kit-a4.pdf" target="_blank" rel="noopener">A4 행동 카드 열기</a><a class="secondary" href="/local/kr-survival-kit-offline.html" target="_blank" rel="noopener">오프라인 안내 열기</a><a class="secondary" href="/kr-survival-kit/home">비축 관리로</a></div></div><div class="orb" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 8 82 21v25c0 23-13 36-32 47C31 82 18 69 18 46V21z" fill="#7bc8d9" stroke="#dafaff" stroke-width="2"/><path d="M50 18 73 27v19c0 17-8 28-23 37-15-9-23-20-23-37V27z" fill="#22506a"/><path d="M50 30v34M33 47h34" stroke="#bbf1f3" stroke-width="7" stroke-linecap="round"/></svg></div></header>
    <div class="layout"><nav class="rail" aria-label="상황 선택"><h2>상황별 첫 행동</h2>${scenarioNav}</nav><section class="action" aria-live="polite"><div class="action-top"><p class="kind">${esc(scenario.kind)}</p><h2>${esc(scenario.title)}</h2><h3>먼저 할 일</h3><p class="first-action">${esc(scenario.first_action)}</p></div><div class="action-body"><h3>이어 확인할 일</h3>${detail}${household}<div class="comms"><strong>전화·인터넷이 끊기면</strong>${esc(guide.communication_loss.first_action)} ${esc(guide.communication_loss.paper_note)}</div></div></section></div>
    <section class="timeline" aria-labelledby="timeline-title"><div class="section-head"><h2 id="timeline-title">${sheetHeading}</h2><p>${sheetSummary}</p></div><div class="sheet-tabs" role="tablist" aria-label="상세 행동 안내">${sheetNav}</div><div id="sheet-panel" role="tabpanel" aria-labelledby="tab-${esc(sheet.id)}" tabindex="0"><h3>${esc(sheet.title)}</h3><p class="sheet-intro">${esc(sheet.intro)}</p>${sheet.layout === "reference" ? `<div class="reference-grid">${rows}</div>` : `<ol class="time-list">${rows}</ol>`}</div></section>
    <details class="references"><summary>공식 참고 자료와 파일 보관 방법</summary><p>외부 출처는 인터넷 연결이 필요합니다. PDF는 열린 화면에서 인쇄·다운로드하고, HTML은 브라우저의 ‘다른 이름으로 저장’으로 미리 보관하세요.</p><ul>${uniqueSources.map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.publisher)} · ${esc(source.title)}</a></li>`).join("")}</ul></details></main></ha-card>`;
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

customElements.define("kr-survival-kit-guide-card", KrSurvivalKitGuideCard);
window.customCards.push({ type: "kr-survival-kit-guide-card", name: "KR Survival Kit 상황 안내", description: "경보별 첫 행동과 시간순 안내" });
