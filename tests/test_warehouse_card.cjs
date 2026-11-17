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
vm.runInNewContext(source + "\nglobalThis.TestCard = KrSurvivalKitInventoryCard; globalThis.testGrid = krReadyGrid; globalThis.readyItems = krReadyItems; globalThis.pictograms = KR_READY_PICTOGRAMS; globalThis.stockFormat = krStockFormat; globalThis.stockParse = krStockParse;", context);

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const item = { id: "drinking-water", name: "생수", tier: "rotation", unit: "ml", date_kind: "expiry" };
const record = { applicable: true };
const snapshot = (status) => ({ catalog: [item], items: { [item.id]: record }, summary: { items: { [item.id]: status } } });
const base = { target: 24000, usable: 24000, confirmed: true, verified_on: "2026-11-16", stale: false, state: "sufficient", expiring_quantity: 0, expired_quantity: 0, unknown_date_quantity: 0 };
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "../custom_components/kr_survival_kit/content/catalog.ko.json"), "utf8")).items;
assert.equal(catalog.filter((entry) => !context.pictograms[entry.id]).length, 0, "every item has its own pictogram");
assert.equal(new Set(Object.values(context.pictograms)).size, catalog.length, "pictograms are unique");

const complete = context.testGrid(snapshot(base), escape);
assert.equal((complete.match(/class="ready-item"/g) || []).length, 1);
assert.equal((complete.match(/class="ready-art"/g) || []).length, 1);
assert.match(complete, /24 L \/ 24 L/);
for (const changed of [
  { usable: 0, state: "shortage" }, { usable: 2000, state: "shortage" },
  { confirmed: false, state: "needs_check" }, { stale: true, state: "needs_check" },
  { expired_quantity: 1000 }, { expiring_quantity: 1000 }, { unknown_date_quantity: 1000 },
  { target: 0 }, { state: "needs_check" },
]) assert.equal(context.readyItems(snapshot({ ...base, ...changed })).length, 0, JSON.stringify(changed));
assert.equal(context.readyItems({ ...snapshot(base), items: { [item.id]: { applicable: false } } }).length, 0);
assert.match(context.testGrid(snapshot({ ...base, usable: 0, state: "shortage" }), escape), /아래에서 목표량·기한·실사를 기록하세요/);
assert.equal(context.stockFormat(item, 1001), "1.001");
assert.equal(context.stockParse(item, "1.001"), 1001);
assert.equal(context.stockFormat(item, 1), "0.001");
assert.equal(context.stockParse(item, "0.001"), 1);
assert.equal(context.stockParse({ id: "water-container", unit: "개" }, "2"), 2);
assert.equal(context.stockParse({ id: "water-container", unit: "개" }, "2.5"), NaN);
assert.equal(context.stockParse(item, "1.0001"), NaN);
assert.equal(context.stockParse(item, "-1"), NaN);
assert.equal(context.stockParse(item, "1000000.001"), NaN);
const suspicious = { ...item, id: "unknown-item", name: '<img src=x onerror="alert(1)">' };
const malicious = context.testGrid({ catalog: [suspicious], items: { [suspicious.id]: record }, summary: { items: { [suspicious.id]: base } } }, escape);
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

console.log("Complete-only 2D grid, catalog pictograms, L units, escaping, weather freshness, and keyboard focus passed");
