const KR_SCRIPT_BASE = (typeof document !== "undefined" && document.currentScript?.src)
  ? new URL(".", document.currentScript.src).href
  : "/kr_survival_kit_assets/";

const KR_SURVIVAL_GROUPS = {
  water: new Set(["drinking-water", "water-container", "insulated-bottle", "portable-water-filter", "water-sanitation-kit"]),
  food: new Set(["shelf-stable-meal", "canned-food", "self-heating-ration", "portable-stove", "butane-canister", "lighter", "solid-fuel", "manual-can-opener", "cooler-ice-pack", "long-storage-snacks", "infant-formula", "ready-to-feed-formula", "infant-feeding-supplies"]),
  power: new Set(["flashlight", "batteries", "radio", "candles", "portable-solar-panel", "power-bank", "portable-power-station", "charging-cables", "door-alarm", "portable-radio-communication"]),
};

const KR_OPTIONAL_CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "water_cook", label: "식수·식량·취사", ids: new Set(["water-container", "faucet-water-tank", "water-purification-tablets", "portable-stove", "butane-canister", "butane-torch", "self-heating-ration", "rice", "spam-canned-ham", "canned-tuna", "salt-jar", "honey-gift-set", "lighter", "solid-fuel", "manual-can-opener", "insulated-bottle", "cooler-ice-pack", "portable-water-filter", "long-storage-snacks", "water-sanitation-kit"]) },
  { id: "power_light", label: "전원·연료·통신", ids: new Set(["radio", "candles", "home-solar-panel", "portable-solar-panel", "power-bank", "portable-power-station", "charging-cables", "portable-radio-communication", "door-alarm", "metal-fuel-can", "fuel-siphon-nozzle"]) },
  { id: "care_infant", label: "의료·유아", ids: new Set(["infant-supplies", "prescription-preparedness", "infant-formula", "ready-to-feed-formula", "infant-feeding-supplies", "child-id-card", "child-comfort-kit", "child-carrier"]) },
  { id: "gear_protect", label: "방호·위생·침구", ids: new Set(["hand-warmers", "sleeping-bag", "large-plastic-bags", "warm-clothes", "raincoat", "masks", "gas-mask", "gas-mask-filter", "earplugs", "compressed-towel", "rubber-gloves", "rubber-boots", "sealing-tape", "portable-toilet", "toilet-coagulant", "cat-litter", "sanitation-bags", "thermal-mat", "hot-water-bag", "protective-goggles"]) },
  { id: "doc_move", label: "자산·서류·이동", ids: new Set(["storage-bin", "emergency-contact-card", "family-photo", "basic-documents", "door-window-locks", "lock-tools", "transport-cart", "emergency-payment-check", "cash-krw", "cash-usd", "crypto-cold-wallet"]) },
];

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

function krSvg(body, idTag) {
  return `<svg viewBox="0 0 48 48" width="44" height="44" focusable="false" aria-hidden="true" data-icon="${idTag}">${body}</svg>`;
}

