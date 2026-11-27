const KR_SCRIPT_BASE = (typeof document !== "undefined" && document.currentScript?.src)
  ? new URL(".", document.currentScript.src).href
  : "/kr_survival_kit_assets/";

const KR_SURVIVAL_GROUPS = {
  water: new Set(["drinking-water", "water-container", "insulated-bottle", "portable-water-filter", "water-sanitation-kit"]),
  food: new Set(["shelf-stable-meal", "canned-food", "self-heating-ration", "portable-stove", "butane-canister", "lighter", "solid-fuel", "manual-can-opener", "cooler-ice-pack", "long-storage-snacks", "infant-formula", "ready-to-feed-formula", "infant-feeding-supplies"]),
  power: new Set(["flashlight", "headlamp", "charging-cable", "batteries", "radio", "candles", "portable-solar-panel", "power-bank", "portable-power-station", "charging-cables", "door-alarm", "portable-radio-communication"]),
};

const KR_OPTIONAL_CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "custom", label: "직접 추가", match: (item) => item.custom === true },
  { id: "water_cook", label: "식수·식량·취사", ids: new Set(["mouthwash", "disposable-tableware", "plastic-wrap", "ice-packs", "water-container", "faucet-water-tank", "water-purification-tablets", "portable-stove", "butane-canister", "butane-torch", "self-heating-ration", "rice", "canned-food", "salt-jar", "honey-gift-set", "lighter", "solid-fuel", "manual-can-opener", "insulated-bottle", "cooler-ice-pack", "portable-water-filter", "long-storage-snacks", "water-sanitation-kit"]) },
  { id: "power_light", label: "전원·연료·통신", ids: new Set(["headlamp", "charging-cable", "radio", "candles", "home-solar-panel", "portable-solar-panel", "power-bank", "portable-power-station", "charging-cables", "portable-radio-communication", "door-alarm", "metal-fuel-can", "fuel-siphon-nozzle"]) },
  { id: "care_infant", label: "의료·유아", ids: new Set(["infant-medicine", "infant-supplies", "prescription-preparedness", "infant-formula", "ready-to-feed-formula", "infant-feeding-supplies", "child-id-card", "child-comfort-kit", "child-carrier"]) },
  { id: "gear_protect", label: "방호·위생·침구", ids: new Set(["emergency-blanket", "spare-shoes", "aluminum-tape", "cable-ties", "hand-warmers", "sleeping-bag", "large-plastic-bags", "warm-clothes", "raincoat", "masks", "gas-mask", "gas-mask-filter", "earplugs", "compressed-towel", "rubber-gloves", "rubber-boots", "sealing-tape", "portable-toilet", "toilet-coagulant", "cat-litter", "sanitation-bags", "thermal-mat", "hot-water-bag", "protective-goggles"]) },
  { id: "doc_move", label: "자산·서류·이동", ids: new Set(["important-documents", "window-locks", "storage-bin", "emergency-contact-card", "family-photo", "basic-documents", "door-window-locks", "lock-tools", "transport-cart", "emergency-payment-check", "cash-krw", "cash-usd", "crypto-cold-wallet"]) },
];

const KR_OPTIONAL_CATEGORIES_EN = {
  all: "All",
  custom: "Custom",
  water_cook: "Water · Food · Cook",
  power_light: "Power · Fuel · Comms",
  care_infant: "Medical · Infant",
  gear_protect: "Gear · Hygiene · Sleep",
  doc_move: "Assets · Docs · Move",
};

const KR_UNIT_EN = {
  "개": "ea", "병": "btl", "팩": "pk", "통": "can", "박스": "box", "상자": "box",
  "세트": "set", "켤레": "pair", "장": "pc", "롤": "roll", "봉": "bag", "권": "copy",
  "갑": "pack", "정": "tab", "포": "pouch", "원": "KRW", "달러": "USD", "개입": "pk",
};

const KR_UNIT_I18N = {
  en: KR_UNIT_EN,
  ja: { "개": "個", "병": "本", "팩": "パック", "통": "缶", "박스": "箱", "상자": "箱", "세트": "セット", "켤레": "足", "장": "枚", "롤": "ロール", "봉": "袋", "권": "冊", "갑": "箱", "정": "錠", "포": "包", "원": "KRW", "달러": "USD", "개입": "個入" },
  zh: { "개": "个", "병": "瓶", "팩": "包", "통": "罐", "박스": "箱", "상자": "箱", "세트": "套", "켤레": "双", "장": "张", "롤": "卷", "봉": "袋", "권": "本", "갑": "盒", "정": "片", "포": "袋", "원": "KRW", "달러": "USD", "개입": "包" },
  es: { "개": "ud", "병": "bot", "팩": "paq", "통": "lata", "박스": "caja", "상자": "caja", "세트": "set", "켤레": "par", "장": "ud", "롤": "rollo", "봉": "bolsa", "권": "ej", "갑": "paq", "정": "comp", "포": "sobre", "원": "KRW", "달러": "USD", "개입": "paq" },
  fr: { "개": "u.", "병": "bout", "팩": "paq", "통": "boîte", "박스": "boîte", "상자": "boîte", "세트": "lot", "켤레": "paire", "장": "pce", "롤": "roul", "봉": "sac", "권": "ex", "갑": "paq", "정": "comp", "포": "sachet", "원": "KRW", "달러": "USD", "개입": "paq" },
  de: { "개": "Stk", "병": "Fl", "팩": "Pck", "통": "Dose", "박스": "Karton", "상자": "Box", "세트": "Set", "켤레": "Paar", "장": "Stk", "롤": "Rolle", "봉": "Beutel", "권": "Ex", "갑": "Pck", "정": "Tabl", "포": "Btl", "원": "KRW", "달러": "USD", "개입": "Pck" },
};

function krStockScale(item) {
  return item.id === "drinking-water" ? 1000 : 1;
}

function krStockUnit(item, lang = "ko") {
  if (item.id === "drinking-water") return "L";
  if (lang === "ko") return item.unit;
  return KR_UNIT_I18N[lang]?.[item.unit] || KR_UNIT_EN[item.unit] || item.unit;
}

function krStockFormat(item, stored) {
  return String(Number(stored) / krStockScale(item));
}

function krStockText(item, stored, lang = "ko") {
  return `${krStockFormat(item, stored)} ${krStockUnit(item, lang)}`;
}

function krDateLabel(item, lang = "ko") {
  const koLabel = item.id === "drinking-water" ? "유통기한"
    : ["소비기한", "유통기한", "교체 점검일", "사용기한", "사용 권장기한"].includes(item.date_label)
      ? item.date_label : "유통기한 또는 소비기한";
  if (lang !== "en") return koLabel;
  return {
    "유통기한": "Expiration Date",
    "소비기한": "Use-by Date",
    "교체 점검일": "Replacement Check",
    "사용기한": "Use-by Date",
    "사용 권장기한": "Recommended Use-by",
    "유통기한 또는 소비기한": "Expiry / Use-by Date",
  }[koLabel] || "Expiry Date";
}

