class KrSurvivalKitInventoryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._snapshot = null;
    this._draft = null;
    this._message = "";
    this._loading = false;
    this._optionalOpen = false;
    this._optionalQuery = "";
    this._focusOptionalSearch = false;
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
      if (!this._draft) this._message = "";
    } catch (error) {
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
    if (noMatch) noMatch.hidden = found !== 0;
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
    const renderRows = (listedItems) => listedItems.map((item) => {
      const status = item.status;
      const recommendation = recommendations.get(item.id);
      const saved = snapshot.items[item.id];
      const newOptional = item.tier === "optional" && !saved;
      const lots = saved?.lots || [];
      const lotText = lots.length ? lots.map((lot) =>
        `<li>${escape(lot.lot_id)} · ${escape(lot.quantity)} ${escape(item.unit)}` +
        (item.date_kind === "expiry" ? ` · 표시 기한 ${escape(lot.expires_on || "미확인")}` : "") + "</li>"
      ).join("") : "<li>기록된 구매 단위 없음</li>";
      return `<article class="item" data-name="${escape(item.name)}"><div class="item-head"><div><h3>${escape(item.name)}</h3>` +
        `<span class="state ${escape(status.state)}">${states[status.state]}</span></div>` +
        `<button type="button" data-edit="${escape(item.id)}">${newOptional ? "설정" : "수정"}</button></div>` +
        (item.examples ? `<p class="item-note">${escape(item.examples)}</p>` : "") +
        (item.note ? `<p class="item-note">${escape(item.note)}</p>` : "") +
        (newOptional ? "" : `<p>기록 수량 ${status.usable} ${escape(item.unit)} / 목표 ${status.target === null ? "미설정" : escape(status.target) + " " + escape(item.unit)}</p>`) +
        (recommendation ? `<p class="recommendation">준비량 예시: <strong>${escape(recommendation.quantity)}</strong></p>` : "") +
        (item.id === "water-container" && recommendation ? `<p>안전수 보관 용량 예시입니다. 위의 급수 용기 개수 목표와는 단위가 다릅니다.</p>` : "") +
        (newOptional ? "" : `<p>마지막 실사 ${escape(status.verified_on || "기록 없음")}${status.confirmed ? "" : " · 현재 수량 미확인"}</p>`) +
        (newOptional ? "" : `<ul>${lotText}</ul>`) + `</article>`;
    }).join("");
    const regularItems = items.filter((item) => item.tier !== "optional");
    const optionalItems = items.filter((item) => item.tier === "optional");
    const activeOptionalCount = optionalItems.filter((item) => item.status.state !== "not_applicable").length;
    const rows = renderRows(regularItems);
    const optionalRows = optionalItems.length
      ? `<details id="optional-items" ${this._optionalOpen ? "open" : ""}><summary>선택 물품 ${optionalItems.length}개 · 사용 중 ${activeOptionalCount}개</summary>` +
        `<p>기본은 해당 없음입니다. 필요한 품목만 설정하세요.</p>` +
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
      @media(prefers-color-scheme:dark){.shortage{color:#ff9d94}.needs_check{color:#f0b76d}.sufficient{color:#78d8d2}}
      @media(max-width:400px){ha-card{padding:.9rem}.item-head{flex-wrap:wrap}}
    </style><ha-card><h2>재고 점검</h2><p class="intro">실제 수량을 확인했을 때만 실사로 기록하세요. 기본 준비량만 4인·3일 계산 예시이며 목표·재고는 자동 변경되지 않습니다.</p>` +
      `<button type="button" id="refresh">새로고침</button>` +
      (this._message ? `<p class="message" role="status">${escape(this._message)}</p>` : "") +
      (snapshot ? (edit || rows + optionalRows) : `<p>${this._loading ? "재고를 불러오는 중입니다." : "재고를 표시할 수 없습니다."}</p>`) + `</ha-card>`;
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