// Unified tactical duotone SVG artwork for all 56 catalog items.
const KR_READY_PICTOGRAMS = {
  "drinking-water": krSvg(`<rect x="18" y="4" width="12" height="5" rx="1.5" fill="#7be0eb" stroke="#dffbff" stroke-width="1.5"/><path d="M18 10h12l4 6v25a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V16z" fill="#328fa6" fill-opacity=".55" stroke="#9beaf4" stroke-width="1.8"/><rect x="15" y="22" width="18" height="11" rx="1.5" fill="#d9f7fa" fill-opacity=".9"/><path d="M19 27.5h10M24 14v4" stroke="#1d6d82" stroke-width="2" stroke-linecap="round"/>`, "water"),
  "shelf-stable-meal": krSvg(`<path d="M12 10h24l3 32a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="#e59a4b" fill-opacity=".28" stroke="#f5c07a" stroke-width="1.8"/><path d="M14 15h20" stroke="#f5c07a" stroke-width="1.6" stroke-dasharray="2 2"/><rect x="16" y="21" width="16" height="14" rx="2" fill="#f7cfa0" fill-opacity=".25" stroke="#f7cfa0" stroke-width="1.5"/><path d="M21 26c0-2 3-2 3-4m3 4c0-2 3-2 3-4" stroke="#ffd89c" stroke-width="1.6" stroke-linecap="round"/>`, "meal"),
  "canned-food": krSvg(`<ellipse cx="24" cy="11" rx="13" ry="4.5" fill="#e06f6c" fill-opacity=".35" stroke="#f4a4a0" stroke-width="1.8"/><path d="M11 11v26c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5V11" fill="#c94b4b" fill-opacity=".28" stroke="#f4a4a0" stroke-width="1.8"/><path d="M11 21c0 2.2 5.8 4 13 4s13-1.8 13-4M11 31c0 2.2 5.8 4 13 4s13-1.8 13-4" stroke="#ffd0cc" stroke-width="1.4" opacity=".8"/><circle cx="26" cy="11" r="2" fill="#ffd0cc"/>`, "canned"),
  hygiene: krSvg(`<rect x="11" y="13" width="22" height="24" rx="4" fill="#8ce2db" fill-opacity=".25" stroke="#9ef0e8" stroke-width="1.8"/><ellipse cx="22" cy="13" rx="11" ry="3.5" fill="#9ef0e8" fill-opacity=".35" stroke="#9ef0e8" stroke-width="1.5"/><ellipse cx="22" cy="13" rx="3.5" ry="1.3" fill="#133340"/><path d="M33 20h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" fill="#9ef0e8" fill-opacity=".2" stroke="#9ef0e8" stroke-width="1.6"/>`, "hygiene"),
  flashlight: krSvg(`<path d="M15 26 30 11l7 7-15 15z" fill="#7ec4d8" fill-opacity=".3" stroke="#b5ecf7" stroke-width="1.8" stroke-linejoin="round"/><path d="M29 10l3-3 8 8-3 3" fill="#ffd479" fill-opacity=".35" stroke="#ffe19c" stroke-width="1.8"/><path d="M10 31l4-4 4 4-4 4z" fill="#b5ecf7"/><path d="M37 8l5-3m-2 8h5m-9-9V2" stroke="#ffe19c" stroke-width="1.8" stroke-linecap="round"/>`, "flashlight"),
  batteries: krSvg(`<rect x="14" y="10" width="20" height="32" rx="3" fill="#6ee09f" fill-opacity=".25" stroke="#9cf2bf" stroke-width="1.8"/><rect x="19" y="5" width="10" height="5" rx="1" fill="#9cf2bf"/><path d="M25 17l-5 9h5l-2 9 7-11h-5z" fill="#ffe082" stroke="#ffe082" stroke-width="1" stroke-linejoin="round"/>`, "batteries"),
  backpack: krSvg(`<path d="M17 12V9a5 5 0 0 1 14 0v3" stroke="#f7b277" stroke-width="2" fill="none"/><rect x="11" y="12" width="26" height="30" rx="6" fill="#e87e4d" fill-opacity=".28" stroke="#f7b277" stroke-width="1.8"/><rect x="15" y="25" width="18" height="12" rx="3" fill="#f7b277" fill-opacity=".25" stroke="#f7b277" stroke-width="1.5"/><path d="M19 18h10" stroke="#ffd8b5" stroke-width="2" stroke-linecap="round"/>`, "backpack"),
  blanket: krSvg(`<rect x="10" y="11" width="28" height="24" rx="4" fill="#d9778c" fill-opacity=".28" stroke="#f5a3b5" stroke-width="1.8"/><path d="M10 19h28M10 27h28" stroke="#f5a3b5" stroke-width="1.4" opacity=".75"/><path d="M14 35v5m6-5v5m8-5v5m6-5v5" stroke="#f5a3b5" stroke-width="1.8" stroke-linecap="round"/>`, "blanket"),
  "first-aid-kit": krSvg(`<path d="M18 12V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" stroke="#ff9494" stroke-width="1.8" fill="none"/><rect x="8" y="12" width="32" height="27" rx="4" fill="#e05252" fill-opacity=".26" stroke="#ff9494" stroke-width="1.8"/><path d="M24 19v13M17.5 25.5h13" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`, "firstaid"),
  "infant-supplies": krSvg(`<circle cx="24" cy="24" r="13" fill="#f7c873" fill-opacity=".22" stroke="#ffe09e" stroke-width="1.8"/><circle cx="15" cy="14" r="4.5" fill="#f7c873" fill-opacity=".3" stroke="#ffe09e" stroke-width="1.6"/><circle cx="33" cy="14" r="4.5" fill="#f7c873" fill-opacity=".3" stroke="#ffe09e" stroke-width="1.6"/><circle cx="20" cy="23" r="1.5" fill="#ffe09e"/><circle cx="28" cy="23" r="1.5" fill="#ffe09e"/><path d="M21 28c1.5 1.5 4.5 1.5 6 0" stroke="#ffe09e" stroke-width="1.6" stroke-linecap="round"/>`, "infant"),
  "prescription-preparedness": krSvg(`<rect x="14" y="13" width="20" height="28" rx="3" fill="#95c8ff" fill-opacity=".25" stroke="#b8dcff" stroke-width="1.8"/><rect x="12" y="7" width="24" height="6" rx="1.5" fill="#b8dcff" fill-opacity=".4" stroke="#b8dcff" stroke-width="1.6"/><path d="M24 21v10M19 26h10" stroke="#96f2d7" stroke-width="2.6" stroke-linecap="round"/>`, "rx"),
  radio: krSvg(`<path d="M13 18 33 7" stroke="#9ee8f5" stroke-width="2" stroke-linecap="round"/><rect x="8" y="18" width="32" height="22" rx="4" fill="#5ba4b8" fill-opacity=".28" stroke="#9ee8f5" stroke-width="1.8"/><circle cx="17" cy="29" r="5" fill="#9ee8f5" fill-opacity=".25" stroke="#9ee8f5" stroke-width="1.5"/><path d="M26 24h9M26 29h9M26 34h6" stroke="#dff8fc" stroke-width="1.8" stroke-linecap="round"/>`, "radio"),
  "water-container": krSvg(`<rect x="11" y="11" width="26" height="30" rx="4" fill="#4aa8cc" fill-opacity=".28" stroke="#8de0fa" stroke-width="1.8"/><path d="M18 11V7h12v4" stroke="#8de0fa" stroke-width="1.8"/><path d="M17 17h14v4H17z" fill="#8de0fa" fill-opacity=".35"/><path d="M24 25c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z" fill="#b8f2ff"/>`, "watercan"),
  "portable-stove": krSvg(`<rect x="9" y="25" width="30" height="13" rx="2.5" fill="#8fa8b5" fill-opacity=".28" stroke="#c3dbe6" stroke-width="1.8"/><path d="M14 25v-5h20v5" stroke="#c3dbe6" stroke-width="1.8"/><path d="M24 10c-3 3.5-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4.5-4-8z" fill="#ffb86c" stroke="#ffe0a3" stroke-width="1.2"/><circle cx="33" cy="31.5" r="2.2" fill="#ffb86c"/>`, "stove"),
  "butane-canister": krSvg(`<rect x="16" y="13" width="16" height="28" rx="3" fill="#ff9f68" fill-opacity=".26" stroke="#ffc299" stroke-width="1.8"/><path d="M19 13V9h10v4M24 9V5" stroke="#ffc299" stroke-width="1.8" stroke-linecap="round"/><path d="M16 21h16M16 33h16" stroke="#ffc299" stroke-width="1.3" opacity=".75"/>`, "butane"),
  "self-heating-ration": krSvg(`<rect x="9" y="14" width="30" height="24" rx="4" fill="#7ac98f" fill-opacity=".25" stroke="#a6e6b7" stroke-width="1.8"/><path d="M9 24h30" stroke="#a6e6b7" stroke-width="1.5"/><path d="M18 8c0 2.5 2 3 2 5m5-5c0 2.5 2 3 2 5m5-5c0 2.5 2 3 2 5" stroke="#ffd88f" stroke-width="1.7" stroke-linecap="round"/>`, "ration"),
  candles: krSvg(`<rect x="17" y="19" width="14" height="22" rx="2" fill="#f7e3a1" fill-opacity=".3" stroke="#ffefb8" stroke-width="1.8"/><path d="M24 19v-4" stroke="#ffefb8" stroke-width="1.6"/><path d="M24 6c-2.5 3-3 5-3 6.5a3 3 0 0 0 6 0C27 11 26.5 9 24 6z" fill="#ffb35c" stroke="#ffe5a3" stroke-width="1.2"/>`, "candles"),
  "hand-warmers": krSvg(`<rect x="12" y="10" width="24" height="28" rx="6" fill="#ff8f6b" fill-opacity=".26" stroke="#ffb89e" stroke-width="1.8"/><path d="M18 20c0 2.5 2 3.5 2 6m4-8c0 3 2 4 2 7m4-5c0 2.5 2 3.5 2 6" stroke="#ffd6b8" stroke-width="1.8" stroke-linecap="round"/>`, "warmer"),
  "large-plastic-bags": krSvg(`<path d="M16 11l3-4h10l3 4 5 7v21a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V18z" fill="#7ea3b8" fill-opacity=".28" stroke="#b5d6e8" stroke-width="1.8" stroke-linejoin="round"/><path d="M17 15h14" stroke="#b5d6e8" stroke-width="1.6" stroke-dasharray="2 2"/>`, "bags"),
  lighter: krSvg(`<rect x="15" y="19" width="18" height="22" rx="3" fill="#ff7d54" fill-opacity=".28" stroke="#ffb094" stroke-width="1.8"/><rect x="17" y="13" width="10" height="6" rx="1" fill="#c7d8e0" fill-opacity=".4" stroke="#c7d8e0" stroke-width="1.4"/><path d="M24 5c-2.5 2.5-3 4.5-3 5.5a3 3 0 0 0 6 0c0-1-.5-3-3-5.5z" fill="#ffd166"/>`, "lighter"),
  "solid-fuel": krSvg(`<ellipse cx="24" cy="21" rx="11" ry="4.5" fill="#d9e8f0" fill-opacity=".35" stroke="#e8f3f8" stroke-width="1.7"/><path d="M13 21v7c0 2.5 4.9 4.5 11 4.5s11-2 11-4.5v-7" fill="#a2bdc9" fill-opacity=".25" stroke="#e8f3f8" stroke-width="1.7"/><path d="M24 8c-2 2.5-2.5 4.5-2.5 5.5a2.5 2.5 0 0 0 5 0c0-1-.5-3-2.5-5.5z" fill="#ffad5c"/>`, "solidfuel"),
  "child-id-card": krSvg(`<rect x="8" y="13" width="32" height="22" rx="3.5" fill="#82b8ff" fill-opacity=".25" stroke="#b0d4ff" stroke-width="1.8"/><circle cx="17" cy="22" r="3.5" fill="#b0d4ff"/><path d="M12.5 30c.8-2.5 2.5-3.5 4.5-3.5s3.7 1 4.5 3.5M25 21h10M25 26h8" stroke="#b0d4ff" stroke-width="1.8" stroke-linecap="round"/>`, "childid"),
  "portable-solar-panel": krSvg(`<path d="M9 14h30l3 20H6z" fill="#4692c9" fill-opacity=".32" stroke="#8fd0ff" stroke-width="1.8" stroke-linejoin="round"/><path d="M19 14l-1 20M29 14l1 20M8 24h32" stroke="#8fd0ff" stroke-width="1.4"/><circle cx="38" cy="9" r="3" fill="#ffe07d"/>`, "solar"),
  "manual-can-opener": krSvg(`<path d="M16 10l16 16m0-16L16 26" stroke="#c9dce6" stroke-width="2.4" stroke-linecap="round"/><circle cx="15" cy="33" r="4" fill="none" stroke="#9ad8e6" stroke-width="2"/><circle cx="33" cy="33" r="4" fill="none" stroke="#9ad8e6" stroke-width="2"/><path d="M18 28l-2 3m14-3l2 3" stroke="#c9dce6" stroke-width="2" stroke-linecap="round"/>`, "opener"),
  "insulated-bottle": krSvg(`<rect x="19" y="5" width="10" height="5" rx="1.5" fill="#9fe3d8" stroke="#d1faf3" stroke-width="1.4"/><rect x="16" y="10" width="16" height="32" rx="4" fill="#3b998e" fill-opacity=".35" stroke="#9fe3d8" stroke-width="1.8"/><path d="M16 17h16M16 34h16" stroke="#9fe3d8" stroke-width="1.4"/>`, "thermos"),
  "cooler-ice-pack": krSvg(`<rect x="9" y="15" width="30" height="23" rx="3.5" fill="#5aa8e0" fill-opacity=".28" stroke="#9ed4ff" stroke-width="1.8"/><path d="M16 15v-4h16v4M9 21h30" stroke="#9ed4ff" stroke-width="1.8"/><path d="M24 25v8M20 29h8" stroke="#d4edff" stroke-width="1.8" stroke-linecap="round"/>`, "cooler"),
  "portable-water-filter": krSvg(`<rect x="18" y="8" width="12" height="24" rx="3" fill="#52b8cf" fill-opacity=".3" stroke="#9be8f7" stroke-width="1.8"/><path d="M24 32v8M16 15h16M16 25h16" stroke="#9be8f7" stroke-width="1.8" stroke-linecap="round"/><circle cx="24" cy="41" r="2" fill="#b8f2ff"/>`, "filter"),
  "storage-bin": krSvg(`<rect x="8" y="13" width="32" height="6" rx="1.5" fill="#89acc2" fill-opacity=".4" stroke="#b9d6e8" stroke-width="1.8"/><path d="M11 19h26l-2 20H13z" fill="#5d8299" fill-opacity=".28" stroke="#b9d6e8" stroke-width="1.8"/><path d="M19 25h10" stroke="#b9d6e8" stroke-width="2" stroke-linecap="round"/>`, "bin"),
  "long-storage-snacks": krSvg(`<rect x="11" y="13" width="26" height="22" rx="4" fill="#e6a85c" fill-opacity=".28" stroke="#ffd08f" stroke-width="1.8"/><circle cx="19" cy="21" r="2" fill="#ffd08f"/><circle cx="28" cy="20" r="1.8" fill="#ffd08f"/><circle cx="24" cy="28" r="2.2" fill="#ffd08f"/>`, "snacks"),
  "infant-formula": krSvg(`<rect x="13" y="13" width="22" height="28" rx="3" fill="#f7d57e" fill-opacity=".25" stroke="#ffe5a3" stroke-width="1.8"/><rect x="15" y="8" width="18" height="5" rx="1.5" fill="#ffe5a3" fill-opacity=".4" stroke="#ffe5a3" stroke-width="1.5"/><circle cx="24" cy="27" r="5" fill="#ffe5a3" fill-opacity=".35"/>`, "formula"),
  "ready-to-feed-formula": krSvg(`<rect x="16" y="14" width="16" height="27" rx="3" fill="#fff0c2" fill-opacity=".28" stroke="#ffe7a3" stroke-width="1.8"/><path d="M20 14l2-7h4l2 7" fill="#ffe7a3" fill-opacity=".4" stroke="#ffe7a3" stroke-width="1.6"/><path d="M16 24h16" stroke="#ffe7a3" stroke-width="1.5"/>`, "liquidformula"),
  "infant-feeding-supplies": krSvg(`<path d="M18 10c0 5-2 7-2 10v18m14-28v28" stroke="#bde6ff" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="18" cy="11" rx="3.5" ry="5" fill="#bde6ff" fill-opacity=".35" stroke="#bde6ff" stroke-width="1.6"/><path d="M27 10v7h6v-7" stroke="#bde6ff" stroke-width="1.8" stroke-linecap="round"/>`, "feeding"),
  "power-bank": krSvg(`<rect x="14" y="9" width="20" height="31" rx="3.5" fill="#5ea8d4" fill-opacity=".28" stroke="#9be0ff" stroke-width="1.8"/><path d="M25 16l-5 8h5l-2 8 6-10h-5z" fill="#ffe27a"/><circle cx="20" cy="13" r="1.2" fill="#9be0ff"/><circle cx="24" cy="13" r="1.2" fill="#9be0ff"/>`, "powerbank"),
  "portable-power-station": krSvg(`<path d="M16 13V9h16v4" stroke="#8de8d6" stroke-width="2" fill="none"/><rect x="9" y="13" width="30" height="26" rx="4" fill="#2e8c82" fill-opacity=".35" stroke="#8de8d6" stroke-width="1.8"/><rect x="14" y="19" width="10" height="8" rx="1.5" fill="#8de8d6" fill-opacity=".35" stroke="#8de8d6" stroke-width="1.3"/><path d="M30 19l-3 5h3l-1 5 4-6h-3z" fill="#ffe27a"/><circle cx="16" cy="33" r="2" fill="#8de8d6"/><circle cx="22" cy="33" r="2" fill="#8de8d6"/>`, "powerstation"),
  "charging-cables": krSvg(`<path d="M15 16v14a8 8 0 0 0 16 0V19" fill="none" stroke="#9ed8eb" stroke-width="2.2" stroke-linecap="round"/><rect x="12" y="9" width="6" height="7" rx="1" fill="#9ed8eb"/><rect x="28" y="12" width="6" height="7" rx="1" fill="#9ed8eb"/><path d="M14 6v3m2-3v3m15 0v3" stroke="#dff6fc" stroke-width="1.6" stroke-linecap="round"/>`, "cables"),
  "warm-clothes": krSvg(`<path d="M17 9l7 4 7-4 8 6-4 7-3-2v19H16V20l-3 2-4-7z" fill="#d97b66" fill-opacity=".28" stroke="#ffb09e" stroke-width="1.8" stroke-linejoin="round"/><path d="M24 13v26" stroke="#ffb09e" stroke-width="1.5"/>`, "clothes"),
  raincoat: krSvg(`<path d="M18 11a6 6 0 0 1 12 0l8 7-3 6-4-2v17H17V22l-4 2-3-6z" fill="#e6c453" fill-opacity=".28" stroke="#ffe587" stroke-width="1.8" stroke-linejoin="round"/><path d="M24 13v26" stroke="#ffe587" stroke-width="1.5"/>`, "raincoat"),
  masks: krSvg(`<path d="M13 18h22v11c0 5-5 8-11 8s-11-3-11-8z" fill="#8fd6eb" fill-opacity=".28" stroke="#baefff" stroke-width="1.8"/><path d="M13 20c-4 0-5 2-5 4s1 4 5 4m22-8c4 0 5 2 5 4s-1 4-5 4" fill="none" stroke="#baefff" stroke-width="1.6"/><path d="M18 24h12M18 28h12" stroke="#baefff" stroke-width="1.4" opacity=".8"/>`, "masks"),
  "rubber-gloves": krSvg(`<path d="M15 24v-9a2 2 0 0 1 4 0v6m0-9a2 2 0 0 1 4 0v9m0-8a2 2 0 0 1 4 0v8m0-5a2 2 0 0 1 4 0v12l-2 10H16l-3-11a2 2 0 0 1 2-3z" fill="#e6738e" fill-opacity=".28" stroke="#ffa8bc" stroke-width="1.8" stroke-linejoin="round"/>`, "gloves"),
  "rubber-boots": krSvg(`<path d="M16 9h11v19l8 4v6H15V9z" fill="#5da688" fill-opacity=".3" stroke="#9ee6c7" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 34h20M16 14h11" stroke="#9ee6c7" stroke-width="1.5"/>`, "boots"),
  "sealing-tape": krSvg(`<circle cx="24" cy="24" r="13" fill="#a8c4d4" fill-opacity=".28" stroke="#d4eaf7" stroke-width="1.8"/><circle cx="24" cy="24" r="5.5" fill="none" stroke="#d4eaf7" stroke-width="1.8"/><path d="M31 35h9" stroke="#d4eaf7" stroke-width="2.2" stroke-linecap="round"/>`, "tape"),
  "emergency-contact-card": krSvg(`<rect x="9" y="12" width="30" height="24" rx="3.5" fill="#7ab8a8" fill-opacity=".28" stroke="#a6ebd9" stroke-width="1.8"/><path d="M16 19c2 0 3 2 2 4l-1 1c1 2 3 4 5 5l1-1c2-1 4 0 4 2v2c0 1-1 2-2 2-6 0-11-5-11-11 0-1 1-2 2-2z" fill="#a6ebd9"/><path d="M27 20h7M27 25h7" stroke="#a6ebd9" stroke-width="1.8" stroke-linecap="round"/>`, "contact"),
  "family-photo": krSvg(`<rect x="9" y="11" width="30" height="26" rx="3" fill="#c79ee0" fill-opacity=".25" stroke="#e4c7f7" stroke-width="1.8"/><circle cx="19" cy="20" r="3" fill="#e4c7f7"/><circle cx="29" cy="21" r="2.6" fill="#e4c7f7"/><path d="M13 33c1-4 4-6 6-6s5 2 6 6m1 0c.8-3 2.5-4.5 4.5-4.5s3.5 1.5 4.5 4.5" stroke="#e4c7f7" stroke-width="1.6" stroke-linecap="round" fill="none"/>`, "photo"),
  "sanitation-bags": krSvg(`<path d="M16 14h16l3 24a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2z" fill="#7094a8" fill-opacity=".28" stroke="#a8cde0" stroke-width="1.8"/><path d="M19 14l2-5h6l2 5M18 20h12" stroke="#a8cde0" stroke-width="1.8" stroke-linecap="round"/>`, "sanitation"),
  "thermal-mat": krSvg(`<rect x="9" y="16" width="24" height="16" rx="7" fill="#9fb5c2" fill-opacity=".3" stroke="#d4e6f0" stroke-width="1.8"/><ellipse cx="33" cy="24" rx="4.5" ry="8" fill="#d4e6f0" fill-opacity=".25" stroke="#d4e6f0" stroke-width="1.8"/><path d="M15 21h10M15 27h10" stroke="#d4e6f0" stroke-width="1.4" opacity=".8"/>`, "mat"),
  "child-comfort-kit": krSvg(`<path d="M15 16h18v18H15z" fill="#f79ec2" fill-opacity=".25" stroke="#ffc4dc" stroke-width="1.8"/><circle cx="24" cy="13" r="3.5" fill="#ffc4dc" fill-opacity=".35" stroke="#ffc4dc" stroke-width="1.5"/><circle cx="36" cy="25" r="3.5" fill="#ffc4dc" fill-opacity=".35" stroke="#ffc4dc" stroke-width="1.5"/>`, "comfort"),
  "basic-documents": krSvg(`<path d="M13 8h15l7 7v25H13z" fill="#8cb4cc" fill-opacity=".25" stroke="#bde0f5" stroke-width="1.8" stroke-linejoin="round"/><path d="M28 8v7h7M18 22h12M18 28h12M18 34h8" stroke="#bde0f5" stroke-width="1.8" stroke-linecap="round"/>`, "docs"),
  "door-window-locks": krSvg(`<rect x="12" y="21" width="24" height="19" rx="3.5" fill="#e6b65c" fill-opacity=".28" stroke="#ffd88f" stroke-width="1.8"/><path d="M17 21v-6a7 7 0 0 1 14 0v6" fill="none" stroke="#ffd88f" stroke-width="2"/><circle cx="24" cy="30" r="2.5" fill="#ffd88f"/>`, "lock"),
  "door-alarm": krSvg(`<path d="M16 29a8 8 0 0 1 16 0v5H16z" fill="#ff7878" fill-opacity=".3" stroke="#ffa8a8" stroke-width="1.8"/><path d="M13 34h22M24 14v4M13 17l3 3m19-3-3 3" stroke="#ffa8a8" stroke-width="1.8" stroke-linecap="round"/>`, "alarm"),
  "child-carrier": krSvg(`<path d="M15 10h18l-2 22H17z" fill="#70b8c9" fill-opacity=".28" stroke="#a6e6f5" stroke-width="1.8"/><path d="M15 10l-3-3m21 3l3-3M19 32v8m10-8v8" stroke="#a6e6f5" stroke-width="2" stroke-linecap="round"/>`, "carrier"),
  "transport-cart": krSvg(`<path d="M9 12h6l4 18h18l3-12H16" fill="#7eaec2" fill-opacity=".25" stroke="#b5e0f2" stroke-width="1.8" stroke-linejoin="round"/><circle cx="20" cy="36" r="3.5" fill="#b5e0f2"/><circle cx="35" cy="36" r="3.5" fill="#b5e0f2"/>`, "cart"),
  "water-sanitation-kit": krSvg(`<path d="M16 14h16l-2 25H18z" fill="#63d1c8" fill-opacity=".28" stroke="#9ef5ed" stroke-width="1.8"/><path d="M21 14V9h6v5M18 22h12" stroke="#9ef5ed" stroke-width="1.6"/><path d="M24 26v6m-3-3h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`, "watersan"),
  "hot-water-bag": krSvg(`<path d="M19 9h10l-1 4h4a5 5 0 0 1 5 5v17a5 5 0 0 1-5 5H16a5 5 0 0 1-5-5V18a5 5 0 0 1 5-5h4z" fill="#ff7f73" fill-opacity=".28" stroke="#ffb2ab" stroke-width="1.8"/><path d="M19 24h10M24 19v10" stroke="#ffb2ab" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`, "hotbag"),
  "portable-radio-communication": krSvg(`<path d="M17 16V6" stroke="#8de8b5" stroke-width="2.2" stroke-linecap="round"/><rect x="14" y="16" width="20" height="25" rx="3.5" fill="#4aa678" fill-opacity=".3" stroke="#8de8b5" stroke-width="1.8"/><rect x="18" y="21" width="12" height="7" rx="1" fill="#8de8b5" fill-opacity=".35"/><path d="M18 33h12M18 36h8" stroke="#8de8b5" stroke-width="1.5" stroke-linecap="round"/>`, "walkie"),
  "emergency-payment-check": krSvg(`<rect x="8" y="13" width="32" height="22" rx="3.5" fill="#77cc8e" fill-opacity=".26" stroke="#a6f0ba" stroke-width="1.8"/><path d="M8 20h32" stroke="#a6f0ba" stroke-width="2.5"/><rect x="13" y="26" width="8" height="4" rx="1" fill="#a6f0ba"/>`, "payment"),
  "protective-goggles": krSvg(`<path d="M8 20a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v7a5 5 0 0 1-5 5h-6l-3-4h-4l-3 4h-6a5 5 0 0 1-5-5z" fill="#7ecce0" fill-opacity=".3" stroke="#b5f0ff" stroke-width="1.8"/><path d="M13 21l4 4" stroke="#e6fbff" stroke-width="1.6" stroke-linecap="round"/>`, "goggles"),
  "faucet-water-tank": krSvg(`<rect x="10" y="12" width="22" height="28" rx="4" fill="#4aa8cc" fill-opacity=".28" stroke="#8de0fa" stroke-width="1.8"/><path d="M32 30h6v5" fill="none" stroke="#8de0fa" stroke-width="2.2" stroke-linecap="round"/><circle cx="38" cy="39" r="1.8" fill="#b8f2ff"/><path d="M16 12V8h10v4" stroke="#8de0fa" stroke-width="1.8"/>`, "faucet"),
  "water-purification-tablets": krSvg(`<rect x="11" y="10" width="26" height="28" rx="4" fill="#7be0eb" fill-opacity=".2" stroke="#9ef0f8" stroke-width="1.8"/><circle cx="19" cy="19" r="3" fill="#b8f5ff"/><circle cx="29" cy="19" r="3" fill="#b8f5ff"/><circle cx="19" cy="29" r="3" fill="#b8f5ff"/><circle cx="29" cy="29" r="3" fill="#b8f5ff"/>`, "aquatabs"),
  "metal-fuel-can": krSvg(`<path d="M12 14h18l6 6v20H12z" fill="#d95f59" fill-opacity=".3" stroke="#ff9e99" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 14V9h9v5M17 22l12 12m0-12L17 34" stroke="#ff9e99" stroke-width="1.8" stroke-linecap="round"/>`, "jerrycan"),
  "fuel-siphon-nozzle": krSvg(`<path d="M12 36c0-14 6-22 14-22h8l4 6" fill="none" stroke="#f7b277" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="18" r="4" fill="#f7b277" fill-opacity=".4" stroke="#f7b277" stroke-width="1.6"/>`, "siphon"),
  "butane-torch": krSvg(`<rect x="16" y="21" width="12" height="20" rx="2" fill="#ff9f68" fill-opacity=".28" stroke="#ffc299" stroke-width="1.8"/><path d="M20 21v-6h12l4-3" fill="none" stroke="#d4e6f0" stroke-width="2.2" stroke-linecap="round"/><path d="M38 11c2 0 4 1.5 4 3s-2 2-4 2" fill="#ffd166"/>`, "torch"),
  rice: krSvg(`<path d="M13 13h22l3 26a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="#f2e6c9" fill-opacity=".28" stroke="#fff3d6" stroke-width="1.8"/><path d="M16 13c2-3 14-3 16 0" stroke="#fff3d6" stroke-width="1.8"/><ellipse cx="24" cy="27" rx="6" ry="4" fill="#fff3d6" fill-opacity=".5"/>`, "rice"),
  "spam-canned-ham": krSvg(`<rect x="10" y="14" width="28" height="22" rx="3" fill="#e06f6c" fill-opacity=".35" stroke="#ffb0ad" stroke-width="1.8"/><rect x="14" y="20" width="20" height="10" rx="1.5" fill="#ffe19c" fill-opacity=".3" stroke="#ffe19c" stroke-width="1.4"/>`, "spam"),
  "canned-tuna": krSvg(`<ellipse cx="24" cy="22" rx="14" ry="7" fill="#5aa8e0" fill-opacity=".32" stroke="#9ed4ff" stroke-width="1.8"/><path d="M10 22v8c0 3.9 6.3 7 14 7s14-3.1 14-7v-8" fill="#4692c9" fill-opacity=".25" stroke="#9ed4ff" stroke-width="1.8"/>`, "tuna"),
  "salt-jar": krSvg(`<rect x="15" y="14" width="18" height="26" rx="4" fill="#e6f4f8" fill-opacity=".25" stroke="#ffffff" stroke-width="1.8"/><rect x="17" y="9" width="14" height="5" rx="1.5" fill="#a8c4d4"/><path d="M18 29h12l-2 7h-8z" fill="#ffffff" fill-opacity=".6"/>`, "salt"),
  "honey-gift-set": krSvg(`<path d="M16 15h16l3 8v15a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V23z" fill="#ffb703" fill-opacity=".32" stroke="#ffd166" stroke-width="1.8"/><rect x="18" y="9" width="12" height="5" rx="1.5" fill="#ffd166"/><path d="M17 26h14" stroke="#fff3b0" stroke-width="2"/>`, "honey"),
  "sleeping-bag": krSvg(`<path d="M14 14a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v24a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="#5da688" fill-opacity=".3" stroke="#9ee6c7" stroke-width="1.8"/><path d="M14 19h20M24 19v23" stroke="#9ee6c7" stroke-width="1.6"/>`, "sleepbag"),
  "home-solar-panel": krSvg(`<rect x="6" y="11" width="36" height="24" rx="2" fill="#3a86ff" fill-opacity=".3" stroke="#8fd0ff" stroke-width="1.8"/><path d="M15 11v24M24 11v24M33 11v24M6 19h36M6 27h36" stroke="#8fd0ff" stroke-width="1.2"/><path d="M18 35l-2 6m16-6 2 6" stroke="#8fd0ff" stroke-width="2" stroke-linecap="round"/>`, "homesolar"),
  "gas-mask": krSvg(`<path d="M14 14c0-4 4-6 10-6s10 2 10 6v12c0 6-4 10-10 10s-10-4-10-10z" fill="#5c7080" fill-opacity=".35" stroke="#b5d0e0" stroke-width="1.8"/><circle cx="19" cy="20" r="3.2" fill="#8fd0ff" fill-opacity=".45" stroke="#b5d0e0" stroke-width="1.4"/><circle cx="29" cy="20" r="3.2" fill="#8fd0ff" fill-opacity=".45" stroke="#b5d0e0" stroke-width="1.4"/><circle cx="24" cy="31" r="4.5" fill="#495057" stroke="#ffd166" stroke-width="1.6"/>`, "gasmask"),
  "gas-mask-filter": krSvg(`<ellipse cx="24" cy="18" rx="12" ry="5" fill="#5c7080" fill-opacity=".4" stroke="#ffd166" stroke-width="1.8"/><path d="M12 18v12c0 2.8 5.4 5 12 5s12-2.2 12-5V18" fill="#495057" fill-opacity=".35" stroke="#ffd166" stroke-width="1.8"/><path d="M19 13h10v4H19z" fill="#ffd166" fill-opacity=".5"/>`, "gasfilter"),
  earplugs: krSvg(`<path d="M15 32v-9l3-11h2l3 11v9zM25 32v-9l3-11h2l3 11v9z" fill="#ff9f68" fill-opacity=".35" stroke="#ffc299" stroke-width="1.6" stroke-linejoin="round"/>`, "earplugs"),
  "compressed-towel": krSvg(`<circle cx="24" cy="24" r="11" fill="#e6f4f8" fill-opacity=".28" stroke="#ffffff" stroke-width="1.8"/><path d="M17 24h14M24 17v14" stroke="#9beaf4" stroke-width="1.8" stroke-linecap="round"/>`, "towel"),
  "portable-toilet": krSvg(`<ellipse cx="24" cy="18" rx="11" ry="4.5" fill="#d9e8f0" fill-opacity=".3" stroke="#e8f3f8" stroke-width="1.8"/><path d="M13 18l2 19h18l2-19" fill="#9fb5c2" fill-opacity=".25" stroke="#e8f3f8" stroke-width="1.8"/>`, "toilet"),
  "toilet-coagulant": krSvg(`<rect x="13" y="11" width="22" height="26" rx="3" fill="#8ce2db" fill-opacity=".25" stroke="#9ef0e8" stroke-width="1.8"/><circle cx="20" cy="23" r="1.5" fill="#fff"/><circle cx="28" cy="21" r="1.5" fill="#fff"/><circle cx="24" cy="28" r="1.5" fill="#fff"/>`, "coagulant"),
  "cat-litter": krSvg(`<path d="M12 12h24l2 26H10z" fill="#e6c453" fill-opacity=".25" stroke="#ffe587" stroke-width="1.8"/><circle cx="24" cy="25" r="4" fill="#ffe587" fill-opacity=".4"/><circle cx="19" cy="21" r="1.5" fill="#ffe587"/><circle cx="29" cy="21" r="1.5" fill="#ffe587"/>`, "catlitter"),
  "lock-tools": krSvg(`<path d="M14 34L32 14m-18 0l5 5m9 9l6 6" stroke="#b5d6e8" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="15" r="3" fill="none" stroke="#ffd166" stroke-width="1.8"/><rect x="28" y="28" width="9" height="9" rx="2" fill="#ffd166" fill-opacity=".35" stroke="#ffd166" stroke-width="1.6"/>`, "locktools"),
  "cash-krw": krSvg(`<rect x="8" y="14" width="32" height="20" rx="3" fill="#52b788" fill-opacity=".3" stroke="#9ef0be" stroke-width="1.8"/><path d="M17 20l2.5 8 2.5-6 2.5 6 2.5-8M15 24h18" fill="none" stroke="#d8f3dc" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`, "krw"),
  "cash-usd": krSvg(`<rect x="8" y="14" width="32" height="20" rx="3" fill="#40916c" fill-opacity=".32" stroke="#8cf2ad" stroke-width="1.8"/><path d="M24 18v12m3-9.5c0-1.5-6-1.5-6 0s6 2 6 4.5-6 2-6 0" fill="none" stroke="#d8f3dc" stroke-width="1.8" stroke-linecap="round"/>`, "usd"),
  "crypto-cold-wallet": krSvg(`<rect x="13" y="10" width="22" height="28" rx="4" fill="#f7931a" fill-opacity=".26" stroke="#ffb74d" stroke-width="1.8"/><circle cx="24" cy="22" r="5" fill="none" stroke="#ffe082" stroke-width="1.8"/><path d="M24 19v6m-2-3h4M20 33h8" stroke="#ffe082" stroke-width="1.6" stroke-linecap="round"/>`, "crypto"),
};

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