/** Quick expiry buttons sized to the product: batteries last years, medicine and food months to a few years. */
function krExpiryPresets(item, lang = "ko") {
  const yr = lang !== "ko" ? "y" : "년";
  const mo = lang !== "ko" ? "m" : "개월";
  if (item.date_label === "사용 권장기한") return [[36, `+3${yr}`], [60, `+5${yr}`], [120, `+10${yr}`]];
  if (item.date_label === "사용기한") return [[12, `+1${yr}`], [24, `+2${yr}`], [36, `+3${yr}`]];
  return [[6, `+6${mo}`], [12, `+1${yr}`], [24, `+2${yr}`]];
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
const KR_CUSTOM_PICTOGRAM = krSvg(`<rect x="10" y="10" width="28" height="28" rx="7" fill="#b8c0ff" fill-opacity=".22" stroke="#d6dbff" stroke-width="1.8" stroke-dasharray="4 3"/><path d="M24 17v14M17 24h14" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>`, "custom");

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
  "instant-rice": krSvg(`<ellipse cx="24" cy="24" rx="14" ry="11" fill="#fff3d6" fill-opacity=".26" stroke="#fff8e8" stroke-width="1.8"/><ellipse cx="24" cy="23" rx="9" ry="6" fill="#ffffff" fill-opacity=".4"/><path d="M16 18h16" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="2 2"/>`, "instantrice"),
  "cup-noodles": krSvg(`<path d="M13 15h22l-3 24H16z" fill="#ff9f68" fill-opacity=".28" stroke="#ffc299" stroke-width="1.8"/><path d="M11 15h26" stroke="#ffe0b2" stroke-width="2.2" stroke-linecap="round"/><path d="M18 24c2-2 4 2 6 0s4 2 6 0" fill="none" stroke="#ffe0b2" stroke-width="1.6"/>`, "cupnoodles"),
  "canned-pupa": krSvg(`<ellipse cx="24" cy="14" rx="11" ry="4" fill="#b5838d" fill-opacity=".35" stroke="#e5b3bd" stroke-width="1.8"/><path d="M13 14v21c0 2.2 4.9 4 11 4s11-1.8 11-4V14" fill="#9d6b75" fill-opacity=".28" stroke="#e5b3bd" stroke-width="1.8"/><circle cx="24" cy="26" r="3.5" fill="#ffd6de" fill-opacity=".6"/>`, "pupa"),
  "canned-whelk": krSvg(`<ellipse cx="24" cy="14" rx="12" ry="4" fill="#2ec4b6" fill-opacity=".32" stroke="#80ffdb" stroke-width="1.8"/><path d="M12 14v21c0 2.2 5.4 4 12 4s12-1.8 12-4V14" fill="#208b81" fill-opacity=".28" stroke="#80ffdb" stroke-width="1.8"/><path d="M20 26a4 4 0 1 1 8 0c0 2-2 3-4 3" fill="none" stroke="#c7fff0" stroke-width="1.6" stroke-linecap="round"/>`, "whelk"),
  "canned-fruit": krSvg(`<ellipse cx="24" cy="14" rx="11" ry="4" fill="#ffb703" fill-opacity=".35" stroke="#ffe066" stroke-width="1.8"/><path d="M13 14v21c0 2.2 4.9 4 11 4s11-1.8 11-4V14" fill="#fb8500" fill-opacity=".25" stroke="#ffe066" stroke-width="1.8"/><path d="M19 26a5 5 0 0 1 10 0z" fill="#ffe066" fill-opacity=".75"/>`, "fruitcan"),
  "wet-wipes": krSvg(`<rect x="9" y="16" width="30" height="18" rx="4" fill="#80ed99" fill-opacity=".24" stroke="#b7f7c6" stroke-width="1.8"/><ellipse cx="24" cy="21" rx="7" ry="2.5" fill="#ffffff" fill-opacity=".55"/><path d="M21 15c1-3 5-3 6 0" fill="none" stroke="#ffffff" stroke-width="1.6"/>`, "wetwipes"),
  "batteries-aaa": krSvg(`<rect x="17" y="12" width="14" height="28" rx="2.5" fill="#72efdd" fill-opacity=".25" stroke="#a6fff2" stroke-width="1.8"/><rect x="21" y="8" width="6" height="4" rx="1" fill="#a6fff2"/><path d="M24 20v6m-3-3h6" stroke="#a6fff2" stroke-width="1.8" stroke-linecap="round"/>`, "battaaa"),
  "batteries-special": krSvg(`<circle cx="24" cy="24" r="12" fill="#90e0ef" fill-opacity=".25" stroke="#caf0f8" stroke-width="1.8"/><circle cx="24" cy="24" r="6" fill="none" stroke="#caf0f8" stroke-width="1.4" stroke-dasharray="2 2"/><path d="M24 20v8m-4-4h8" stroke="#caf0f8" stroke-width="1.6" stroke-linecap="round"/>`, "battspecial"),
  "otc-medicine": krSvg(`<rect x="10" y="15" width="28" height="18" rx="4" fill="#ff9ebb" fill-opacity=".26" stroke="#ffc2d4" stroke-width="1.8"/><path d="M17 24h14M24 19v10" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="20" r="2" fill="#ffe066"/>`, "otc"),
  "digestive-medicine": krSvg(`<rect x="13" y="10" width="22" height="29" rx="4" fill="#9be7a8" fill-opacity=".24" stroke="#c8f7d0" stroke-width="1.8"/><path d="M18 20c3-3 9-3 12 0M18 27c3 3 9 3 12 0" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><rect x="17" y="6" width="14" height="5" rx="1.5" fill="#c8f7d0"/>`, "digestive-medicine"),
  "cold-medicine": krSvg(`<rect x="9" y="17" width="30" height="16" rx="8" fill="#ffb4a2" fill-opacity=".28" stroke="#ffd6cc" stroke-width="1.8"/><path d="M24 17v16" stroke="#ffd6cc" stroke-width="1.8"/><path d="M14 11c2-3 5-3 7 0M27 11c2-3 5-3 7 0" fill="none" stroke="#9ed8ff" stroke-width="1.8" stroke-linecap="round"/>`, "cold-medicine"),
  antidiarrheal: krSvg(`<rect x="12" y="13" width="24" height="24" rx="5" fill="#ffd166" fill-opacity=".22" stroke="#ffe7a3" stroke-width="1.8"/><circle cx="19" cy="21" r="2.4" fill="#ffffff"/><circle cx="29" cy="21" r="2.4" fill="#ffffff"/><circle cx="19" cy="30" r="2.4" fill="#ffffff"/><circle cx="29" cy="30" r="2.4" fill="#ffffff"/>`, "antidiarrheal"),
  "wound-ointment": krSvg(`<path d="M12 30l14-14 6 6-14 14H12z" fill="#f4a261" fill-opacity=".26" stroke="#ffcf9f" stroke-width="1.8" stroke-linejoin="round"/><path d="M32 22l4-4-6-6-4 4" fill="#ffffff" fill-opacity=".85" stroke="#ffcf9f" stroke-width="1.6"/><path d="M15 33h4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`, "wound-ointment"),
  "sterile-gauze": krSvg(`<rect x="11" y="11" width="26" height="26" rx="2.5" fill="#e9f5ff" fill-opacity=".22" stroke="#d6ecff" stroke-width="1.8"/><path d="M11 20h26M11 28h26M20 11v26M28 11v26" stroke="#d6ecff" stroke-width="1.2" stroke-opacity=".8"/>`, "sterile-gauze"),
  "elastic-bandage": krSvg(`<circle cx="21" cy="24" r="11" fill="#e5c49f" fill-opacity=".28" stroke="#f5dcbc" stroke-width="1.8"/><circle cx="21" cy="24" r="4" fill="none" stroke="#f5dcbc" stroke-width="1.6"/><path d="M32 24h7v10h-9" fill="#e5c49f" fill-opacity=".28" stroke="#f5dcbc" stroke-width="1.8" stroke-linejoin="round"/>`, "elastic-bandage"),
  "adhesive-bandages": krSvg(`<rect x="8" y="18" width="32" height="12" rx="6" transform="rotate(-30 24 24)" fill="#f2b880" fill-opacity=".3" stroke="#ffd7ad" stroke-width="1.8"/><rect x="19" y="19.5" width="10" height="9" rx="2" transform="rotate(-30 24 24)" fill="#ffffff" fill-opacity=".8"/>`, "adhesive-bandages"),
  "medical-tape": krSvg(`<circle cx="24" cy="24" r="12" fill="#ffffff" fill-opacity=".18" stroke="#e8f1f5" stroke-width="2.2"/><circle cx="24" cy="24" r="5" fill="none" stroke="#e8f1f5" stroke-width="1.6"/><path d="M33 31l6 6" stroke="#ff9494" stroke-width="2.4" stroke-linecap="round"/>`, "medical-tape"),
  "batteries-c": krSvg(`<rect x="15" y="12" width="18" height="26" rx="3" fill="#80ffdb" fill-opacity=".24" stroke="#b8fff0" stroke-width="1.8"/><rect x="21" y="8" width="6" height="4" rx="1" fill="#b8fff0"/><text x="24" y="30" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff" font-family="sans-serif">C</text>`, "batteries-c"),
  "batteries-d": krSvg(`<rect x="12" y="11" width="24" height="28" rx="4" fill="#48cae4" fill-opacity=".24" stroke="#a8ecf7" stroke-width="1.8"/><rect x="20" y="7" width="8" height="4" rx="1" fill="#a8ecf7"/><text x="24" y="30" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff" font-family="sans-serif">D</text>`, "batteries-d"),
  headlamp: krSvg(`<path d="M9 22c4-8 26-8 30 0" fill="none" stroke="#9ed8eb" stroke-width="2.4" stroke-linecap="round"/><rect x="17" y="19" width="14" height="11" rx="3" fill="#ffd166" fill-opacity=".3" stroke="#ffe7a3" stroke-width="1.8"/><path d="M20 34l-3 6M24 34v7M28 34l3 6" stroke="#ffe066" stroke-width="2" stroke-linecap="round"/>`, "headlamp"),
  "emergency-blanket": krSvg(`<path d="M10 14h28l-4 20H14z" fill="#e0c068" fill-opacity=".3" stroke="#f5dd8c" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 20l6 8 5-6 7 8" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-opacity=".8"/>`, "emergency-blanket"),
  mouthwash: krSvg(`<path d="M18 16h12v22a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#5bc0eb" fill-opacity=".28" stroke="#9fe3ff" stroke-width="1.8"/><rect x="20" y="9" width="8" height="7" rx="1.5" fill="#9fe3ff"/><path d="M21 27h6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`, "mouthwash"),
  "disposable-tableware": krSvg(`<ellipse cx="20" cy="30" rx="11" ry="5" fill="#f1faee" fill-opacity=".2" stroke="#e8f4ec" stroke-width="1.8"/><path d="M33 12v26M36 12v8a3 3 0 0 1-6 0v-8" fill="none" stroke="#e8f4ec" stroke-width="1.8" stroke-linecap="round"/>`, "disposable-tableware"),
  "plastic-wrap": krSvg(`<rect x="8" y="18" width="32" height="12" rx="3" fill="#90e0ef" fill-opacity=".22" stroke="#caf0f8" stroke-width="1.8"/><path d="M14 30c4 6 16 6 20 0" fill="#caf0f8" fill-opacity=".25" stroke="#caf0f8" stroke-width="1.4"/><circle cx="12" cy="24" r="2" fill="#caf0f8"/>`, "plastic-wrap"),
  "infant-medicine": krSvg(`<path d="M19 12h10v6l3 4v16a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V22l3-4z" fill="#ffafcc" fill-opacity=".28" stroke="#ffd1e3" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 30h8M24 26v8" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`, "infant-medicine"),
  "ice-packs": krSvg(`<rect x="10" y="14" width="28" height="20" rx="5" fill="#a2d2ff" fill-opacity=".3" stroke="#cde6ff" stroke-width="1.8"/><path d="M24 18v12M19 21l10 6M29 21l-10 6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`, "ice-packs"),
  "charging-cable": krSvg(`<path d="M12 36c0-10 8-8 12-14s8-6 12-6" fill="none" stroke="#9ed8eb" stroke-width="2.2" stroke-linecap="round"/><rect x="34" y="11" width="6" height="10" rx="1.5" fill="#cfefff" fill-opacity=".8"/><rect x="8" y="34" width="8" height="6" rx="1.5" fill="#cfefff" fill-opacity=".8"/>`, "charging-cable"),
  "spare-shoes": krSvg(`<path d="M8 30c0-5 3-11 7-11 2 4 6 5 10 5 6 0 14 2 15 6v4H8z" fill="#8d99ae" fill-opacity=".3" stroke="#c6cfdb" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 34h32" stroke="#c6cfdb" stroke-width="2"/>`, "spare-shoes"),
  "aluminum-tape": krSvg(`<circle cx="24" cy="24" r="13" fill="#c0c7cf" fill-opacity=".32" stroke="#e3e8ee" stroke-width="2"/><circle cx="24" cy="24" r="5.5" fill="none" stroke="#e3e8ee" stroke-width="1.6"/><path d="M14 16l4 3M30 30l4 3" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>`, "aluminum-tape"),
  "cable-ties": krSvg(`<path d="M12 34L32 14a3 3 0 0 1 4 4L16 38" fill="none" stroke="#f1faee" stroke-width="2.2" stroke-linecap="round"/><rect x="9" y="31" width="7" height="7" rx="1.5" fill="#f1faee" fill-opacity=".3" stroke="#f1faee" stroke-width="1.6"/><path d="M20 26l2 2M24 22l2 2M28 18l2 2" stroke="#f1faee" stroke-width="1.4"/>`, "cable-ties"),
  "important-documents": krSvg(`<path d="M15 10h14l6 6v22H15z" fill="#bde0fe" fill-opacity=".24" stroke="#d8ecff" stroke-width="1.8" stroke-linejoin="round"/><path d="M11 14v28h20" fill="none" stroke="#d8ecff" stroke-width="1.6" stroke-opacity=".7"/><path d="M19 22h11M19 27h11M19 32h7" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>`, "important-documents"),
  "window-locks": krSvg(`<rect x="9" y="10" width="30" height="28" rx="2" fill="#8ecae6" fill-opacity=".18" stroke="#c4e7f6" stroke-width="1.8"/><path d="M24 10v28" stroke="#c4e7f6" stroke-width="1.6"/><rect x="27" y="21" width="7" height="7" rx="1.5" fill="#ffd166" fill-opacity=".85"/>`, "window-locks"),
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

function krSurvivalDays(snapshot) {
  if (!snapshot?.summary?.items) return { waterDays: 0, foodDays: 0 };
  const people = Math.max(1, snapshot.household_size || 4);
  const items = snapshot.summary.items;
  const waterMl = items["drinking-water"]?.usable || 0;
  const waterDays = Math.round((waterMl / (people * 2000)) * 10) / 10;
  const mults = {
    "instant-rice": 1, "cup-noodles": 1, "shelf-stable-meal": 1,
    "spam-canned-ham": 2, "canned-tuna": 1.5, "canned-pupa": 1,
    "canned-whelk": 1.5, "canned-fruit": 1, "self-heating-ration": 1,
    "long-storage-snacks": 0.5, rice: 8,
  };
  let servings = 0;
  for (const [id, m] of Object.entries(mults)) servings += (items[id]?.usable || 0) * m;
  const foodDays = Math.round((servings / (people * 3)) * 10) / 10;
  return { waterDays, foodDays };
}

// ---- Storage locations (free text per lot, e.g. "현관 팬트리", "주방 팬트리 3층 선반")
const KR_LOCATION_MAX = 60;
const KR_LOCATION_EXAMPLES = ["현관 팬트리", "주방 팬트리", "베란다 창고", "거실 수납장", "차량 트렁크"];
const KR_PIN_SVG = '<svg class="pin" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>';

// Characters refused in any typed text (server refuses them too); output is escaped as well.
const KR_FORBIDDEN_TEXT = /[<>"'`&\\]/g;
const KR_CUSTOM_NAME_MAX = 40;
const KR_CUSTOM_UNITS = ["개", "병", "팩", "통", "박스", "세트", "켤레", "장", "롤", "kg"];
const KR_CUSTOM_DATES = [["", "기한 없음 (수량만 점검)"], ["유통기한", "유통기한"], ["소비기한", "소비기한"], ["사용기한", "사용기한 (약·위생용품)"], ["사용 권장기한", "사용 권장기한 (건전지)"]];

/** Normalise typed text to what the server accepts: single line, no markup characters, trimmed, length-capped. */
function krCleanText(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(KR_FORBIDDEN_TEXT, "").replace(/\s+/g, " ").trim().slice(0, max).trim();
}

const KR_TITLE_MAX = 30;
const KR_NICKNAME_MAX = 20;
const KR_DEFAULT_TITLE = "우리 집 비축 관리";
const KR_DISPLAY_TOGGLES = [
  ["show_survival", "생수·식량 며칠분 표시", "제목 옆의 '생수 ○일분 · 식량 ○일분'을 보여 줍니다."],
  ["show_clock", "시계·날씨 표시", "제목 옆의 현재 시각과 날씨를 보여 줍니다."],
  ["show_expiring", "기한 임박 알림 띠 표시", "기한이 다가온 물품을 위쪽 노란 띠로 알려 줍니다."],
  ["show_rank", "쉘터 등급 표시", "비축 점수와 등급(아이언 → 챌린저)을 보여 줍니다."],
  ["show_missions", "긴급 퀘스트 표시", "지금 채우면 좋은 물품을 퀘스트로 알려 줍니다."],
];

/** Display settings with defaults for anything the server did not send (older versions). */
function krDisplay(snapshot) {
  const stored = snapshot?.display && typeof snapshot.display === "object" ? snapshot.display : {};
  const result = {
    title: krCleanText(stored.title, KR_TITLE_MAX) || KR_DEFAULT_TITLE,
    nickname: krCleanText(stored.nickname, KR_NICKNAME_MAX),
  };
  for (const [key] of KR_DISPLAY_TOGGLES) result[key] = stored[key] !== false;
  return result;
}

/** Whole number inside [min, max] from a typed value, or null. */
function krBoundedInt(value, min, max) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return null;
  const number = Number(text);
  return number >= min && number <= max ? number : null;
}

const KR_ASSET_VERSION = "0.15.0";

const KR_LANGS = {
  ko: { code: "ko", flag: "🇰🇷", label: "한국어", short: "KO" },
  en: { code: "en", flag: "🇺🇸", label: "English", short: "EN" },
  ja: { code: "ja", flag: "🇯🇵", label: "日本語", short: "JA" },
  zh: { code: "zh", flag: "🇨🇳", label: "中文", short: "ZH" },
  es: { code: "es", flag: "🇪🇸", label: "Español", short: "ES" },
  fr: { code: "fr", flag: "🇫🇷", label: "Français", short: "FR" },
  de: { code: "de", flag: "🇩🇪", label: "Deutsch", short: "DE" },
};

const KR_UI_TRANS = {
  ja: {
    "Stockpile": "備蓄管理", "Guide": "緊急ガイド", "Home Stockpile": "家庭備蓄管理",
    "2D Shelf": "2D 棚", "3D View": "3D 倉庫", "All": "すべて", "Shortage": "不足",
    "Needs Check": "要確認", "Expiring": "期限間近", "Ready": "完備", "Low": "不足",
    "Check": "要確認", "Expired": "期限切れ", "Inactive": "未使用", "Edit": "編集", "Set": "設定",
    "No Target": "目標未設定", "Unset": "未設定", "Shelter Rank": "シェルターランク",
    "Urgent Quests": "緊急クエスト", "Essential Supplies": "基本備蓄品", "Optional Supplies": "任意備蓄品",
    "By Storage Location": "保管場所別", "Essentials Rack": "基本備蓄ラック", "Optional Rack": "任意備蓄ラック",
    "Active Only": "使用中のみ", "Auto Time": "時刻自動", "Dawn": "夜明け", "Day": "昼", "Sunset": "夕暮れ", "Night": "夜",
    "Auto Weather": "天気自動", "Clear": "晴れ", "Rain": "雨", "Snow": "雪", "Storm": "雷雨",
    "Auto Spin": "自動回転", "Reset View": "視点リセット", "Click to edit": "クリックして編集",
    "+ Add Custom Item": "+ 品目を追加", "⚡ Quick ±1": "⚡ クイック±1", "⚡ Quick ±1 ON": "⚡ クイック±1 ON",
    "Save": "保存", "Cancel": "キャンセル", "Reset": "初期値", "Emergency Guide": "緊急ガイド",
    "First Actions": "初期行動", "Immediate Action": "最優先行動", "Next Steps": "次の手順",
    "Peacetime": "平時", "Civil Defense Alerts": "民防衛警報", "Utility Outages": "ライフライン停止",
    "Language": "言語", "Theme": "テーマ", "Dashboard Settings": "ダッシュボード設定",
  },
  zh: {
    "Stockpile": "储备管理", "Guide": "应急指南", "Home Stockpile": "家庭储备管理",
    "2D Shelf": "2D 货架", "3D View": "3D 仓库", "All": "全部", "Shortage": "不足",
    "Needs Check": "待盘点", "Expiring": "临期", "Ready": "齐备", "Low": "不足",
    "Check": "待盘点", "Expired": "已过期", "Inactive": "未使用", "Edit": "编辑", "Set": "设置",
    "No Target": "未设目标", "Unset": "未设置", "Shelter Rank": "避难所等级",
    "Urgent Quests": "紧急任务", "Essential Supplies": "基础储备物资", "Optional Supplies": "可选储备物资",
    "By Storage Location": "按存放位置", "Essentials Rack": "基础储备货架", "Optional Rack": "可选储备货架",
    "Active Only": "仅显示启用", "Auto Time": "自动时间", "Dawn": "黎明", "Day": "白天", "Sunset": "黄昏", "Night": "夜晚",
    "Auto Weather": "自动天气", "Clear": "晴朗", "Rain": "下雨", "Snow": "下雪", "Storm": "雷暴",
    "Auto Spin": "自动旋转", "Reset View": "重置视角", "Click to edit": "点击编辑",
    "+ Add Custom Item": "+ 添加自定义物资", "⚡ Quick ±1": "⚡ 快速±1", "⚡ Quick ±1 ON": "⚡ 快速±1 开",
    "Save": "保存", "Cancel": "取消", "Reset": "恢复默认", "Emergency Guide": "应急指南",
    "First Actions": "首要行动", "Immediate Action": "立即行动", "Next Steps": "后续步骤",
    "Peacetime": "平时", "Civil Defense Alerts": "民防警报", "Utility Outages": "水电中断",
    "Language": "语言", "Theme": "主题", "Dashboard Settings": "仪表盘设置",
  },
  es: {
    "Stockpile": "Reservas", "Guide": "Guía", "Home Stockpile": "Reservas del Hogar",
    "2D Shelf": "Estante 2D", "3D View": "Vista 3D", "All": "Todo", "Shortage": "Escaso",
    "Needs Check": "Revisar", "Expiring": "Por vencer", "Ready": "Listo", "Low": "Bajo",
    "Check": "Revisar", "Expired": "Vencido", "Inactive": "Inactivo", "Edit": "Editar", "Set": "Fijar",
    "No Target": "Sin meta", "Unset": "Sin meta", "Shelter Rank": "Rango Refugio",
    "Urgent Quests": "Misiones Urgentes", "Essential Supplies": "Suministros Básicos", "Optional Supplies": "Suministros Opcionales",
    "By Storage Location": "Por Ubicación", "Essentials Rack": "Estante Básico", "Optional Rack": "Estante Opcional",
    "Active Only": "Solo activos", "Auto Time": "Hora Auto", "Dawn": "Alba", "Day": "Día", "Sunset": "Ocaso", "Night": "Noche",
    "Auto Weather": "Clima Auto", "Clear": "Despejado", "Rain": "Lluvia", "Snow": "Nieve", "Storm": "Tormenta",
    "Auto Spin": "Giro Auto", "Reset View": "Reiniciar Vista", "Click to edit": "Clic para editar",
    "+ Add Custom Item": "+ Añadir artículo", "⚡ Quick ±1": "⚡ Rápido ±1", "⚡ Quick ±1 ON": "⚡ Rápido ±1 ON",
    "Save": "Guardar", "Cancel": "Cancelar", "Reset": "Restablecer", "Emergency Guide": "Guía de Emergencia",
    "First Actions": "Primeras Acciones", "Immediate Action": "Acción Inmediata", "Next Steps": "Siguientes Pasos",
    "Peacetime": "Tiempo de Paz", "Civil Defense Alerts": "Alertas Civiles", "Utility Outages": "Cortes de Servicio",
    "Language": "Idioma", "Theme": "Tema", "Dashboard Settings": "Ajustes",
  },
  fr: {
    "Stockpile": "Stocks", "Guide": "Guide", "Home Stockpile": "Gestion des Stocks",
    "2D Shelf": "Étagère 2D", "3D View": "Vue 3D", "All": "Tout", "Shortage": "Manque",
    "Needs Check": "À vérifier", "Expiring": "Expire bientôt", "Ready": "Prêt", "Low": "Bas",
    "Check": "Vérifier", "Expired": "Expiré", "Inactive": "Inactif", "Edit": "Modifier", "Set": "Définir",
    "No Target": "Sans objectif", "Unset": "Non défini", "Shelter Rank": "Rang Abri",
    "Urgent Quests": "Quêtes Urgentes", "Essential Supplies": "Réserves Essentielles", "Optional Supplies": "Réserves Optionnelles",
    "By Storage Location": "Par Emplacement", "Essentials Rack": "Rayon Essentiel", "Optional Rack": "Rayon Optionnel",
    "Active Only": "Actifs seul.", "Auto Time": "Heure Auto", "Dawn": "Aube", "Day": "Jour", "Sunset": "Crépuscule", "Night": "Nuit",
    "Auto Weather": "Météo Auto", "Clear": "Clair", "Rain": "Pluie", "Snow": "Neige", "Storm": "Orage",
    "Auto Spin": "Rotation Auto", "Reset View": "Réinit. Vue", "Click to edit": "Cliquer pour modifier",
    "+ Add Custom Item": "+ Ajouter un article", "⚡ Quick ±1": "⚡ Rapide ±1", "⚡ Quick ±1 ON": "⚡ Rapide ±1 ON",
    "Save": "Enregistrer", "Cancel": "Annuler", "Reset": "Réinitialiser", "Emergency Guide": "Guide d'Urgence",
    "First Actions": "Premiers Gestes", "Immediate Action": "Action Immédiate", "Next Steps": "Étapes Suivantes",
    "Peacetime": "Temps de Paix", "Civil Defense Alerts": "Alertes Civiles", "Utility Outages": "Pannes Réseau",
    "Language": "Langue", "Theme": "Thème", "Dashboard Settings": "Paramètres",
  },
  de: {
    "Stockpile": "Vorrat", "Guide": "Leitfaden", "Home Stockpile": "Hausvorrat",
    "2D Shelf": "2D Regal", "3D View": "3D Lager", "All": "Alle", "Shortage": "Knapp",
    "Needs Check": "Prüfen", "Expiring": "Läuft ab", "Ready": "Bereit", "Low": "Knapp",
    "Check": "Prüfen", "Expired": "Abgelaufen", "Inactive": "Inaktiv", "Edit": "Bearbeiten", "Set": "Festlegen",
    "No Target": "Kein Ziel", "Unset": "Offen", "Shelter Rank": "Schutzrang",
    "Urgent Quests": "Dringende Aufgaben", "Essential Supplies": "Grundvorrat", "Optional Supplies": "Optionale Vorräte",
    "By Storage Location": "Nach Lagerort", "Essentials Rack": "Grundregal", "Optional Rack": "Optionsregal",
    "Active Only": "Nur aktive", "Auto Time": "Zeit Auto", "Dawn": "Morgen", "Day": "Tag", "Sunset": "Abend", "Night": "Nacht",
    "Auto Weather": "Wetter Auto", "Clear": "Klar", "Rain": "Regen", "Snow": "Schnee", "Storm": "Gewitter",
    "Auto Spin": "Auto-Drehung", "Reset View": "Ansicht Reset", "Click to edit": "Zum Bearbeiten klicken",
    "+ Add Custom Item": "+ Artikel hinzufügen", "⚡ Quick ±1": "⚡ Schnell ±1", "⚡ Quick ±1 ON": "⚡ Schnell ±1 AN",
    "Save": "Speichern", "Cancel": "Abbrechen", "Reset": "Zurücksetzen", "Emergency Guide": "Notfall-Leitfaden",
    "First Actions": "Erste Maßnahmen", "Immediate Action": "Sofortmaßnahme", "Next Steps": "Nächste Schritte",
    "Peacetime": "Friedenszeit", "Civil Defense Alerts": "Zivilschutz", "Utility Outages": "Versorgungsausfall",
    "Language": "Sprache", "Theme": "Design", "Dashboard Settings": "Einstellungen",
  },
};

const KR_ITEM_I18N = {
  ja: {
    "drinking-water": "飲料水", "instant-rice": "パックご飯", "cup-noodles": "カップ麺", "shelf-stable-meal": "レトルト食品",
    "spam-canned-ham": "缶詰ハム", "canned-tuna": "ツナ缶", "canned-pupa": "さなぎ缶", "canned-whelk": "つぶ貝缶",
    "canned-fruit": "果物缶", "canned-food": "その他缶詰", hygiene: "トイレットペーパー", "wet-wipes": "ウェットティッシュ",
    flashlight: "懐中電灯", batteries: "単3電池", "batteries-aaa": "単4電池", "batteries-special": "ボタン電池",
    "batteries-c": "単2電池", "batteries-d": "単1電池", backpack: "避難リュック", blanket: "毛布",
    "first-aid-kit": "消毒液", "otc-medicine": "解熱鎮痛薬", "digestive-medicine": "胃腸薬", "cold-medicine": "風邪薬",
    antidiarrheal: "止瀉薬", "wound-ointment": "傷軟膏", "sterile-gauze": "滅菌ガーゼ", "elastic-bandage": "弾性包帯",
    "adhesive-bandages": "絆創膏", "medical-tape": "医療テープ", radio: "防災ラジオ", "power-bank": "モバイルバッテリー",
    "portable-power-station": "ポータブル電源", "portable-stove": "カセットコンロ", "butane-canister": "カセットガス",
    "portable-water-filter": "携帯浄水器", "gas-mask": "防毒マスク", masks: "マスク",
  },
  zh: {
    "drinking-water": "饮用水", "instant-rice": "即食米饭", "cup-noodles": "方便面", "shelf-stable-meal": "即食软罐头",
    "spam-canned-ham": "午餐肉罐头", "canned-tuna": "金枪鱼罐头", "canned-pupa": "蚕蛹罐头", "canned-whelk": "海螺罐头",
    "canned-fruit": "水果罐头", "canned-food": "其他罐头", hygiene: "卷纸", "wet-wipes": "湿巾",
    flashlight: "手电筒", batteries: "5号电池", "batteries-aaa": "7号电池", "batteries-special": "纽扣电池",
    "batteries-c": "2号电池", "batteries-d": "1号电池", backpack: "应急背包", blanket: "毛毯",
    "first-aid-kit": "消毒液", "otc-medicine": "退烧止痛药", "digestive-medicine": "肠胃药", "cold-medicine": "感冒药",
    antidiarrheal: "止泻药", "wound-ointment": "外伤药膏", "sterile-gauze": "无菌纱布", "elastic-bandage": "弹性绷带",
    "adhesive-bandages": "创可贴", "medical-tape": "医用胶带", radio: "应急收音机", "power-bank": "充电宝",
    "portable-power-station": "户外电源", "portable-stove": "便携燃气炉", "butane-canister": "丁烷气罐",
    "portable-water-filter": "便携净水器", "gas-mask": "防毒面具", masks: "防护口罩",
  },
  es: {
    "drinking-water": "Agua Potable", "instant-rice": "Arroz Listo", "cup-noodles": "Fideos Vaso", "shelf-stable-meal": "Comida Lista",
    "spam-canned-ham": "Jamón Lata", "canned-tuna": "Atún Lata", "canned-fruit": "Fruta Lata", hygiene: "Papel Higiénico",
    "wet-wipes": "Toallitas", flashlight: "Linterna", batteries: "Pilas AA", "batteries-aaa": "Pilas AAA",
    "batteries-special": "Pilas Botón", "batteries-c": "Pilas C", "batteries-d": "Pilas D", backpack: "Mochila Emerg.",
    blanket: "Mantas", "first-aid-kit": "Antiséptico", "otc-medicine": "Analgésicos", "digestive-medicine": "Digestivo",
    "cold-medicine": "Antigripal", antidiarrheal: "Antidiarreico", "wound-ointment": "Pomada", "sterile-gauze": "Gasa Estéril",
    "elastic-bandage": "Venda Elástica", "adhesive-bandages": "Tiritas", "medical-tape": "Esparadrapo",
  },
  fr: {
    "drinking-water": "Eau Potable", "instant-rice": "Riz Prêt", "cup-noodles": "Nouilles", "shelf-stable-meal": "Plats Prêts",
    "spam-canned-ham": "Jambon Boîte", "canned-tuna": "Thon Boîte", "canned-fruit": "Fruits Boîte", hygiene: "Papier Toilette",
    "wet-wipes": "Lingettes", flashlight: "Lampe Torche", batteries: "Piles AA", "batteries-aaa": "Piles AAA",
    "batteries-special": "Piles Bouton", "batteries-c": "Piles C", "batteries-d": "Piles D", backpack: "Sac d'Évac.",
    blanket: "Couvertures", "first-aid-kit": "Antiseptique", "otc-medicine": "Antalgiques", "digestive-medicine": "Digestif",
    "cold-medicine": "Rhume", antidiarrheal: "Antidiarrhéique", "wound-ointment": "Pommade", "sterile-gauze": "Gaze Stérile",
    "elastic-bandage": "Bandage", "adhesive-bandages": "Pansements", "medical-tape": "Sparadrap",
  },
  de: {
    "drinking-water": "Trinkwasser", "instant-rice": "Fertigreis", "cup-noodles": "Instant-Nudeln", "shelf-stable-meal": "Fertiggerichte",
    "spam-canned-ham": "Dosenfleisch", "canned-tuna": "Thunfischdose", "canned-fruit": "Obstkonserve", hygiene: "Toilettenpapier",
    "wet-wipes": "Feuchttücher", flashlight: "Taschenlampe", batteries: "AA-Batterien", "batteries-aaa": "AAA-Batterien",
    "batteries-special": "Knopfzellen", "batteries-c": "C-Batterien", "batteries-d": "D-Batterien", backpack: "Notfallrucksack",
    blanket: "Decken", "first-aid-kit": "Desinfektion", "otc-medicine": "Schmerzmittel", "digestive-medicine": "Magenmittel",
    "cold-medicine": "Erkältungsmittel", antidiarrheal: "Durchfallmittel", "wound-ointment": "Wundsalbe", "sterile-gauze": "Sterile Mull",
    "elastic-bandage": "Elast. Binde", "adhesive-bandages": "Pflaster", "medical-tape": "Heftpflaster",
  },
};

function krGetLang() {
  try {
    const saved = window.localStorage?.getItem("kr_survival_kit_lang");
    return Object.hasOwn(KR_LANGS, saved) ? saved : "ko";
  } catch { return "ko"; }
}
function krT(lang, ko, en) {
  if (!lang || lang === "ko") return ko;
  if (lang === "en") return en;
  return KR_UI_TRANS[lang]?.[en] || en;
}
const KR_EN_NAMES = {
  "drinking-water": "Drinking Water", "instant-rice": "Instant Rice", "cup-noodles": "Cup Noodles",
  "shelf-stable-meal": "Retort Meals", "spam-canned-ham": "Canned Ham", "canned-tuna": "Canned Tuna",
  "canned-pupa": "Canned Pupa", "canned-whelk": "Canned Whelk", "canned-fruit": "Canned Fruit",
  "canned-food": "Other Canned Food", hygiene: "Toilet Paper", "wet-wipes": "Wet Wipes",
  flashlight: "Flashlight", batteries: "AA Batteries", "batteries-aaa": "AAA Batteries",
  "batteries-special": "C/D/Coin Batteries", backpack: "Go Bag", blanket: "Blankets",
  "first-aid-kit": "First Aid Kit", "otc-medicine": "OTC Medicine", "infant-supplies": "Infant Supplies",
  "prescription-preparedness": "Prescriptions", radio: "Solar/Crank Radio", "water-container": "20L Water Jug",
  "faucet-water-tank": "Spigot Water Tank", "water-purification-tablets": "Water Tablets",
  "metal-fuel-can": "Metal Fuel Can", "fuel-siphon-nozzle": "Fuel Siphon", "portable-stove": "Portable Stove",
  "butane-canister": "Butane Canister", "butane-torch": "Butane Torch", "self-heating-ration": "Self-Heating Meal",
  rice: "Rice", "salt-jar": "Salt Jar", "honey-gift-set": "Honey Jar", candles: "Candles",
  "hand-warmers": "Hand Warmers", "sleeping-bag": "Sleeping Bag", "large-plastic-bags": "Large Plastic Bags",
  lighter: "Lighters", "solid-fuel": "Solid Fuel", "child-id-card": "Child ID Card",
  "home-solar-panel": "Home Solar 200W", "portable-solar-panel": "Portable Solar 60W",
  "manual-can-opener": "Can Opener", "insulated-bottle": "Thermos", "cooler-ice-pack": "Cooler & Ice",
  "portable-water-filter": "Water Filter", "storage-bin": "Storage Bin", "long-storage-snacks": "Snacks",
  "infant-formula": "Infant Formula", "ready-to-feed-formula": "Liquid Formula",
  "infant-feeding-supplies": "Feeding Gear", "power-bank": "Power Bank",
  "portable-power-station": "Home Power Station", "charging-cables": "Charging Cables",
  "warm-clothes": "Warm Clothes", raincoat: "Raincoat", masks: "Protective Masks",
  "gas-mask": "Gas Mask", "gas-mask-filter": "Gas Mask Filter", earplugs: "Earplugs",
  "compressed-towel": "Compressed Towel", "rubber-gloves": "Rubber Gloves", "rubber-boots": "Rubber Boots",
  "sealing-tape": "Sealing Tape", "emergency-contact-card": "Contact Card", "family-photo": "Family Photo",
  "portable-toilet": "Portable Toilet", "toilet-coagulant": "Toilet Coagulant", "cat-litter": "Cat Litter",
  "sanitation-bags": "Sanitation Bags", "thermal-mat": "Thermal Mat", "child-comfort-kit": "Child Comfort Kit",
  "basic-documents": "Key Documents", "door-window-locks": "Door/Window Locks", "door-alarm": "Door Alarm",
  "lock-tools": "Lock Tools", "child-carrier": "Child Carrier", "transport-cart": "Wagon Cart",
  "water-sanitation-kit": "Sanitation Kit", "hot-water-bag": "Hot Water Bag",
  "portable-radio-communication": "Two-Way Radio", "emergency-payment-check": "Payment Check",
  "cash-krw": "KRW Cash", "cash-usd": "USD Cash", "crypto-cold-wallet": "Crypto / Cold Wallet",
  "protective-goggles": "Safety Goggles",
  "digestive-medicine": "Digestive Meds", "cold-medicine": "Cold Medicine",
  antidiarrheal: "Antidiarrheal", "wound-ointment": "Wound Ointment",
  "sterile-gauze": "Sterile Gauze", "elastic-bandage": "Elastic Bandage",
  "adhesive-bandages": "Adhesive Bandages", "medical-tape": "Medical Tape",
  "batteries-c": "C Batteries", "batteries-d": "D Batteries",
  headlamp: "Headlamp", "emergency-blanket": "Emergency Blanket",
  mouthwash: "Mouthwash", "disposable-tableware": "Disposable Tableware",
  "plastic-wrap": "Plastic Wrap", "infant-medicine": "Infant Medicine",
  "ice-packs": "Ice Packs", "charging-cable": "Charging Cable",
  "spare-shoes": "Spare Shoes", "aluminum-tape": "Aluminum Tape",
  "cable-ties": "Cable Ties", "important-documents": "Important Docs Copy",
  "window-locks": "Window Locks",
};
function krItemDisplayName(item, lang) {
  if (lang && lang !== "ko") {
    return KR_ITEM_I18N[lang]?.[item.id] || KR_EN_NAMES[item.id] || item.name;
  }
  return KR_READY_SHORT_NAMES[item.id] || item.name;
}

/** Saved 자동 회전 choice; without one, follow the system "reduce motion" setting. */
function krSpinPreference() {
  let saved = null;
  try { saved = window.localStorage?.getItem("kr_survival_kit_3d_spin"); } catch { /* private mode */ }
  if (saved === "on" || saved === "off") return saved === "on";
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function krCleanLocation(value) {
  return krCleanText(value, KR_LOCATION_MAX);
}

/** Distinct locations of one item, the place holding the most stock first. */
function krItemLocations(record) {
  const totals = new Map();
  for (const lot of record?.lots || []) {
    const place = String(lot.location || "").trim();
    if (place) totals.set(place, (totals.get(place) || 0) + (Number(lot.quantity) || 0));
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([place]) => place);
}

/** Every location used in the household, most used first (for suggestions). */
function krAllLocations(snapshot) {
  const uses = new Map();
  for (const record of Object.values(snapshot?.items || {})) {
    for (const place of krItemLocations(record)) uses.set(place, (uses.get(place) || 0) + 1);
  }
  return [...uses.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([place]) => place);
}

/** "보관 위치별 보기": items grouped by place, searchable, each entry opens the editor. */
function krLocationPanel(snapshot, escape, open = false, lang = "ko") {
  if (!snapshot) return "";
  const T = (ko, en) => krT(lang, ko, en);
  const active = snapshot.catalog.filter((item) => snapshot.items[item.id]?.applicable ?? !krIsSelectable(item));
  const groups = new Map();
  const unplaced = [];
  for (const item of active) {
    const record = snapshot.items[item.id];
    const placed = (record?.lots || []).filter((lot) => String(lot.location || "").trim());
    if (!placed.length) { unplaced.push(item); continue; }
    const perPlace = new Map();
    for (const lot of placed) {
      const place = lot.location.trim();
      perPlace.set(place, (perPlace.get(place) || 0) + (Number(lot.quantity) || 0));
    }
    for (const [place, quantity] of perPlace) {
      if (!groups.has(place)) groups.set(place, []);
      groups.get(place).push({ item, quantity });
    }
  }
  const short = (item) => krItemDisplayName(item, lang);
  const places = [...groups.keys()].sort((a, b) => groups.get(b).length - groups.get(a).length || a.localeCompare(b, lang === "en" ? "en" : "ko"));
  const entry = ({ item, quantity }, place) =>
    `<li data-loc-text="${escape(`${place} ${item.name} ${short(item)}`.toLowerCase())}"><button type="button" class="loc-item" data-edit="${escape(item.id)}">${escape(short(item))}<b>${escape(krStockText(item, quantity, lang))}</b></button></li>`;
  const body = places.length
    ? places.map((place) => `<section class="loc-group" data-loc-group><h4>${KR_PIN_SVG}${escape(place)} <span>${groups.get(place).length}${T("종", "")}</span></h4><ul>${groups.get(place).map((row) => entry(row, place)).join("")}</ul></section>`).join("")
    : `<p class="ready-empty">${T('아직 보관 위치를 적은 물품이 없습니다. 물품을 눌러 <strong>보관 위치</strong>에 "현관 팬트리", "주방 팬트리 3층 선반"처럼 적어 두면 여기서 장소별로 모아 볼 수 있어요.', 'No storage locations recorded yet. Tap an item and enter a <strong>Location</strong> (e.g. "Pantry Shelf 3") to group items by place.')}</p>`;
  const unplacedNote = places.length && unplaced.length
    ? `<details class="loc-unplaced"><summary>${T(`위치 미지정 ${unplaced.length}종`, `Unassigned (${unplaced.length})`)}</summary><ul>${unplaced.map((item) => `<li data-loc-text="${escape(`${item.name} ${short(item)}`.toLowerCase())}"><button type="button" class="loc-item" data-edit="${escape(item.id)}">${escape(short(item))}</button></li>`).join("")}</ul></details>` : "";
  return `<section class="ready-panel location-panel" aria-labelledby="location-panel-title"><details id="location-panel" ${open ? "open" : ""}><summary><h3 id="location-panel-title">${KR_PIN_SVG}${T("보관 위치별 보기", "By Storage Location")} <span>${places.length}${T("곳", " places")}</span></h3></summary>` +
    (places.length ? `<input id="loc-search" type="search" placeholder="${T("위치나 물품 이름으로 찾기 (예: 팬트리, 생수)", "Search location or item...")}" aria-label="${T("보관 위치 검색", "Search storage locations")}">` : "") +
    `<div class="loc-groups">${body}</div>${unplacedNote}<p class="loc-empty" hidden>${T("찾는 위치나 물품이 없습니다.", "No matching location or item.")}</p></details></section>`;
}

// ---- Quick ±1: water in bottles moves one bottle, loose water 1 L, everything else one unit.
// Consumption (−1) takes from the lot that expires first (FIFO, unknown dates last) so split stock
// across places still decreases; restocking (+1) adds to the first lot.
function krLotTotal(record) {
  return (record?.lots || []).reduce((sum, lot) => sum + (Number(lot.quantity) || 0), 0);
}

function krQuickStep(item, record) {
  if (item.id !== "drinking-water") return { short: "1", text: `1${item.display_unit || item.unit || ""}` };
  const bottle = record?.lots?.[0]?.bottle_ml;
  return bottle ? { short: "1병", text: `한 병(${krStockText(item, bottle)})` } : { short: "1L", text: "1L" };
}

function krQuickPlan(item, record, delta) {
  const source = record?.lots?.length ? record.lots : [{ lot_id: "lot-1", quantity: 0, expires_on: null, received_on: null }];
  const lots = source.map((lot) => ({ ...lot }));
  let index = 0;
  if (delta < 0) {
    const candidates = lots.map((lot, i) => ({ lot, i })).filter(({ lot }) => lot.quantity > 0);
    if (!candidates.length) return { lots, changed: 0 };
    candidates.sort((a, b) => (a.lot.expires_on || "9999-12-31").localeCompare(b.lot.expires_on || "9999-12-31") || a.i - b.i);
    index = candidates[0].i;
  }
  const lot = lots[index];
  const before = lot.quantity || 0;
  if (lot.bottle_ml && Number.isInteger(lot.bottle_count)) {
    lot.bottle_count = Math.max(0, lot.bottle_count + (delta > 0 ? 1 : -1));
    lot.quantity = lot.bottle_ml * lot.bottle_count;
  } else {
    const step = item.id === "drinking-water" ? 1000 : 1;
    lot.quantity = Math.max(0, before + (delta > 0 ? step : -step));
  }
  if (lot.quantity > 1_000_000_000) return { lots: source.map((l) => ({ ...l })), changed: 0 };
  return { lots, changed: lot.quantity - before, place: lot.location || "" };
}

function krReadyGrid(snapshot, escape, visible = snapshot?.catalog.filter((item) =>
  !krIsSelectable(item)), editing = false, quickMode = false, lang = "ko") {
  const T = (ko, en) => krT(lang, ko, en);
  if (!snapshot) return `<p class="ready-empty">${T("재고를 불러오는 중입니다.", "Loading inventory...")}</p>`;
  if (!visible.length) return `<p class="ready-empty">${T("이 조건에 맞는 물품이 없습니다.", "No items match this filter.")}</p>`;
  const readyIds = new Set(krReadyItems(snapshot).map((item) => item.id));
  return `<div class="ready-grid" role="list">${visible.map((item) => {
    const status = snapshot.summary.items[item.id];
    const ready = readyIds.has(item.id);
    const inactive = !(snapshot.items[item.id]?.applicable ?? !krIsSelectable(item));
    const pictogram = KR_READY_PICTOGRAMS[item.id] || KR_CUSTOM_PICTOGRAM;
    const current = status.usable ?? 0;
    // Stock whose package date is still unknown is on the shelf too; show it so a save never looks lost.
    const held = current + (status.unknown_date_quantity ?? 0);
    const quantity = `${krStockText(item, held, lang)} / ${status.target == null ? T("목표 미설정", "No Target") : krStockText(item, status.target, lang)}`;
    const label = inactive ? T("미사용", "Inactive") : ready ? T("완비", "Ready") : !status.confirmed || status.stale ? T("실사 필요", "Check") :
      status.expiring_quantity > 0 ? T("기한 임박", "Expiring") : status.expired_quantity > 0 ? T("기한 경과", "Expired") :
      status.unknown_date_quantity > 0 ? (status.next_label_check_on ? `${T("기한 확인", "Date?")} ${status.next_label_check_on}` : T("기한 확인", "Date?")) : status.state === "shortage" ? T("부족", "Low") : "";
    const dDay = !inactive && status.next_expiry_on && snapshot.today ? krDaysUntil(status.next_expiry_on, snapshot.today) : null;
    const badgeTone = inactive ? "muted" : ready ? "ok" : status.expired_quantity > 0 || status.state === "shortage" ? "warn" : "alert";
    const percent = status.target > 0 ? Math.floor(Math.min(1, current / status.target) * 100) : 0;
    const action = inactive ? T("설정", "Set") : T("수정", "Edit");
    const places = inactive ? [] : krItemLocations(snapshot.items[item.id]);
    // The main place may be clamped on narrow tiles; keep "+N곳" outside the clamp so it is never hidden.
    const placeTag = places.length ? `<span class="ready-loc" title="${escape(places.join(" · "))}">${KR_PIN_SVG}<span>${escape(places[0])}</span>${places.length > 1 ? `<b class="loc-more">+${places.length - 1}${T("곳", "")}</b>` : ""}</span>` : "";
    const { short: stepShort, text: stepText } = krQuickStep(item, snapshot.items[item.id]);
    const itemName = krItemDisplayName(item, lang);
    const quickBtns = quickMode && !inactive ? `<div class="quick-bar" role="group" aria-label="${escape(itemName)} ${T("빠른 수량 조절", "Quick Adjust")}"><button type="button" class="qbtn" data-dir="down" data-quick="${escape(item.id)}:-1" aria-label="${escape(itemName)} ${escape(stepText)} ${T("줄이기", "decrease")}" ${editing || krLotTotal(snapshot.items[item.id]) <= 0 ? "disabled" : ""}>−${stepShort}</button><button type="button" class="qbtn" data-dir="up" data-quick="${escape(item.id)}:1" aria-label="${escape(itemName)} ${escape(stepText)} ${T("늘리기", "increase")}" ${editing ? "disabled" : ""}>+${stepShort}</button></div>` : "";
    return `<div class="ready-item" data-item="${escape(item.id)}" data-complete="${ready}" data-tone="${badgeTone}" role="listitem"><button type="button" class="shelf-edit" data-edit="${escape(item.id)}" aria-label="${escape([`${itemName} ${action}`, quantity, label, places.length ? `${T("보관 위치", "Location")} ${places.join(", ")}` : ""].filter(Boolean).join(" · "))}" ${editing ? "disabled" : ""}><span class="tile-top"><span class="tile-led" aria-hidden="true"></span>${dDay !== null && dDay <= 90 ? `<span class="dday-tag">D${dDay >= 0 ? `-${dDay}` : `+${Math.abs(dDay)}`}</span>` : ""}<span class="shelf-action">${action}</span></span><span class="ready-art" aria-hidden="true">${pictogram}</span>` +
      `<span class="ready-name">${escape(itemName)}</span><span class="ready-number">${escape(quantity)}</span>${placeTag}<span aria-hidden="true" class="stock-meter"><span style="width:${percent}%"></span></span>${label ? `<span class="stock-label">${escape(label)}</span>` : ""}</button>${quickBtns}</div>`;
  }).join("")}</div>`;
}

const KR_READY_SHORT_NAMES = {
  "drinking-water": "생수", "instant-rice": "즉석밥", "cup-noodles": "컵라면", "shelf-stable-meal": "레토르트 간편식",
  "spam-canned-ham": "스팸", "canned-tuna": "참치캔", "canned-pupa": "번데기캔", "canned-whelk": "골뱅이캔", "canned-fruit": "과일캔",
  "canned-food": "기타 통조림", hygiene: "두루마리 휴지", "wet-wipes": "물티슈",
  flashlight: "손전등", batteries: "AA 건전지", "batteries-aaa": "AAA 건전지", "batteries-special": "버튼셀 건전지",
  backpack: "대피 가방", blanket: "담요", "first-aid-kit": "소독약", "otc-medicine": "해열진통제",
  "infant-supplies": "기저귀", "prescription-preparedness": "처방약", radio: "자가발전 라디오",
  "water-container": "급수 용기", "portable-stove": "휴대 버너", "butane-canister": "부탄가스", "self-heating-ration": "발열식 비상식량",
  candles: "양초", "hand-warmers": "손난로", "large-plastic-bags": "대형 비닐", lighter: "라이터",
  "solid-fuel": "고체 연료", "child-id-card": "아이 인식표", "portable-solar-panel": "태양광 패널", "manual-can-opener": "캔 따개",
  "insulated-bottle": "보온병", "cooler-ice-pack": "아이스박스", "portable-water-filter": "정수 필터", "storage-bin": "보관함",
  "long-storage-snacks": "간식", "infant-formula": "분유", "ready-to-feed-formula": "액상 분유", "infant-feeding-supplies": "일회용 젖병",
  "power-bank": "보조배터리", "portable-power-station": "휴대 전원", "charging-cables": "휴대폰 충전기", "warm-clothes": "여벌 옷",
  raincoat: "우비", masks: "마스크", "rubber-gloves": "고무장갑", "rubber-boots": "장화",
  "sealing-tape": "투명 테이프", "emergency-contact-card": "연락 카드", "family-photo": "가족 사진", "sanitation-bags": "위생 봉투",
  "thermal-mat": "단열 매트", "child-comfort-kit": "아이 안심 꾸러미", "basic-documents": "신분증 사본", "door-window-locks": "현관 보조 잠금",
  "door-alarm": "문 알림", "child-carrier": "아이 캐리어", "transport-cart": "운반 수레", "water-sanitation-kit": "손 소독제",
  "hot-water-bag": "온수 주머니", "portable-radio-communication": "무전기", "emergency-payment-check": "비상 결제", "protective-goggles": "보호 안경",
  "faucet-water-tank": "수도꼭지 물통", "water-purification-tablets": "아쿠아탭스",
  "metal-fuel-can": "철제 기름통", "fuel-siphon-nozzle": "주유 펌프",
  "butane-torch": "부탄 토치", rice: "쌀", "spam-canned-ham": "스팸", "canned-tuna": "참치캔",
  "salt-jar": "소금(병)", "honey-gift-set": "벌꿀", "sleeping-bag": "캠핑 침낭",
  "home-solar-panel": "가정용 태양광", "portable-solar-panel": "휴대 태양광",
  "portable-power-station": "가정용 파워뱅크", "power-bank": "휴대 보조배터리",
  "gas-mask": "방독면", "gas-mask-filter": "방독면 필터", earplugs: "이어플러그",
  "compressed-towel": "압축 수건", "portable-toilet": "휴대용 변기",
  "toilet-coagulant": "변기 응고제", "cat-litter": "고양이 모래", "lock-tools": "자물쇠 공구",
  "cash-krw": "원화 현금", "cash-usd": "달러 외화", "crypto-cold-wallet": "코인·지갑",
  "child-carrier": "산악 아기캐리어", "transport-cart": "웨건 수레",
  "digestive-medicine": "소화제",
  "cold-medicine": "감기약",
  antidiarrheal: "지사제",
  "wound-ointment": "상처 연고",
  "sterile-gauze": "멸균 거즈",
  "elastic-bandage": "압박 붕대",
  "adhesive-bandages": "일회용 밴드",
  "medical-tape": "의료용 테이프",
  "batteries-c": "C형 건전지",
  "batteries-d": "D형 건전지",
  headlamp: "헤드랜턴",
  "emergency-blanket": "은박 보온포",
  mouthwash: "가글액",
  "disposable-tableware": "일회용 식기",
  "plastic-wrap": "위생 랩",
  "infant-medicine": "영유아 상비약",
  "ice-packs": "아이스팩",
  "charging-cable": "충전 케이블",
  "spare-shoes": "여벌 신발",
  "aluminum-tape": "알루미늄 테이프",
  "cable-ties": "케이블타이",
  "important-documents": "중요 서류 사본",
  "window-locks": "창문 잠금",
};

const KR_STOCK_RANKS = [
  ["아이언", "#c0c8cd"], ["브론즈", "#ffc493"], ["실버", "#dbe8ff"],
  ["골드", "#ffe393"], ["플레티넘", "#8cf4de"], ["에메랄드", "#8cf2ad"],
  ["다이아", "#9adaff"], ["마스터", "#d4bbff"], ["그랜드마스터", "#ffa9b2"],
  ["챌린저", "#ffe39a"],
];

const KR_STOCK_WEIGHTS = {
  "drinking-water": 28,
  "instant-rice": 5, "cup-noodles": 5, "shelf-stable-meal": 5,
  "spam-canned-ham": 3, "canned-tuna": 3, "canned-pupa": 3, "canned-whelk": 3, "canned-fruit": 3,
  hygiene: 4, "wet-wipes": 4,
  flashlight: 6, batteries: 4, "batteries-aaa": 2, "batteries-special": 1, "batteries-c": 1, "batteries-d": 1,
  backpack: 5, blanket: 5,
  // First aid and medicine were one bundle each (weight 5); each single product now carries 1.
  "first-aid-kit": 1, "sterile-gauze": 1, "elastic-bandage": 1, "adhesive-bandages": 1, "medical-tape": 1,
  "otc-medicine": 1, "digestive-medicine": 1, "cold-medicine": 1, "antidiarrheal": 1, "wound-ointment": 1,
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

const KR_PERCENTILE_LABELS = [
  "대비 시작", "상위 82%", "상위 68%", "상위 52%", "상위 38%",
  "상위 25%", "상위 15%", "상위 7%", "상위 3%", "상위 1%",
];

function krRankShieldSvg(color) {
  return `<svg class="rank-shield" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2L4 5.5v6c0 5.2 3.4 9.7 8 11 4.6-1.3 8-5.8 8-11v-6L12 2z" fill="${color}" fill-opacity=".28" stroke="${color}" stroke-width="2"/><path d="M9 12l2 2 4-4" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function krStockRankView(snapshot, open = false, lang = "ko") {
  if (!snapshot) return "";
  const T = (ko, en) => krT(lang, ko, en);
  const score = krStockScore(snapshot);
  const index = Math.min(KR_STOCK_RANKS.length - 1, Math.floor(score / 10));
  const [rankKo, color] = KR_STOCK_RANKS[index];
  const enRanks = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"];
  const rank = lang !== "ko" ? enRanks[index] : rankKo;
  const enPct = ["Getting Started", "Top 82%", "Top 68%", "Top 52%", "Top 38%", "Top 25%", "Top 15%", "Top 7%", "Top 3%", "Top 1%"];
  const pct = lang !== "ko" ? enPct[index] : KR_PERCENTILE_LABELS[index];
  const next = KR_STOCK_RANKS[index + 1];
  const nextEn = enRanks[index + 1];
  const message = next
    ? T(`다음 등급 ${next[0]}까지 ${(index + 1) * 10 - score}점 남았습니다.`, `${(index + 1) * 10 - score} pts to ${nextEn}.`)
    : T("최상위 쉘터 등급(챌린저)을 달성했습니다!", "Top Shelter Rank (Challenger) achieved!");
  return `<details class="stock-rank compact-detail" ${open ? "open" : ""}>
    <summary><span>${T("쉘터 등급", "Shelter Rank")}</span>${krRankShieldSvg(color)}<strong class="rank-badge" style="--rank-color:${color}">${rank}</strong><span class="pct-chip">${pct}</span><span class="stock-score">${score} / 100</span></summary>
    <div class="rank-detail"><progress aria-label="${T("비축 점수", "Stockpile Score")}" value="${score}" max="100"></progress>
    <p><strong>${pct} ${T("추정 대비 수준", "Estimated Readiness")}</strong> · ${message}</p><p>${T("배점은 생수 28점, 간편식 3종(즉석밥·컵라면·레토르트) 각 5점(15점), 통조림 5종(스팸·참치·번데기·골뱅이·과일) 각 3점(15점), 휴지·물티슈 각 4점(8점), 손전등 6점, 건전지 3종(AA 4·AAA 2·특수 2, 총 8점), 배낭·담요 각 5점(10점), 응급처치·상비약 각 5점(10점)으로 총 100점입니다. 등급과 상위 %는 가구 대비 수준을 가늠하기 위한 참고 지표입니다.", "Weights (100 pts total): Water 28, Instant Meals 15, Canned Goods 15, Hygiene 8, Flashlight 6, Batteries 8, Gear 10, First Aid & Medicine 10. Ranks and percentiles are reference indicators for household readiness.")}</p></div>
    </details>`;
}

function krStockShelves(snapshot, escape, showInactive, editing, filter, optCategory = "all", optSearch = "", quickMode = false, locationOpen = false, lang = "ko") {
  return krStockShelvesOnly(snapshot, escape, showInactive, editing, filter, optCategory, optSearch, quickMode, lang) + krLocationPanel(snapshot, escape, locationOpen, lang);
}

function krStockShelvesOnly(snapshot, escape, showInactive, editing, filter, optCategory = "all", optSearch = "", quickMode = false, lang = "ko") {
  const T = (ko, en) => krT(lang, ko, en);
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
    if (catObj.match ? !catObj.match(item) : catObj.ids && !catObj.ids.has(item.id)) return false;
    if (!query) return true;
    const shortName = (KR_READY_SHORT_NAMES[item.id] || "").toLowerCase();
    const enName = (KR_EN_NAMES[item.id] || "").toLowerCase();
    return item.name.toLowerCase().includes(query) || shortName.includes(query) || enName.includes(query);
  });
  const ready = krReadyItems(snapshot);
  const quickToggle = `<button type="button" id="toggle-quick-mode" aria-pressed="${quickMode}" title="${T("모달을 열지 않고 바로 +1 / -1 소비·보충", "Quick +1 / -1 without opening modal")}">${quickMode ? T("⚡ 빠른 ±1 켜짐", "⚡ Quick ±1 ON") : T("⚡ 빠른 ±1", "⚡ Quick ±1")}</button>`;
  const shelves = `<section class="ready-panel" aria-labelledby="essentials-shelf"><div class="shelf-head"><h3 id="essentials-shelf" tabindex="-1">${T("기본 비축 물품", "Essential Supplies")} <span>${T(`완비 ${ready.filter((item) => !krIsSelectable(item)).length}종`, `${ready.filter((item) => !krIsSelectable(item)).length} Ready`)}</span></h3>${quickToggle}</div>${krReadyGrid(snapshot, escape, essentials, editing, quickMode, lang)}</section>`;
  if (!optional.length) return shelves;
  const catEn = KR_OPTIONAL_CATEGORIES_EN;
  const categoryBar = `<div class="opt-toolbar"><div class="opt-cats" role="group" aria-label="${T("선택 물품 분류", "Optional Categories")}">${KR_OPTIONAL_CATEGORIES.map((cat) =>
    `<button type="button" data-opt-cat="${cat.id}" aria-pressed="${optCategory === cat.id}">${lang !== "ko" ? (catEn[cat.id] || cat.label) : cat.label}</button>`).join("")}</div><input id="opt-search" type="search" placeholder="${T("품목 검색...", "Search items...")}" aria-label="${T("미사용 선택 물품 검색", "Search unused optional items")}" value="${escape(optSearch)}"></div>`;
  const backupBar = `<div class="backup-bar"><button type="button" id="backup-export">${T("💾 재고 백업 저장 (JSON)", "💾 Export Backup (JSON)")}</button><button type="button" id="backup-import-btn">${T("📂 백업 복원", "📂 Import Backup")}</button><input type="file" id="backup-import" accept="application/json,.json" hidden aria-hidden="true" tabindex="-1"></div>`;
  return shelves + `<section class="ready-panel" aria-labelledby="optional-shelf-title"><div class="shelf-head"><h3 id="optional-shelf-title">${T("선택 물품", "Optional Supplies")} <span>${T(`사용 중 ${active.length}종 · 완비 ${ready.filter(krIsSelectable).length}종`, `${active.length} Active · ${ready.filter(krIsSelectable).length} Ready`)}</span></h3><button type="button" id="add-custom" class="add-custom" ${editing ? "disabled" : ""}>${T("＋ 물품 직접 추가", "+ Add Custom Item")}</button></div>
    ${active.length ? krReadyGrid(snapshot, escape, active, editing, quickMode, lang) : `<p class="ready-empty">${T("표시할 선택 물품이 없습니다.", "No optional items to display.")}</p>`}
    ${inactive.length && filter === "all" ? `<details id="optional-shelf" ${showInactive ? "open" : ""}><summary>${T(`아직 사용하지 않는 물품 ${inactive.length}종 보기`, `Show ${inactive.length} unused optional items`)}</summary>${categoryBar}${krReadyGrid(snapshot, escape, filteredInactive, editing, false, lang)}</details>` : ""}${backupBar}</section>`;
}

const KR_RECORD_MISSIONS = [
  { id: "water", title: "마실 물 기록", ids: ["drinking-water"], mode: "all", art: KR_READY_PICTOGRAMS["drinking-water"] },
  { id: "food", title: "먹을거리 기록", ids: ["instant-rice", "cup-noodles", "shelf-stable-meal", "spam-canned-ham", "canned-tuna", "canned-pupa", "canned-whelk", "canned-fruit", "canned-food", "self-heating-ration"], mode: "any", art: KR_READY_PICTOGRAMS["spam-canned-ham"] },
  { id: "light", title: "빛·전원 기록", ids: ["flashlight", "batteries", "batteries-aaa", "batteries-special", "batteries-c", "batteries-d", "power-bank"], mode: "any", art: KR_READY_PICTOGRAMS.flashlight },
  { id: "care", title: "구급·상비약 기록", ids: ["first-aid-kit", "sterile-gauze", "elastic-bandage", "adhesive-bandages", "medical-tape", "otc-medicine", "digestive-medicine", "cold-medicine", "antidiarrheal", "wound-ointment"], mode: "any", art: KR_READY_PICTOGRAMS["first-aid-kit"] },
];

function krMissionState(snapshot) {
  const readyIds = new Set(krReadyItems(snapshot).map((item) => item.id));
  return KR_RECORD_MISSIONS.map((mission) => {
    const count = mission.ids.filter((id) => readyIds.has(id)).length;
    return { ...mission, count, complete: mission.mode === "any" ? count > 0 : count === mission.ids.length };
  });
}

function krUrgentQuests(snapshot, lang = "ko") {
  if (!snapshot) return [];
  const T = (ko, en) => krT(lang, ko, en);
  const quests = [];
  const readyIds = new Set(krReadyItems(snapshot).map((i) => i.id));
  for (const item of snapshot.catalog) {
    const st = snapshot.summary?.items?.[item.id];
    const active = snapshot.items[item.id]?.applicable ?? !krIsSelectable(item);
    if (!active || !st || readyIds.has(item.id)) continue;
    const weight = KR_STOCK_WEIGHTS[item.id] || 0;
    const name = krItemDisplayName(item, lang);
    if (st.expired_quantity > 0) {
      quests.push({ priority: 100 + weight, tag: T("긴급 · 기한경과", "Urgent · Expired"), title: T(`${name} 만료분 교체·소비`, `Replace expired ${name}`), reward: weight ? `+${weight}${T("점", "pts")}` : T("위생·안전", "Safety"), itemId: item.id });
    } else if (st.expiring_quantity > 0) {
      quests.push({ priority: 85 + weight, tag: T("순환 소비", "Rotate"), title: T(`${name} 기한 임박 먼저 쓰기`, `Use expiring ${name}`), reward: weight ? `+${weight}${T("점", "pts")}` : T("낭비 방지", "No Waste"), itemId: item.id });
    } else if (st.state === "shortage" || !st.confirmed || st.stale) {
      quests.push({ priority: 40 + weight, tag: st.state === "shortage" ? T("보충 미션", "Restock") : T("실사 미션", "Audit"), title: st.state === "shortage" ? T(`${name} 목표량 채우기`, `Restock ${name}`) : T(`${name} 재고 확인하기`, `Verify ${name}`), reward: weight ? T(`최대 +${weight}점`, `Up to +${weight}pts`) : T("선택 퀘스트", "Optional"), itemId: item.id });
    }
  }
  quests.sort((a, b) => b.priority - a.priority);
  return quests.slice(0, 4);
}

function krExpiringStrip(snapshot, escape, lang = "ko") {
  if (!snapshot) return "";
  const T = (ko, en) => krT(lang, ko, en);
  const alerts = snapshot.catalog.filter((item) => {
    const st = snapshot.summary?.items?.[item.id];
    const active = snapshot.items[item.id]?.applicable ?? !krIsSelectable(item);
    return active && st && (st.expired_quantity > 0 || st.expiring_quantity > 0);
  });
  if (!alerts.length) return "";
  return `<div class="expiring-banner" role="region" aria-label="${T("기한 임박 순환 알림", "Expiring Rotation Alerts")}"><strong>${T("🔥 기한 임박·경과 — 기한이 지나기 전에 먼저 쓰고 새로 채우세요", "🔥 Expiring/Expired — Rotate and restock before expiry")}</strong><div class="expiring-chips">${alerts.slice(0, 6).map((item) => {
    const st = snapshot.summary.items[item.id];
    const name = krItemDisplayName(item, lang);
    const dDay = st.next_expiry_on && snapshot.today ? krDaysUntil(st.next_expiry_on, snapshot.today) : null;
    const tag = st.expired_quantity > 0 ? T("만료", "Expired") : (dDay !== null ? `D-${Math.max(0, dDay)}` : T("임박", "Soon"));
    return `<button type="button" class="exp-chip" data-edit="${escape(item.id)}"><span>${escape(name)}</span><strong>${tag}</strong></button>`;
  }).join("")}</div></div>`;
}

function krMissionView(snapshot, escape, animate = false, open = false, lang = "ko") {
  const T = (ko, en) => krT(lang, ko, en);
  const missions = krMissionState(snapshot);
  const complete = missions.filter((mission) => mission.complete).length;
  const names = lang !== "ko"
    ? ["Start Quests", "Initial Prep", "Survival+", "Elite Shelter", "Master Shelter"]
    : ["퀘스트 시작", "초동 대비", "생존 확장", "정예 쉘터", "마스터 쉘터"];
  const mTitleEn = { water: "Drinking Water", food: "Food & Rations", light: "Light & Power", care: "First Aid & Meds" };
  const quests = krUrgentQuests(snapshot, lang);
  const nextTag = quests[0] ? `${T("다음", "Next")}: ${quests[0].title}` : T("모든 긴급 미션 클리어!", "All urgent quests cleared!");
  return `<details class="mission-panel compact-detail" ${open ? "open" : ""}><summary class="mission-head"><span>${T("긴급 퀘스트", "Urgent Quests")}</span><strong>${T("준비 기록 단계", "Prep Stage")} ${complete}/4 · ${names[complete]}</strong><span class="quest-next">${escape(nextTag)}</span></summary><div class="mission-detail">` +
    `<div class="mission-progress" role="progressbar" aria-label="${T("준비 기록 단계", "Prep Stage")}" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${complete}"><span style="width:${complete * 25}%"></span></div>` +
    (quests.length ? `<div class="quest-list">${quests.map((q) => `<button type="button" class="quest-btn" data-edit="${escape(q.itemId)}"><span class="quest-tag">${escape(q.tag)}</span><strong class="quest-title">${escape(q.title)}</strong><span class="quest-reward">${escape(q.reward)}</span></button>`).join("")}</div>` : `<p class="quest-clear">${T("🎉 현재 시급한 미션을 모두 완료했습니다!", "🎉 All urgent quests completed!")}</p>`) +
    `<div class="mission-grid">${missions.map((mission) => `<div class="mission-item ${mission.complete ? `done${animate ? " unlock" : ""}` : "pending"}">` +
      `<span class="mission-art" aria-hidden="true">${mission.complete ? mission.art : "○"}</span>` +
      `<span class="mission-title">${escape(lang !== "ko" ? (mTitleEn[mission.id] || mission.title) : mission.title)}</span><span class="mission-state">${mission.complete ? T("클리어", "Cleared") : mission.mode === "any" ? T("대상 중 완비 0개", "0 ready") : T(`완비 ${mission.count}/${mission.ids.length}개`, `${mission.count}/${mission.ids.length} ready`)}</span></div>`).join("")}</div></div></details>`;
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
    this._quickMode = false;
    this._customDraft = null;
    this._settingsDraft = null;
    this._lang = krGetLang();
    let savedView;
    try { savedView = window.localStorage?.getItem("kr_survival_kit_view"); } catch { /* optional */ }
    this._viewMode = savedView === "3d" ? "3d" : "2d";
  }

  setConfig(config) {
    this._config = config || {};
    if (config?.lang) this._lang = config.lang;
    this._render();
  }

  setLang(lang) {
    this._lang = Object.hasOwn(KR_LANGS, lang) ? lang : "ko";
    if (this._viewMode === "3d" && this._engine3d) {
      this._stop3D();
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._snapshot && !this._loading) this._load();
    this._updateAtmosphere();
  }

  connectedCallback() {
    this._timer = window.setInterval(() => { if (!this._draft && !this._customDraft && !this._settingsDraft) this._load(); }, 30000);
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
    if (this._settingsDraft) this._captureSettings();
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
      ...this._draft.lots[index],
      lot_id: this._draft.lots[index].lot_id,
      location: row.querySelector(".location")?.value ?? this._draft.lots[index].location ?? "",
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
        ...(krCleanLocation(lot.location) ? { location: krCleanLocation(lot.location) } : {}),
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

  async _quickAdjust(itemId, delta) {
    if (this._saving || !this._snapshot) return;
    const item = this._snapshot.catalog.find((c) => c.id === itemId);
    if (!item) return;
    const saved = this._snapshot.items[itemId];
    const { lots, changed, place } = krQuickPlan(item, saved, delta);
    const name = KR_READY_SHORT_NAMES[item.id] || item.name;
    if (!changed) {
      this._message = `${name}: ${delta < 0 ? "더 줄일 재고가 없습니다." : "최대 수량에 도달했습니다."}`;
      this._render();
      return;
    }
    this._saving = true;
    try {
      await this._call("set_item", {
        item_id: item.id,
        revision: this._snapshot.revision,
        applicable: saved?.applicable ?? true,
        target: saved?.target ?? null,
        lots,
        ...(saved?.review_interval_days ? { review_interval_days: saved.review_interval_days } : {}),
        confirm: true,
        apply_date_defaults: true,
      });
      await this._load();
      this._message = `${name} ${changed > 0 ? "+" : "−"}${krStockText(item, Math.abs(changed))}${place ? ` (${place})` : ""} 반영했습니다.`;
    } catch (error) {
      await this._load();
      this._message = `빠른 수정 실패: ${error.message || "다시 시도하세요."}`;
    } finally {
      this._saving = false;
      this._render();
      // Re-render replaces the buttons; return focus so keyboard users can tap again. Fall back to "+" when "−" became disabled at 0.
      const sel = (d) => `[data-quick="${itemId}:${d}"]`; // catalog ids are kebab-case, safe inside a quoted attribute
      const again = this.shadowRoot.querySelector(sel(delta));
      (again && !again.disabled ? again : this.shadowRoot.querySelector(sel(1)))?.focus({ preventScroll: true });
    }
  }

  _exportBackup() {
    if (!this._snapshot) return;
    const payload = JSON.stringify({
      schema: "kr-survival-kit-backup-v1",
      exported_at: new Date().toISOString(),
      household_size: this._snapshot.household_size ?? 4,
      custom_items: this._snapshot.custom_items ?? {},
      display: krDisplay(this._snapshot),
      items: this._snapshot.items ?? {},
    }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kr-survival-kit-backup-${this._snapshot.today || "export"}.json`;
    a.style.display = "none";
    this.shadowRoot.append(a);
    a.click();
    a.remove();
    // Revoking synchronously can cancel the download in some browsers.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    this._message = "재고 백업 파일을 저장했습니다.";
    this._render();
  }

  async _importBackup(file) {
    if (!file || this._saving || !this._snapshot) return;
    if (file.size > 5 * 1024 * 1024) {
      this._message = "백업 복원 실패: 파일이 너무 큽니다(5MB 초과). KR Survival Kit 백업 파일인지 확인하세요.";
      this._render();
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      this._message = "백업 복원 실패: JSON 파일을 읽을 수 없습니다. 'KR Survival Kit 재고 백업 저장'으로 만든 파일을 선택하세요.";
      this._render();
      return;
    }
    const items = parsed?.items;
    if (parsed?.schema !== "kr-survival-kit-backup-v1" || !items || typeof items !== "object" || Array.isArray(items)) {
      this._message = "백업 복원 실패: KR Survival Kit 백업 파일이 아닙니다.";
      this._render();
      return;
    }
    const catalog = new Map(this._snapshot.catalog.map((item) => [item.id, item]));
    // Custom items from the backup: reuse one with the same name here, otherwise create it on restore.
    const backupCustoms = parsed.custom_items && typeof parsed.custom_items === "object" && !Array.isArray(parsed.custom_items) ? parsed.custom_items : {};
    const customPlan = Object.entries(backupCustoms).filter(([id, def]) => /^custom-[1-9][0-9]{0,5}$/.test(id) && def && typeof def === "object")
      .map(([id, def]) => ({ id, name: krCleanText(def.name, KR_CUSTOM_NAME_MAX), unit: KR_CUSTOM_UNITS.includes(def.unit) ? def.unit : "개",
        date: def.date_kind === "expiry" && KR_CUSTOM_DATES.some(([value]) => value && value === def.date_label) ? def.date_label : def.date_kind === "expiry" ? "유통기한" : "" }))
      .filter((plan) => plan.name);
    const entries = Object.entries(items).filter(([id, rec]) => (catalog.has(id) || customPlan.some((plan) => plan.id === id)) && rec && typeof rec === "object");
    const people = parsed.household_size;
    const restorePeople = Number.isInteger(people) && people >= 1 && people <= 99 && people !== this._snapshot.household_size;
    if (!entries.length && !restorePeople) {
      this._message = "백업 복원 실패: 복원할 품목이 없습니다.";
      this._render();
      return;
    }
    if (!window.confirm(`백업 파일의 ${entries.length}개 품목${restorePeople ? `과 가구 인원(${people}명)` : ""}으로 현재 기록을 덮어씁니다. 계속할까요?`)) return;
    this._saving = true;
    this._message = "백업을 복원하는 중입니다…";
    this._render();
    const today = this._snapshot.today || "";
    const restoredCheck = (rec) => rec.confirmed !== false && typeof rec.verified_on === "string"
      && /^\d{4}-\d{2}-\d{2}$/.test(rec.verified_on) && rec.verified_on <= today;
    const failed = [];
    let restored = 0;
    try {
      // Refresh once so the first write uses the newest revision, then chain the returned revisions.
      this._snapshot = await this._call("get_inventory");
      let revision = this._snapshot.revision;
      if (restorePeople) {
        try {
          revision = (await this._call("set_household_size", { revision, household_size: people })).revision;
        } catch (error) {
          failed.push(`가구 인원(${error.message || "오류"})`);
        }
      }
      if (parsed.display && typeof parsed.display === "object" && !Array.isArray(parsed.display)) {
        const restoredDisplay = krDisplay({ display: parsed.display });
        const current = krDisplay(this._snapshot);
        const changes = Object.fromEntries(Object.entries(restoredDisplay).filter(([key, value]) => current[key] !== value));
        if (changes.title === KR_DEFAULT_TITLE) changes.title = "";
        if (Object.keys(changes).length) {
          try {
            revision = (await this._call("set_display", { revision, ...changes })).revision;
          } catch (error) {
            failed.push(`화면 설정(${error.message || "오류"})`);
          }
        }
      }
      const idMap = new Map();
      for (const plan of customPlan) {
        const existing = this._snapshot.catalog.find((item) => item.custom && item.name.toLowerCase() === plan.name.toLowerCase());
        if (existing) { idMap.set(plan.id, existing.id); continue; }
        try {
          const created = await this._call("add_custom_item", { revision, name: plan.name, unit: plan.unit,
            date_kind: plan.date ? "expiry" : "inspection", ...(plan.date ? { date_label: plan.date } : {}) });
          revision = created.revision;
          idMap.set(plan.id, created.item_id);
        } catch (error) {
          failed.push(plan.name);
        }
      }
      for (const [backupId, rec] of entries) {
        const itemId = idMap.get(backupId) || (catalog.has(backupId) && !catalog.get(backupId).custom ? backupId : null);
        if (!itemId) continue;
        try {
          const result = await this._call("set_item", {
            item_id: itemId,
            revision,
            applicable: rec.applicable === true,
            target: rec.target ?? null,
            lots: Array.isArray(rec.lots) ? rec.lots : [],
            ...(Number.isInteger(rec.review_interval_days) ? { review_interval_days: rec.review_interval_days } : {}),
            // Keep the backup's inspection state: its own (never future) check day, or unconfirmed — never "checked today".
            ...(restoredCheck(rec) ? { verified_on: rec.verified_on } : {}),
            confirm: Boolean(restoredCheck(rec)),
            apply_date_defaults: true,
          });
          revision = result.revision;
          restored += 1;
        } catch (error) {
          failed.push(KR_READY_SHORT_NAMES[itemId] || catalog.get(itemId)?.name || itemId);
          if (/changed|revision/i.test(error.message || "")) {
            revision = (await this._call("get_inventory")).revision;
          }
        }
      }
    } catch (error) {
      failed.push(`연결 오류(${error.message || "다시 시도하세요"})`);
    } finally {
      this._saving = false;
      await this._load();
    }
    this._message = failed.length
      ? `백업에서 ${restored}개 품목을 복원했고, ${failed.length}건은 값이 올바르지 않아 건너뛰었습니다: ${failed.slice(0, 8).join(", ")}${failed.length > 8 ? " 외" : ""}`
      : `백업에서 ${restored}개 품목${restorePeople ? `과 가구 인원 ${people}명` : ""}을 복원했습니다.`;
    this._render();
  }

  _openSettings() {
    if (this._draft || this._customDraft || this._saving || !this._snapshot) return;
    const display = krDisplay(this._snapshot);
    this._settingsDraft = {
      ...display,
      title: display.title === KR_DEFAULT_TITLE ? "" : display.title,
      household_size: String(this._snapshot.household_size ?? 4),
      inspection_days: String(this._snapshot.default_review_interval_days ?? 90),
    };
    this._message = "";
    this._render();
  }

  _captureSettings() {
    const form = this.shadowRoot.querySelector("#settings-editor");
    if (!form || !this._settingsDraft) return;
    this._settingsDraft.title = form.querySelector("#set-title").value;
    this._settingsDraft.nickname = form.querySelector("#set-nickname").value;
    this._settingsDraft.household_size = form.querySelector("#set-people").value;
    this._settingsDraft.inspection_days = form.querySelector("#set-days").value;
    for (const [key] of KR_DISPLAY_TOGGLES) this._settingsDraft[key] = form.querySelector(`[data-toggle="${key}"]`).checked;
  }

  async _saveSettings() {
    if (this._saving || !this._settingsDraft) return;
    this._captureSettings();
    const draft = this._settingsDraft;
    const people = krBoundedInt(draft.household_size, 1, 99);
    const days = krBoundedInt(draft.inspection_days, 7, 365);
    if (people === null || days === null) {
      this._message = people === null ? "가구 인원은 1~99 사이의 정수로 입력하세요." : "점검 주기는 7~365 사이의 정수(일)로 입력하세요.";
      this._settingsInvalid = people === null ? "set-people" : "set-days";
      this._render();
      const field = this.shadowRoot.querySelector(`#${this._settingsInvalid}`);
      field?.focus({ preventScroll: false });
      field?.select?.();
      return;
    }
    this._settingsInvalid = null;
    const current = krDisplay(this._snapshot);
    const wanted = { title: krCleanText(draft.title, KR_TITLE_MAX) || KR_DEFAULT_TITLE, nickname: krCleanText(draft.nickname, KR_NICKNAME_MAX) };
    for (const [key] of KR_DISPLAY_TOGGLES) wanted[key] = Boolean(draft[key]);
    const changes = Object.fromEntries(Object.entries(wanted).filter(([key, value]) => current[key] !== value));
    if (changes.title === KR_DEFAULT_TITLE) changes.title = "";
    this._saving = true;
    this._message = "설정을 저장하는 중입니다…";
    this._render();
    try {
      let revision = this._snapshot.revision;
      if (Object.keys(changes).length) revision = (await this._call("set_display", { revision, ...changes })).revision;
      if (people !== this._snapshot.household_size) revision = (await this._call("set_household_size", { revision, household_size: people })).revision;
      if (days !== this._snapshot.default_review_interval_days) await this._call("set_inspection_days", { inspection_days: days });
      this._settingsDraft = null;
      this._saving = false;
      await this._load();
      this._message = "설정을 저장했습니다. 이 Home Assistant를 쓰는 모든 기기에 함께 적용됩니다.";
      this._render();
      this.shadowRoot.querySelector("#open-settings")?.focus({ preventScroll: true });
      return;
    } catch (error) {
      const conflict = /changed|revision/i.test(error.message || "");
      this._message = conflict ? "다른 기기에서 먼저 저장했습니다. 최신 내용을 불러왔으니 다시 저장해 주세요." : `설정을 저장하지 못했습니다. ${error.message || ""}`;
      this._saving = false;
      if (conflict) {
        await this._load();
        this._message = "다른 기기에서 먼저 저장했습니다. 최신 내용을 불러왔으니 다시 저장해 주세요.";
        this._render();
        return;
      }
    }
    this._saving = false;
    this._render();
  }

  async _addCustom() {
    if (this._saving || !this._customDraft) return;
    const name = krCleanText(this._customDraft.name, KR_CUSTOM_NAME_MAX);
    const { unit, date } = this._customDraft;
    if (!name) {
      this._message = "물품 이름을 입력하세요.";
      this._render();
      return;
    }
    if (this._snapshot.catalog.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      this._message = `"${name}"은(는) 이미 있는 물품입니다. 목록에서 찾아 수정하세요.`;
      this._render();
      return;
    }
    this._saving = true;
    try {
      const result = await this._call("add_custom_item", {
        revision: this._snapshot.revision, name, unit,
        date_kind: date ? "expiry" : "inspection", ...(date ? { date_label: date } : {}),
      });
      this._customDraft = null;
      this._saving = false;
      await this._load();
      const item = this._snapshot?.catalog.find((entry) => entry.id === result.item_id);
      this._message = `${name}을(를) 추가했습니다. 수량을 입력하세요.`;
      if (item) this._edit(item, false);
      else this._render();
      return;
    } catch (error) {
      this._message = /changed|revision/i.test(error.message || "")
        ? "다른 수정이 먼저 저장됐습니다. 다시 추가를 눌러 주세요."
        : /exists/i.test(error.message || "") ? "같은 이름의 물품이 이미 있습니다."
        : `물품을 추가하지 못했습니다. ${error.message || ""}`;
      if (/changed|revision/i.test(error.message || "")) await this._load();
    }
    this._saving = false;
    this._render();
  }

  async _removeCustom() {
    if (this._saving || !this._draft) return;
    const item = this._snapshot.catalog.find((entry) => entry.id === this._draft.id);
    if (!item?.custom || !window.confirm(`직접 추가한 "${item.name}" 물품과 재고 기록을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    this._saving = true;
    try {
      await this._call("remove_custom_item", { revision: this._snapshot.revision, item_id: item.id });
      this._draft = null;
      this._shelfEditId = null;
      await this._load();
      this._message = `${item.name} 물품을 삭제했습니다.`;
    } catch (error) {
      this._message = /changed|revision/i.test(error.message || "")
        ? "다른 수정이 먼저 저장됐습니다. 최신 재고를 확인하고 다시 삭제하세요."
        : "삭제하지 못했습니다. HA 로그를 확인한 뒤 다시 시도하세요.";
      await this._load();
    }
    this._saving = false;
    this._render();
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
    this._locationOpen = this.shadowRoot.querySelector("#location-panel")?.open ?? this._locationOpen;
    const previousDialog = this.shadowRoot.querySelector("#item-dialog");
    const dialogScroll = previousDialog?.scrollTop ?? 0;
    const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
    const snapshot = this._snapshot;
    const people = snapshot?.household_size ?? 4;
    const lang = this._lang || krGetLang();
    const T = (ko, en) => krT(lang, ko, en);
    const states = { shortage: T("부족", "Shortage"), needs_check: T("확인 필요", "Needs Check"), sufficient: T("충족", "Ready"), not_applicable: T("해당 없음", "Inactive") };
    const items = snapshot?.catalog.map((item) => ({ ...item, status: snapshot.summary.items[item.id] })) ?? [];
    const recommendations = new Map([
      ...(snapshot?.household?.items || []), ...(snapshot?.household?.optional_items || []),
    ].map((entry) => [entry.item_id, entry]));
    const draftItem = items.find((item) => item.id === this._draft?.id);
    const draftRecommendation = recommendations.get(this._draft?.id);
    const noteCoveredByBasis = draftItem?.note && draftRecommendation?.basis?.includes(draftItem.note);
    const labelCheckDays = snapshot?.label_check_days?.[draftItem?.id] ?? 7;
    const draftIcon = draftItem ? (KR_READY_PICTOGRAMS[draftItem.id] || KR_CUSTOM_PICTOGRAM) : "";
    const knownPlaces = krAllLocations(snapshot);
    const custom = this._customDraft;
    const customDateEn = { "": "No Expiry (Quantity Check Only)", "유통기한": "Expiration Date", "소비기한": "Use-by Date", "사용기한": "Use-by (Meds/Hygiene)", "사용 권장기한": "Recommended Use-by (Batteries)" };
    const customForm = custom && !this._draft ? `<form id="custom-editor"><div class="dialog-head"><span class="dialog-art" aria-hidden="true">${KR_CUSTOM_PICTOGRAM}</span><div><h3 id="item-dialog-title" tabindex="-1">${T("물품 직접 추가", "Add Custom Item")}</h3><p class="dialog-status">${T("목록에 없는 물품을 우리 집 물품으로 추가합니다.", "Add a custom item not in the default catalog.")}</p></div></div>` +
      `<label for="custom-name">${T("물품 이름", "Item Name")} <small>(${T(`최대 ${KR_CUSTOM_NAME_MAX}자`, `max ${KR_CUSTOM_NAME_MAX} chars`)})</small></label><input id="custom-name" type="text" required maxlength="${KR_CUSTOM_NAME_MAX}" autocomplete="off" placeholder="${T("예: 캠핑용 랜턴, 반려견 사료", "e.g. Camping Lantern, Pet Food")}" value="${escape(custom.name)}" aria-describedby="custom-name-help"><p id="custom-name-help" class="item-note">${T("꺾쇠(< >)·따옴표·& 같은 특수문자는 자동으로 빠집니다.", "Special characters (< > quotes &) are stripped automatically.")}</p>` +
      `<label for="custom-unit">${T("단위", "Unit")}</label><select id="custom-unit">${KR_CUSTOM_UNITS.map((unit) => `<option value="${unit}" ${custom.unit === unit ? "selected" : ""}>${lang === "en" ? (KR_UNIT_EN[unit] || unit) : unit}</option>`).join("")}</select>` +
      `<label for="custom-date">${T("기한 관리", "Expiry Tracking")}</label><select id="custom-date">${KR_CUSTOM_DATES.map(([value, text]) => `<option value="${value}" ${custom.date === value ? "selected" : ""}>${lang === "en" ? (customDateEn[value] || text) : text}</option>`).join("")}</select>` +
      `<div class="actions"><button type="submit" class="primary" ${this._saving ? "disabled" : ""}>${T("추가하고 수량 입력", "Add & Enter Quantity")}</button><button type="button" id="custom-cancel">${T("취소", "Cancel")}</button></div></form>` : "";
    const settings = this._settingsDraft && !this._draft && !custom ? this._settingsDraft : null;
    const toggleEn = {
      show_survival: ["Show Water & Food Days", "Shows 'Water Xd · Food Yd' next to the title."],
      show_clock: ["Show Clock & Weather", "Shows current time and local weather next to the title."],
      show_expiring: ["Show Expiring Banner", "Highlights expiring or expired items at the top."],
      show_rank: ["Show Shelter Rank", "Displays stockpile score and rank (Iron to Challenger)."],
      show_missions: ["Show Urgent Quests", "Highlights priority restock and rotation quests."],
    };
    const settingsForm = settings ? `<form id="settings-editor" novalidate><div class="dialog-head"><span class="dialog-art settings-art" aria-hidden="true">⚙️</span><div><h3 id="item-dialog-title" tabindex="-1">${T("대시보드 설정", "Dashboard Settings")}</h3><p class="dialog-status">${T("이 Home Assistant를 쓰는 모든 기기에 함께 적용됩니다.", "Applies across all devices using this Home Assistant.")}</p></div></div>` +
      `<fieldset class="settings-group"><legend>${T("이름", "Names")}</legend>` +
      `<label for="set-title">${T("대시보드 제목", "Dashboard Title")} <small>(${T(`최대 ${KR_TITLE_MAX}자`, `max ${KR_TITLE_MAX} chars`)})</small></label><input id="set-title" type="text" maxlength="${KR_TITLE_MAX}" autocomplete="off" placeholder="${T(KR_DEFAULT_TITLE, "Home Stockpile")}" value="${escape(settings.title)}"><p class="item-note">${T(`비워 두면 "${KR_DEFAULT_TITLE}"로 표시됩니다.`, 'Leave blank to use default title.')}</p>` +
      `<label for="set-nickname">${T("집 이름·닉네임", "Household Nickname")} <small>(${T(`선택, 최대 ${KR_NICKNAME_MAX}자`, `optional, max ${KR_NICKNAME_MAX}`)})</small></label><input id="set-nickname" type="text" maxlength="${KR_NICKNAME_MAX}" autocomplete="off" placeholder="${T("예: 행복한 우리집, 민준이네", "e.g. Safe Haven, Home Base")}" value="${escape(settings.nickname)}"><p class="item-note">${T('제목 위에 작게 표시됩니다. 특수문자(< > " \' & 등)는 자동으로 빠집니다.', 'Shown above the title. Special characters are stripped automatically.')}</p></fieldset>` +
      `<fieldset class="settings-group"><legend>${T("우리 집 기준", "Household Baseline")}</legend><div class="field-pair">` +
      `<label>${T("가구 인원 (명)", "Household Size")}<input id="set-people" ${this._settingsInvalid === "set-people" ? 'aria-invalid="true"' : ""} type="number" inputmode="numeric" min="1" max="99" step="1" required value="${escape(settings.household_size)}"></label>` +
      `<label>${T("기본 점검 주기 (일)", "Default Check Interval (days)")}<input id="set-days" ${this._settingsInvalid === "set-days" ? 'aria-invalid="true"' : ""} type="number" inputmode="numeric" min="7" max="365" step="1" required value="${escape(settings.inspection_days)}"></label></div>` +
      `<p class="item-note">${T("가구 인원은 1~99명, 점검 주기는 7~365일까지 입력할 수 있습니다. 인원을 바꾸면 며칠분 계산과 목표량이 바로 바뀌고, 품목마다 따로 정한 점검 주기는 그대로 유지됩니다.", "Household size: 1–99; check interval: 7–365 days. Changing size immediately recalculates targets and survival days.")}</p>${this._message && this._settingsInvalid ? `<p class="message settings-message" role="alert">${escape(this._message)}</p>` : ""}</fieldset>` +
      `<fieldset class="settings-group"><legend>${T("화면에 보일 항목", "Visible Sections")}</legend>${KR_DISPLAY_TOGGLES.map(([key, label, help]) => {
        const [lText, hText] = lang === "en" && toggleEn[key] ? toggleEn[key] : [label, help];
        return `<label class="check-row toggle-row"><input type="checkbox" data-toggle="${key}" ${settings[key] ? "checked" : ""}><span><strong>${lText}</strong><small>${hText}</small></span></label>`;
      }).join("")}</fieldset>` +
      (this._message && !this._settingsInvalid ? `<p class="message settings-message" role="alert">${escape(this._message)}</p>` : "") +
      `<div class="actions"><button type="submit" class="primary" ${this._saving ? "disabled" : ""}>${T("저장", "Save")}</button><button type="button" id="settings-cancel">${T("취소", "Cancel")}</button><button type="button" id="settings-reset">${T("기본값으로", "Reset")}</button></div></form>` : "";
    const editItemName = draftItem ? krItemDisplayName(draftItem, lang) : "";
    const edit = this._draft && draftItem ? `<form id="editor"><div class="dialog-head"><span class="dialog-art" aria-hidden="true">${draftIcon}</span><div><h3 id="item-dialog-title" tabindex="-1">${escape(editItemName)} ${T("수정", "Edit")}</h3><p class="dialog-status">${T("현재", "Current")} ${escape(krStockText(draftItem, (draftItem.status.usable ?? 0) + (draftItem.status.unknown_date_quantity ?? 0), lang))} · ${states[draftItem.status.state]} · ${T("실사", "Checked")} ${escape(draftItem.status.verified_on || T("없음", "None"))}${draftItem.status.next_review_on ? ` · ${T("다음", "Next")} ${escape(draftItem.status.next_review_on)}` : ""}</p></div></div>` +
      (draftItem.status.target != null ? `<p class="recommendation">${T(`${people}인 가구 목표`, `Target for ${people}`)} <strong>${escape(krStockText(draftItem, draftItem.status.target, lang))}</strong></p>` : "") +
      (lang !== "en" && draftItem.examples ? `<p class="item-note">${escape(draftItem.examples)}</p>` : "") +
      (lang !== "en" && draftItem.note && !noteCoveredByBasis ? `<p class="item-note">${escape(draftItem.note)}</p>` : "") +
      (lang !== "en" && draftRecommendation?.basis ? `<details class="item-reference"><summary>품목 참고 기준</summary><p>${escape(draftRecommendation.basis)}</p></details>` : "") +
      (this._draft.lots.length > 1 ? `<p class="item-note">${T("보관 위치나 입고일이 다른 재고를 나눠 기록합니다. 각 수량과 위치를 수정할 수 있습니다.", "Track separate lots by storage location or received date.")}</p>` : "") +
      `<datalist id="kr-location-options">${[...new Set([...knownPlaces, ...KR_LOCATION_EXAMPLES])].map((place) => `<option value="${escape(place)}"></option>`).join("")}</datalist>` +
      this._draft.lots.map((lot, index) =>
        `<fieldset class="lot-edit"><legend>${this._draft.lots.length > 1 ? `${T("재고", "Lot")} ${index + 1}${String(lot.location || "").trim() ? ` · ${escape(lot.location.trim())}` : ""}` : T("수량과 날짜", "Quantity & Dates")}</legend>` +
        (this._draft.lots.length > 1 ? `<button type="button" class="lot-remove" data-remove-lot="${index}" aria-label="${T(`재고 ${index + 1} 삭제`, `Remove lot ${index + 1}`)}">${T("이 재고 삭제", "Remove Lot")}</button>` : "") +
        (lot.capacity !== undefined
          ? `<div class="preset-row" role="group" aria-label="${T("생수 빠른 입력", "Quick Water Presets")}"><button type="button" class="preset-btn" data-water-preset="2:6">${T("2L × 6병", "2L × 6")}</button><button type="button" class="preset-btn" data-water-preset="2:12">${T("2L × 12병", "2L × 12")}</button><button type="button" class="preset-btn" data-water-preset="0.5:20">${T("500ml × 20병", "500ml × 20")}</button></div>` +
            `<div class="field-pair"><label>${T("병 용량 (L)", "Bottle Size (L)")}<input class="capacity" type="number" min="0.001" max="1000000" step="0.001" value="${escape(lot.capacity)}" required></label>` +
            `<label>${T("병 수 (병)", "Bottles")}<input class="bottle-count" type="number" min="0" max="1000000000" step="1" value="${escape(lot.count)}" required></label></div>` +
            `<output class="lot-total" aria-live="polite"></output>`
          : `<label>${draftItem.id === "drinking-water" ? T("보유량 합계 (L)", "Total Volume (L)") : `${T("보유 수량", "Quantity")} (${escape(krStockUnit(draftItem, lang))})`}<div class="qty-row"><input class="quantity" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(lot.quantity)}" required><button type="button" class="step-btn" data-step="-1" aria-label="1 ${T("빼기", "minus")}">−1</button><button type="button" class="step-btn" data-step="1" aria-label="1 ${T("더하기", "plus")}">+1</button><button type="button" class="step-btn" data-step="5" aria-label="5 ${T("더하기", "plus")}">+5</button></div></label>`) +
        `<div class="field-pair"><label>${T("입고일", "Received On")}<input class="received-on" type="date" value="${escape(lot.received_on || snapshot.today || "")}"></label>` +
        (draftItem.date_kind === "expiry" ? `<label>${escape(krDateLabel(draftItem, lang))}<input class="expiry" type="date" value="${escape(lot.expires_on || "")}" aria-describedby="expiry-help"></label>` : `<div></div>`) + `</div>` +
        (draftItem.date_kind === "expiry" ? `<div class="preset-row" role="group" aria-label="${escape(krDateLabel(draftItem, lang))}">${krExpiryPresets(draftItem, lang).map(([months, text]) => `<button type="button" class="preset-btn" data-exp-months="${months}">${text}</button>`).join("")}</div>` : "") +
        (lot.label_check_on ? `<small class="label-check">${T("포장 기한 확인일", "Label Check Due")} ${escape(lot.label_check_on)}</small>` : "") +
        `<label class="loc-field">${T("보관 위치", "Location")} <small>(${T("선택", "optional")})</small><input class="location" type="text" maxlength="${KR_LOCATION_MAX}" list="kr-location-options" autocomplete="off" value="${escape(lot.location || "")}" placeholder="${T("예: 주방 팬트리 3층 선반", "e.g. Pantry Shelf 3")}"></label>` +
        `<div class="preset-row loc-chips" role="group" aria-label="${T("자주 쓰는 보관 위치", "Frequent Locations")}">${(knownPlaces.length ? knownPlaces : KR_LOCATION_EXAMPLES).slice(0, 5).map((place) => `<button type="button" class="preset-btn" data-loc="${escape(place)}">${KR_PIN_SVG}${escape(place)}</button>`).join("")}</div>` +
        `</fieldset>`
      ).join("") +
      (this._draft.lots.length < 20 ? `<button type="button" id="add-lot" class="add-lot">${T("＋ 다른 위치에 보관 중인 재고 추가", "+ Add Lot in Another Location")}</button>` : "") +
      (draftItem.date_kind === "expiry" ? `<p id="expiry-help" class="item-note">${T(`${krDateLabel(draftItem)}이 여러 개면 가장 빠른 날짜를 입력하세요. 비우면 ${labelCheckDays}일 뒤 확인 알림이 뜹니다.`, `Enter the earliest ${krDateLabel(draftItem, "en").toLowerCase()}. Leave blank to be reminded in ${labelCheckDays} days.`)}</p>` : `<p class="item-note">${T("저장한 날을 마지막 실사일로 기록합니다.", "Saving records today as the last verification date.")}</p>`) +
      `<label for="target">${T("목표량", "Target")} (${escape(krStockUnit(draftItem, lang))})</label><input id="target" type="number" min="0" max="${draftItem.id === "drinking-water" ? "1000000" : "1000000000"}" step="${draftItem.id === "drinking-water" ? "0.001" : "1"}" value="${escape(this._draft.target)}" placeholder="${draftItem.status.recommended_target == null ? T("미설정", "Unset") : escape(krStockText(draftItem, draftItem.status.recommended_target, lang)) + T(" 자동", " (auto)")}">` +
      `<details id="item-settings" ${this._draft.settingsOpen ? "open" : ""}><summary>${T("점검 및 관리 설정", "Check & Management Settings")}</summary>` +
      `<label class="check-row"><input id="applicable" type="checkbox" ${this._draft.applicable ? "checked" : ""}> ${T("우리 집에서 관리", "Track in Household")}</label>` +
      `<label for="review-interval">${T("재고 점검 주기 (일)", "Check Interval (days)")}</label><input id="review-interval" type="number" min="1" max="3650" step="1" value="${escape(this._draft.review_interval_days)}" placeholder="${T(`기본 ${snapshot.default_review_interval_days ?? 30}일`, `Default ${snapshot.default_review_interval_days ?? 30}d`)}"><p class="item-note">${T("마지막 저장일로부터 이 기간이 지나면 실사 필요로 표시됩니다.", "Items older than this since last save are marked as Check Needed.")}</p></details>` +
      `<div class="actions"><button type="submit" class="primary">${T("저장", "Save")}</button><button type="button" id="cancel">${T("취소", "Cancel")}</button>` +
      `${draftItem.custom ? `<button type="button" id="remove-custom" class="danger">${T("이 물품 삭제", "Delete Item")}</button>` : snapshot.items[this._draft.id] ? `<button type="button" id="delete" class="danger">${T("기록 삭제", "Clear Record")}</button>` : ""}</div></form>` : "";
    const counts = snapshot?.summary;
    const filters = [["all", T("전체", "All"), null], ["shortage", T("부족", "Shortage"), counts?.shortage_count],
      ["needs_check", T("확인 필요", "Needs Check"), counts?.needs_check_count], ["expiring", T("기한 임박", "Expiring"), counts?.expiring_count]];
    const signals = counts ? `<div class="signals" aria-label="${T("선반 필터", "Shelf Filter")}">${filters.map(([id, label, count]) =>
      `<button type="button" data-status="${id}" aria-pressed="${this._statusFilter === id}"><span>${label}</span>${count == null ? "" : `<strong>${count}</strong>`}</button>`).join("")}</div>` : "";
    const missionSignature = krMissionState(snapshot).map((mission) => mission.complete).join("");
    const animateMission = Boolean(snapshot && missionSignature !== this._missionSignature);
    this._missionSignature = missionSignature;
    const catEn3d = KR_OPTIONAL_CATEGORIES_EN;
    const optCatSelect = `<select id="zone-3d-cat" data-3d-cat aria-label="${T("3D 선택 물품 분류", "3D Optional Category")}">${KR_OPTIONAL_CATEGORIES.map((c) => `<option value="${c.id}">${lang !== "ko" ? (catEn3d[c.id] || c.label) : c.label}</option>`).join("")}</select>`;
    const stage3d = this._viewMode === "3d" && snapshot ? `<section class="warehouse-3d-stage" aria-label="${T("3D 입체 창고 뷰", "3D Warehouse View")}"><div class="warehouse-3d-bar"><div class="controls" role="group" aria-label="${T("창고 구역", "Warehouse Zone")}"><button type="button" data-3d-zone="essentials" aria-pressed="true">${T("기본 비축 랙", "Essentials Rack")}</button><button type="button" data-3d-zone="optional" aria-pressed="false">${T("선택 물품 랙", "Optional Rack")}</button>${optCatSelect}<button type="button" id="toggle-3d-active" aria-pressed="false">${T("사용 중만", "Active Only")}</button></div><div class="controls" role="group" aria-label="${T("창고 환경", "Environment")}"><select data-3d-time aria-label="${T("시간대", "Time of Day")}"><option value="auto">${T("시간 자동", "Auto Time")}</option><option value="dawn">${T("새벽", "Dawn")}</option><option value="day">${T("낮", "Day")}</option><option value="sunset">${T("노을", "Sunset")}</option><option value="night">${T("밤", "Night")}</option></select><select data-3d-weather aria-label="${T("날씨", "Weather")}"><option value="auto">${T("날씨 자동", "Auto Weather")}</option><option value="clear">${T("맑음", "Clear")}</option><option value="rain">${T("비", "Rain")}</option><option value="snow">${T("눈", "Snow")}</option><option value="storm">${T("뇌우", "Storm")}</option></select><span class="env-chip" id="env-3d-chip" role="status"></span></div><div class="controls"><button type="button" id="toggle-3d-spin" aria-pressed="true">${T("자동 회전", "Auto Spin")}</button><button type="button" id="reset-3d-cam">${T("시점 초기화", "Reset View")}</button></div></div><canvas id="warehouse-3d-canvas"></canvas><div id="warehouse-3d-tooltip" role="status" hidden></div></section>` : "";
    const surv = krSurvivalDays(snapshot);
    const display = krDisplay(snapshot);
    const titleText = display.title === KR_DEFAULT_TITLE && lang !== "ko" ? T(KR_DEFAULT_TITLE, "Home Stockpile") : display.title;
    const survChip = snapshot && display.show_survival ? `<span class="survival-chip" title="${T(`${people}인 가구 기준 예상 생존 가능 일수`, `Estimated survival days for ${people}-person household`)}">${T(`💧 생수 ${surv.waterDays}일분 · 🍱 식량 ${surv.foodDays}일분`, `💧 Water ${surv.waterDays}d · 🍱 Food ${surv.foodDays}d`)}</span>` : "";
    // Keep the live 3D stage (WebGL context, camera, weather particles) across re-renders such as the 30s inventory poll.
    const keptStage = this._viewMode === "3d" && snapshot && this._engine3d ? this.shadowRoot.querySelector(".warehouse-3d-stage") : null;
    if (!keptStage) this._stop3D();
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
      input:not([type=checkbox]),#custom-editor select{box-sizing:border-box;width:100%;min-height:42px;padding:.45rem .6rem;font:inherit;color:var(--primary-text-color,#173048);background:var(--card-background-color,#fff);border:1px solid #5c7a8a;border-radius:8px}
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
      .hero-title{display:flex;flex-direction:column;gap:2px;min-width:0}.hero-title h2{overflow-wrap:anywhere}.nickname{font-size:.82rem;font-weight:800;opacity:.85;overflow-wrap:anywhere}
      .atmosphere.no-clock #local-clock,.atmosphere.no-clock #local-weather{display:none !important}
      #open-settings{min-width:44px;min-height:36px;padding:0 .5rem;font-size:1.15rem;color:inherit;border-color:var(--kr-line,rgba(130,205,220,.45));background:rgba(7,22,34,.5)}
      .settings-group{margin:12px 0 0;padding:10px 12px 12px;border:1px solid rgba(130,170,190,.35);border-radius:10px}.settings-group legend{padding:0 6px;font-weight:800}
      .toggle-row{display:flex;align-items:flex-start;gap:10px;margin:8px 0;cursor:pointer}.toggle-row input{width:20px;height:20px;margin-top:2px;flex:none}.toggle-row span{display:flex;flex-direction:column;gap:2px}.toggle-row small{opacity:.75;font-size:.8rem}
      .settings-message{margin:12px 0 0}#settings-editor input[aria-invalid="true"]{border-color:#ff8a80;box-shadow:0 0 0 2px rgba(255,138,128,.35)}
      .settings-art{display:grid;place-items:center;font-size:1.8rem}
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
      .rank-shield{vertical-align:middle;flex-shrink:0}
      .pct-chip{padding:.14rem .45rem;border-radius:6px;background:rgba(143,230,238,.16);border:1px solid rgba(143,230,238,.38);color:var(--kr-accent,#9ee9ea);font-size:.76rem;font-weight:800}
      .quest-next{font-size:.78rem;color:var(--kr-muted,#c7e2e7);margin-inline-start:auto}
      .quest-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem;margin:.55rem 0}
      .quest-btn{display:grid;gap:.15rem;text-align:left;padding:.5rem .65rem;border-radius:9px;border:1px solid rgba(130,210,225,.4);background:rgba(16,46,64,.65);color:inherit}
      .quest-btn:hover{border-color:var(--kr-accent,#8fe6ee);background:rgba(28,72,96,.75)}
      .quest-tag{font-size:.68rem;font-weight:800;color:#ffd166}.quest-title{font-size:.82rem}.quest-reward{font-size:.72rem;color:var(--kr-accent,#9ee9ea)}
      .expiring-banner{margin-top:.9rem;padding:.7rem .85rem;border-radius:12px;border:1px solid rgba(255,170,90,.55);background:rgba(120,55,15,.26);display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap}
      .expiring-banner>strong{font-size:.86rem;color:#ffd9a0}
      .expiring-chips{display:flex;flex-wrap:wrap;gap:.35rem}
      .exp-chip{min-height:34px;padding:.2rem .6rem;font-size:.78rem;border-radius:999px;border-color:rgba(255,180,100,.55);background:rgba(255,160,70,.16);color:#fff2dc;display:inline-flex;align-items:center;gap:.35rem}
      .exp-chip strong{color:#ffb366}
      .survival-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:8px;border:1px solid rgba(130,220,235,.4);background:rgba(15,48,66,.65);color:#aef2f8;font-size:.82rem;font-weight:800}
      #toggle-quick-mode{min-height:34px;padding:.2rem .65rem;font-size:.78rem;border-radius:999px;border-color:rgba(130,205,220,.4);color:inherit}
      #toggle-quick-mode[aria-pressed="true"]{background:var(--kr-accent,#8fe6ee);color:var(--kr-accent-ink,#0b2029);border-color:var(--kr-accent,#8fe6ee);font-weight:800}
      .quick-bar{flex:none;display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px}
      .quick-bar .qbtn{min-width:0;min-height:36px;padding:2px 0;font-size:.8rem;font-weight:800;border-radius:8px;background:rgba(18,52,70,.85);border:1px solid rgba(115,172,190,.42);color:#eef9fb;font-variant-numeric:tabular-nums;cursor:pointer}
      .quick-bar .qbtn:hover:not(:disabled){border-color:#9fe8f2;background:rgba(36,82,104,.95)}
      .quick-bar .qbtn[data-dir="up"]{color:#9ff2cc}
      .quick-bar .qbtn:disabled{opacity:.4;cursor:not-allowed}
      .quick-bar .qbtn:focus-visible{outline:3px solid #ffd899;outline-offset:1px}
      .backup-bar{display:flex;flex-wrap:wrap;gap:8px;margin-top:1rem;padding-top:.85rem;border-top:1px solid rgba(115,172,190,.25)}
      .backup-bar button,.backup-import-btn{display:inline-flex;align-items:center;min-height:36px;padding:.3rem .7rem;font-size:.8rem;font-weight:700;border-radius:8px;border:1px solid rgba(115,172,190,.4);background:rgba(12,35,48,.6);color:inherit;cursor:pointer}
      .warehouse-3d-bar select{min-height:34px;padding:2px 8px;border-radius:7px;border:1px solid rgba(112,174,194,.4);background:#0f2736;color:#dff5f8;font:inherit;font-size:.78rem}
      @media(max-width:650px){.quest-list{grid-template-columns:1fr}}
      .rank-badge{padding:.16rem .52rem;border-radius:6px;color:#111922;background:var(--rank-color);font-size:.84rem;font-weight:800}
      .stock-score{font-size:.84rem;font-variant-numeric:tabular-nums;color:var(--kr-muted,#cfe8ec)}
      .rank-detail,.mission-detail{padding:.15rem .8rem .8rem}
      .rank-detail progress{display:block;width:100%;height:.55rem;accent-color:var(--kr-accent,#8fe6ee);border-radius:999px}
      .rank-detail p,.mission-detail p{font-size:.82rem;color:var(--kr-muted,#c7e2e7)}

      .ready-panel{margin-top:1.15rem;padding:1rem;border:1px solid rgba(112,174,194,.34);border-radius:14px;background:rgba(12,33,46,.72);box-shadow:inset 0 1px 0 rgba(165,235,245,.1)}
      .shelf-head{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.75rem;flex-wrap:wrap}
      .ready-panel h3{margin:0;color:#ecf8f9;font-size:1.02rem;letter-spacing:-.02em}.ready-panel h3 span{color:#91e0ea;font-size:.88rem;font-weight:700;margin-left:.35rem;font-variant-numeric:tabular-nums}
      .ready-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:.52rem}
      .ready-item{min-width:0;display:flex;flex-direction:column}
      .ready-item .shelf-edit{position:relative;display:flex;flex-direction:column;align-items:center;gap:.3rem;width:100%;flex:1 1 auto;min-width:0;padding:.45rem .38rem .6rem;border:1px solid rgba(115,172,190,.36);border-radius:12px;background:linear-gradient(180deg,rgba(32,67,86,.86) 0%,rgba(20,45,60,.92) 100%);color:#f4fafa;text-align:center}
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
      .pin{flex:none;vertical-align:-1px}
      .ready-loc{display:flex;align-items:flex-start;justify-content:center;gap:3px;max-width:100%;box-sizing:border-box;padding:2px 7px;border-radius:8px;background:rgba(255,209,102,.13);border:1px solid rgba(255,209,102,.35);color:#ffe3a3;font-size:.68rem;font-weight:700;line-height:1.35}
      .ready-loc .pin{margin-top:2px}.add-custom{margin-inline-start:auto;min-height:36px;padding:.3rem .8rem;border-radius:8px;border:1px dashed rgba(184,192,255,.7);background:rgba(184,192,255,.1);color:inherit;font:inherit;font-size:.82rem;font-weight:800;cursor:pointer}.add-custom:disabled{opacity:.5;cursor:not-allowed}.add-custom:focus-visible{outline:3px solid #ffd899;outline-offset:2px}#custom-editor select,#custom-editor input{width:100%;box-sizing:border-box}.ready-loc .loc-more{flex:none;font-weight:800;opacity:.9}
      .ready-loc>span{min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:keep-all;overflow-wrap:anywhere}
      .location-panel>details>summary{list-style:none;cursor:pointer}.location-panel>details>summary::-webkit-details-marker{display:none}
      .location-panel>details>summary h3{display:flex;align-items:center;gap:.4rem;margin:0}.location-panel>details>summary h3::after{content:"+";margin-inline-start:auto;font-weight:800;opacity:.7}.location-panel>details[open]>summary h3::after{content:"−"}
      .location-panel h3 span{font-size:.8rem;font-weight:700;color:var(--kr-accent,#8fe6ee)}
      #loc-search{display:block;width:min(22rem,100%);min-height:38px;margin:.8rem 0 .2rem;padding:.3rem .75rem;font:inherit;font-size:.86rem;border-radius:999px;background:rgba(7,20,30,.45);color:inherit;border:1px solid rgba(120,175,195,.38)}
      .loc-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(15rem,100%),1fr));gap:.6rem;margin-top:.7rem}
      .loc-group{padding:.6rem .7rem;border:1px solid rgba(115,172,190,.3);border-radius:10px;background:rgba(9,25,36,.32)}
      .loc-group h4{display:flex;align-items:center;gap:.3rem;margin:0 0 .45rem;font-size:.88rem;color:#ffe3a3;overflow-wrap:anywhere}.loc-group h4 span{margin-inline-start:auto;font-size:.72rem;color:#9fdce6;white-space:nowrap}
      .loc-group ul,.loc-unplaced ul{display:flex;flex-wrap:wrap;gap:.35rem;margin:0;padding:0;list-style:none}
      .loc-item{display:inline-flex;align-items:center;gap:.35rem;min-height:32px;padding:.15rem .6rem;font-size:.8rem;border-radius:999px;background:rgba(120,190,210,.12);border:1px solid rgba(120,190,210,.35);color:inherit;cursor:pointer}
      .loc-item b{font-weight:650;font-size:.74rem;color:#cde7eb;font-variant-numeric:tabular-nums}.loc-item:hover{border-color:#9fe8f2}.loc-item:focus-visible{outline:3px solid #ffd899;outline-offset:1px}
      .loc-unplaced{margin-top:.7rem}.loc-unplaced summary{cursor:pointer;font-size:.84rem;color:#9fdce6;margin-bottom:.4rem}
      .loc-empty{margin:.6rem 0 0;font-size:.84rem;color:#9fdce6}
      .loc-field{display:block;margin-top:.6rem}.loc-field small{font-weight:500;opacity:.75}.loc-field input{display:block;width:100%;box-sizing:border-box;margin-top:.25rem}
      .loc-chips{margin-top:.4rem}.loc-chips .preset-btn{display:inline-flex;align-items:center;gap:3px}
      .lot-edit{position:relative}.lot-remove{position:absolute;top:-.15rem;right:.6rem;min-height:30px;padding:.1rem .55rem;font-size:.75rem;border-radius:999px;background:rgba(255,123,123,.12);border:1px solid rgba(255,123,123,.45);color:#ffb3b3;cursor:pointer}
      .add-lot{display:block;width:100%;min-height:40px;margin:.2rem 0 .7rem;font-weight:750;border:1px dashed rgba(143,230,238,.55);border-radius:10px;background:transparent;color:var(--kr-accent,#8fe6ee);cursor:pointer}.add-lot:hover{background:rgba(143,230,238,.08)}
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
    .warehouse-3d-bar .env-chip{display:inline-flex;align-items:center;min-height:34px;padding:0 .6rem;border-radius:999px;border:1px solid rgba(112,174,194,.4);background:rgba(15,39,54,.75);color:#dff5f8;font-size:.76rem;white-space:nowrap}
    .warehouse-3d-bar .env-chip:empty{display:none}
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
      #item-dialog input,dialog select{background:var(--kr-bg,#0c1923);color:inherit}
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
      :host([data-kr-themed]) .atmosphere span,:host([data-kr-themed]) #refresh,:host([data-kr-themed]) #open-settings,:host([data-kr-themed]) .ready-panel,:host([data-kr-themed]) .signals button,:host([data-kr-themed]) .ready-item .shelf-edit,:host([data-kr-themed]) .mission-item,:host([data-kr-themed]) .quest-btn{background:var(--kr-surface);border-color:var(--kr-line);color:var(--kr-text)}
      :host([data-kr-themed]) .expiring-banner{background:var(--kr-glow);border-color:var(--kr-accent)}
      :host([data-kr-themed]) .expiring-banner>strong,:host([data-kr-themed]) .exp-chip{color:var(--kr-text);border-color:var(--kr-line)}
      :host([data-kr-themed]) .signals button[aria-pressed="true"],:host([data-kr-themed]) .ready-item .shelf-edit:hover:not(:disabled){background:var(--kr-glow);border-color:var(--kr-accent)}
      :host([data-kr-themed]) .ready-panel h3 span,:host([data-kr-themed]) .signals button strong,:host([data-kr-themed]) .mission-head strong,:host([data-kr-themed]) .mission-art,:host([data-kr-themed]) .shelf-action{color:var(--kr-accent)}
      :host([data-kr-themed]) .ready-number,:host([data-kr-themed]) .stock-label,:host([data-kr-themed]) .mission-state,:host([data-kr-themed]) .ready-empty{color:var(--kr-muted)!important}
      :host([data-kr-themed]) .stock-meter,:host([data-kr-themed]) .mission-progress{background:var(--kr-line)}:host([data-kr-themed]) .stock-meter span,:host([data-kr-themed]) .mission-progress span{background:var(--kr-accent)}
      :host([data-kr-themed]) .ready-item[data-complete="true"] .shelf-edit,:host([data-kr-themed]) .mission-item.done{border-color:var(--kr-accent)}
      :host([data-kr-themed]) .ready-art,:host([data-kr-themed]) .dialog-art{background:#122534;border-color:var(--kr-line)}
      :host([data-kr-themed]) #opt-search{background:var(--kr-bg);border-color:var(--kr-line)}
    :host([data-kr-themed]) .quick-bar .qbtn{background:var(--kr-surface,var(--kr-bg));border-color:var(--kr-line);color:var(--kr-text)}
    :host([data-kr-themed]) .ready-loc{background:var(--kr-glow);border-color:var(--kr-line);color:var(--kr-text)}
    :host([data-kr-themed]) .loc-group{background:var(--kr-surface,var(--kr-bg));border-color:var(--kr-line)}
    :host([data-kr-themed]) .loc-group h4{color:var(--kr-text)}:host([data-kr-themed]) .loc-group h4 span,:host([data-kr-themed]) .loc-item b,:host([data-kr-themed]) .loc-empty,:host([data-kr-themed]) .loc-unplaced summary{color:var(--kr-muted)}
    :host([data-kr-themed]) .loc-item,:host([data-kr-themed]) #loc-search{background:var(--kr-bg);border-color:var(--kr-line);color:var(--kr-text)}
    :host([data-kr-themed]) .add-lot{border-color:var(--kr-accent);color:var(--kr-accent)}
    :host([data-kr-themed]) .quick-bar .qbtn[data-dir="up"]{color:var(--kr-accent)}
    :host([data-kr-themed]) .quick-bar .qbtn:hover:not(:disabled){background:var(--kr-glow);border-color:var(--kr-accent)}
    :host([data-kr-themed]) ha-card{border-radius:var(--kr-radius,16px);box-shadow:var(--kr-shadow,0 24px 64px rgba(4,14,24,.32));border:1px solid var(--kr-line)}
    :host([data-kr-themed]) .ready-panel,:host([data-kr-themed]) .compact-detail,:host([data-kr-themed]) .expiring-banner,:host([data-kr-themed]) .loc-group{border-radius:var(--kr-radius,14px)}
    :host([data-kr-themed]) .ready-item .shelf-edit,:host([data-kr-themed]) .signals button,:host([data-kr-themed]) .mission-item,:host([data-kr-themed]) .quest-btn{border-radius:var(--kr-tile-radius,12px)}
    :host([data-kr-themed]) .ready-art,:host([data-kr-themed]) .dialog-art{background:var(--kr-art-bg,rgba(9,25,36,.42));border-color:var(--kr-line);border-radius:var(--kr-tile-radius,12px)}

    /* Bespoke Theme Signatures */
    :host([data-theme-id="cute"]) .hero{background:radial-gradient(circle at 18% 20%,rgba(255,182,213,.45) 0 18%,transparent 19%),radial-gradient(circle at 86% 14%,rgba(255,158,200,.42),transparent 46%),linear-gradient(135deg,#fff5f9 0%,#ffe7f0 100%)}
    :host([data-theme-id="cute"]) .hero::before{background-image:radial-gradient(rgba(232,74,138,.12) 1.5px,transparent 1.5px);background-size:20px 20px}
    :host([data-theme-id="cute"]) .ready-item .shelf-edit{background:linear-gradient(180deg,#ffffff 0%,#fff4f8 100%);box-shadow:0 6px 16px rgba(232,74,138,.1)}
    :host([data-theme-id="cute"]) .ready-item .shelf-edit:hover:not(:disabled){transform:translateY(-3px) scale(1.01);box-shadow:0 10px 22px rgba(232,74,138,.2)}
    :host([data-theme-id="cute"]) .rank-badge,:host([data-theme-id="cute"]) .pct-chip{border-radius:999px}

    :host([data-theme-id="future"]) .hero{background:radial-gradient(circle at 82% 15%,rgba(0,240,255,.22),transparent 42%),radial-gradient(circle at 15% 85%,rgba(99,102,241,.2),transparent 45%),linear-gradient(135deg,#080f24 0%,#050914 100%)}
    :host([data-theme-id="future"]) .hero::before{background-image:linear-gradient(rgba(0,240,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.07) 1px,transparent 1px);background-size:32px 32px}
    :host([data-theme-id="future"]) .ready-panel,:host([data-theme-id="future"]) .compact-detail{backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 rgba(0,240,255,.22),0 8px 28px rgba(0,10,30,.45)}
    :host([data-theme-id="future"]) .ready-item .shelf-edit{background:linear-gradient(160deg,rgba(16,28,58,.92),rgba(9,16,36,.96));box-shadow:inset 0 0 18px rgba(0,240,255,.07)}
    :host([data-theme-id="future"]) .signals strong,:host([data-theme-id="future"]) .hero h2{text-shadow:0 0 14px rgba(0,240,255,.35)}

    :host([data-theme-id="cyber"]) .hero{background:radial-gradient(circle at 85% 12%,rgba(255,42,133,.28),transparent 45%),radial-gradient(circle at 10% 90%,rgba(0,240,255,.16),transparent 45%),linear-gradient(135deg,#120824 0%,#07040f 100%)}
    :host([data-theme-id="cyber"]) .hero::before{background-image:repeating-linear-gradient(0deg,rgba(255,42,133,.06) 0 1px,transparent 1px 3px),linear-gradient(90deg,rgba(0,240,255,.04) 1px,transparent 1px);background-size:100% 3px,24px 24px}
    :host([data-theme-id="cyber"]) .hero h2{text-shadow:2px 0 rgba(0,240,255,.55),-2px 0 rgba(255,42,133,.55);letter-spacing:-.02em}
    :host([data-theme-id="cyber"]) .ready-panel,:host([data-theme-id="cyber"]) .compact-detail{box-shadow:0 0 0 1px rgba(255,42,133,.28),0 10px 28px rgba(0,0,0,.6)}
    :host([data-theme-id="cyber"]) .ready-item .shelf-edit{background:linear-gradient(180deg,#1a1033 0%,#0f091f 100%);border-color:rgba(155,77,255,.45)}
    :host([data-theme-id="cyber"]) .ready-item[data-complete="true"] .shelf-edit{box-shadow:0 0 14px rgba(255,42,133,.32)}

    :host([data-theme-id="robot"]) ha-card{border-top:5px solid #ff9f1c}
    :host([data-theme-id="robot"]) .hero{background:repeating-linear-gradient(-45deg,rgba(255,159,28,.05) 0 8px,transparent 8px 16px),linear-gradient(135deg,#222730 0%,#14171c 100%)}
    :host([data-theme-id="robot"]) .ready-panel{border-top:3px solid #ff9f1c;background:linear-gradient(180deg,#232830 0%,#191d24 100%)}
    :host([data-theme-id="robot"]) .ready-item .shelf-edit{background:linear-gradient(180deg,#29303b 0%,#1d222b 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 4px 10px rgba(0,0,0,.35)}
    :host([data-theme-id="robot"]) .tile-led{border-radius:2px;width:9px;height:5px}

    :host([data-theme-id="pretty"]) .hero{background:radial-gradient(circle at 80% 15%,rgba(196,158,245,.36),transparent 48%),radial-gradient(circle at 12% 80%,rgba(245,190,220,.3),transparent 45%),linear-gradient(135deg,#fcfaff 0%,#f1e8fa 100%)}
    :host([data-theme-id="pretty"]) .ready-panel,:host([data-theme-id="pretty"]) .compact-detail{box-shadow:0 12px 30px rgba(142,78,198,.08);border-width:1.5px}
    :host([data-theme-id="pretty"]) .ready-item .shelf-edit{background:linear-gradient(180deg,#ffffff 0%,#f9f4ff 100%);box-shadow:0 6px 16px rgba(142,78,198,.09)}

    :host([data-theme-id="cool"]) .hero{background:radial-gradient(circle at 85% 12%,rgba(46,229,157,.18),transparent 45%),linear-gradient(135deg,#0d1b17 0%,#070e0c 100%)}
    :host([data-theme-id="cool"]) .hero::before{background-image:linear-gradient(rgba(46,229,157,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(46,229,157,.04) 1px,transparent 1px);background-size:22px 22px}
    :host([data-theme-id="cool"]) .ready-item .shelf-edit{background:linear-gradient(180deg,#132621 0%,#0c1714 100%)}
    :host([data-theme-id="cool"]) .ready-item[data-complete="true"] .shelf-edit{box-shadow:0 0 16px rgba(46,229,157,.2)}

    :host([data-theme-id="horror"]) ha-card{box-shadow:inset 0 0 110px rgba(170,10,28,.26),0 24px 64px rgba(0,0,0,.78)}
    :host([data-theme-id="horror"]) .hero{background:radial-gradient(circle at 82% 18%,rgba(255,40,65,.22),transparent 46%),radial-gradient(circle at 20% 80%,rgba(120,8,20,.25),transparent 52%),linear-gradient(135deg,#17070b 0%,#080305 100%)}
    :host([data-theme-id="horror"]) .ready-item .shelf-edit{background:linear-gradient(180deg,#1d0b10 0%,#100508 100%)}
    :host([data-theme-id="horror"]) .hero h2{text-shadow:0 0 18px rgba(255,59,78,.45)}
    </style><ha-card>${edit || customForm || settingsForm ? `<dialog id="item-dialog" aria-labelledby="item-dialog-title">${this._message && !settingsForm ? `<p class="message" role="status">${escape(this._message)}</p>` : ""}${edit || customForm || settingsForm}</dialog>` : ""}<section class="hero" aria-label="${T("비축 관리 개요", "Stockpile Overview")}"><div class="hero-intro"><div class="hero-head"><div class="hero-title">${display.nickname ? `<span class="nickname">🏠 ${escape(display.nickname)}</span>` : ""}<h2>${escape(titleText)}</h2></div><div class="atmosphere${display.show_clock ? "" : " no-clock"}" aria-label="${T("시각과 날씨", "Time and Weather")}">${survChip}<span id="local-clock">--:--</span><span id="local-weather" hidden></span><div class="view-switch" role="group" aria-label="${T("창고 보기", "Warehouse View")}"><button type="button" data-view-mode="2d" aria-pressed="${this._viewMode === "2d"}">${T("2D 선반", "2D Shelf")}</button><button type="button" data-view-mode="3d" aria-pressed="${this._viewMode === "3d"}">${T("3D 창고", "3D View")}</button></div><button type="button" id="refresh" aria-label="${T("재고 새로고침", "Refresh Inventory")}" title="${T("재고 새로고침", "Refresh Inventory")}">↻</button><button type="button" id="open-settings" aria-label="${T("대시보드 설정", "Dashboard Settings")}" title="${T("대시보드 설정", "Dashboard Settings")}" ${snapshot ? "" : "disabled"}>⚙</button></div></div>` +
      (!snapshot ? `<p class="hero-copy">${this._loadError ? T("재고를 읽지 못했습니다. 새로고침으로 다시 시도하세요.", "Failed to load inventory. Try refreshing.") : T("재고를 불러오는 중입니다.", "Loading inventory...")}</p>` : "") +
      `${signals}</div><div class="status-disclosures">${display.show_rank ? krStockRankView(snapshot, this._rankOpen, lang) : ""}${display.show_missions ? krMissionView(snapshot, escape, animateMission, this._missionOpen, lang) : ""}</div>` +
      (!edit && this._message ? `<p class="shelf-message" role="status">${escape(this._message)}</p>` : "") +
      `${display.show_expiring ? krExpiringStrip(snapshot, escape, lang) : ""}${stage3d}${this._viewMode === "3d" && snapshot ? "" : krStockShelves(snapshot, escape, this._optionalShelfOpen, Boolean(this._draft), this._statusFilter, this._optCategory, this._optSearch, this._quickMode, this._locationOpen, lang)}</section></ha-card>`;
    for (const [selector, state] of [[".stock-rank", "_rankOpen"], [".mission-panel", "_missionOpen"], ["#optional-shelf", "_optionalShelfOpen"], ["#location-panel", "_locationOpen"]]) {
      this.shadowRoot.querySelector(selector)?.addEventListener("toggle", (event) => { this[state] = event.currentTarget.open; });
    }
    const dialog = this.shadowRoot.querySelector("#item-dialog");
    if (dialog) {
      dialog.showModal();
      dialog.scrollTop = dialogScroll;
      if (!previousDialog) dialog.querySelector("h3")?.focus({ preventScroll: true });
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        (dialog.querySelector("#cancel") || dialog.querySelector("#custom-cancel") || dialog.querySelector("#settings-cancel"))?.click();
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
      row.querySelectorAll("[data-loc]").forEach((btn) => btn.addEventListener("click", () => {
        const input = row.querySelector(".location");
        if (!input) return;
        input.value = btn.dataset.loc;
        input.focus({ preventScroll: true });
      }));
    });
    this.shadowRoot.querySelector("#add-lot")?.addEventListener("click", () => {
      this._captureDraft();
      const first = this._draft.lots[0] || {};
      const used = new Set(this._draft.lots.map((lot) => lot.lot_id));
      let n = this._draft.lots.length + 1;
      while (used.has(`lot-${n}`)) n += 1;
      this._draft.lots.push({
        lot_id: `lot-${n}`, quantity: "0", expires_on: null, received_on: null, location: "",
        ...(first.capacity !== undefined ? { capacity: first.capacity || "2", count: "0" } : {}),
      });
      this._render();
      const rows = this.shadowRoot.querySelectorAll(".lot-edit");
      const added = rows[rows.length - 1];
      added?.scrollIntoView({ block: "nearest" });
      added?.querySelector(".location")?.focus({ preventScroll: true });
    });
    this.shadowRoot.querySelectorAll("[data-remove-lot]").forEach((btn) => btn.addEventListener("click", () => {
      this._captureDraft();
      if (this._draft.lots.length <= 1) return;
      const index = Number(btn.dataset.removeLot);
      this._draft.lots.splice(index, 1);
      this._render();
      const rows = this.shadowRoot.querySelectorAll(".lot-edit");
      rows[Math.min(index, rows.length - 1)]?.querySelector("legend")?.scrollIntoView({ block: "nearest" });
      this.shadowRoot.querySelector("#add-lot")?.focus({ preventScroll: true });
    }));
    const locSearch = this.shadowRoot.querySelector("#loc-search");
    locSearch?.addEventListener("input", () => {
      // Filter in place (no re-render) so typing never loses focus.
      const query = locSearch.value.trim().toLowerCase();
      const panel = this.shadowRoot.querySelector("#location-panel");
      let shown = 0;
      panel.querySelectorAll("li[data-loc-text]").forEach((li) => {
        li.hidden = Boolean(query) && !li.dataset.locText.includes(query);
        if (!li.hidden) shown += 1;
      });
      panel.querySelectorAll("[data-loc-group]").forEach((group) => {
        group.hidden = !group.querySelector("li:not([hidden])");
      });
      const unplaced = panel.querySelector(".loc-unplaced");
      if (unplaced) {
        unplaced.hidden = Boolean(query) && !unplaced.querySelector("li:not([hidden])");
        if (query && !unplaced.hidden) unplaced.open = true;
      }
      panel.querySelector(".loc-empty").hidden = shown > 0;
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
    this.shadowRoot.querySelector("#toggle-quick-mode")?.addEventListener("click", () => {
      this._quickMode = !this._quickMode;
      this._render();
    });
    this.shadowRoot.querySelectorAll("[data-quick]").forEach((btn) => btn.addEventListener("click", () => {
      const [id, d] = btn.dataset.quick.split(":");
      this._quickAdjust(id, Number(d));
    }));
    this.shadowRoot.querySelector("#backup-export")?.addEventListener("click", () => this._exportBackup());
    this.shadowRoot.querySelector("#backup-import-btn")?.addEventListener("click", () => {
      if (!this._saving) this.shadowRoot.querySelector("#backup-import")?.click();
    });
    this.shadowRoot.querySelector("#backup-import")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow picking the same file again after fixing it
      this._importBackup(file);
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
    this.shadowRoot.querySelector("#remove-custom")?.addEventListener("click", () => this._removeCustom());
    this.shadowRoot.querySelector("#add-custom")?.addEventListener("click", () => {
      if (this._draft || this._saving) return;
      this._customDraft = { name: "", unit: "개", date: "" };
      this._message = "";
      this._render();
      this.shadowRoot.querySelector("#custom-name")?.focus({ preventScroll: true });
    });
    const customName = this.shadowRoot.querySelector("#custom-name");
    customName?.addEventListener("input", () => {
      // Drop refused characters as they are typed so the field always shows what will be saved.
      const cleaned = customName.value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(KR_FORBIDDEN_TEXT, "");
      if (cleaned !== customName.value) {
        const pos = Math.max(0, (customName.selectionStart ?? cleaned.length) - (customName.value.length - cleaned.length));
        customName.value = cleaned;
        customName.setSelectionRange(pos, pos);
      }
      this._customDraft.name = customName.value;
    });
    this.shadowRoot.querySelector("#custom-unit")?.addEventListener("change", (e) => { this._customDraft.unit = e.target.value; });
    this.shadowRoot.querySelector("#custom-date")?.addEventListener("change", (e) => { this._customDraft.date = e.target.value; });
    this.shadowRoot.querySelector("#custom-editor")?.addEventListener("submit", (event) => { event.preventDefault(); this._addCustom(); });
    this.shadowRoot.querySelector("#custom-cancel")?.addEventListener("click", () => {
      if (this._saving) return;
      this._customDraft = null;
      this._message = "";
      this._render();
      this.shadowRoot.querySelector("#add-custom")?.focus({ preventScroll: true });
    });
    this.shadowRoot.querySelector("#open-settings")?.addEventListener("click", () => this._openSettings());
    this.shadowRoot.querySelector("#settings-editor")?.addEventListener("submit", (event) => { event.preventDefault(); this._saveSettings(); });
    this.shadowRoot.querySelectorAll("#set-title, #set-nickname").forEach((input) => input.addEventListener("input", () => {
      const cleaned = input.value.replace(/[\u0000-\u001f\u007f]/g, "").replace(KR_FORBIDDEN_TEXT, "");
      if (cleaned !== input.value) {
        const pos = Math.max(0, (input.selectionStart ?? cleaned.length) - (input.value.length - cleaned.length));
        input.value = cleaned;
        input.setSelectionRange?.(pos, pos);
      }
    }));
    this.shadowRoot.querySelectorAll("#set-people, #set-days").forEach((input) => input.addEventListener("input", () => {
      if (!this._settingsInvalid) return;
      // Typing a new value clears the old error without redrawing the dialog.
      this._settingsInvalid = null;
      this._message = "";
      input.closest("form")?.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute("aria-invalid"));
      input.closest("fieldset")?.querySelector(".settings-message")?.remove();
    }));
    this.shadowRoot.querySelector("#settings-cancel")?.addEventListener("click", () => {
      if (this._saving) return;
      this._settingsDraft = null;
      this._settingsInvalid = null;
      this._message = "";
      this._render();
      this.shadowRoot.querySelector("#open-settings")?.focus({ preventScroll: true });
    });
    this.shadowRoot.querySelector("#settings-reset")?.addEventListener("click", () => {
      if (this._saving || !this._settingsDraft) return;
      this._captureSettings();
      Object.assign(this._settingsDraft, { title: "", nickname: "", household_size: "4", inspection_days: "90" },
        Object.fromEntries(KR_DISPLAY_TOGGLES.map(([key]) => [key, true])));
      this._message = "기본값을 채웠습니다. 저장을 눌러야 적용됩니다.";
      this._render();
    });
    this.shadowRoot.querySelectorAll("input.location").forEach((input) => input.addEventListener("input", () => {
      const cleaned = input.value.replace(KR_FORBIDDEN_TEXT, "");
      if (cleaned !== input.value) input.value = cleaned;
    }));
    if (keptStage) {
      this.shadowRoot.querySelector(".warehouse-3d-stage")?.replaceWith(keptStage);
      this._engine3d.rebuild();
    }
    const canvas3d = keptStage ? null : this.shadowRoot.querySelector("#warehouse-3d-canvas");
    if (canvas3d && typeof window !== "undefined") {
      const tooltip3d = this.shadowRoot.querySelector("#warehouse-3d-tooltip");
      const getTheme = () => {
        try { return window.localStorage?.getItem("kr_survival_kit_theme") || "black"; } catch { return "black"; }
      };
      const base = this._config?.asset_path ? `${this._config.asset_path.replace(/\/$/, "")}/` : KR_SCRIPT_BASE;
      // Live HA sun/weather drive the 3D warehouse sky; `weather_entity` in card config overrides auto-detection.
      const getEnv = () => {
        const states = this._hass?.states || {};
        const weatherId = this._config?.weather_entity || Object.keys(states).find((id) => id.startsWith("weather."));
        return { sun: states["sun.sun"]?.state, weather: weatherId ? states[weatherId]?.state : undefined };
      };
      let envPrefs = { time: "auto", weather: "auto" };
      try { envPrefs = { ...envPrefs, ...JSON.parse(window.localStorage?.getItem("kr_survival_kit_3d_env") || "{}") }; } catch { /* private mode */ }
      const timeSel = this.shadowRoot.querySelector("[data-3d-time]");
      const weatherSel = this.shadowRoot.querySelector("[data-3d-weather]");
      const envChip = this.shadowRoot.querySelector("#env-3d-chip");
      if (timeSel) timeSel.value = envPrefs.time;
      if (weatherSel) weatherSel.value = envPrefs.weather;
      const saveEnv = () => {
        try { window.localStorage?.setItem("kr_survival_kit_3d_env", JSON.stringify(envPrefs)); } catch { /* private mode */ }
      };
      const spinButton = this.shadowRoot.querySelector("#toggle-3d-spin");
      spinButton?.setAttribute("aria-pressed", String(krSpinPreference()));
      import(`${base}kr-warehouse-3d.js?v=${KR_ASSET_VERSION}`).then(({ KrWarehouseThreeEngine }) => {
        if (!this.shadowRoot.contains(canvas3d)) return;
        const localize = {
          getLang: () => this._lang || krGetLang(),
          itemName: (item) => krItemDisplayName(item, this._lang || krGetLang()),
          unit: (item) => krStockUnit(item, this._lang || krGetLang()),
          t: (ko, en) => krT(this._lang || krGetLang(), ko, en),
        };
        this._engine3d = new KrWarehouseThreeEngine(
          canvas3d, tooltip3d,
          () => this._snapshot, () => this._statusFilter,
          (item) => this._edit(item, false), getTheme, getEnv, localize,
        );
        this._engine3d.autoRotate = krSpinPreference();
        this._engine3d.timeMode = envPrefs.time;
        this._engine3d.weatherMode = envPrefs.weather;
        this._engine3d.onEnvChange = (label) => { if (envChip) envChip.textContent = label; };
        if (envChip) envChip.textContent = this._engine3d.envLabel || "";
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
      this.shadowRoot.querySelector("[data-3d-cat]")?.addEventListener("change", (e) => {
        if (!this._engine3d) return;
        this._engine3d.optCategory = e.target.value;
        this._engine3d.zone = "optional";
        this._engine3d.rebuild();
        this.shadowRoot.querySelectorAll("[data-3d-zone]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset["3dZone"] === "optional")));
      });
      timeSel?.addEventListener("change", (e) => {
        envPrefs.time = e.target.value;
        saveEnv();
        if (this._engine3d) this._engine3d.timeMode = envPrefs.time;
      });
      weatherSel?.addEventListener("change", (e) => {
        envPrefs.weather = e.target.value;
        saveEnv();
        if (this._engine3d) this._engine3d.weatherMode = envPrefs.weather;
      });
      this.shadowRoot.querySelector("#toggle-3d-active")?.addEventListener("click", (e) => {
        if (!this._engine3d) return;
        this._engine3d.onlyActive = !this._engine3d.onlyActive;
        e.currentTarget.setAttribute("aria-pressed", String(this._engine3d.onlyActive));
        this._engine3d.rebuild();
      });
      this.shadowRoot.querySelector("#toggle-3d-spin")?.addEventListener("click", (e) => {
        if (!this._engine3d) return;
        this._engine3d.autoRotate = !this._engine3d.autoRotate;
        this._engine3d.pauseUntil = 0;
        e.currentTarget.setAttribute("aria-pressed", String(this._engine3d.autoRotate));
        try { window.localStorage?.setItem("kr_survival_kit_3d_spin", this._engine3d.autoRotate ? "on" : "off"); } catch { /* private mode */ }
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
    this._audioDevices = [];
    this._selectedOutput = "browser:default";
    this._sirenStatus = "";
    this._lang = krGetLang();
  }

  setLang(lang) {
    this._lang = Object.hasOwn(KR_LANGS, lang) ? lang : "ko";
    if (this._guideKo) {
      const useEn = this._lang !== "ko";
      this._guide = useEn && this._guideEn ? this._guideEn : this._guideKo;
      this._loadQuiz(useEn && this._quizEn ? this._quizEn : this._quizKo);
      this._render();
    }
  }

  connectedCallback() {
    this._refreshAudioDevices();
  }

  disconnectedCallback() {
    this._stopSiren();
  }

  async _refreshAudioDevices() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((d) => d.kind === "audiooutput");
      const sig = outputs.map((d) => `${d.deviceId}:${d.label}`).join("|");
      const prevSig = (this._audioDevices || []).map((d) => `${d.deviceId}:${d.label}`).join("|");
      if (sig === prevSig) return;
      this._audioDevices = outputs;
      if (this._guide && !this.shadowRoot.activeElement) this._render();
    } catch { /* device enumeration optional */ }
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
    if (this._haPlayingEntity && this._hass) {
      this._hass.callService?.("media_player", "media_stop", { entity_id: this._haPlayingEntity }).catch?.(() => {});
      this._haPlayingEntity = null;
    }
    this._activeSiren = null;
    this._sirenStatus = "";
  }

  async _playSiren(kind) {
    if (this._activeSiren === kind) {
      this._stopSiren();
      this._render();
      return;
    }
    this._stopSiren();
    this._activeSiren = kind;

    if (this._selectedOutput.startsWith("ha:")) {
      const entityId = this._selectedOutput.slice(3);
      if (this._hass?.callService) {
        const base = this._assetPath === "/local" ? "/local" : this._assetPath;
        const url = `${window.location.origin}${base}/sirens/${kind}.wav`;
        const speaker = this._hass.states?.[entityId]?.attributes?.friendly_name || entityId;
        try {
          this._haPlayingEntity = entityId;
          this._sirenStatus = `${speaker}(으)로 전송 중...`;
          this._render();
          await this._hass.callService("media_player", "play_media", {
            entity_id: entityId,
            media_content_id: url,
            media_content_type: "music",
          });
          this._sirenStatus = `${speaker}에서 재생 중 · 다시 누르거나 ■ 정지로 끕니다`;
        } catch (err) {
          this._sirenStatus = `장치 재생 실패: ${err.message || "연결 확인 필요"}`;
          this._activeSiren = null;
          this._haPlayingEntity = null;
        }
        this._render();
        return;
      }
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      this._activeSiren = null;
      this._sirenStatus = "이 브라우저는 오디오 재생을 지원하지 않습니다.";
      this._render();
      return;
    }
    const ctx = new AudioCtx();
    const deviceId = this._selectedOutput.startsWith("browser:") ? this._selectedOutput.slice(8) : "default";
    if (deviceId !== "default" && typeof ctx.setSinkId === "function") {
      try {
        await ctx.setSinkId(deviceId);
      } catch {
        this._sirenStatus = "선택한 출력 장치 전환이 지원되지 않아 기본 장치로 재생합니다.";
      }
    }
    this._audioCtx = ctx;

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
    if (config.lang) this._lang = Object.hasOwn(KR_LANGS, config.lang) ? config.lang : "ko";
    const parseJson = (val) => (typeof val === "string" ? JSON.parse(val) : val);
    this._guideKo = parseJson(config.guide_data);
    this._guideEn = config.guide_en_data ? parseJson(config.guide_en_data) : null;
    this._quizKo = config.quiz_data;
    this._quizEn = config.quiz_en_data || null;
    const useEn = this._lang !== "ko";
    this._guide = useEn && this._guideEn ? this._guideEn : this._guideKo;
    if (!this._guide?.scenarios?.length || !this._guide?.playbook?.length) throw new Error("상황 안내 자료가 없습니다.");
    this._loadQuiz(useEn && this._quizEn ? this._quizEn : this._quizKo);
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
    const lang = this._lang || krGetLang();
    const T = (ko, en) => krT(lang, ko, en);
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
    return `<details class="quiz-panel" ${this._quizOpen ? "open" : ""}><summary class="quiz-head"><strong>${escape(lang === "en" ? "Scenario Judgment Quiz" : (data.title || "상황 판단 연습"))}</strong><span>${T("학습 진도", "Progress")} ${answered}/${data.questions.length} · ${T("정답", "Correct")} ${correct}/${data.questions.length}</span></summary>` +
      `<p>${T("학습 기록은 이 브라우저에만 저장됩니다. 실제 대피 판단이나 생존 가능성 점수가 아닙니다.", "Progress is saved in this browser only and is for training purposes.")}</p>` +
      `<div class="quiz-question"><small>${escape(level?.title || T("학습 문제", "Question"))} · ${index + 1}/${data.questions.length}</small><h4>${escape(question.prompt)}</h4>` +
      `<div class="quiz-choices">${question.choices.map((entry) => `<button type="button" data-quiz-choice="${escape(entry.id)}" aria-pressed="${selected === entry.id}">${escape(entry.text)}</button>`).join("")}</div>` +
      (choice ? `<div class="quiz-feedback" role="status"><p><strong>${selected === question.answer_id ? T("맞았습니다.", "Correct.") : T("다시 확인해 보세요.", "Check again.")}</strong> ${escape(choice.feedback)}</p>` +
        `<p><strong>${T("정답", "Answer")}: ${escape(answer?.text || T("자료 확인 필요", "Verify guide"))}</strong> ${escape(answer?.feedback || "")}</p>` +
        `<p class="quiz-sources">${sourceLinks ? `${T("공식 출처", "Official Source")}: ${sourceLinks}` : T("공식 참고 자료를 확인하세요.", "Check official references.")}</p></div>` : "") +
      `<div class="quiz-nav"><button type="button" data-quiz-nav="prev" ${index === 0 ? "disabled" : ""}>${T("이전", "Previous")}</button><button type="button" data-quiz-nav="next" ${index === data.questions.length - 1 ? "disabled" : ""}>${T("다음 문제", "Next")}</button></div><button type="button" data-quiz-reset>${T("학습 기록 지우고 다시 풀기", "Reset Quiz Progress")}</button></div></details>`;
  }

  set hass(value) { this._hass = value; }
  getCardSize() { return 10; }

  _render() {
    this._quizOpen = this.shadowRoot.querySelector(".quiz-panel")?.open ?? this._quizOpen;
    const guide = this._guide;
    if (!guide) return;
    const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    const lang = this._lang || krGetLang();
    const T = (ko, en) => krT(lang, ko, en);
    const scenarios = guide.scenarios;
    const scenario = scenarios.find((item) => item.id === this._scenario) || scenarios[0];
    const sheet = guide.playbook.find((item) => item.id === this._sheet) || guide.playbook[0];
    const civilIds = new Set(["air-raid", "civil-warning", "cbrn-alert", "nuclear-alert"]);
    const utilityIds = new Set(["power-outage", "water-outage"]);
    const scenarioGroups = [
      [T("평시", "Peacetime"), scenarios.filter((item) => item.id === "prepare")],
      [T("민방공 경보", "Civil Defense Alerts"), scenarios.filter((item) => civilIds.has(item.id) || item.kind === "민방공 경보")],
      [T("생활 기반 장애", "Utility Outages"), scenarios.filter((item) => utilityIds.has(item.id) || item.kind === "생활 기반 장애")],
    ];
    const scenarioNav = scenarioGroups.map(([title, items]) => `<div class="nav-group"><h3>${esc(title)}</h3><div class="nav-items">${items.map((item) =>
      `<button type="button" data-scenario="${esc(item.id)}" aria-pressed="${item.id === scenario.id}" class="${item.id === scenario.id ? "active" : ""}">${esc(item.title)}</button>`).join("")}</div></div>`).join("");
    const sheetNav = guide.playbook.map((item) => `<button type="button" role="tab" id="tab-${esc(item.id)}" aria-controls="sheet-panel" aria-selected="${item.id === sheet.id}" tabindex="${item.id === sheet.id ? 0 : -1}" data-sheet="${esc(item.id)}">${esc(item.label || item.title)}</button>`).join("");
    const detail = scenario.details?.length ? `<ul>${scenario.details.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p>${esc(scenario.paper_note)}</p>`;
    const household = scenario.id === "prepare" ? `<p class="household">${esc(guide.household_summary)}</p>` : "";
    const rows = sheet.layout === "reference" ? sheet.rows.map((row) =>
      `<article class="reference-item"><span>${esc(row.when)}</span><h4>${esc(row.title)}</h4><p>${esc(row.text)}</p></article>`).join("") :
      sheet.rows.map((row) => `<li class="time-row"><div class="time-rail"><span class="time-dot" aria-hidden="true"></span><span class="time-when">${esc(row.when)}</span></div><div class="time-copy"><h4>${esc(row.title)}</h4><p>${esc(row.text)}</p></div></li>`).join("");
    const sheetHeading = sheet.id === "field-skills" ? T("이동·위생 점검", "Navigation & Hygiene") : sheet.layout === "reference" ? T("장비 사용 점검", "Equipment Check") : T("상황이 이어질 때", "Extended Timeline");
    const sheetSummary = sheet.id === "field-skills" ? T("평시에 경로와 시설을 확인하고, 현장에서는 공식 지시를 먼저 따르세요.", "Practice routes in peacetime; follow official orders on site.") : sheet.layout === "reference" ? T("제품 설명서와 표시를 먼저 확인하세요.", "Check product manuals and labels first.") : T("새 경보와 현장 지시가 나오면 그 안내를 먼저 따르세요.", "Follow new alerts and on-site instructions first.");
    const sources = Object.values(guide.sources).filter((source) => typeof source.url === "string" && /^https:\/\//i.test(source.url)); // only https links are rendered
    const uniqueSources = [...new Map(sources.map((source) => [source.url.replace("https://www.", "https://"), source])).values()];
    const alertTone = civilIds.has(scenario.id) || scenario.kind === "민방공 경보" ? "danger" : utilityIds.has(scenario.id) || scenario.kind === "생활 기반 장애" ? "warn" : "info";
    const haPlayers = Object.entries(this._hass?.states || {})
      .filter(([id, st]) => id.startsWith("media_player.") && st?.state !== "unavailable")
      .map(([id, st]) => ({ value: `ha:${id}`, label: `🏠 [${T("HA 스피커", "HA Speaker")}] ${st?.attributes?.friendly_name || id}` }));
    const browserOutputs = [
      { value: "browser:default", label: T("🔊 현재 브라우저 기본 출력 장치", "🔊 Current Browser Default Output") },
      ...this._audioDevices
        .filter((d) => d.deviceId && d.deviceId !== "default")
        .map((d, i) => ({ value: `browser:${d.deviceId}`, label: `🔈 ${d.label || T(`브라우저 출력 장치 ${i + 1}`, `Browser Output ${i + 1}`)}` })),
    ];
    const allOutputs = [...browserOutputs, ...haPlayers];
    const outputOptions = allOutputs.map((opt) =>
      `<option value="${esc(opt.value)}" ${this._selectedOutput === opt.value ? "selected" : ""}>${esc(opt.label)}</option>`
    ).join("");
    const sirenHtml = `<div class="siren-box"><h4>${T("🔊 민방공 경보음 직접 들어보기 (체험용)", "🔊 Civil Defense Siren Tester (Preview)")}</h4><p>${T("실제 경보와 혼동되지 않도록 볼륨을 낮춰 테스트하세요. 브라우저 스피커나 집에 연결된 HA 스마트 스피커를 선택할 수 있습니다.", "Lower your volume to avoid confusion with real alerts. Choose your browser speaker or a Home Assistant smart speaker.")}</p><div class="siren-output"><label for="siren-output-select">${T("출력 장치", "Output Device")}</label><select id="siren-output-select" data-siren-output>${outputOptions}</select><button type="button" data-siren-refresh title="${T("장치 목록 새로고침", "Refresh Devices")}">${T("↻ 장치 찾기", "↻ Refresh")}</button></div><div class="siren-row"><button type="button" data-siren="air-raid" aria-pressed="${this._activeSiren === "air-raid"}">${T("공습경보 (파상음)", "Air Raid (Wail)")}</button><button type="button" data-siren="civil-warning" aria-pressed="${this._activeSiren === "civil-warning"}">${T("경계경보 (연속음)", "Warning (Steady)")}</button><button type="button" data-siren="cbrn-alert" aria-pressed="${this._activeSiren === "cbrn-alert"}">${T("화생방경보 (2단음)", "CBRN (Hi-Lo)")}</button><button type="button" data-siren="nuclear-alert" aria-pressed="${this._activeSiren === "nuclear-alert"}">${T("핵경보 (긴급 펄스)", "Nuclear (Pulse)")}</button>${this._activeSiren ? `<button type="button" class="stop" data-siren-stop>${T("■ 정지", "■ Stop")}</button>` : ""}</div>${this._sirenStatus ? `<p class="siren-status" role="status">${esc(this._sirenStatus)}</p>` : ""}</div>`;
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
      .siren-output{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:10px}
      .siren-output label{font-size:.82rem;font-weight:700;color:#cde8ee}
      .siren-output select{flex:1;min-width:180px;min-height:38px;padding:5px 10px;border-radius:8px;border:1px solid #568599;background:#102230;color:#eef8fa;font:inherit;font-size:.84rem}
      .siren-output button{min-height:38px;padding:5px 10px;font-size:.8rem;border-radius:8px;border:1px solid #568599;background:#193547;color:#eef8fa;cursor:pointer}
      .siren-row{display:flex;flex-wrap:wrap;gap:7px}
      .siren-row button{min-height:40px;padding:7px 12px;font-size:.84rem;font-weight:700;border-radius:8px;border:1px solid #568599;background:#193547;color:#eef8fa;cursor:pointer}
      .siren-row button[aria-pressed="true"]{background:#d94848;border-color:#ff9494;color:#fff}
      .siren-row button.stop{background:#2d3b45;border-color:#748b99}
      .siren-status{margin:8px 0 0;font-size:.8rem;color:#ffd08a}
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
      :host([data-kr-themed]) .hero,:host([data-kr-themed]) .rail,:host([data-kr-themed]) .action,:host([data-kr-themed]) .timeline,:host([data-kr-themed]) .references,:host([data-kr-themed]) .quiz-panel,:host([data-kr-themed]) .siren-box{border-radius:var(--kr-radius,18px)}
      :host([data-theme-id="cyber"]) .hero{box-shadow:0 0 24px rgba(255,42,133,.2)}
      :host([data-theme-id="robot"]) .hero{border-top:4px solid #ff9f1c}
      :host([data-theme-id="horror"]) ha-card{box-shadow:inset 0 0 100px rgba(170,10,28,.24)}
      :host([data-theme-id="cute"]) .hero,:host([data-theme-id="pretty"]) .hero{box-shadow:0 14px 36px rgba(160,90,170,.12)}
    </style><ha-card><main class="shell"><header class="hero"><div class="hero-content"><h2>${T("상황 안내", "Emergency Guide")}</h2><p><strong>${esc(guide.official_first)}</strong> ${T("받은 경보를 선택하면 첫 행동을 바로 확인할 수 있습니다.", "Select an alert to see immediate first actions.")}</p><div class="hero-actions"><a href="${esc(this._assetPath)}/kr-survival-kit-a4.pdf" target="_blank" rel="noopener">${T("A4 행동 카드 열기", "Open A4 Action Card")}</a><a class="secondary" href="${esc(this._assetPath)}/kr-survival-kit-offline.html" target="_blank" rel="noopener">${T("오프라인 안내 열기", "Open Offline Guide")}</a>${this._showInventoryLink ? `<a class="secondary" href="/kr-survival-kit/home">${T("비축 관리로", "Go to Stockpile")}</a>` : ""}</div></div><div class="orb" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 8 82 21v25c0 23-13 36-32 47C31 82 18 69 18 46V21z" fill="#7bc8d9" stroke="#dafaff" stroke-width="2"/><path d="M50 18 73 27v19c0 17-8 28-23 37-15-9-23-20-23-37V27z" fill="#22506a"/><path d="M50 30v34M33 47h34" stroke="#bbf1f3" stroke-width="7" stroke-linecap="round"/></svg></div></header>
    <div class="layout"><nav class="rail" aria-label="${T("상황 선택", "Select Scenario")}"><h2>${T("상황별 첫 행동", "First Actions")}</h2>${scenarioNav}</nav><section class="action" data-tone="${alertTone}" aria-live="polite"><div class="action-top"><p class="kind">${esc(scenario.kind)}</p><h2>${esc(scenario.title)}</h2><h3>${T("먼저 할 일", "Immediate Action")}</h3><p class="first-action">${esc(scenario.first_action)}</p></div><div class="action-body"><h3>${T("이어 확인할 일", "Next Steps")}</h3>${detail}${household}${sirenHtml}<div class="comms"><strong>${T("전화·인터넷이 끊기면", "If Phone/Internet Fails")}</strong>${esc(guide.communication_loss.first_action)} ${esc(guide.communication_loss.paper_note)}</div></div></section></div>
    <section class="timeline" aria-labelledby="timeline-title"><div class="section-head"><h2 id="timeline-title">${T(sheetHeading, "Extended Timeline & Reference")}</h2><p>${T(sheetSummary, "Follow official broadcasts and on-site instructions first.")}</p></div><div class="sheet-tabs" role="tablist" aria-label="${T("상세 행동 안내", "Detailed Playbook")}">${sheetNav}</div><div id="sheet-panel" role="tabpanel" aria-labelledby="tab-${esc(sheet.id)}" tabindex="0"><h3>${esc(sheet.title)}</h3><p class="sheet-intro">${esc(sheet.intro)}</p>${sheet.layout === "reference" ? `<div class="reference-grid">${rows}</div>` : `<ol class="time-list">${rows}</ol>`}</div></section>
    ${this._quizView(esc)}
    <details class="references"><summary>${T("공식 참고 자료와 파일 보관 방법", "Official References & Offline Saving")}</summary><p>${T("외부 출처는 인터넷 연결이 필요합니다. PDF는 열린 화면에서 인쇄·다운로드하고, HTML은 브라우저의 ‘다른 이름으로 저장’으로 미리 보관하세요.", "External sources require internet access. Print/download the PDF or save the offline HTML via browser 'Save As'.")}</p><ul>${uniqueSources.map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.publisher)} · ${esc(source.title)}</a></li>`).join("")}</ul></details></main></ha-card>`;
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
    this.shadowRoot.querySelector("[data-siren-output]")?.addEventListener("change", (event) => {
      this._selectedOutput = event.target.value;
    });
    this.shadowRoot.querySelector("[data-siren-refresh]")?.addEventListener("click", () => {
      this._refreshAudioDevices();
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
  black: {name: "블랙", enName: "Black", tagline: "미니멀 다크", enTagline: "Minimal Dark", scheme:"dark", bg: "#101215", surface: "#1c2026", glow: "#272f36", text: "#f1f4f5", muted: "#c0cbd0", line: "#49535d", accent: "#96e4da", "accent-ink": "#102021", "art-bg": "#151a20", radius: "16px", "tile-radius": "12px", shadow: "0 24px 64px rgba(0,0,0,.45)"},
  white: {name: "화이트", enName: "White", tagline: "클린 라이트", enTagline: "Clean Light", scheme:"light", bg: "#f3f6f8", surface: "#ffffff", glow: "#e1ebf1", text: "#152b3a", muted: "#405763", line: "#aabfc9", accent: "#075d70", "accent-ink": "#ffffff", "art-bg": "#eef4f7", radius: "16px", "tile-radius": "12px", shadow: "0 18px 42px rgba(21,43,58,.1)"},
  blue: {name: "블루", enName: "Blue", tagline: "딥 마린", enTagline: "Deep Marine", scheme:"dark", bg: "#101d38", surface: "#182d4f", glow: "#234568", text: "#eef6ff", muted: "#c6daf0", line: "#56769c", accent: "#8bd8ff", "accent-ink": "#112540", "art-bg": "#132645", radius: "16px", "tile-radius": "12px", shadow: "0 24px 64px rgba(4,14,28,.45)"},
  ivory: {name: "아이보리", enName: "Ivory", tagline: "웜 페이퍼", enTagline: "Warm Paper", scheme:"light", bg: "#f2e9d7", surface: "#fff9ec", glow: "#ece0c5", text: "#362b20", muted: "#5d5040", line: "#b6a387", accent: "#714619", "accent-ink": "#ffffff", "art-bg": "#f5ebd8", radius: "16px", "tile-radius": "12px", shadow: "0 18px 42px rgba(54,43,32,.1)"},
  cute: {name: "귀여운", enName: "Cute", tagline: "파스텔 라운드", enTagline: "Pastel Pill", scheme:"light", bg: "#fff2f6", surface: "#ffffff", glow: "#ffe0eb", text: "#4a2034", muted: "#8c536e", line: "#f4b8ce", accent: "#e84a8a", "accent-ink": "#ffffff", "art-bg": "#ffe8f1", radius: "24px", "tile-radius": "18px", shadow: "0 20px 46px rgba(232,74,138,.14)"},
  future: {name: "미래", enName: "Future", tagline: "오비탈 HUD", enTagline: "Orbital HUD", scheme:"dark", bg: "#070b18", surface: "#0e162e", glow: "#17254d", text: "#e6f6ff", muted: "#8cb4d8", line: "#2b467a", accent: "#00f0ff", "accent-ink": "#04141d", "art-bg": "#0a132b", radius: "14px", "tile-radius": "10px", shadow: "0 24px 64px rgba(0,20,60,.65)"},
  cyber: {name: "사이버", enName: "Cyber", tagline: "네온 스캔라인", enTagline: "Neon CRT", scheme:"dark", bg: "#090612", surface: "#140d26", glow: "#261447", text: "#f7ecff", muted: "#c6a4e8", line: "#5b2d8c", accent: "#ff2a85", "accent-ink": "#ffffff", "art-bg": "#1a0e30", radius: "4px", "tile-radius": "4px", shadow: "0 0 36px rgba(255,42,133,.22)"},
  robot: {name: "로봇", enName: "Robot", tagline: "메카 인더스트리얼", enTagline: "Mecha Steel", scheme:"dark", bg: "#16191e", surface: "#20252d", glow: "#2d3540", text: "#eef2f6", muted: "#9aa6b5", line: "#4c5766", accent: "#ff9f1c", "accent-ink": "#1a1100", "art-bg": "#191d24", radius: "6px", "tile-radius": "6px", shadow: "0 22px 54px rgba(0,0,0,.55)"},
  pretty: {name: "예쁜", enName: "Pretty", tagline: "라벤더 펄", enTagline: "Lavender Pearl", scheme:"light", bg: "#f7f2fb", surface: "#ffffff", glow: "#ede2f7", text: "#2e1f3d", muted: "#6b5582", line: "#cfb9e6", accent: "#8e4ec6", "accent-ink": "#ffffff", "art-bg": "#f3ebfc", radius: "22px", "tile-radius": "16px", shadow: "0 20px 46px rgba(142,78,198,.12)"},
  cool: {name: "멋진", enName: "Cool", tagline: "스텔스 택티컬", enTagline: "Stealth Tech", scheme:"dark", bg: "#09110f", surface: "#101e1b", glow: "#17302a", text: "#ebfaf6", muted: "#92bfb4", line: "#2d574c", accent: "#2ee59d", "accent-ink": "#062116", "art-bg": "#0e1b18", radius: "10px", "tile-radius": "8px", shadow: "0 24px 60px rgba(0,0,0,.6)"},
  horror: {name: "공포", enName: "Horror", tagline: "블러드 크림슨", enTagline: "Crimson Dread", scheme:"dark", bg: "#0b0507", surface: "#170a0e", glow: "#2e0f18", text: "#f7e6e9", muted: "#b88a92", line: "#5c202c", accent: "#ff3b4e", "accent-ink": "#ffffff", "art-bg": "#1c090e", radius: "8px", "tile-radius": "6px", shadow: "0 24px 64px rgba(80,0,10,.55)"},
};

class KrSurvivalKitPanel extends HTMLElement {
  constructor() {
    super();
    this._lang = krGetLang();
    const T = (ko, en) => krT(this._lang, ko, en);
    let saved;
    try { saved = window.localStorage.getItem("kr_survival_kit_theme"); } catch { /* storage is optional */ }
    this._theme = Object.hasOwn(KR_PANEL_THEMES, saved) ? saved : "black";
    const cur = KR_PANEL_THEMES[this._theme];
    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host { display:block; color:var(--kr-text); background:var(--kr-bg); min-height:100%; }
        header { position:relative; z-index:20; display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px;
          padding: 8px 16px; background:var(--kr-surface); border-bottom:1px solid var(--kr-line); }
        nav { display: flex; flex-wrap: wrap; gap: 8px; }
        a { color: inherit; padding: 10px 12px; border-radius: 8px; text-decoration: none; }
        a[aria-current="page"] { color:var(--kr-text); font-weight:700;
          box-shadow: inset 0 -3px var(--kr-accent); }
        a:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
        .panel-controls{position:relative;display:flex;align-items:center;gap:8px;margin-inline-start:auto}
        #theme-picker-btn{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:.3rem .75rem;border:1px solid var(--kr-line);border-radius:9px;color:var(--kr-text);background:var(--kr-bg);cursor:pointer;font:inherit;font-size:.84rem;font-weight:600}
        #theme-picker-btn:hover,#theme-picker-btn[aria-expanded="true"]{border-color:var(--kr-accent);background:var(--kr-glow)}
        .theme-dot{width:12px;height:12px;border-radius:50%;border:1px solid rgba(128,128,128,.45);flex-shrink:0}
        .theme-popover{position:absolute;top:calc(100% + 8px);right:0;z-index:50;width:min(92vw,390px);padding:10px;border:1px solid var(--kr-line);border-radius:14px;background:var(--kr-surface);box-shadow:0 18px 48px rgba(0,0,0,.38);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        .theme-popover[hidden]{display:none}
        .theme-opt{display:flex;align-items:center;gap:8px;text-align:left;min-height:42px;padding:6px 9px;border:1px solid var(--kr-line);border-radius:10px;color:var(--kr-text);background:var(--kr-bg);cursor:pointer;font:inherit}
        .theme-opt:hover{border-color:var(--kr-accent);background:var(--kr-glow)}
        .theme-opt[aria-pressed="true"]{border-color:var(--kr-accent);background:var(--kr-glow);box-shadow:inset 0 0 0 1px var(--kr-accent)}
        .theme-meta{display:flex;flex-direction:column;line-height:1.2;min-width:0}
        .theme-meta strong{font-size:.82rem}
        .theme-meta small{font-size:.7rem;color:var(--kr-muted)}
        #lang-picker-btn{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:.3rem .7rem;border:1px solid var(--kr-line);border-radius:9px;color:var(--kr-text);background:var(--kr-bg);cursor:pointer;font:inherit;font-size:.82rem;font-weight:700}
        #lang-picker-btn:hover,#lang-picker-btn[aria-expanded="true"]{border-color:var(--kr-accent);background:var(--kr-glow)}
        .lang-popover{position:absolute;top:calc(100% + 8px);right:0;z-index:55;min-width:170px;padding:6px;border:1px solid var(--kr-line);border-radius:12px;background:var(--kr-surface);box-shadow:0 18px 48px rgba(0,0,0,.38);display:grid;gap:4px}
        .lang-popover[hidden]{display:none}
        .lang-opt{display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;min-height:38px;padding:6px 10px;border:1px solid transparent;border-radius:8px;color:var(--kr-text);background:var(--kr-bg);cursor:pointer;font:inherit;font-size:.84rem;font-weight:600}
        .lang-opt:hover{border-color:var(--kr-accent);background:var(--kr-glow)}
        .lang-opt[aria-pressed="true"]{border-color:var(--kr-accent);background:var(--kr-accent);color:var(--kr-accent-ink);font-weight:700}
        #theme-picker-btn:focus-visible,.theme-opt:focus-visible,#lang-picker-btn:focus-visible,.lang-opt:focus-visible{outline:2px solid var(--kr-accent);outline-offset:2px}
        @media(max-width:600px){.panel-controls{width:100%;margin-inline-start:0;justify-content:flex-end}.theme-popover{left:0;right:auto;width:100%;grid-template-columns:1fr}.lang-popover{right:0;min-width:165px}}
        main { padding: clamp(4px, 2vw, 20px); }
      </style>
      <header>
        <ha-menu-button></ha-menu-button>
        <nav aria-label="KR Survival Kit 메뉴">
          <a href="/kr-survival-kit/home" data-nav="home">${T("비축 관리", "Stockpile")}</a>
          <a href="/kr-survival-kit/guide" data-nav="guide">${T("상황 안내", "Guide")}</a>
        </nav>
        <div class="panel-controls">
          <button type="button" id="theme-picker-btn" aria-haspopup="true" aria-expanded="false">
            <span class="theme-dot" style="background:linear-gradient(135deg,${cur.bg} 50%,${cur.accent} 50%)"></span>
            <span id="theme-picker-label">${T(`테마: ${cur.name}`, `Theme: ${cur.enName}`)}</span>
            <span aria-hidden="true">▾</span>
          </button>
          <div class="theme-popover" id="theme-popover" role="group" aria-label="${T("화면 테마", "Theme")}" hidden>
            ${Object.entries(KR_PANEL_THEMES).map(([id, theme]) =>
              `<button type="button" class="theme-opt" data-theme="${id}" aria-pressed="false"><span class="theme-dot" style="background:linear-gradient(135deg,${theme.bg} 50%,${theme.accent} 50%)"></span><span class="theme-meta"><strong>${this._lang !== "ko" ? theme.enName : theme.name}</strong><small>${this._lang !== "ko" ? theme.enTagline : theme.tagline}</small></span></button>`).join("")}
          </div>
          <button type="button" id="lang-picker-btn" aria-haspopup="true" aria-expanded="false" aria-label="${T("언어 선택", "Language")}">
            <span id="lang-picker-label">${KR_LANGS[this._lang].flag} ${KR_LANGS[this._lang].label}</span>
            <span aria-hidden="true">▾</span>
          </button>
          <div class="lang-popover" id="lang-popover" role="group" aria-label="${T("언어 선택", "Language")}" hidden>
            ${Object.values(KR_LANGS).map((l) =>
              `<button type="button" class="lang-opt" data-lang="${l.code}" aria-pressed="${this._lang === l.code}"><span>${l.flag} ${l.label}</span><small>${l.short}</small></button>`).join("")}
          </div>
        </div>
      </header>
      <main></main>`;
    const pickerBtn = this.shadowRoot.querySelector("#theme-picker-btn");
    const popover = this.shadowRoot.querySelector("#theme-popover");
    const langBtn = this.shadowRoot.querySelector("#lang-picker-btn");
    const langPopover = this.shadowRoot.querySelector("#lang-popover");
    pickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      langPopover.hidden = true;
      langBtn.setAttribute("aria-expanded", "false");
      const open = popover.hidden;
      popover.hidden = !open;
      pickerBtn.setAttribute("aria-expanded", String(open));
    });
    langBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      popover.hidden = true;
      pickerBtn.setAttribute("aria-expanded", "false");
      const open = langPopover.hidden;
      langPopover.hidden = !open;
      langBtn.setAttribute("aria-expanded", String(open));
    });
    this.shadowRoot.addEventListener("click", (e) => {
      if (!e.target.closest?.(".panel-controls")) {
        popover.hidden = true;
        pickerBtn.setAttribute("aria-expanded", "false");
        langPopover.hidden = true;
        langBtn.setAttribute("aria-expanded", "false");
      }
    });
    this.shadowRoot.querySelectorAll("[data-theme]").forEach((button) => button.addEventListener("click", () => {
      this._applyTheme(button.dataset.theme);
      try { window.localStorage.setItem("kr_survival_kit_theme", button.dataset.theme); } catch { /* storage is optional */ }
      popover.hidden = true;
      pickerBtn.setAttribute("aria-expanded", "false");
    }));
    this.shadowRoot.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
      this._applyLang(button.dataset.lang);
      langPopover.hidden = true;
      langBtn.setAttribute("aria-expanded", "false");
    }));
  }

  connectedCallback() {
    this._applyTheme(this._theme);
    this._applyLang(this._lang);
  }

  _applyTheme(name) {
    this._theme = name;
    this.setAttribute("data-theme-id", name);
    const theme = KR_PANEL_THEMES[name];
    for (const [key, value] of Object.entries(theme)) {
      if (!["name", "enName", "tagline", "enTagline"].includes(key)) this.style.setProperty(`--kr-${key}`, value);
    }
    const label = this.shadowRoot.querySelector("#theme-picker-label");
    if (label) label.textContent = `${krT(this._lang, "테마", "Theme")}: ${this._lang === "ko" ? theme.name : theme.enName}`;
    const dot = this.shadowRoot.querySelector("#theme-picker-btn .theme-dot");
    if (dot) dot.style.background = `linear-gradient(135deg,${theme.bg} 50%,${theme.accent} 50%)`;
    for (const button of this.shadowRoot.querySelectorAll("[data-theme]")) {
      button.setAttribute("aria-pressed", String(button.dataset.theme === name));
    }
    if (this._card) this._card.setAttribute("data-theme-id", name);
  }

  _applyLang(lang) {
    this._lang = Object.hasOwn(KR_LANGS, lang) ? lang : "ko";
    try { window.localStorage.setItem("kr_survival_kit_lang", this._lang); } catch { /* optional */ }
    const homeLink = this.shadowRoot.querySelector('[data-nav="home"]');
    const guideLink = this.shadowRoot.querySelector('[data-nav="guide"]');
    if (homeLink) homeLink.textContent = krT(this._lang, "비축 관리", "Stockpile");
    if (guideLink) guideLink.textContent = krT(this._lang, "상황 안내", "Guide");
    const langInfo = KR_LANGS[this._lang];
    const langLabel = this.shadowRoot.querySelector("#lang-picker-label");
    if (langLabel && langInfo) langLabel.textContent = `${langInfo.flag} ${langInfo.label}`;
    const theme = KR_PANEL_THEMES[this._theme];
    const label = this.shadowRoot.querySelector("#theme-picker-label");
    if (label && theme) label.textContent = `${krT(this._lang, "테마", "Theme")}: ${this._lang === "ko" ? theme.name : theme.enName}`;
    for (const button of this.shadowRoot.querySelectorAll("[data-theme]")) {
      const th = KR_PANEL_THEMES[button.dataset.theme];
      if (th) {
        const strong = button.querySelector("strong");
        const small = button.querySelector("small");
        if (strong) strong.textContent = this._lang !== "ko" ? th.enName : th.name;
        if (small) small.textContent = this._lang !== "ko" ? th.enTagline : th.tagline;
      }
    }
    for (const button of this.shadowRoot.querySelectorAll("[data-lang]")) {
      button.setAttribute("aria-pressed", String(button.dataset.lang === this._lang));
    }
    this._card?.setLang?.(this._lang);
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
    const { guide, guide_en, quiz, quiz_en, asset_path } = this._config;
    const card = document.createElement(isGuide ? "kr-survival-kit-panel-guide" : "kr-survival-kit-panel-inventory");
    card.toggleAttribute("data-kr-themed", true);
    card.setAttribute("data-theme-id", this._theme);
    card.setConfig(isGuide
      ? { guide_data: guide, guide_en_data: guide_en, asset_path, quiz_data: quiz, quiz_en_data: quiz_en, show_inventory_link: false, lang: this._lang }
      : { lang: this._lang });
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
