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

function krStockParse(item, shown, allowBlank = false) {
  const value = String(shown ?? "").trim();
  if (allowBlank && value === "") return null;
  const pattern = item.id === "drinking-water" ? /^\d+(?:\.\d{1,3})?$/ : /^\d+$/;
  if (!pattern.test(value)) return NaN;
  const stored = Math.round(Number(value) * krStockScale(item));
  return Number.isSafeInteger(stored) && stored <= 1_000_000_000 ? stored : NaN;
}

const KR_WAREHOUSE_ITEMS = {
  water: ["drinking-water", "water-container", "portable-water-filter", "water-sanitation-kit"],
  food: ["shelf-stable-meal", "canned-food", "butane-canister", "self-heating-ration"],
  power: ["flashlight", "batteries", "radio", "power-bank"],
  living: ["hygiene", "first-aid-kit", "backpack", "blanket"],
};

const KR_WAREHOUSE_NAMES = {
  "drinking-water": "생수", "water-container": "급수 용기", "portable-water-filter": "정수 필터",
  "water-sanitation-kit": "위생 도구", "shelf-stable-meal": "간편식", "canned-food": "통조림",
  "butane-canister": "부탄가스", "self-heating-ration": "발열식 비상식량",
  flashlight: "손전등", batteries: "건전지", radio: "라디오", "power-bank": "보조배터리",
  hygiene: "위생용품", "first-aid-kit": "구급품", backpack: "대피 가방", blanket: "담요",
};

