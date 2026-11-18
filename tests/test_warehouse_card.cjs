"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../custom_components/kr_survival_kit/www/kr-survival-kit-card.js"), "utf8");
const elements = Object.fromEntries([".hero", "#local-clock", "#local-weather"].map((key) => [key, { dataset: {}, textContent: "" }]));
class MockElement {
  attachShadow() { this.shadowRoot = { querySelector: (selector) => elements[selector] }; }
}
const context = { HTMLElement: MockElement, customElements: { define() {}, get() {} }, window: { customCards: [], requestAnimationFrame: (callback) => callback() }, Intl, Date };
vm.runInNewContext(source + "\nglobalThis.TestCard = KrSurvivalKitInventoryCard; globalThis.testGrid = krReadyGrid; globalThis.stockScore = krStockScore; globalThis.stockRank = krStockRankView; globalThis.readyItems = krReadyItems; globalThis.pictograms = KR_READY_PICTOGRAMS; globalThis.stockFormat = krStockFormat; globalThis.stockParse = krStockParse; globalThis.daysUntil = krDaysUntil; globalThis.addMonths = krAddMonths;", context);

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
assert.equal(catalog.filter((entry) => !String(context.pictograms[entry.id]).includes("<svg")).length, 0, "every pictogram is custom SVG");
assert.equal(context.daysUntil("2026-11-28", "2026-11-18"), 10);
assert.equal(context.addMonths("2026-11-18", 6), "2027-05-18");

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
assert.match(context.testGrid(snapshot({ ...base, usable: 0, state: "shortage" }), escape), /0 L \/ 24 L/);
assert.equal(context.stockScore(snapshot({ ...base, usable: 12000 })), 50);
assert.equal(context.stockScore(snapshot({ ...base, expiring_quantity: 6000 })), 75);
assert.equal(context.stockScore(snapshot({ ...base, stale: true })), 0);
assert.equal(context.stockScore(snapshot({ ...base, target: null })), 0);
assert.equal(context.stockScore(snapshot({ ...base, usable: 48000 })), 100);
const withOptional = snapshot(base);
withOptional.catalog.push({ id: "radio", tier: "optional" });
assert.equal(context.stockScore(withOptional), 100);
for (const [index, rank] of ["아이언", "브론즈", "실버", "골드", "플레티넘", "에메랄드", "다이아", "마스터", "그랜드마스터", "챌린저"].entries()) {
  assert.match(context.stockRank(snapshot({ ...base, target: 100, usable: index * 10 })), new RegExp(`<strong class="rank-badge"[^>]*>${rank}</strong>`));
}
const disabled = { ...snapshot(base), items: { [item.id]: { applicable: false } } };
assert.match(context.testGrid(disabled, escape), /생수 설정.*미사용/);
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

card._hass.states["weather.known"].last_updated = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
card._updateAtmosphere();
assert.match(elements["#local-weather"].textContent, /날씨 갱신 지연/);
assert.equal(elements[".hero"].dataset.weather, "normal");
card._config.weather_entity = undefined;
card._updateAtmosphere();
assert.equal(elements["#local-weather"].hidden, true);

let changeStatus;
let focused = false;
const statusButton = { dataset: { status: "shortage" }, addEventListener: (_type, handler) => { changeStatus = handler; } };
card.shadowRoot = {
  innerHTML: "",
  querySelector: (selector) => selector === '[data-status="shortage"]'
    ? { focus: () => { focused = true; } } : elements[selector] || null,
  querySelectorAll: (selector) => selector === "[data-status]" ? [statusButton] : [],
};
card._snapshot = snapshot(base);
card._render();
changeStatus();
assert.equal(card._statusFilter, "shortage");
assert.equal(focused, true);
assert.doesNotMatch(card.shadowRoot.innerHTML, /data-item="drinking-water"/);
assert.doesNotMatch(card.shadowRoot.innerHTML, /id="inventory-list"/);
assert.match(card.shadowRoot.innerHTML, /data-view-mode="3d"/);

console.log("Inventory grid, catalog pictograms, L units, escaping, weather freshness, and keyboard focus passed");
