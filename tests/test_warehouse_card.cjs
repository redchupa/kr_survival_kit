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
vm.runInNewContext(source + "\nglobalThis.TestCard = KrSurvivalKitInventoryCard; globalThis.testGrid = krReadyGrid; globalThis.stockScore = krStockScore; globalThis.stockRank = krStockRankView; globalThis.readyItems = krReadyItems; globalThis.pictograms = KR_READY_PICTOGRAMS; globalThis.stockFormat = krStockFormat; globalThis.stockParse = krStockParse; globalThis.daysUntil = krDaysUntil; globalThis.addMonths = krAddMonths; globalThis.survivalDays = krSurvivalDays; globalThis.urgentQuests = krUrgentQuests; globalThis.expiringStrip = krExpiringStrip;", context);

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

const days = context.survivalDays({ household_size: 4, summary: { items: { "drinking-water": { usable: 24000 }, "instant-rice": { usable: 12 }, "spam-canned-ham": { usable: 6 } } } });
assert.equal(days.waterDays, 3);
assert.equal(days.foodDays, 2);
const quests = context.urgentQuests({ catalog: [item], items: { "drinking-water": { applicable: true } }, summary: { items: { "drinking-water": { ...base, usable: 0, state: "shortage" } } } });
assert.equal(quests.length, 1);
assert.equal(quests[0].itemId, "drinking-water");
const expHtml = context.expiringStrip({ today: "2026-11-18", catalog: [item], items: { "drinking-water": { applicable: true } }, summary: { items: { "drinking-water": { ...base, expiring_quantity: 2000, next_expiry_on: "2026-11-25" } } } }, escape);
assert.match(expHtml, /D-7/);

// Storage locations: per-lot free text, shown on tiles, grouped in the "보관 위치별 보기" panel.
assert.equal(context.krCleanLocation("  주방   팬트리\n3층  "), "주방 팬트리 3층");
assert.equal(context.krCleanLocation("가".repeat(70)).length, 60);
assert.equal(context.krCleanLocation(null), "");
const placed = {
  ...snapshot(base),
  items: { [item.id]: { applicable: true, lots: [
    { lot_id: "a", quantity: 4000, location: "주방 팬트리 3층 선반" },
    { lot_id: "b", quantity: 20000, location: "현관 팬트리" },
    { lot_id: "c", quantity: 0, location: "" },
  ] } },
};
assert.deepEqual([...context.krItemLocations(placed.items[item.id])], ["현관 팬트리", "주방 팬트리 3층 선반"]);
const placedTile = context.testGrid(placed, escape);
assert.match(placedTile, /class="ready-loc"[^>]*>.*현관 팬트리 외 1곳/);
assert.match(placedTile, /보관 위치 현관 팬트리, 주방 팬트리 3층 선반/);
assert.doesNotMatch(context.testGrid(snapshot(base), escape), /ready-loc/, "no tag without a location");
const hostile = { ...placed, items: { [item.id]: { applicable: true, lots: [{ lot_id: "x", quantity: 1, location: '<img src=x onerror="alert(1)">' }] } } };
assert.doesNotMatch(context.testGrid(hostile, escape), /<img/, "location text is escaped on tiles");
assert.doesNotMatch(context.krLocationPanel(hostile, escape), /<img/, "location text is escaped in the panel");
const panel = context.krLocationPanel(placed, escape, true);
assert.match(panel, /보관 위치별 보기 <span>2곳<\/span>/);
assert.match(panel, /<details id="location-panel" open>/);
assert.match(panel, /현관 팬트리 <span>1종<\/span>.*data-edit="drinking-water"[^>]*>생수<b>20 L<\/b>/s);
assert.match(context.krLocationPanel(snapshot(base), escape), /아직 보관 위치를 적은 물품이 없습니다/);
assert.deepEqual([...context.krAllLocations(placed)], ["주방 팬트리 3층 선반", "현관 팬트리"]);

console.log("Inventory grid, catalog pictograms, L units, escaping, weather freshness, survival days, quests, keyboard focus, and storage locations passed");