function krWarehouseObject(item, group) {
  const form = {
    bottle: `<path d="M17 6h14v5l3 4v26c0 3-3 5-6 5H17c-3 0-5-2-5-5V15l5-4z" fill="#78c8db" stroke="#d6f6f9" stroke-width="1.3"/><path d="M28 12l6 3v26l-6 4z" fill="#367d9b"/><path d="M15 25h17v11H15z" fill="#e4f4ef"/><path d="M18 29h11" stroke="#348cad" stroke-width="2"/><path d="M17 4h14v6H17z" fill="#cee9ed"/>`,
    jerrycan: `<path d="M9 13h29l5 5v25H9z" fill="#78bfc4" stroke="#d5f1ed" stroke-width="1.3"/><path d="M38 13l5 5v25l-5 3z" fill="#306879"/><path d="M14 12V7h16v5M19 7V4h6v3" fill="none" stroke="#d3efec" stroke-width="3"/><path d="M19 25h14M26 18v16" stroke="#d6f3ef" stroke-width="3"/>`,
    filter: `<path d="M15 8h19l-4 11v20l-4 7h-7l-4-7V19z" fill="#72b8bf" stroke="#d3edeb" stroke-width="1.3"/><path d="M28 19l6-11-4 11v20l-4 7V24z" fill="#2e6676"/><path d="M13 8h23M18 31h11" stroke="#e0f6f1" stroke-width="3"/>`,
    can: `<path d="M10 13h27v28q-1 5-13 5T10 41z" fill="#e3ae83" stroke="#f8dfbb" stroke-width="1.3"/><path d="M37 13h5v28q-1 3-5 4z" fill="#a86450"/><ellipse cx="24" cy="13" rx="14" ry="5" fill="#e1edf0" stroke="#fff" stroke-width="1.2"/><ellipse cx="24" cy="13" rx="8" ry="2.5" fill="#8daeb9"/><path d="M12 27h25" stroke="#fff0cf" stroke-width="7"/>`,
    meal: `<path d="M11 10h26l5 34H9z" fill="#d3ad83" stroke="#f4dcc0" stroke-width="1.3"/><path d="M37 10l5 34-8 3 3-37z" fill="#936a55"/><path d="M12 10h25M15 20h18M16 27h15" stroke="#fff0d2" stroke-width="2"/><path d="M14 39h23" stroke="#b87d5a" stroke-width="3"/>`,
    gas: `<path d="M13 12h25v29q-1 6-12 6T13 41z" fill="#d7a77d" stroke="#f4d1a8" stroke-width="1.3"/><path d="M38 12h5v29q0 4-5 5z" fill="#986b55"/><ellipse cx="25" cy="12" rx="12" ry="4" fill="#d9e5e6"/><path d="M20 7h11v5H20z" fill="#a8c1c5"/><path d="M24 4h5v4h-5z" fill="#e7f3f1"/><path d="M14 24h24" stroke="#bb534b" stroke-width="7"/>`,
    battery: `<path d="M10 12h28v31H10z" fill="#8bbec5" stroke="#d7eff0" stroke-width="1.3"/><path d="M38 12l5 4v27l-5 3z" fill="#315e73"/><path d="M20 8h9v4h-9z" fill="#e8f4f3"/><path d="M20 24h9M24 20v9" stroke="#eaf8f4" stroke-width="3"/>`,
    radio: `<path d="M8 19h31l5 5v19H8z" fill="#7198aa" stroke="#d6ecf0" stroke-width="1.3"/><path d="M39 19l5 5v19l-5 3z" fill="#2c5368"/><path d="M14 19L10 3" stroke="#d5e8ec" stroke-width="2"/><circle cx="20" cy="32" r="7" fill="#264b5f" stroke="#c7e5e8"/><path d="M31 29h8M31 34h8" stroke="#d4eff0" stroke-width="2"/>`,
    flashlight: `<path d="M12 18h23l5 7-5 7H12z" fill="#8db6bd" stroke="#e4f3f0" stroke-width="1.3"/><path d="M35 18l5 7-5 7z" fill="#3b6d7b"/><path d="M10 16h6v18h-6z" fill="#b8d2d4"/><path d="M23 23h7" stroke="#d9edef" stroke-width="3"/>`,
    medical: `<path d="M9 17h29l5 5v23H9z" fill="#8dbeb0" stroke="#e4f4e9" stroke-width="1.3"/><path d="M38 17l5 5v23l-5 3z" fill="#3d716e"/><path d="M17 17v-7h18v7" fill="none" stroke="#dcefe5" stroke-width="3"/><path d="M23 27h11M28 22v11" stroke="#f3fbf8" stroke-width="4"/>`,
    pack: `<path d="M15 11h23l5 31-7 5H11z" fill="#a5b5a1" stroke="#e3ebdd" stroke-width="1.3"/><path d="M38 11l5 31-7 5V16z" fill="#5d746b"/><path d="M17 11V7h17v4M16 27h22" fill="none" stroke="#dce8dd" stroke-width="3"/>`,
    crate: `<path d="M8 16h30v27H8z" fill="#8ea5a4" stroke="#e5eeea" stroke-width="1.3"/><path d="M38 16l6 5v22l-6 4z" fill="#446b72"/><path d="M8 16l7-5h30l-7 5z" fill="#c6d7d0"/><path d="M15 23h18M15 30h18" stroke="#d8ebe5" stroke-width="2"/>`,
  };
  const kind = item.id === "drinking-water" ? "bottle" : item.id === "water-container" ? "jerrycan" : item.id === "portable-water-filter" ? "filter" :
    item.id === "canned-food" ? "can" : item.id === "butane-canister" ? "gas" : item.id === "self-heating-ration" || item.id === "shelf-stable-meal" ? "meal" :
    item.id === "flashlight" ? "flashlight" : item.id === "radio" ? "radio" : ["batteries", "power-bank", "portable-power-station"].includes(item.id) ? "battery" :
    item.id === "first-aid-kit" ? "medical" : item.id === "backpack" ? "pack" : group === "water" ? "filter" : group === "food" ? "meal" : group === "power" ? "battery" : "crate";
  return `<svg class="cargo-object" viewBox="0 0 52 52" aria-hidden="true" focusable="false"><g class="cargo-ghost">${form[kind]}</g><g class="cargo-stock">${form[kind]}</g></svg>`;
}