function krDaysUntil(isoDate, todayIso) {
  if (!isoDate || !todayIso) return null;
  const a = Date.parse(`${isoDate}T00:00:00Z`);
  const b = Date.parse(`${todayIso}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((a - b) / 86400000);
}

function krReadyGrid(snapshot, escape, visible = snapshot?.catalog.filter((item) =>
  !krIsSelectable(item)), editing = false) {
  if (!snapshot) return `<p class="ready-empty">재고를 불러오는 중입니다.</p>`;
  if (!visible.length) return `<p class="ready-empty">이 조건에 맞는 물품이 없습니다.</p>`;
  const readyIds = new Set(krReadyItems(snapshot).map((item) => item.id));
  return `<div class="ready-grid" role="list">${visible.map((item) => {
    const status = snapshot.summary.items[item.id];
    const ready = readyIds.has(item.id);
    const inactive = !(snapshot.items[item.id]?.applicable ?? !krIsSelectable(item));
    const pictogram = KR_READY_PICTOGRAMS[item.id] || "◈";
    const current = status.usable ?? 0;
    const quantity = `${krStockText(item, current)} / ${status.target == null ? "목표 미설정" : krStockText(item, status.target)}`;
    const label = inactive ? "미사용" : ready ? "완비" : !status.confirmed || status.stale ? "실사 필요" :
      status.expiring_quantity > 0 ? "기한 임박" : status.expired_quantity > 0 ? "기한 경과" :
      status.unknown_date_quantity > 0 ? (status.next_label_check_on ? `기한 확인 ${status.next_label_check_on}` : "기한 확인") : status.state === "shortage" ? "부족" : "";
    const dDay = !inactive && status.next_expiry_on && snapshot.today ? krDaysUntil(status.next_expiry_on, snapshot.today) : null;
    const badgeTone = inactive ? "muted" : ready ? "ok" : status.expired_quantity > 0 || status.state === "shortage" ? "warn" : "alert";
    const percent = status.target > 0 ? Math.floor(Math.min(1, current / status.target) * 100) : 0;
    const action = inactive ? "설정" : "수정";
    return `<div class="ready-item" data-item="${escape(item.id)}" data-complete="${ready}" data-tone="${badgeTone}" role="listitem"><button type="button" class="shelf-edit" data-edit="${escape(item.id)}" aria-label="${escape([`${item.name} ${action}`, quantity, label].filter(Boolean).join(" · "))}" ${editing ? "disabled" : ""}><span class="tile-top"><span class="tile-led" aria-hidden="true"></span>${dDay !== null && dDay <= 90 ? `<span class="dday-tag">D${dDay >= 0 ? `-${dDay}` : `+${Math.abs(dDay)}`}</span>` : ""}<span class="shelf-action">${action}</span></span><span class="ready-art" aria-hidden="true">${pictogram}</span>` +
      `<span class="ready-name">${escape(KR_READY_SHORT_NAMES[item.id] || item.name)}</span><span class="ready-number">${escape(quantity)}</span><span aria-hidden="true" class="stock-meter"><span style="width:${percent}%"></span></span>${label ? `<span class="stock-label">${escape(label)}</span>` : ""}</button></div>`;
  }).join("")}</div>`;
}

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
  "faucet-water-tank": "수도꼭지 물통", "water-purification-tablets": "아쿠아탭스",
  "metal-fuel-can": "철제 기름통", "fuel-siphon-nozzle": "자바라 노즐",
  "butane-torch": "부탄 토치", rice: "쌀", "spam-canned-ham": "스팸", "canned-tuna": "참치캔",
  "salt-jar": "소금(병)", "honey-gift-set": "벌꿀", "sleeping-bag": "캠핑 침낭",
  "home-solar-panel": "가정용 태양광", "portable-solar-panel": "휴대 태양광",
  "portable-power-station": "가정용 파워뱅크", "power-bank": "휴대 보조배터리",
  "gas-mask": "방독면", "gas-mask-filter": "방독면 필터", earplugs: "이어플러그",
  "compressed-towel": "압축 수건", "portable-toilet": "휴대용 변기",
  "toilet-coagulant": "변기 응고제", "cat-litter": "고양이 모래", "lock-tools": "자물쇠 공구",
  "cash-krw": "원화 현금", "cash-usd": "달러 외화", "crypto-cold-wallet": "코인·지갑",
  "child-carrier": "산악 아기캐리어", "transport-cart": "웨건 수레",
};

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

function krStockShelves(snapshot, escape, showInactive, editing, filter, optCategory = "all", optSearch = "") {
  const optional = snapshot?.catalog.filter(krIsSelectable) ?? [];
  const matches = (item) => {
    if (filter === "all") return true;
    const status = snapshot.summary.items[item.id];
    return filter === "expiring" ? status.expiring_quantity > 0 : status.state === filter;
  };
  const essentials = snapshot?.catalog.filter((item) => !krIsSelectable(item) && matches(item));
  const active = optional.filter((item) => snapshot.items[item.id]?.applicable && matches(item));
  const inactive = optional.filter((item) => !snapshot.items[item.id]?.applicable);
  const catObj = KR_OPTIONAL_CATEGORIES.find((cat) => cat.id === optCategory) || KR_OPTIONAL_CATEGORIES[0];
  const query = optSearch.trim().toLowerCase();
  const filteredInactive = inactive.filter((item) => {
    if (catObj.ids && !catObj.ids.has(item.id)) return false;
    if (!query) return true;
    const shortName = (KR_READY_SHORT_NAMES[item.id] || "").toLowerCase();
    return item.name.toLowerCase().includes(query) || shortName.includes(query);
  });
  const ready = krReadyItems(snapshot);
  const shelves = `<section class="ready-panel" aria-labelledby="essentials-shelf"><div class="shelf-head"><h3 id="essentials-shelf" tabindex="-1">기본 비축 물품 <span>완비 ${ready.filter((item) => !krIsSelectable(item)).length}종</span></h3></div>${krReadyGrid(snapshot, escape, essentials, editing)}</section>`;
  if (!optional.length) return shelves;
  const categoryBar = `<div class="opt-toolbar"><div class="opt-cats" role="group" aria-label="선택 물품 분류">${KR_OPTIONAL_CATEGORIES.map((cat) =>
    `<button type="button" data-opt-cat="${cat.id}" aria-pressed="${optCategory === cat.id}">${cat.label}</button>`).join("")}</div><input id="opt-search" type="search" placeholder="품목 검색..." aria-label="미사용 선택 물품 검색" value="${escape(optSearch)}"></div>`;
  return shelves + `<section class="ready-panel" aria-labelledby="optional-shelf-title"><div class="shelf-head"><h3 id="optional-shelf-title">선택 물품 <span>사용 중 ${active.length}종 · 완비 ${ready.filter(krIsSelectable).length}종</span></h3></div>
    ${active.length ? krReadyGrid(snapshot, escape, active, editing) : '<p class="ready-empty">표시할 선택 물품이 없습니다.</p>'}
    ${inactive.length && filter === "all" ? `<details id="optional-shelf" ${showInactive ? "open" : ""}><summary>아직 사용하지 않는 물품 ${inactive.length}종 보기</summary>${categoryBar}${krReadyGrid(snapshot, escape, filteredInactive, editing)}</details>` : ""}</section>`;
}

const KR_RECORD_MISSIONS = [
  { id: "water", title: "마실 물 기록", ids: ["drinking-water"], mode: "all", art: KR_READY_PICTOGRAMS["drinking-water"] },
  { id: "food", title: "먹을거리 기록", ids: ["shelf-stable-meal", "canned-food", "self-heating-ration"], mode: "any", art: KR_READY_PICTOGRAMS["canned-food"] },
  { id: "light", title: "빛·전원 기록", ids: ["flashlight", "batteries", "power-bank"], mode: "any", art: KR_READY_PICTOGRAMS.flashlight },
  { id: "care", title: "구급품 기록", ids: ["first-aid-kit"], mode: "all", art: KR_READY_PICTOGRAMS["first-aid-kit"] },
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

function krAddMonths(isoDate, months) {
  const base = isoDate ? new Date(`${isoDate}T00:00:00Z`) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  base.setUTCMonth(base.getUTCMonth() + months);
  return base.toISOString().slice(0, 10);
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
    this._optCategory = "all";
    this._optSearch = "";
    let savedView;
    try { savedView = window.localStorage?.getItem("kr_survival_kit_view"); } catch { /* optional */ }
    this._viewMode = savedView === "3d" ? "3d" : "2d";
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
    this._stop3D();
  }

  _stop3D() {
    if (this._engine3d) {
      this._engine3d.destroy();
      this._engine3d = null;
    }
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
    const weather = this.shadowRoot.querySelector("#local-weather");
    const entityId = this._config?.weather_entity;
    const validEntity = typeof entityId === "string" && /^weather\.[a-z0-9_]+$/.test(entityId);
    if (weather) weather.hidden = !validEntity;
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
    const draftIcon = draftItem ? (KR_READY_PICTOGRAMS[draftItem.id] || "") : "";
    const edit = this._draft && draftItem ? `<form id="editor"><div class="dialog-head"><span class="dialog-art" aria-hidden="true">${draftIcon}</span><div><h3 id="item-dialog-title" tabindex="-1">${escape(draftItem.name)} 수정</h3><p class="dialog-status">현재 ${escape(krStockText(draftItem, draftItem.status.usable))} · ${states[draftItem.status.state]} · 실사 ${escape(draftItem.status.verified_on || "없음")}${draftItem.status.next_review_on ? ` · 다음 ${escape(draftItem.status.next_review_on)}` : ""}</p></div></div>` +
      (draftItem.status.target != null ? `<p class="recommendation">${people}인 가구 목표 <strong>${escape(krStockText(draftItem, draftItem.status.target))}</strong></p>` : "") +
      (draftItem.examples ? `<p class="item-note">${escape(draftItem.examples)}</p>` : "") +
      (draftItem.note && !noteCoveredByBasis ? `<p class="item-note">${escape(draftItem.note)}</p>` : "") +
      (draftRecommendation?.basis ? `<details class="item-reference"><summary>품목 참고 기준</summary><p>${escape(draftRecommendation.basis)}</p></details>` : "") +
      (this._draft.lots.length > 1 ? `<p class="item-note">이전에 저장한 날짜별 기록입니다. 각 수량을 수정할 수 있습니다.</p>` : "") +
      this._draft.lots.map((lot, index) =>
        `<fieldset class="lot-edit"><legend>${this._draft.lots.length > 1 ? `기존 재고 ${index + 1}` : "수량과 날짜"}</legend>` +
        (lot.capacity !== undefined
          ? `<div class="preset-row" role="group" aria-label="생수 빠른 입력"><button type="button" class="preset-btn" data-water-preset="2:6">2L × 6병</button><button type="button" class="preset-btn" data-water-preset="2:12">2L × 12병</button><button type="button" class="preset-btn" data-water-preset="0.5:20">500ml × 20병</button></div>` +
            `<div class="field-pair"><label>병 용량 (L)<input class="capacity" type="number" min="0.001" max="1000000" step="0.001" value="${escape(lot.capacity)}" required></label>` +
            `<label>병 수 (병)<input class="bottle-count" type="number" min="0" max="1000000000" step="1" value="${escape(lot.count)}" required></label></div>` +
            `<output class="lot-total" aria-live="polite"></output>`
          : `<label>${draftItem.id === "drinking-water" ? "보유량 합계 (L)" : `보유 수량 (${escape(krStockUnit(draftItem))})`}<div class="qty-row"><input class="quantity" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(lot.quantity)}" required><button type="button" class="step-btn" data-step="-1" aria-label="1 빼기">−1</button><button type="button" class="step-btn" data-step="1" aria-label="1 더하기">+1</button><button type="button" class="step-btn" data-step="5" aria-label="5 더하기">+5</button></div></label>`) +
        `<div class="field-pair"><label>입고일<input class="received-on" type="date" value="${escape(lot.received_on || snapshot.today || "")}"></label>` +
        (draftItem.date_kind === "expiry" ? `<label>${escape(krDateLabel(draftItem))}<input class="expiry" type="date" value="${escape(lot.expires_on || "")}" aria-describedby="expiry-help"></label>` : `<div></div>`) + `</div>` +
        (draftItem.date_kind === "expiry" ? `<div class="preset-row" role="group" aria-label="기한 빠른 설정"><button type="button" class="preset-btn" data-exp-months="6">+6개월</button><button type="button" class="preset-btn" data-exp-months="12">+1년</button><button type="button" class="preset-btn" data-exp-months="24">+2년</button></div>` : "") +
        (lot.label_check_on ? `<small class="label-check">포장 기한 확인일 ${escape(lot.label_check_on)}</small>` : "") +
        `</fieldset>`
      ).join("") +
      (draftItem.date_kind === "expiry" ? `<p id="expiry-help" class="item-note">포장 기한이 여러 개면 가장 빠른 날짜를 입력하세요. 비우면 ${labelCheckDays}일 뒤 확인 알림이 뜹니다.</p>` : `<p class="item-note">저장한 날을 마지막 실사일로 기록합니다.</p>`) +
      `<label for="target">목표량 (${escape(krStockUnit(draftItem))})</label><input id="target" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(this._draft.target)}" placeholder="${draftItem.status.recommended_target == null ? "미설정" : escape(krStockText(draftItem, draftItem.status.recommended_target)) + " 자동"}">` +
      `<details id="item-settings" ${this._draft.settingsOpen ? "open" : ""}><summary>점검 및 관리 설정</summary>` +
      `<label class="check-row"><input id="applicable" type="checkbox" ${this._draft.applicable ? "checked" : ""}> 우리 집에서 관리</label>` +
      `<label for="review-interval">재고 점검 주기 (일)</label><input id="review-interval" type="number" min="1" max="3650" step="1" value="${escape(this._draft.review_interval_days)}" placeholder="기본 ${escape(snapshot.default_review_interval_days ?? 30)}일"><p class="item-note">마지막 저장일로부터 이 기간이 지나면 실사 필요로 표시됩니다.</p></details>` +
      `<div class="actions"><button type="submit" class="primary">저장</button><button type="button" id="cancel">취소</button>` +
      `<button type="button" id="delete" class="danger">기록 삭제</button></div></form>` : "";
    const counts = snapshot?.summary;
    const filters = [["all", "전체", null], ["shortage", "부족", counts?.shortage_count],
      ["needs_check", "확인 필요", counts?.needs_check_count], ["expiring", "기한 임박", counts?.expiring_count]];
    const signals = counts ? `<div class="signals" aria-label="선반 필터">${filters.map(([id, label, count]) =>
      `<button type="button" data-status="${id}" aria-pressed="${this._statusFilter === id}"><span>${label}</span>${count == null ? "" : `<strong>${count}</strong>`}</button>`).join("")}</div>` : "";
    const missionSignature = krMissionState(snapshot).map((mission) => mission.complete).join("");
    const animateMission = Boolean(snapshot && missionSignature !== this._missionSignature);
    this._missionSignature = missionSignature;
    const stage3d = this._viewMode === "3d" && snapshot ? `<section class="warehouse-3d-stage" aria-label="3D 입체 창고 뷰"><div class="warehouse-3d-bar"><div class="controls" role="group" aria-label="창고 구역"><button type="button" data-3d-zone="all" aria-pressed="true">전체 창고</button><button type="button" data-3d-zone="essentials" aria-pressed="false">기본 비축 랙</button><button type="button" data-3d-zone="optional" aria-pressed="false">선택 물품 랙</button></div><div class="controls"><button type="button" id="toggle-3d-spin" aria-pressed="true">자동 회전</button><button type="button" id="reset-3d-cam">시점 초기화</button></div></div><canvas id="warehouse-3d-canvas"></canvas><div id="warehouse-3d-tooltip" role="status" hidden></div></section>` : "";
    this._stop3D();
    this.toggleAttribute?.("data-view", this._viewMode === "3d");
    if (this._viewMode === "3d") this.setAttribute?.("data-view", "3d");
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color,#173048);font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif}
      *{box-sizing:border-box}
      ha-card{display:block;padding:0;max-width:1480px;margin:0 auto;overflow:hidden;background:var(--card-background-color,#fff);border-radius:16px;box-shadow:0 24px 64px rgba(4,14,24,.32)}
      h2{font-size:1.25rem;margin:0 0 .3rem}h3{font-size:1rem;margin:0 0 .35rem}h4{font-size:.95rem;margin:1rem 0 .4rem}
      p{margin:.35rem 0;color:var(--secondary-text-color,#405564);line-height:1.5}
      button{font:inherit;min-height:44px;padding:.45rem .75rem;border:1px solid #3d6f82;background:transparent;color:var(--primary-text-color,#173048);border-radius:8px;cursor:pointer;transition:border-color .15s ease,transform .12s ease}
      button:hover{background:rgba(25,127,131,.14)}button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #f0b24d;outline-offset:2px}
      .primary{background:#157a82;color:#fff;border-color:#1c9aa3;font-weight:700}.danger{border-color:#8a454a;color:#ffb4b8}
      .message{padding:.7rem .85rem;border-radius:8px;background:rgba(210,139,36,.18);border-left:3px solid #e0a950;line-height:1.5;margin-bottom:.75rem}
      .recommendation{padding:.55rem .75rem;background:rgba(25,127,131,.14);border:1px solid rgba(110,210,220,.25);border-radius:8px;font-size:.92rem}
      .item-note{font-size:.84rem;opacity:.88}
      label{display:block;margin:.65rem 0 .25rem;font-weight:600;font-size:.9rem}
      label.check-row{display:flex;align-items:center;gap:.5rem;margin:.6rem 0;cursor:pointer}
      input:not([type=checkbox]){box-sizing:border-box;width:100%;min-height:42px;padding:.45rem .6rem;font:inherit;color:var(--primary-text-color,#173048);background:var(--card-background-color,#fff);border:1px solid #5c7a8a;border-radius:8px}
      .lot-edit{min-inline-size:0;border:1px solid var(--divider-color,#3b5868);border-radius:10px;padding:.75rem;margin:.65rem 0;background:rgba(0,0,0,.06)}
      .lot-edit legend{font-weight:750;font-size:.88rem;padding:0 .35rem}.lot-total{display:block;margin-top:.45rem;font-weight:750;color:var(--kr-accent,#8fe6ee)}
      .field-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}.qty-row{display:flex;gap:.35rem;align-items:center}.qty-row input{flex:1;min-width:0}
      .step-btn,.preset-btn{min-height:36px;padding:.25rem .6rem;font-size:.82rem;font-weight:700;border-radius:7px;background:rgba(120,190,210,.12);border-color:rgba(120,190,210,.35)}
      .preset-row{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 .2rem}.label-check{display:block;margin-top:.35rem;font-size:.8rem;color:#ffd08a}
      .actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.85rem}.actions .danger{margin-inline-start:auto}
      details{border-top:1px solid var(--divider-color,#3a5766);margin-top:.5rem}summary{min-height:44px;padding:.65rem .25rem;cursor:pointer;font-weight:700}

      .hero{position:relative;display:block;padding:clamp(1.1rem,2.6vw,2rem);color:#edf7f8;background:radial-gradient(circle at 85% 10%,rgba(67,188,207,.16),transparent 46%),linear-gradient(135deg,#102433 0%,#0b1925 60%,#09131d 100%);transition:background .5s ease}
      .hero[data-daypart="day"]{background:radial-gradient(circle at 85% 10%,rgba(90,205,222,.2),transparent 48%),linear-gradient(135deg,#17394c 0%,#0f2736 58%,#0b1b26 100%)}
      .hero[data-daypart="night"]{background:radial-gradient(circle at 85% 10%,rgba(54,154,189,.14),transparent 45%),linear-gradient(135deg,#0f2030 0%,#091522 62%,#071019 100%)}
      .hero::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(130,220,235,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(130,220,235,.035) 1px,transparent 1px);background-size:28px 28px}
      .hero::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0}
      .hero[data-weather="rain"]::after{opacity:.18;background:repeating-linear-gradient(108deg,transparent 0 26px,#9fdfe8 27px 28px,transparent 29px 49px);animation:krSkyDrift 18s linear infinite}
      .hero[data-weather="snow"]::after{opacity:.17;background:radial-gradient(circle at 15% 22%,#fff 0 2px,transparent 3px),radial-gradient(circle at 78% 55%,#fff 0 2px,transparent 3px),radial-gradient(circle at 46% 81%,#fff 0 2px,transparent 3px);background-size:110px 100px;animation:krSkyDrift 28s linear infinite}
      .hero>*{position:relative;z-index:1}
      .hero-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .hero h2{font-size:clamp(1.45rem,2.6vw,2.05rem);line-height:1.18;letter-spacing:-.035em;margin:0;color:#f3fafb}
      .hero p{color:#c6d9df;max-width:40rem}.hero .hero-copy{font-size:.98rem;line-height:1.55;margin-top:.5rem}
      .atmosphere{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.atmosphere span{display:inline-flex;min-height:36px;align-items:center;padding:4px 11px;border:1px solid rgba(130,205,220,.38);border-radius:8px;background:rgba(7,22,34,.62);color:#dcf3f7;font-size:.86rem;font-weight:700;font-variant-numeric:tabular-nums}
      .atmosphere span[hidden]{display:none}
      #refresh{min-width:44px;min-height:36px;padding:0 .5rem;font-size:1.15rem;color:inherit;border-color:var(--kr-line,rgba(130,205,220,.45));background:rgba(7,22,34,.5)}

      .signals{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem}
      .signals button{display:flex;gap:.7rem;align-items:baseline;min-width:6.8rem;justify-content:space-between;background:rgba(10,27,40,.6);color:#eef7f8;border:1px solid rgba(110,165,185,.42);border-radius:10px;padding:.5rem .8rem}
      .signals strong{font-size:1.22rem;font-variant-numeric:tabular-nums;color:#8be4ee}
      .signals button:hover,.signals button[aria-pressed="true"]{background:rgba(42,112,135,.42);border-color:#8be4ee}

      .status-disclosures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;margin-top:.85rem;align-items:start}
      .compact-detail{min-width:0;border:1px solid var(--kr-line,rgba(98,154,176,.38));border-radius:12px;background:var(--kr-surface,rgba(13,34,48,.78))}
      .compact-detail summary{display:flex;align-items:center;flex-wrap:wrap;gap:.35rem .65rem;padding:.55rem .8rem;min-height:44px;cursor:pointer;list-style:none}
      .compact-detail summary::-webkit-details-marker{display:none}
      .compact-detail summary::after{content:"＋";margin-inline-start:auto;color:var(--kr-accent,#8fe6ee);font-weight:700}
      .compact-detail[open] summary::after{content:"−"}
      .rank-badge{padding:.16rem .52rem;border-radius:6px;color:#111922;background:var(--rank-color);font-size:.84rem;font-weight:800}
      .stock-score{font-size:.84rem;font-variant-numeric:tabular-nums;color:var(--kr-muted,#cfe8ec)}
      .rank-detail,.mission-detail{padding:.15rem .8rem .8rem}
      .rank-detail progress{display:block;width:100%;height:.55rem;accent-color:var(--kr-accent,#8fe6ee);border-radius:999px}
      .rank-detail p,.mission-detail p{font-size:.82rem;color:var(--kr-muted,#c7e2e7)}

      .ready-panel{margin-top:1.15rem;padding:1rem;border:1px solid rgba(112,174,194,.34);border-radius:14px;background:rgba(12,33,46,.72);box-shadow:inset 0 1px 0 rgba(165,235,245,.1)}
      .shelf-head{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.75rem;flex-wrap:wrap}
      .ready-panel h3{margin:0;color:#ecf8f9;font-size:1.02rem;letter-spacing:-.02em}.ready-panel h3 span{color:#91e0ea;font-size:.88rem;font-weight:700;margin-left:.35rem;font-variant-numeric:tabular-nums}
      .ready-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:.52rem}
      .ready-item{min-width:0}
      .ready-item .shelf-edit{position:relative;display:flex;flex-direction:column;align-items:center;gap:.3rem;width:100%;height:100%;min-width:0;padding:.45rem .38rem .6rem;border:1px solid rgba(115,172,190,.36);border-radius:12px;background:linear-gradient(180deg,rgba(32,67,86,.86) 0%,rgba(20,45,60,.92) 100%);color:#f4fafa;text-align:center}
      .ready-item .shelf-edit:hover:not(:disabled){border-color:#9fe8f2;transform:translateY(-2px);background:linear-gradient(180deg,rgba(44,88,110,.95) 0%,rgba(26,56,74,.95) 100%)}
      .ready-item .shelf-edit:focus-visible{outline:3px solid #ffd899;outline-offset:2px}
      .shelf-edit:disabled{cursor:default}
      .tile-top{display:flex;align-items:center;justify-content:space-between;width:100%;gap:4px;min-height:18px}
      .tile-led{width:7px;height:7px;border-radius:50%;background:#6b8a99;flex-shrink:0}
      .ready-item[data-tone="ok"] .tile-led{background:#52f2a8;box-shadow:0 0 8px #52f2a8aa}
      .ready-item[data-tone="alert"] .tile-led{background:#ffd166;box-shadow:0 0 8px #ffd16699}
      .ready-item[data-tone="warn"] .tile-led{background:#ff7b7b;box-shadow:0 0 8px #ff7b7baa}
      .dday-tag{font-size:.66rem;font-weight:800;padding:1px 5px;border-radius:4px;background:rgba(255,193,94,.22);color:#ffe09c;font-variant-numeric:tabular-nums}
      .shelf-action{margin-inline-start:auto;padding:1px 5px;border-radius:4px;color:rgba(220,245,250,.72);font-size:.68rem;line-height:1.3;opacity:.78}
      .ready-item .shelf-edit:hover .shelf-action{opacity:1;color:#fff}
      .ready-art{display:grid;place-items:center;width:54px;height:54px;border-radius:14px;background:rgba(9,25,36,.42);border:1px solid rgba(135,205,220,.16);margin:.1rem 0}
      .ready-art svg{display:block;width:40px;height:40px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.35))}
      .ready-item[data-complete="true"] .shelf-edit{border-color:rgba(116,232,184,.58);background:linear-gradient(180deg,rgba(28,84,78,.86) 0%,rgba(19,56,54,.94) 100%)}
      .ready-item[data-complete="true"] .ready-art{border-color:rgba(128,240,192,.35);background:rgba(16,58,52,.55)}
      .ready-name{font-size:.82rem;font-weight:750;line-height:1.25;overflow-wrap:anywhere}
      .ready-number{font-size:.76rem;font-weight:650;color:#cde7eb;line-height:1.25;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
      .stock-meter{display:block;width:86%;height:5px;border-radius:999px;background:rgba(8,22,32,.65);overflow:hidden;margin-top:auto}.stock-meter span{display:block;height:100%;background:#76d9e8;border-radius:inherit;transition:width .3s ease}.ready-item[data-complete="true"] .stock-meter span{background:#7cf2b6}
      .stock-label{font-size:.71rem;font-weight:700;color:#d6edf0}
      .ready-empty{margin:.15rem 0!important;padding:.7rem 0;color:#cfe4e8!important;line-height:1.55}
      .view-switch{display:inline-flex;border:1px solid rgba(130,205,220,.38);border-radius:8px;overflow:hidden;background:rgba(7,22,34,.5)}
      .view-switch button{min-height:36px;padding:.25rem .6rem;border:0;border-radius:0;font-size:.8rem;font-weight:700;color:#c9e6ec}
      .view-switch button[aria-pressed="true"]{background:var(--kr-accent,#8fe6ee);color:var(--kr-accent-ink,#0b2029)}
      .warehouse-3d-stage{position:relative;margin-top:1.15rem;border:1px solid rgba(112,174,194,.42);border-radius:14px;overflow:hidden;background:#07121c}
      .warehouse-3d-bar{display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap;padding:.6rem .85rem;background:rgba(10,27,40,.85);border-bottom:1px solid rgba(112,174,194,.28)}
      .warehouse-3d-bar .controls{display:flex;gap:.35rem;flex-wrap:wrap}
      .warehouse-3d-bar button{min-height:34px;padding:.25rem .6rem;font-size:.78rem;border-radius:7px;color:#dff5f8;border-color:rgba(112,174,194,.4)}
      .warehouse-3d-bar button[aria-pressed="true"]{background:var(--kr-accent,#8fe6ee);color:var(--kr-accent-ink,#0b2029);border-color:var(--kr-accent,#8fe6ee);font-weight:700}
      #warehouse-3d-canvas{display:block;width:100%;height:clamp(380px,56vh,560px);touch-action:none}
      #warehouse-3d-tooltip{position:absolute;z-index:5;pointer-events:none;padding:.45rem .65rem;border-radius:8px;background:rgba(8,22,34,.92);border:1px solid #8fe6ee;color:#eef9fb;font-size:.78rem;box-shadow:0 8px 24px rgba(0,0,0,.45);display:grid;gap:2px}
      #warehouse-3d-tooltip[hidden]{display:none}
      #warehouse-3d-tooltip small{color:#91e0ea;font-size:.7rem}

      .opt-toolbar{display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap;margin:.6rem 0 .75rem}
      .opt-cats{display:flex;flex-wrap:wrap;gap:.35rem}
      .opt-cats button{min-height:34px;padding:.25rem .65rem;font-size:.8rem;border-radius:999px;border-color:rgba(120,175,195,.35);color:inherit}
      .opt-cats button[aria-pressed="true"]{background:var(--kr-accent,#8fe6ee);color:var(--kr-accent-ink,#0d2229);border-color:var(--kr-accent,#8fe6ee);font-weight:700}
      #opt-search{width:min(14rem,100%);min-height:36px;padding:.3rem .65rem;font-size:.84rem;border-radius:999px;background:rgba(7,20,30,.45);color:inherit;border:1px solid rgba(120,175,195,.38)}

      #item-dialog{box-sizing:border-box;width:min(38rem,calc(100% - 24px));max-height:min(88dvh,54rem);margin:auto;padding:clamp(.95rem,3vw,1.45rem);overflow:auto;overscroll-behavior:contain;border:1px solid var(--kr-line,#4d778a);border-radius:16px;background:var(--kr-surface,#122431);color:var(--kr-text,#eef7f9);color-scheme:var(--kr-scheme,dark);box-shadow:0 24px 60px rgba(0,0,0,.65)}
      #item-dialog::backdrop{background:rgba(5,12,18,.78);backdrop-filter:blur(3px)}
      .dialog-head{display:flex;align-items:center;gap:.75rem;margin-bottom:.65rem}
      .dialog-art{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;background:rgba(120,200,220,.12);border:1px solid rgba(120,200,220,.28);flex-shrink:0}
      .dialog-art svg{width:34px;height:34px}
      #item-dialog h3{font-size:1.2rem;margin:0}
      .dialog-status{font-size:.82rem;margin:.2rem 0 0;color:var(--kr-muted,#b8d6dc)}
      #item-dialog input{background:var(--kr-bg,#0c1923);color:inherit}
      #item-dialog button{color:inherit}
      #item-dialog button.primary{background:var(--kr-accent,#1b8d96);color:var(--kr-accent-ink,#fff);border-color:transparent}
      .shelf-message{font-size:.86rem;padding:.55rem .8rem;border-radius:8px;background:rgba(25,127,131,.18);margin-top:.65rem}
      .item-reference{margin:.45rem 0}

      .mission-head{display:flex;gap:.5rem 1rem;align-items:baseline;justify-content:space-between;flex-wrap:wrap}
      .mission-head strong{color:var(--kr-accent,#9ee9ea);font-size:.84rem}
      .mission-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.5rem;margin-top:.55rem}
      .mission-item{position:relative;display:grid;grid-template-columns:2.4rem minmax(0,1fr);gap:.15rem .5rem;align-items:center;min-width:0;padding:.5rem .65rem;border:1px solid rgba(90,145,165,.38);border-radius:10px;background:rgba(18,46,60,.7)}
      .mission-item.done{border-color:rgba(130,225,215,.62);background:rgba(26,76,88,.75)}
      .mission-art{grid-row:1/3;display:grid;place-items:center;font-size:1.2rem}.mission-art svg{width:30px;height:30px}
      .mission-title{font-size:.8rem;font-weight:700}.mission-state{font-size:.71rem;color:#c2dce0}
      .mission-progress{height:8px;margin:.55rem 0 .45rem;overflow:hidden;border:1px solid rgba(110,165,185,.45);border-radius:999px;background:rgba(10,30,42,.7)}.mission-progress span{display:block;height:100%;background:#7ce0de;border-radius:999px;transition:width .45s ease}
      .mission-item.done::after{content:"✓";position:absolute;right:.45rem;top:.35rem;display:grid;place-items:center;width:1rem;height:1rem;border-radius:50%;background:#bdf5ea;color:#114a5c;font-size:.68rem;font-weight:900}
      .mission-item.unlock .mission-art{animation:krMissionUnlock .5s ease-out both}

      @keyframes krSkyDrift{from{background-position:0 0}to{background-position:100px 180px}}
      @keyframes krMissionUnlock{from{transform:scale(.65);opacity:.25}to{transform:scale(1);opacity:1}}
      @media(prefers-reduced-motion:reduce){.hero,.mission-progress span,.ready-item .shelf-edit,.stock-meter span{transition:none!important}.hero[data-weather]::after,.mission-item.unlock .mission-art{animation:none!important}}
      @media(max-width:1100px){.ready-grid{grid-template-columns:repeat(8,minmax(0,1fr))}}
      @media(max-width:850px){.ready-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}
      @media(max-width:650px){.ready-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.mission-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.signals{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.35rem;margin-top:.7rem}.signals button{min-width:0;display:grid;justify-items:center;justify-content:center;align-content:center;gap:.12rem;padding:.35rem .2rem;font-size:.76rem;text-align:center}.signals strong{font-size:1rem}.status-disclosures{grid-template-columns:1fr}.field-pair{grid-template-columns:1fr}}
      @media(max-width:450px){.ready-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ready-panel{padding:.75rem}}
      @media(max-width:400px){.mission-item{grid-template-columns:1fr;text-align:center}.mission-art{grid-row:auto}}

      :host([data-kr-themed]){color:var(--kr-text);--primary-text-color:var(--kr-text);--secondary-text-color:var(--kr-muted);--divider-color:var(--kr-line)}
      :host([data-kr-themed]) ha-card{background:var(--kr-bg)}
      :host([data-kr-themed]) .hero{color:var(--kr-text);background:radial-gradient(ellipse at top right,var(--kr-glow),transparent 58%),var(--kr-bg)}
      :host([data-kr-themed]) .hero h2,:host([data-kr-themed]) .hero p,:host([data-kr-themed]) .atmosphere,:host([data-kr-themed]) .atmosphere span,:host([data-kr-themed]) .ready-panel h3,:host([data-kr-themed]) .ready-name{color:var(--kr-text)}
      :host([data-kr-themed]) .atmosphere span,:host([data-kr-themed]) #refresh,:host([data-kr-themed]) .ready-panel,:host([data-kr-themed]) .signals button,:host([data-kr-themed]) .ready-item .shelf-edit,:host([data-kr-themed]) .mission-item{background:var(--kr-surface);border-color:var(--kr-line);color:var(--kr-text)}
      :host([data-kr-themed]) .signals button[aria-pressed="true"],:host([data-kr-themed]) .ready-item .shelf-edit:hover:not(:disabled){background:var(--kr-glow);border-color:var(--kr-accent)}
      :host([data-kr-themed]) .ready-panel h3 span,:host([data-kr-themed]) .signals button strong,:host([data-kr-themed]) .mission-head strong,:host([data-kr-themed]) .mission-art,:host([data-kr-themed]) .shelf-action{color:var(--kr-accent)}
      :host([data-kr-themed]) .ready-number,:host([data-kr-themed]) .stock-label,:host([data-kr-themed]) .mission-state,:host([data-kr-themed]) .ready-empty{color:var(--kr-muted)!important}
      :host([data-kr-themed]) .stock-meter,:host([data-kr-themed]) .mission-progress{background:var(--kr-line)}:host([data-kr-themed]) .stock-meter span,:host([data-kr-themed]) .mission-progress span{background:var(--kr-accent)}
      :host([data-kr-themed]) .ready-item[data-complete="true"] .shelf-edit,:host([data-kr-themed]) .mission-item.done{border-color:var(--kr-accent)}
      :host([data-kr-themed]) .ready-art,:host([data-kr-themed]) .dialog-art{background:#122534;border-color:var(--kr-line)}
      :host([data-kr-themed]) #opt-search{background:var(--kr-bg);border-color:var(--kr-line)}
    </style><ha-card>${edit ? `<dialog id="item-dialog" aria-labelledby="item-dialog-title">${this._message ? `<p class="message" role="status">${escape(this._message)}</p>` : ""}${edit}</dialog>` : ""}<section class="hero" aria-label="비축 관리 개요"><div class="hero-intro"><div class="hero-head"><h2>우리 집 비축 관리</h2><div class="atmosphere" aria-label="시각과 날씨"><span id="local-clock">--:--</span><span id="local-weather" hidden></span><div class="view-switch" role="group" aria-label="창고 보기"><button type="button" data-view-mode="2d" aria-pressed="${this._viewMode === "2d"}">2D 선반</button><button type="button" data-view-mode="3d" aria-pressed="${this._viewMode === "3d"}">3D 창고</button></div><button type="button" id="refresh" aria-label="재고 새로고침" title="재고 새로고침">↻</button></div></div>` +
      (!snapshot ? `<p class="hero-copy">${this._loadError ? "재고를 읽지 못했습니다. 새로고침으로 다시 시도하세요." : "재고를 불러오는 중입니다."}</p>` : "") +
      `${signals}</div><div class="status-disclosures">${krStockRankView(snapshot, this._rankOpen)}${krMissionView(snapshot, escape, animateMission, this._missionOpen)}</div>` +
      (!edit && this._message ? `<p class="shelf-message" role="status">${escape(this._message)}</p>` : "") +
      `${stage3d}${this._viewMode === "3d" && snapshot ? "" : krStockShelves(snapshot, escape, this._optionalShelfOpen, Boolean(this._draft), this._statusFilter, this._optCategory, this._optSearch)}</section></ha-card>`;
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
      if (output) {
        const update = () => {
          const capacity = krStockParse(draftItem, row.querySelector(".capacity").value);
          const count = krStockParse({}, row.querySelector(".bottle-count").value);
          const total = capacity * count;
          output.textContent = capacity > 0 && Number.isInteger(total) && total <= 1_000_000_000
            ? `합계 ${krStockText(draftItem, total)}` : "병 용량과 병 수를 확인하세요.";
        };
        row.addEventListener("input", update);
        update();
      }
      row.querySelectorAll("[data-water-preset]").forEach((btn) => btn.addEventListener("click", () => {
        const [cap, cnt] = btn.dataset.waterPreset.split(":");
        const capInput = row.querySelector(".capacity");
        const cntInput = row.querySelector(".bottle-count");
        if (capInput && cntInput) {
          capInput.value = cap;
          cntInput.value = cnt;
          row.dispatchEvent(new Event("input"));
        }
      }));
      row.querySelectorAll("[data-step]").forEach((btn) => btn.addEventListener("click", () => {
        const qtyInput = row.querySelector(".quantity");
        if (!qtyInput) return;
        const delta = Number(btn.dataset.step);
        const cur = Number(qtyInput.value || 0);
        qtyInput.value = String(Math.max(0, Math.round((cur + delta) * 1000) / 1000));
      }));
      row.querySelectorAll("[data-exp-months]").forEach((btn) => btn.addEventListener("click", () => {
        const expInput = row.querySelector(".expiry");
        if (!expInput) return;
        expInput.value = krAddMonths(snapshot?.today, Number(btn.dataset.expMonths));
      }));
    });
    this.shadowRoot.querySelector("#refresh")?.addEventListener("click", () => this._load());
    this.shadowRoot.querySelectorAll("[data-view-mode]").forEach((button) => button.addEventListener("click", () => {
      this._viewMode = button.dataset.viewMode === "3d" ? "3d" : "2d";
      try { window.localStorage?.setItem("kr_survival_kit_view", this._viewMode); } catch { /* optional */ }
      this._render();
      this.shadowRoot.querySelector(`[data-view-mode="${this._viewMode}"]`)?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => {
      this._statusFilter = button.dataset.status;
      this._render();
      this.shadowRoot.querySelector(`[data-status="${this._statusFilter}"]`)?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelectorAll("[data-opt-cat]").forEach((button) => button.addEventListener("click", () => {
      this._optCategory = button.dataset.optCat;
      this._render();
      this.shadowRoot.querySelector(`[data-opt-cat="${this._optCategory}"]`)?.focus({ preventScroll: true });
    }));
    this.shadowRoot.querySelector("#opt-search")?.addEventListener("input", (event) => {
      this._optSearch = event.target.value;
      const pos = event.target.selectionStart;
      this._render();
      const input = this.shadowRoot.querySelector("#opt-search");
      if (input) {
        input.focus({ preventScroll: true });
        input.setSelectionRange(pos, pos);
      }
    });
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
    const canvas3d = this.shadowRoot.querySelector("#warehouse-3d-canvas");
    if (canvas3d && typeof window !== "undefined") {
      const tooltip3d = this.shadowRoot.querySelector("#warehouse-3d-tooltip");
      const getTheme = () => {
        try { return window.localStorage?.getItem("kr_survival_kit_theme") || "black"; } catch { return "black"; }
      };
      const base = this._config?.asset_path ? `${this._config.asset_path.replace(/\/$/, "")}/` : KR_SCRIPT_BASE;
      import(`${base}kr-warehouse-3d.js`).then(({ KrWarehouseThreeEngine }) => {
        if (!this.shadowRoot.contains(canvas3d)) return;
        this._engine3d = new KrWarehouseThreeEngine(
          canvas3d, tooltip3d,
          () => this._snapshot, () => this._statusFilter,
          (item) => this._edit(item, false), getTheme,
        );
      }).catch((err) => {
        if (tooltip3d) {
          tooltip3d.hidden = false;
          tooltip3d.textContent = `3D 엔진 로드 실패: ${err.message || "브라우저가 WebGL을 지원하지 않습니다."}`;
        }
      });
      this.shadowRoot.querySelectorAll("[data-3d-zone]").forEach((btn) => btn.addEventListener("click", () => {
        if (!this._engine3d) return;
        this._engine3d.zone = btn.dataset["3dZone"];
        this._engine3d.rebuild();
        this.shadowRoot.querySelectorAll("[data-3d-zone]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      }));
      this.shadowRoot.querySelector("#toggle-3d-spin")?.addEventListener("click", (e) => {
        if (!this._engine3d) return;
        this._engine3d.autoRotate = !this._engine3d.autoRotate;
        e.currentTarget.setAttribute("aria-pressed", String(this._engine3d.autoRotate));
      });
      this.shadowRoot.querySelector("#reset-3d-cam")?.addEventListener("click", () => {
        this._engine3d?.resetCamera();
      });
    }
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
    this._activeSiren = null;
    this._audioCtx = null;
    this._sirenTimer = null;
  }

  disconnectedCallback() {
    this._stopSiren();
  }

  _stopSiren() {
    if (this._sirenTimer) {
      window.clearInterval(this._sirenTimer);
      this._sirenTimer = null;
    }
    if (this._audioCtx) {
      try { this._audioCtx.close(); } catch { /* ignore */ }
      this._audioCtx = null;
    }
    this._activeSiren = null;
  }

  _playSiren(kind) {
    if (this._activeSiren === kind) {
      this._stopSiren();
      this._render();
      return;
    }
    this._stopSiren();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    this._audioCtx = ctx;
    this._activeSiren = kind;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const scheduleCycle = () => {
      const now = ctx.currentTime;
      if (kind === "air-raid") {
        // Wailing wave: 320Hz -> 780Hz (2.8s) -> 320Hz (2.2s)
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(780, now + 2.8);
        osc.frequency.linearRampToValueAtTime(320, now + 5.0);
        gain.gain.setValueAtTime(0.08, now);
      } else if (kind === "civil-warning") {
        // Steady flat tone: 540Hz continuous
        osc.frequency.setValueAtTime(540, now);
        gain.gain.setValueAtTime(0.08, now);
      } else if (kind === "cbrn-alert") {
        // Two-tone alternating alert
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(480, now + 0.5);
        osc.frequency.setValueAtTime(660, now + 1.0);
        osc.frequency.setValueAtTime(480, now + 1.5);
        gain.gain.setValueAtTime(0.08, now);
      } else {
        // Nuclear urgent rapid pulse
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.setValueAtTime(0.0, now + 0.25);
        gain.gain.setValueAtTime(0.09, now + 0.45);
        gain.gain.setValueAtTime(0.0, now + 0.7);
      }
    };

    scheduleCycle();
    osc.start();
    const period = kind === "air-raid" ? 5000 : kind === "cbrn-alert" ? 2000 : kind === "nuclear-alert" ? 900 : 2000;
    this._sirenTimer = window.setInterval(scheduleCycle, period);
    this._render();
  }

  setConfig(config) {
    this._assetPath = config.asset_path || "/local";
    this._showInventoryLink = config.show_inventory_link !== false;
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
    const alertTone = scenario.kind === "민방공 경보" ? "danger" : scenario.kind === "생활 기반 장애" ? "warn" : "info";
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:#e7f3f6;font-family:"Malgun Gothic","Apple SD Gothic Neo",system-ui,sans-serif;--cyan:#91d9e5;--line:#345064;--muted:#b5c9d1}
      *{box-sizing:border-box}ha-card{display:block;overflow:hidden;background:#101c28;color:inherit;border:0;border-radius:0;min-height:100vh}
      .shell{max-width:1500px;margin:auto;padding:clamp(18px,3vw,48px)}.hero{position:relative;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(250px,.65fr);gap:24px;align-items:center;overflow:hidden;padding:clamp(24px,4vw,58px);min-height:280px;border:1px solid #416274;border-radius:22px;background:radial-gradient(circle at 78% 38%,#28627a 0,#183c50 23%,transparent 49%),linear-gradient(130deg,#142b3b,#0e1925 70%)}
      .hero:after{content:"";position:absolute;right:-70px;top:-175px;width:500px;height:500px;border:1px solid #6bb8ca55;border-radius:50%;box-shadow:0 0 0 42px #5bb4cb12,0 0 0 94px #5bb4cb0b;pointer-events:none}.hero-content{z-index:1}.hero h2{font-size:clamp(2rem,4vw,3.8rem);line-height:1.16;letter-spacing:-.055em;margin:0 0 18px}.hero p{max-width:58ch;font-size:clamp(1rem,1.3vw,1.2rem);line-height:1.72;margin:0;color:#d3e8ed}.hero strong{color:#fff}.hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.hero-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 17px;border:1px solid #82c8d9;border-radius:10px;color:#e7f8fb;text-decoration:none;font-weight:700;background:#21566c}.hero-actions a.secondary{background:#152c3b;border-color:#537487}.hero-actions a:hover{text-decoration:underline;background:#2c7189}
      .orb{z-index:1;justify-self:center;display:grid;place-items:center;width:min(26vw,230px);aspect-ratio:1;border-radius:50%;border:1px solid #9de2ea77;background:radial-gradient(circle,#9bdce425 0 23%,#092837 24% 27%,transparent 28%),repeating-radial-gradient(circle,#83d9e42b 0 1px,transparent 1px 37px);box-shadow:inset 0 0 45px #57b9d12c,0 0 90px #3b9ecb33;transform:rotateX(24deg) rotateZ(-12deg)}.orb svg{width:42%;filter:drop-shadow(0 7px 9px #0008)}
      .layout{display:grid;grid-template-columns:minmax(210px,270px) minmax(0,1fr);gap:24px;margin-top:24px}.rail,.action,.timeline,.references{border:1px solid var(--line);border-radius:18px;background:#172938}.rail{padding:21px;align-self:start}.rail h2,.timeline h2{font-size:1.2rem;letter-spacing:-.025em;margin:0 0 17px}.nav-group+.nav-group{margin-top:22px}.nav-group h3{font-size:.85rem;color:var(--muted);font-weight:600;margin:0 0 9px}.nav-items{display:grid;gap:7px}.nav-items button,.sheet-tabs button{cursor:pointer;font:inherit;text-align:left;color:#dcecf0;border:1px solid transparent;border-radius:9px;background:transparent;min-height:45px;padding:10px 13px}.nav-items button:hover,.sheet-tabs button:hover{background:#28495a}.nav-items button.active{background:#235b6d;border-color:#78c9d9;color:#fff;font-weight:700;box-shadow:inset 3px 0 #9be4ee}.action{overflow:hidden}.action-top{padding:clamp(20px,3vw,36px);background:linear-gradient(135deg,#244b60,#1b3444 63%,#162939);border-bottom:1px solid var(--line)}
      .action[data-tone="danger"] .action-top{border-top:4px solid #ff8787}.action[data-tone="warn"] .action-top{border-top:4px solid #ffd166}.action[data-tone="info"] .action-top{border-top:4px solid #7ce0de}
      .action-top .kind{font-size:.84rem;font-weight:700;color:#bddde5;margin:0 0 11px}.action-top h2{font-size:clamp(1.7rem,2.7vw,2.65rem);letter-spacing:-.04em;margin:0 0 20px}.action-top h3{color:#a4e4ed;font-size:.88rem;font-weight:700;margin:0 0 9px}.first-action{font-size:clamp(1.15rem,1.6vw,1.45rem);font-weight:700;line-height:1.6;max-width:58ch;margin:0}.action-body{padding:clamp(20px,3vw,36px)}.action-body h3{font-size:1rem;margin:0 0 14px}.action-body ul{padding-left:1.3rem;margin:0;max-width:75ch}.action-body li,.action-body p{line-height:1.75;color:#d0e0e5;margin:0 0 12px}.action-body li:last-child{margin-bottom:0}.comms{margin-top:22px;padding:18px 20px;border-left:3px solid #8ed4dd;background:#213e4d;border-radius:0 9px 9px 0;line-height:1.7}.comms strong{display:block;color:#bdebf1;margin-bottom:4px}
      .action-body .household{margin:18px 0 0;padding:16px 18px;border:1px solid #527b8d;border-radius:10px;color:#effbfd;background:#244353;font-weight:700}
      .timeline{margin-top:24px;padding:clamp(22px,3vw,36px)}.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}.section-head p{color:var(--muted);margin:0 0 17px}.sheet-tabs{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:24px;border-bottom:1px solid var(--line);padding-bottom:14px}.sheet-tabs button{border-color:#446273;min-height:43px}.sheet-tabs button[aria-selected="true"]{background:#8bd2dd;color:#0d2430;border-color:#8bd2dd;font-weight:800}.sheet-intro{max-width:75ch;line-height:1.7;color:#c5d9df;margin:0 0 28px}.time-list{list-style:none;padding:0;margin:0}.time-row{display:grid;grid-template-columns:minmax(112px,158px) minmax(0,1fr);gap:20px}.time-rail{position:relative;border-right:1px solid #467487;padding:0 21px 25px 0}.time-dot{position:absolute;right:-5px;top:5px;width:9px;height:9px;border-radius:50%;background:#a5e8ed;box-shadow:0 0 0 5px #366779}.time-when{display:block;font-weight:800;color:#a6e1e9}.time-copy{padding-bottom:26px;max-width:78ch}.time-copy h4{font-size:1.06rem;margin:0 0 6px;color:#f2f8f9}.time-copy p{line-height:1.72;color:#c5d8df;margin:0}.time-row:last-child .time-rail{border-color:transparent}.time-row:last-child .time-copy{padding-bottom:0}
      .reference-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.reference-item{padding:18px;border:1px solid #466b7d;border-radius:12px;background:#1e3949}.reference-item span{color:#b4e5ea;font-size:.84rem;font-weight:700}.reference-item h4{margin:8px 0;color:#f2f8f9}.reference-item p{margin:0;line-height:1.7;color:#c5d8df}@media(max-width:700px){.reference-grid{grid-template-columns:1fr}}
      .references{padding:20px 25px;margin-top:24px}.references summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700}.references p{color:var(--muted);line-height:1.6}.references ul{columns:2;column-gap:30px;padding-left:1.2rem}.references li{break-inside:avoid;line-height:1.6;margin:0 0 10px}.references a{color:#a9e1ec}.references a:hover{text-decoration:none}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #f3c77b;outline-offset:3px}
      @media(max-width:760px){.hero{grid-template-columns:1fr;min-height:0}.orb{display:none}.layout{grid-template-columns:1fr}.rail{padding:18px}.nav-items{grid-template-columns:repeat(auto-fit,minmax(125px,1fr))}.references ul{columns:1}}@media(max-width:420px){.shell{padding:12px}.hero{padding:22px;border-radius:15px}.layout{gap:12px;margin-top:12px}.action-top,.action-body,.timeline{padding:20px}.timeline{margin-top:12px}.time-row{grid-template-columns:80px minmax(0,1fr);gap:13px}.time-rail{padding-right:12px}.time-when{font-size:.82rem}.time-copy{padding-bottom:22px}.rail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:14px}.rail h2{grid-column:1/-1;margin:0 0 4px}.nav-group,.nav-items{display:contents}.nav-group h3{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.nav-items button{min-height:42px;text-align:center;font-size:.84rem;padding:8px 2px}.references{margin-top:12px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
      .quiz-panel{margin-top:24px;border-radius:18px;padding:1.2rem clamp(1rem,2.4vw,2rem);border:1px solid var(--line);background:#172938;color:#e7f3f6}.quiz-panel h3{margin:0}.quiz-panel p{max-width:60rem}.quiz-head{display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap}.quiz-head span{font-size:.84rem;font-weight:700}.quiz-question{max-width:65rem;margin-top:1rem;padding:1rem;border:1px solid var(--divider-color,#9cabb2);border-radius:10px}.quiz-question small{color:var(--muted)}.quiz-question h4{font-size:1rem;line-height:1.5}.quiz-choices{display:grid;gap:.5rem}.quiz-choices button{text-align:left}.quiz-choices button[aria-pressed="true"]{border-color:#197f83;background:#dff2f1;color:#113d49;font-weight:700}.quiz-feedback{padding:.65rem .8rem;border-left:3px solid #197f83;background:#e5f3f2;color:#173b45!important}.quiz-feedback p{margin:.3rem 0;color:#173b45}.quiz-sources a{color:#075c72;text-decoration:underline;font-weight:700}.quiz-sources a:focus-visible{outline:3px solid #d28b24;outline-offset:2px}.quiz-nav{display:flex;justify-content:space-between;gap:.5rem;margin-top:.8rem}.quiz-nav button:disabled{opacity:.5;cursor:default}
      .quiz-panel button{font:inherit;color:#e7f3f6;background:#213e4d;border:1px solid #547b8e;border-radius:8px;padding:10px 12px;min-height:44px;cursor:pointer}.quiz-panel [data-quiz-reset]{margin-top:10px}
      .siren-box{margin-top:18px;padding:14px 16px;border:1px solid rgba(130,205,220,.38);border-radius:12px;background:rgba(12,30,44,.55)}
      .siren-box h4{margin:0 0 6px;font-size:.94rem;color:#9ee9ea}
      .siren-box p{margin:0 0 10px;font-size:.82rem;color:#c3dce2}
      .siren-row{display:flex;flex-wrap:wrap;gap:7px}
      .siren-row button{min-height:40px;padding:7px 12px;font-size:.84rem;font-weight:700;border-radius:8px;border:1px solid #568599;background:#193547;color:#eef8fa;cursor:pointer}
      .siren-row button[aria-pressed="true"]{background:#d94848;border-color:#ff9494;color:#fff}
      .siren-row button.stop{background:#2d3b45;border-color:#748b99}
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
    </style><ha-card><main class="shell"><header class="hero"><div class="hero-content"><h2>상황 안내</h2><p><strong>${esc(guide.official_first)}</strong> 받은 경보를 선택하면 첫 행동을 바로 확인할 수 있습니다.</p><div class="hero-actions"><a href="${esc(this._assetPath)}/kr-survival-kit-a4.pdf" target="_blank" rel="noopener">A4 행동 카드 열기</a><a class="secondary" href="${esc(this._assetPath)}/kr-survival-kit-offline.html" target="_blank" rel="noopener">오프라인 안내 열기</a>${this._showInventoryLink ? `<a class="secondary" href="/kr-survival-kit/home">비축 관리로</a>` : ""}</div></div><div class="orb" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 8 82 21v25c0 23-13 36-32 47C31 82 18 69 18 46V21z" fill="#7bc8d9" stroke="#dafaff" stroke-width="2"/><path d="M50 18 73 27v19c0 17-8 28-23 37-15-9-23-20-23-37V27z" fill="#22506a"/><path d="M50 30v34M33 47h34" stroke="#bbf1f3" stroke-width="7" stroke-linecap="round"/></svg></div></header>
    <div class="layout"><nav class="rail" aria-label="상황 선택"><h2>상황별 첫 행동</h2>${scenarioNav}</nav><section class="action" data-tone="${alertTone}" aria-live="polite"><div class="action-top"><p class="kind">${esc(scenario.kind)}</p><h2>${esc(scenario.title)}</h2><h3>먼저 할 일</h3><p class="first-action">${esc(scenario.first_action)}</p></div><div class="action-body"><h3>이어 확인할 일</h3>${detail}${household}<div class="siren-box"><h4>🔊 민방공 경보음 직접 들어보기 (체험용)</h4><p>실제 경보와 혼동되지 않도록 볼륨을 낮춰 테스트하세요. 버튼을 다시 누르면 소리가 멈춥니다.</p><div class="siren-row"><button type="button" data-siren="air-raid" aria-pressed="${this._activeSiren === "air-raid"}">공습경보 (파상음)</button><button type="button" data-siren="civil-warning" aria-pressed="${this._activeSiren === "civil-warning"}">경계경보 (연속음)</button><button type="button" data-siren="cbrn-alert" aria-pressed="${this._activeSiren === "cbrn-alert"}">화생방경보 (2단음)</button><button type="button" data-siren="nuclear-alert" aria-pressed="${this._activeSiren === "nuclear-alert"}">핵경보 (긴급 펄스)</button>${this._activeSiren ? `<button type="button" class="stop" data-siren-stop>■ 정지</button>` : ""}</div></div><div class="comms"><strong>전화·인터넷이 끊기면</strong>${esc(guide.communication_loss.first_action)} ${esc(guide.communication_loss.paper_note)}</div></div></section></div>
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
    this.shadowRoot.querySelectorAll("[data-siren]").forEach((button) => button.addEventListener("click", () => {
      this._playSiren(button.dataset.siren);
    }));
    this.shadowRoot.querySelector("[data-siren-stop]")?.addEventListener("click", () => {
      this._stopSiren();
      this._render();
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
      ? { guide_data: guide, asset_path, quiz_data: quiz, show_inventory_link: false }
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
