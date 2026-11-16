const KR_SURVIVAL_GROUPS = {
  water: new Set(["drinking-water", "water-container", "insulated-bottle", "portable-water-filter", "water-sanitation-kit"]),
  food: new Set(["shelf-stable-meal", "canned-food", "portable-stove", "butane-canister", "lighter", "solid-fuel", "manual-can-opener", "cooler-ice-pack", "long-storage-snacks", "infant-formula", "ready-to-feed-formula", "infant-feeding-supplies"]),
  power: new Set(["flashlight", "batteries", "radio", "candles", "portable-solar-panel", "power-bank", "portable-power-station", "charging-cables", "door-alarm", "portable-radio-communication"]),
};

function krSurvivalGroup(item) {
  return Object.keys(KR_SURVIVAL_GROUPS).find((group) => KR_SURVIVAL_GROUPS[group].has(item.id)) || "living";
}

function krModuleArt(group) {
  const object = {
    water: `<ellipse cx="80" cy="110" rx="42" ry="8" fill="#071722" opacity=".45"/>
      <path d="M59 32h42l7 63q-2 11-28 11T52 95z" fill="#2a6b86"/>
      <path d="M59 32h42l-7 63q-3 10-24 11l-18-11z" fill="#79b9d1"/>
      <path d="M65 19h30v15H65z" fill="#b9d6df"/><path d="M69 13h22v8H69z" fill="#e5f4f5"/>
      <path d="M57 62h44l-3 26H55z" fill="#e4f2ef" opacity=".9"/><path d="M61 70h34M61 76h27" stroke="#3486a3" stroke-width="3" opacity=".7"/>`,
    food: `<ellipse cx="79" cy="109" rx="51" ry="8" fill="#071722" opacity=".45"/>
      <path d="M36 42h51v54q-1 10-26 10T36 96z" fill="#c47758"/><path d="M36 42h51v54q-1 10-26 10T36 96z" fill="#eebc8d" opacity=".65"/>
      <ellipse cx="61.5" cy="42" rx="25.5" ry="8" fill="#dce7e8"/><ellipse cx="61.5" cy="42" rx="18" ry="4" fill="#a6b8bd"/>
      <path d="M79 30h48v58q-2 10-24 10T79 88z" fill="#a96553"/><path d="M79 30h36v59q-3 7-20 9l-16-10z" fill="#d59c76"/>
      <ellipse cx="103" cy="30" rx="24" ry="8" fill="#edf1ec"/><ellipse cx="103" cy="30" rx="17" ry="4" fill="#b6c3c5"/>
      <path d="M82 52h43M39 65h45" stroke="#f4dfb4" stroke-width="8" opacity=".85"/>`,
    power: `<ellipse cx="80" cy="110" rx="50" ry="8" fill="#071722" opacity=".45"/>
      <path d="M35 47l68-15 25 14-68 16z" fill="#8b9fa9"/><path d="M60 62l68-16v50l-68 16z" fill="#263d52"/>
      <path d="M35 47l25 15v50L35 96z" fill="#536e7c"/><path d="M35 47l68-15v50l-68 16-25 14V62z" fill="none" stroke="#b2c9ce" stroke-width="2"/>
      <path d="M72 72l17-4-7 14 11-3-18 23 6-18-9 2z" fill="#90d8e5"/>
      <path d="M47 38l14-3 6 4-14 3zM83 30l14-3 6 4-14 3z" fill="#d7e4e7"/>`,
    living: `<ellipse cx="80" cy="111" rx="51" ry="8" fill="#071722" opacity=".45"/>
      <path d="M37 52l67-13 26 12-67 16z" fill="#9caaa6"/><path d="M63 67l67-16v46l-67 15z" fill="#425d63"/>
      <path d="M37 52l26 15v45L37 96z" fill="#6f8581"/><path d="M68 36q0-11 13-13h21q10 1 12 12" fill="none" stroke="#c2d3cb" stroke-width="7"/>
      <path d="M81 71l27-6v26l-27 6z" fill="#c7ded8"/><path d="M92 70v22M84 82l21-5" stroke="#368a95" stroke-width="5"/>
      <path d="M37 52l26 15v45l67-15" fill="none" stroke="#bdcec8" stroke-width="2"/>`,
  };
  return `<svg viewBox="0 0 160 120" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${object[group]}</svg>`;
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
  }

  connectedCallback() {
    this._timer = window.setInterval(() => { if (!this._draft) this._load(); }, 30000);
  }

  disconnectedCallback() {
    window.clearInterval(this._timer);
  }

  getCardSize() { return 8; }

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
      target: saved?.target ?? "",
      lots: (saved?.lots || []).map((lot) => ({ ...lot })),
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
    const target = this._draft.target === "" ? null : Number(this._draft.target);
    const lots = this._draft.lots.map((lot) => ({
      lot_id: lot.lot_id,
      quantity: Number(lot.quantity),
      expires_on: item.date_kind === "expiry" ? lot.expires_on : null,
    }));
    if ((target !== null && (!Number.isInteger(target) || target < 0)) ||
        lots.some((lot) => !lot.lot_id || !Number.isInteger(lot.quantity) || lot.quantity < 0)) {
      this._message = "목표량과 수량은 0 이상의 정수로 입력하고 구매 단위 이름을 적으세요.";
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
      const noteCoveredByBasis = item.note && recommendation?.basis?.includes(item.note);
      const lotText = lots.length ? lots.map((lot) =>
        `<li>${escape(lot.lot_id)} · ${escape(lot.quantity)} ${escape(item.unit)}` +
        (item.date_kind === "expiry" ? ` · 표시 기한 ${escape(lot.expires_on || "미확인")}` : "") + "</li>"
      ).join("") : "<li>기록된 구매 단위 없음</li>";
      return `<article class="item" data-name="${escape(item.name)}"><div class="item-head"><div class="item-title"><h3>${escape(item.name)}</h3>` +
        `<span class="state ${escape(status.state)}">${states[status.state]}</span>` +
        (expiring(item) ? `<span class="expiry-state">기한 임박</span>` : "") + `</div>` +
        `<button type="button" data-edit="${escape(item.id)}">${newOptional ? "설정" : "수정"}</button></div>` +
        `<p class="row-meta">${newOptional ? "가구에 필요하면 설정" : saved ? status.confirmed && status.verified_on ? `사용 가능 집계 ${status.usable} ${escape(item.unit)}` : "수량 확인 필요" : "수량 미기록"}` +
        (recommendation ? ` <span>준비량 예시 ${escape(recommendation.quantity)}</span>` : "") + `</p>` +
        `<details class="item-more"><summary>기록과 참고 보기</summary>` +
        (item.examples ? `<p>${escape(item.examples)}</p>` : "") +
        (item.note && !noteCoveredByBasis ? `<p>${escape(item.note)}</p>` : "") +
        (recommendation ? `<p>계산 근거: ${escape(recommendation.basis)}</p>` : "") +
        (item.id === "water-container" && recommendation ? `<p>안전수 보관 용량 예시와 급수 용기 개수 목표는 단위가 다릅니다.</p>` : "") +
        (saved ? `<p>기록 총수량 ${recorded} ${escape(item.unit)}${item.date_kind === "expiry" ? " (표시 기한 미확인·경과분 포함)" : ""} · 가구 목표 ${status.target === null ? "미설정" : escape(status.target) + " " + escape(item.unit)} · 마지막 실사 ${escape(status.verified_on || "기록 없음")}${status.confirmed ? "" : " · 현재 수량 미확인"}</p><ul>${lotText}</ul>` : "") +
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
      `<p>현재 기록 ${escape(draftItem.status.usable)} ${escape(draftItem.unit)} · ${states[draftItem.status.state]} · 마지막 실사 ${escape(draftItem.status.verified_on || "기록 없음")}</p>` +
      (draftRecommendation ? `<p class="recommendation">준비량 예시: <strong>${escape(draftRecommendation.quantity)}</strong><br>${escape(draftRecommendation.basis)}</p>` : "") +
      `<label><input id="applicable" type="checkbox" ${this._draft.applicable ? "checked" : ""}> 우리 가구에 해당</label>` +
      `<label for="target">가구 목표량 (${escape(draftItem.unit)})</label><input id="target" type="number" min="0" step="1" value="${escape(this._draft.target)}" placeholder="미설정">` +
      `<h4>구매 단위별 재고</h4>` + this._draft.lots.map((lot, index) =>
        `<div class="lot-edit"><label>구매 단위 이름<input class="lot-id" value="${escape(lot.lot_id)}" maxlength="80" required></label>` +
        `<label>수량 (${escape(draftItem.unit)})<input class="quantity" type="number" min="0" step="1" value="${escape(lot.quantity)}" required></label>` +
        (draftItem.date_kind === "expiry" ? `<label>표시 기한<input class="expiry" type="date" value="${escape(lot.expires_on || "")}"></label>` : "") +
        `<button type="button" data-remove="${index}">이 단위 삭제</button></div>`
      ).join("") + `<button type="button" id="add-lot">구매 단위 추가</button>` +
      `<label class="confirm"><input id="confirm" type="checkbox" ${this._draft.confirm ? "checked" : ""}> 실제 재고를 확인했고 오늘 실사했습니다</label>` +
      `<div class="actions"><button type="submit" class="primary">저장</button><button type="button" id="cancel">취소</button>` +
      `<button type="button" id="delete">기록 삭제</button></div></form>` : "";
    const moduleLabels = { water: "물", food: "식품·조리", power: "전원·통신", living: "생활·보호" };
    const modules = Object.entries(moduleLabels).map(([group, label]) =>
      `<button type="button" class="module" data-category="${group}" aria-pressed="${this._categoryFilter === group}">` +
      `<span class="module-art">${krModuleArt(group)}</span><span class="module-label">${label}</span></button>`
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
    </style><ha-card><section class="hero" aria-label="비축 관리 개요"><div><h2>우리 집 비축 관리</h2>` +
      `<p class="hero-copy">${snapshot ? Object.keys(snapshot.items).length ? "기록된 품목의 상태를 살펴보고 필요한 것부터 점검하세요." : "저장된 재고 기록이 없습니다. 품목을 열어 실제 수량과 목표를 확인하세요." : this._loadError ? "재고를 읽지 못했습니다. 새로고침으로 다시 시도하세요." : "재고를 불러오는 중입니다."}</p>` +
      `<div class="hero-links"><a class="guide-link" href="${guidePath}">상황 안내 보기</a></div>${signals}` +
      (counts ? `<p class="filter-note">부족·확인 필요·기한 임박 수치는 서로 겹칠 수 있습니다. 부족 0건이 준비 완료를 뜻하지 않습니다.</p>` : "") +
      `</div><div class="scene" aria-label="물, 식품·조리, 전원·통신, 생활·보호 분류">${modules}</div></section>` +
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
    this.shadowRoot.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => {
      this._categoryFilter = this._categoryFilter === button.dataset.category ? "all" : button.dataset.category;
      this._render();
      this.shadowRoot.querySelector("#inventory-list")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }));
    this.shadowRoot.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => {
      this._statusFilter = button.dataset.status;
      this._optionalOpen ||= this._statusFilter === "optional";
      this._render();
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
  }
}

customElements.define("kr-survival-kit-inventory-card", KrSurvivalKitInventoryCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "kr-survival-kit-inventory-card", name: "KR Survival Kit 재고", description: "가구 비상 물품 재고" });