function krWarehouseBay(group, snapshot, escape) {
  const catalog = snapshot?.catalog || [];
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const preferred = KR_WAREHOUSE_ITEMS[group].map((id) => byId.get(id)).filter(Boolean);
  const recorded = catalog.filter((item) => krSurvivalGroup(item) === group && snapshot.items[item.id]);
  const chosen = [...new Map([...recorded, ...preferred].map((item) => [item.id, item])).values()].slice(0, 4);
  if (!snapshot) return `<span class="rack" aria-hidden="true"><span class="rack-empty">재고를 불러오는 중</span></span>`;
  const rows = chosen.map((item) => {
    const status = snapshot.summary.items[item.id];
    const record = snapshot.items[item.id];
    const target = status.target;
    const active = record?.applicable ?? !["household", "optional"].includes(item.tier);
    const inspectionCurrent = status.stale === false || (status.stale === undefined && status.state !== "needs_check");
    const known = Boolean(active && status.confirmed && status.verified_on && inspectionCurrent && target > 0);
    const ratio = known ? Math.min(1, Math.max(0, status.usable / target)) : 0;
    const dateLabel = item.date_label || "표시 기한";
    const warnings = (active ? [
      status.expired_quantity > 0 ? `${dateLabel} 경과 ${krStockFormat(item, status.expired_quantity)}${krStockUnit(item)}` : "",
      status.expiring_quantity > 0 ? `${dateLabel} 임박 ${krStockFormat(item, status.expiring_quantity)}${krStockUnit(item)}` : "",
      status.unknown_date_quantity > 0 ? `${dateLabel} 미확인 ${krStockFormat(item, status.unknown_date_quantity)}${krStockUnit(item)}` : "",
    ] : []).filter(Boolean).join(" · ");
    const label = !active ? "선택 안 함" : target === null ? "목표 미설정" : target === 0 ? "목표 0" : !known ? "확인 필요" : `${krStockFormat(item, status.usable)}/${krStockFormat(item, target)} ${krStockUnit(item)}${status.state === "needs_check" ? " · 날짜 확인 필요" : ""}`;
    const slotCount = item.id === "drinking-water" ? 12 : 4;
    const slots = Array.from({ length: slotCount }, (_, index) => {
      const fill = known ? Math.max(0, Math.min(100, ratio * slotCount * 100 - index * 100)) : 0;
      return `<span class="cargo ${!active ? "inactive" : known ? "" : "unknown"}" style="--cargo-fill:${fill.toFixed(1)}%" aria-hidden="true">${krWarehouseObject(item, group)}</span>`;
    }).join("");
    return `<span class="rack-row ${item.id === "drinking-water" ? "water-row" : ""} ${warnings ? "rack-warning" : ""}" title="${escape(item.name)} · ${escape(label)}${warnings ? ` · ${escape(warnings)}` : ""}">` +
      `<span class="rack-name">${escape(KR_WAREHOUSE_NAMES[item.id] || item.name)}</span>` +
      `<span class="rack-slots" aria-hidden="true">${slots}</span>` +
      `<span class="rack-meta">${escape(warnings || label)}</span></span>`;
  }).join("");
  const recordedCount = catalog.filter((item) => krSurvivalGroup(item) === group && snapshot.items[item.id]).length;
  return `<span class="rack">${rows || `<span class="rack-empty">대표 품목 없음</span>`}</span><span class="rack-caption">기록한 품목 ${recordedCount}개 · 선반은 최대 4개 표시</span>`;
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

  _edit(item) {
    const saved = this._snapshot.items[item.id];
    if (item.tier === "optional") this._optionalOpen = true;
    this._draft = {
      id: item.id,
      applicable: saved?.applicable ?? !["household", "optional"].includes(item.tier),
      target: saved?.target === null || saved?.target === undefined ? "" : krStockFormat(item, saved.target),
      lots: (saved?.lots || []).map((lot) => ({ ...lot, quantity: krStockFormat(item, lot.quantity) })),
      confirm: false,
    };
    this._message = "수량을 직접 확인했을 때만 실사 확인을 선택하세요.";
    this._render();
    this.shadowRoot.querySelector("#target")?.focus();
  }

  _captureDraft() {
    if (!this._draft) return;
    const root = this.shadowRoot;
    this._draft.applicable = root.querySelector("#applicable").checked;
    this._draft.target = root.querySelector("#target").value;
    this._draft.confirm = root.querySelector("#confirm").checked;
    this._draft.lots = [...root.querySelectorAll(".lot-edit")].map((row) => ({
      lot_id: row.querySelector(".lot-id").value.trim(),
      quantity: row.querySelector(".quantity").value,
      expires_on: row.querySelector(".expiry")?.value || null,
    }));
  }

  async _save() {
    if (this._saving) return;
    this._saving = true;
    this._captureDraft();
    const item = this._snapshot.catalog.find((candidate) => candidate.id === this._draft.id);
    const target = krStockParse(item, this._draft.target, true);
    const lots = this._draft.lots.map((lot) => ({
      lot_id: lot.lot_id,
      quantity: krStockParse(item, lot.quantity),
      expires_on: item.date_kind === "expiry" ? lot.expires_on : null,
    }));
    if ((target !== null && (!Number.isInteger(target) || target < 0)) ||
        lots.some((lot) => !lot.lot_id || !Number.isInteger(lot.quantity) || lot.quantity < 0)) {
      this._message = item.id === "drinking-water"
        ? "생수는 0~1,000,000 L, 소수 셋째 자리까지 입력하고 구매 단위 이름을 적으세요."
        : "목표량과 수량은 0 이상의 정수로 입력하고 구매 단위 이름을 적으세요.";
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
      const dateLabel = item.date_label || "표시 기한";
      const noteCoveredByBasis = item.note && recommendation?.basis?.includes(item.note);
      const lotText = lots.length ? lots.map((lot) =>
        `<li>${escape(lot.lot_id)} · ${escape(krStockText(item, lot.quantity))}` +
        (item.date_kind === "expiry" ? ` · ${escape(dateLabel)} ${escape(lot.expires_on || "미확인")}` : "") + "</li>"
      ).join("") : "<li>기록된 구매 단위 없음</li>";
      return `<article class="item" data-name="${escape(item.name)}"><div class="item-head"><div class="item-title"><h3>${escape(item.name)}</h3>` +
        `<span class="state ${escape(status.state)}">${states[status.state]}</span>` +
        (expiring(item) ? `<span class="expiry-state">기한 임박</span>` : "") + `</div>` +
        `<button type="button" data-edit="${escape(item.id)}">${newOptional ? "설정" : "수정"}</button></div>` +
        `<p class="row-meta">${newOptional ? "가구에 필요하면 설정" : saved ? status.confirmed && status.verified_on ? `사용 가능 집계 ${escape(krStockText(item, status.usable))}` : "수량 확인 필요" : "수량 미기록"}` +
        (recommendation ? ` <span>준비량 예시 ${escape(recommendation.quantity)}</span>` : "") + `</p>` +
        (saved && item.date_kind === "expiry" ? `<p class="rotation-meta">${status.expired_quantity ? `${escape(dateLabel)} 경과 ${escape(krStockText(item, status.expired_quantity))} · ` : ""}${status.unknown_date_quantity ? `${escape(dateLabel)} 미확인 ${escape(krStockText(item, status.unknown_date_quantity))} · ` : ""}다음 ${escape(dateLabel)} ${escape(status.next_expiry_on || "확인 필요")}</p>` : "") +
        `<details class="item-more"><summary>기록과 참고 보기</summary>` +
        (item.examples ? `<p>${escape(item.examples)}</p>` : "") +
        (item.note && !noteCoveredByBasis ? `<p>${escape(item.note)}</p>` : "") +
        (recommendation ? `<p>계산 근거: ${escape(recommendation.basis)}</p>` : "") +
        (item.id === "water-container" && recommendation ? `<p>안전수 보관 용량 예시와 급수 용기 개수 목표는 단위가 다릅니다.</p>` : "") +
        (saved ? `<p>기록 총수량 ${escape(krStockText(item, recorded))}${item.date_kind === "expiry" ? " (표시 기한 미확인·경과분 포함)" : ""} · 가구 목표 ${status.target === null ? "미설정" : escape(krStockText(item, status.target))} · 마지막 실사 ${escape(status.verified_on || "기록 없음")}${status.confirmed ? "" : " · 현재 수량 미확인"}</p><ul>${lotText}</ul>` : "") +
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
      (draftRecommendation ? `<p class="recommendation">준비량 예시: <strong>${escape(draftRecommendation.quantity)}</strong><br>${escape(draftRecommendation.basis)}</p>` : "") +
      `<label><input id="applicable" type="checkbox" ${this._draft.applicable ? "checked" : ""}> 우리 가구에 해당</label>` +
      `<label for="target">가구 목표량 (${escape(krStockUnit(draftItem))})</label><input id="target" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(this._draft.target)}" placeholder="미설정">` +
      `<h4>구매 단위별 재고</h4>` + this._draft.lots.map((lot, index) =>
        `<div class="lot-edit"><label>구매 단위 이름<input class="lot-id" value="${escape(lot.lot_id)}" maxlength="80" required></label>` +
        `<label>수량 (${escape(krStockUnit(draftItem))})<input class="quantity" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(lot.quantity)}" required></label>` +
        (draftItem.date_kind === "expiry" ? `<label>${escape(draftItem.date_label || "표시 기한")}<input class="expiry" type="date" value="${escape(lot.expires_on || "")}"></label>` : "") +
        `<button type="button" data-remove="${index}">이 단위 삭제</button></div>`
      ).join("") + `<button type="button" id="add-lot">구매 단위 추가</button>` +
      `<label class="confirm"><input id="confirm" type="checkbox" ${this._draft.confirm ? "checked" : ""}> 실제 재고를 확인했고 오늘 실사했습니다</label>` +
      `<div class="actions"><button type="submit" class="primary">저장</button><button type="button" id="cancel">취소</button>` +
      `<button type="button" id="delete">기록 삭제</button></div></form>` : "";
    const moduleLabels = { water: "물", food: "식품·조리", power: "전원·통신", living: "생활·보호" };
    const warehouseSignature = snapshot ? JSON.stringify(snapshot.catalog.map((item) => {
      const status = snapshot.summary.items[item.id];
      return [item.id, status?.usable, status?.target, status?.state, status?.confirmed, status?.verified_on, status?.expiring_quantity];
    })) : "";
    const animateWarehouse = Boolean(snapshot && warehouseSignature !== this._warehouseSignature);
    this._warehouseSignature = warehouseSignature;
    const modules = Object.entries(moduleLabels).map(([group, label]) =>
      `<button type="button" class="module warehouse-bay ${animateWarehouse ? "bay-updated" : ""}" data-category="${group}" aria-pressed="${this._categoryFilter === group}">` +
      `<span class="bay-header"><span class="module-label">${label}</span><span class="bay-arrow" aria-hidden="true">↗</span></span>` +
      `${krWarehouseBay(group, snapshot, escape)}</button>`
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
      .scene{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.7rem;align-items:stretch;perspective:900px}
      .module{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-width:0;min-height:174px;padding:.35rem .25rem .8rem;border:1px solid #678a98;border-radius:12px;background:linear-gradient(145deg,#365364 0%,#1a2d3b 66%,#112431 100%);color:#f0fafb;box-shadow:inset 1px 1px 0 rgba(219,241,246,.22),0 11px 0 #0d1a24,0 18px 18px rgba(3,12,18,.38);transform:rotateX(6deg);transition:transform .18s ease,box-shadow .18s ease}
      .module::before{content:"";position:absolute;left:12%;right:12%;top:63%;height:18%;background:linear-gradient(180deg,#32556a,#162d3d);border:1px solid #5c8395;transform:skewX(-18deg);box-shadow:0 9px 12px rgba(0,0,0,.28)}
      .module:hover{transform:translateY(-3px) rotateX(6deg)}.module[aria-pressed="true"]{border-color:#a5e7f1;box-shadow:inset 0 0 0 2px #83d7e8,0 11px 0 #0d1a24,0 19px 22px rgba(3,12,18,.4)}
      .module-art{position:relative;z-index:1;display:block;width:100%;max-width:145px}.module-art svg{display:block;width:100%;height:auto;filter:drop-shadow(2px 5px 3px rgba(0,0,0,.22))}.module-label{position:relative;z-index:1;font-size:.92rem;font-weight:750;line-height:1.2;text-align:center}
      .inventory-panel{padding:clamp(1rem,2.4vw,2rem);background:var(--card-background-color,#fff);color:var(--primary-text-color,#173048)}
      .inventory-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}.inventory-heading h2{margin:0;font-size:1.32rem;color:var(--primary-text-color,#173048)}
      .inventory-heading p{margin:0}.filter-bar{display:flex;gap:.45rem;flex-wrap:wrap;margin:1rem 0}.filter-bar button{border-color:var(--divider-color,#9cabb2);border-radius:999px;padding:.45rem .85rem}.filter-bar button[aria-pressed="true"]{background:#176d86;border-color:#176d86;color:#fff}
      .filter-note{font-size:.9rem}.items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;align-items:start}.items>.item,.items>#optional-items{border:1px solid var(--divider-color,#d7e1e7);border-radius:10px;padding:.8rem 1rem;margin:0;min-width:0}
      .item{padding:.8rem 1rem;border-top:0}.item h3{margin:0;font-size:1rem;line-height:1.35}.item-head{align-items:center}.item-title{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap}.item-head button{flex:none}
      .state,.expiry-state{font-size:.77rem;border-radius:999px;padding:.13rem .48rem;border:1px solid currentColor}.expiry-state{color:#a9670e}.row-meta{font-size:.9rem;margin:.4rem 0}.row-meta span{display:block;color:var(--secondary-text-color,#405564)}
      .item-more{margin-top:.45rem}.item-more summary{font-weight:600;font-size:.88rem}.item-more p{margin:.6rem 0}.items>#optional-items{grid-column:1/-1}.items>#optional-items>.item{border-top:1px solid var(--divider-color,#d7e1e7)}
      .empty{grid-column:1/-1;padding:1.25rem;border:1px dashed var(--divider-color,#8da3ad);border-radius:10px}.items>form{grid-column:1/-1;width:100%;box-sizing:border-box}.inventory-panel form{max-width:48rem;margin:0 auto}
      button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #e0a950;outline-offset:2px}
      @media(max-width:900px){.hero{grid-template-columns:1fr}.scene{max-width:760px}}
      @media(max-width:620px){.scene{grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem}.module{min-height:148px}.items{grid-template-columns:1fr}.hero{padding:1.15rem}.inventory-panel{padding:1rem}}
      @media(prefers-reduced-motion:reduce){.module{transition:none}.module:hover{transform:rotateX(6deg)}}
      @media(prefers-color-scheme:dark){.shortage{color:#ff9d94}.needs_check{color:#f0b76d}.sufficient{color:#78d8d2}}
      @media(max-width:400px){.item-head{flex-wrap:wrap}.module{min-height:132px}.scene{gap:.65rem}}
      .hero{position:relative;display:block;background:linear-gradient(135deg,#1b3a4c,#102432 65%,#0d1c2a);transition:background .5s ease}
      .hero[data-daypart="day"]{background:linear-gradient(135deg,#27566a,#173b4e 55%,#132b3a)}
      .hero[data-daypart="night"]{background:linear-gradient(135deg,#172e42,#0b1c2d 62%,#0b1724)}
      .hero::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0}
      .hero[data-weather="rain"]::after{opacity:.18;background:repeating-linear-gradient(108deg,transparent 0 26px,#9fdfe8 27px 28px,transparent 29px 49px);animation:krSkyDrift 18s linear infinite}
      .hero[data-weather="snow"]::after{opacity:.17;background:radial-gradient(circle at 15% 22%,#fff 0 2px,transparent 3px),radial-gradient(circle at 78% 55%,#fff 0 2px,transparent 3px),radial-gradient(circle at 46% 81%,#fff 0 2px,transparent 3px);background-size:110px 100px;animation:krSkyDrift 28s linear infinite}
      .hero>*{position:relative;z-index:1}.hero-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
      .atmosphere{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.atmosphere span{display:inline-flex;min-height:35px;align-items:center;padding:5px 10px;border:1px solid #79b3c082;border-radius:8px;background:#07192768;color:#d9f1f4;font-size:.84rem;font-variant-numeric:tabular-nums}
      .atmosphere-note{font-size:.76rem!important;color:#accbd5!important;margin-top:0!important}.scene{margin-top:25px;max-width:none;gap:13px;perspective:1000px}
      .warehouse-bay{display:block;text-align:left;min-height:0;padding:12px 12px 10px;border-color:#6c9dad;border-radius:11px;background:linear-gradient(130deg,#34586c 0,#18394d 48%,#112b3a 100%);box-shadow:inset 1px 1px 0 #ffffff45,4px 6px 0 #0b1b26,8px 14px 15px #020e17a6;transform:rotateX(3deg);transition:transform .2s ease,border-color .2s ease}
      .warehouse-bay::before{content:none}.warehouse-bay:hover{transform:translateY(-3px) rotateX(3deg)}.warehouse-bay[aria-pressed="true"]{border-color:#a7e9f1;box-shadow:inset 0 0 0 2px #89dce8,4px 6px 0 #0b1b26,8px 14px 15px #020e17a6}
      .bay-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #81afbf77;padding:0 2px 10px;margin-bottom:3px}.warehouse-bay .module-label{text-align:left;font-size:1rem;color:#f3fafd}.bay-arrow{font-size:1.2rem;color:#abdee6}
      .rack{display:grid;gap:2px;min-height:188px}.rack-row{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(74px,1fr);grid-template-rows:auto auto;gap:1px 6px;align-items:center;min-width:0;padding:7px 3px 8px;border-bottom:4px solid #436a7d;background:linear-gradient(180deg,#152e3e33,#07182766);box-shadow:0 4px 0 #071825}.rack-row:last-child{margin-bottom:4px}
      .rack-name{grid-column:1;font-size:.76rem;font-weight:750;line-height:1.2;color:#edf9fa;overflow-wrap:anywhere}.rack-meta{grid-column:1;font-size:.66rem;color:#bdd3db;line-height:1.25;overflow-wrap:anywhere}.rack-warning .rack-meta{color:#ffd187;font-weight:800}.rack-warning{border-left:3px solid #ebad60;padding-left:5px}
      .rack-slots{display:flex;grid-column:2;grid-row:1/3;gap:3px;align-items:end;justify-content:flex-end;min-width:0}.cargo{position:relative;display:block;flex:1;max-width:24px;height:22px;border:1px solid #66899a;border-radius:2px;background:linear-gradient(135deg,#1c3444,#112536);transform:skewY(-6deg);box-shadow:2px 3px 0 #071621}.cargo::after{content:"";position:absolute;left:0;bottom:0;top:0;width:var(--cargo-fill);background:linear-gradient(130deg,#b6e6e8,#4eb3c8 60%,#32849c);box-shadow:inset 1px 1px #eefbfc99}.cargo.unknown{border-style:dashed;background:repeating-linear-gradient(135deg,#243d4e 0 4px,#1b3141 4px 8px)}.cargo.inactive{opacity:.35}.rack-caption{display:block;margin-top:8px;color:#c6dce3;font-size:.69rem;text-align:right}.rack-empty{display:grid;place-items:center;color:#bfd5dd;font-size:.78rem}
      .cargo::after{border-radius:inherit}.warehouse-bay[data-category="water"] .cargo{max-width:17px;height:26px;border-radius:5px 5px 3px 3px}.warehouse-bay[data-category="water"] .cargo::before{content:"";position:absolute;top:-5px;left:28%;width:44%;height:4px;border:1px solid #88aab6;border-radius:2px 2px 0 0;background:#9ec4cf}.warehouse-bay[data-category="food"] .cargo{height:20px;border-radius:4px 4px 6px 6px}.warehouse-bay[data-category="food"] .cargo::before{content:"";position:absolute;top:-3px;left:-1px;right:-1px;height:5px;border:1px solid #819eaa;border-radius:50%;background:#477188}.warehouse-bay[data-category="power"] .cargo{max-width:19px;height:23px;border-radius:3px}.warehouse-bay[data-category="power"] .cargo::before{content:"";position:absolute;top:-4px;left:35%;width:30%;height:3px;background:#9cc9d1}.warehouse-bay[data-category="living"] .cargo::before{content:"+";position:absolute;z-index:2;left:50%;top:50%;transform:translate(-50%,-50%);font-size:13px;font-weight:900;color:#d8f2f4a8}
      .warehouse-bay .rack-slots .cargo{flex:1;max-width:35px;height:34px;border:0;border-radius:0;background:none;transform:none;box-shadow:none}.rack-slots .cargo::before,.rack-slots .cargo::after{content:none!important}.rack-slots .cargo-object{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(2px 3px 2px #06131cb3)}.cargo-ghost{opacity:.12;filter:grayscale(1)}.cargo-stock{clip-path:inset(0 calc(100% - var(--cargo-fill)) 0 0);filter:drop-shadow(0 0 2px #9de7f0b3)}.cargo.unknown .cargo-ghost{opacity:.42}.cargo.inactive .cargo-ghost{opacity:.18}.cargo.inactive .cargo-stock{opacity:0}
      .water-row .rack-slots{grid-column:1/-1;grid-row:3;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));justify-content:stretch;width:100%;gap:2px;margin-top:5px}.warehouse-bay .water-row .cargo{min-width:0;max-width:none;height:27px}.water-row .rack-name{grid-column:1}.water-row .rack-meta{grid-column:2;grid-row:1;text-align:right;font-size:.72rem}.water-row{grid-template-columns:minmax(0,1fr) minmax(0,1.5fr)}.rack-row{background:linear-gradient(160deg,#2a45554d,#07182766 58%);border-bottom:5px solid #49778b;box-shadow:0 4px 0 #071825,0 8px 8px #020d17a6}.rack-row::after{content:"";position:absolute;left:0;right:0;bottom:-5px;height:4px;background:linear-gradient(90deg,#a3cad599,#385f76,#1b394c)}
      .rotation-meta{font-size:.83rem;color:#8b5c0b;font-weight:650}
      .scene-hint{display:none;color:#bbd3db!important;font-size:.78rem!important;margin:12px 2px 0!important}@keyframes krStockIn{from{transform:translateY(-15px) rotate(-5deg);opacity:.2}to{transform:translateY(0) rotate(0);opacity:1}}@keyframes krSkyDrift{from{background-position:0 0}to{background-position:100px 180px}}.bay-updated .cargo-stock{animation:krStockIn .55s cubic-bezier(.17,.84,.31,1) both}
      @media(max-width:900px){.scene{max-width:none}}@media(max-width:620px){.scene{display:flex;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory;padding:2px 8px 18px 2px}.warehouse-bay{flex:0 0 min(83%,290px);min-width:230px;scroll-snap-align:start;min-height:0}.water-row .rack-meta{grid-column:1/-1;grid-row:2;text-align:left}.scene-hint{display:block}.hero{padding:1.15rem}}
      @media(max-width:290px){.warehouse-bay{flex-basis:94%}.rack-row{grid-template-columns:1fr}.rack-slots{grid-column:1;grid-row:auto;justify-content:flex-start;margin:5px 0}.rack-caption{text-align:left}}
      @media(prefers-reduced-motion:reduce){.hero,.warehouse-bay{transition:none}.warehouse-bay:hover{transform:rotateX(3deg)}.hero[data-weather]::after,.bay-updated .cargo-stock{animation:none}}
    </style><ha-card><section class="hero" aria-label="비축 관리 개요"><div class="hero-intro"><div class="hero-head"><h2>우리 집 비축 관리</h2><div class="atmosphere" aria-label="시각과 날씨"><span id="local-clock">--:--</span><span id="local-weather">날씨 연동 안 됨</span></div></div><p class="atmosphere-note" id="time-source">HA 시간대 · 시각 기준 주야 테마</p>` +
      `<p class="hero-copy">${snapshot ? Object.keys(snapshot.items).length ? "기록된 품목의 상태를 살펴보고 필요한 것부터 점검하세요." : "저장된 재고 기록이 없습니다. 품목을 열어 실제 수량과 목표를 확인하세요." : this._loadError ? "재고를 읽지 못했습니다. 새로고침으로 다시 시도하세요." : "재고를 불러오는 중입니다."}</p>` +
      `<div class="hero-links"><a class="guide-link" href="${guidePath}">상황 안내 보기</a></div>${signals}` +
      (counts ? `<p class="filter-note">부족·확인 필요·기한 임박 수치는 서로 겹칠 수 있습니다. 부족 0건이 준비 완료를 뜻하지 않습니다.</p>` : "") +
      `</div><div class="scene" aria-label="물, 식품·조리, 전원·통신, 생활·보호 선반. 좁은 화면에서는 옆으로 넘겨 선택">${modules}</div><p class="scene-hint">선반을 옆으로 넘겨 분류를 선택하세요.</p></section>` +
      `<section class="inventory-panel" id="inventory-list"><div class="inventory-heading"><h2>${listTitle} <span>${filteredItems.length}개</span></h2><button type="button" id="refresh">새로고침</button></div>` +
      `<div class="filter-bar" aria-label="품목 상태 필터">${statusButtons}</div>` +
      `<p class="filter-note">실제 수량을 확인했을 때만 실사로 기록하세요. 4인·3일 기본 준비량은 계산 예시이며 목표·재고에 자동 적용되지 않습니다.</p>` +
      (this._message ? `<p class="message" role="status">${escape(this._message)}</p>` : "") +
      `<div class="items">${snapshot ? (edit || (filteredItems.length ? rows : `<p class="empty">조건에 맞는 품목이 없습니다. 다른 필터를 선택하세요.</p>`) + optionalRows) : `<p class="empty">${this._loading ? "재고를 불러오는 중입니다." : "재고를 표시할 수 없습니다."}</p>`}</div></section></ha-card>`;
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
    this.shadowRoot.querySelector("#refresh")?.addEventListener("click", () => this._load());
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
      this._captureDraft(); this._draft.lots.push({ lot_id: "", quantity: 0, expires_on: null }); this._render();
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
