"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../custom_components/kr_survival_kit/www/kr-survival-kit-card.js"), "utf8");
const elements = Object.fromEntries([".hero", "#local-clock", "#local-weather", "#time-source"].map((key) => [key, { dataset: {}, textContent: "" }]));
class MockElement {
  attachShadow() { this.shadowRoot = { querySelector: (selector) => elements[selector] }; }
}
const context = { HTMLElement: MockElement, customElements: { define() {} }, window: { customCards: [], requestAnimationFrame: (callback) => callback() }, Intl, Date };
vm.runInNewContext(source + "\nglobalThis.TestCard = KrSurvivalKitInventoryCard; globalThis.testBay = krWarehouseBay; globalThis.stockFormat = krStockFormat; globalThis.stockParse = krStockParse;", context);

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const item = { id: "drinking-water", name: "생수", tier: "rotation", unit: "ml", date_kind: "expiry" };
const record = { applicable: true };
const snapshot = (status) => ({ catalog: [item], items: { [item.id]: record }, summary: { items: { [item.id]: status } } });
const base = { target: 1000, usable: 0, confirmed: true, verified_on: "2026-11-16", state: "shortage", expiring_quantity: 0, expired_quantity: 0, unknown_date_quantity: 0 };

const zero = context.testBay("water", snapshot(base), escape);
assert.match(zero, /0\/1 L/);
assert.doesNotMatch(zero, /class="cargo unknown"/);
assert.equal((zero.match(/--cargo-fill:0\.0%/g) || []).length, 12);
assert.equal((zero.match(/class="cargo-object"/g) || []).length, 12);

const unknown = context.testBay("water", snapshot({ ...base, confirmed: false, state: "needs_check" }), escape);
assert.match(unknown, /확인 필요/);
assert.equal((unknown.match(/class="cargo unknown"/g) || []).length, 12);

const partial = context.testBay("water", snapshot({ ...base, usable: 500 }), escape);
assert.equal((partial.match(/--cargo-fill:100\.0%/g) || []).length, 6);
const twoLitres = context.testBay("water", snapshot({ ...base, target: 24000, usable: 2000 }), escape);
const fourLitres = context.testBay("water", snapshot({ ...base, target: 24000, usable: 4000 }), escape);
assert.equal((twoLitres.match(/--cargo-fill:100\.0%/g) || []).length, 1);
assert.equal((fourLitres.match(/--cargo-fill:100\.0%/g) || []).length, 2);
assert.match(twoLitres, /2\/24 L/);
assert.match(fourLitres, /4\/24 L/);
const mixedDate = context.testBay("water", snapshot({ ...base, target: 24000, usable: 2000, state: "needs_check", stale: false, unknown_date_quantity: 22000 }), escape);
assert.equal((mixedDate.match(/--cargo-fill:100\.0%/g) || []).length, 1);
assert.match(mixedDate, /2\/24 L · 날짜 확인 필요/);
assert.match(mixedDate, /표시 기한 미확인 22L/);
const staleDate = context.testBay("water", snapshot({ ...base, target: 24000, usable: 2000, state: "needs_check", stale: true }), escape);
assert.equal((staleDate.match(/--cargo-fill:100\.0%/g) || []).length, 0);
const expired = context.testBay("water", snapshot({ ...base, expired_quantity: 200, unknown_date_quantity: 100 }), escape);
assert.match(expired, /rack-warning/);
assert.match(expired, /표시 기한 경과 0.2L/);
assert.match(expired, /표시 기한 미확인 0.1L/);
assert.equal(context.stockFormat(item, 1001), "1.001");
assert.equal(context.stockParse(item, "1.001"), 1001);
assert.equal(context.stockFormat(item, 1), "0.001");
assert.equal(context.stockParse(item, "0.001"), 1);
assert.equal(context.stockParse({ id: "water-container", unit: "개" }, "2"), 2);
assert.equal(context.stockParse({ id: "water-container", unit: "개" }, "2.5"), NaN);
assert.equal(context.stockParse(item, "1.0001"), NaN);
assert.equal(context.stockParse(item, "-1"), NaN);
assert.equal(context.stockParse(item, "1000000.001"), NaN);
const inactive = context.testBay("water", {
  catalog: [item], items: { [item.id]: { applicable: false } },
  summary: { items: { [item.id]: { ...base, state: "not_applicable", expired_quantity: 200 } } },
}, escape);
assert.match(inactive, /선택 안 함/);
assert.doesNotMatch(inactive, /표시 기한 경과/);

const suspicious = { ...item, id: "unknown-item", name: '<img src=x onerror="alert(1)">' };
const malicious = context.testBay("living", {
  catalog: [suspicious], items: { [suspicious.id]: record }, summary: { items: { [suspicious.id]: base } },
}, escape);
assert.doesNotMatch(malicious, /<img/);
assert.match(malicious, /&lt;img/);

const card = new context.TestCard();
card._config = { weather_entity: "weather.known" };
card._hass = { config: { time_zone: "Asia/Seoul", unit_system: { temperature: "°C" } }, states: {
  "weather.known": { state: "rainy", last_updated: new Date().toISOString(), attributes: { temperature: 12 } },
} };
card._updateAtmosphere();
assert.match(elements["#local-weather"].textContent, /비 · 12°C/);
assert.equal(elements[".hero"].dataset.weather, "rain");
assert.match(elements["#time-source"].textContent, /HA 시간대/);

card._hass.states["weather.known"].last_updated = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
card._updateAtmosphere();
assert.match(elements["#local-weather"].textContent, /날씨 갱신 지연/);
assert.equal(elements[".hero"].dataset.weather, "normal");
card._config.weather_entity = undefined;
card._updateAtmosphere();
assert.equal(elements["#local-weather"].textContent, "날씨 연동 안 됨");

const handlers = {};
const focus = [];
let scrolled = 0;
const categoryButton = { dataset: { category: "water" }, addEventListener: (_type, handler) => { handlers.category = handler; } };
const statusButton = { dataset: { status: "shortage" }, addEventListener: (_type, handler) => { handlers.status = handler; } };
card.shadowRoot = {
  activeElement: null,
  innerHTML: "",
  querySelector: (selector) => {
    if (selector === '[data-category="water"]') return { focus: () => focus.push("category") };
    if (selector === '[data-status="shortage"]') return { focus: () => focus.push("status") };
    if (selector === "#refresh") return { focus: () => focus.push("refresh"), addEventListener() {} };
    if (selector === "#inventory-list") return { scrollIntoView: () => { scrolled += 1; } };
    return elements[selector] || null;
  },
  querySelectorAll: (selector) => selector === "[data-category]" ? [categoryButton] : selector === "[data-status]" ? [statusButton] : [],
};
card._snapshot = snapshot(base);
card._render();
handlers.category({ detail: 0 });
assert.deepEqual(focus, ["category"]);
assert.equal(scrolled, 0);
handlers.status({ detail: 0 });
assert.deepEqual(focus, ["category", "status"]);
handlers.category({ detail: 1 });
assert.deepEqual(focus, ["category", "status", "refresh"]);
assert.equal(scrolled, 1);

console.log("Warehouse fill, unknown/zero, inactive and rotation warnings, escaping, weather freshness, and keyboard focus passed");
