import * as THREE from "./three.module.min.js";

const KR_SPIN_RESUME_MS = 4000;

const SHORT_NAMES = {
  "drinking-water": "생수", "instant-rice": "즉석밥", "cup-noodles": "컵라면", "shelf-stable-meal": "레토르트 간편식",
  "spam-canned-ham": "스팸", "canned-tuna": "참치캔", "canned-pupa": "번데기캔", "canned-whelk": "골뱅이캔", "canned-fruit": "과일캔",
  "canned-food": "기타 통조림", hygiene: "두루마리 휴지", "wet-wipes": "물티슈",
  flashlight: "손전등", batteries: "AA 건전지", "batteries-aaa": "AAA 건전지", "batteries-special": "버튼셀 건전지",
  backpack: "대피 가방", blanket: "담요", "first-aid-kit": "소독약", "otc-medicine": "해열진통제",
  "infant-supplies": "기저귀", "prescription-preparedness": "처방약", radio: "자가발전 라디오",
  "water-container": "20L 말통", "faucet-water-tank": "수도꼭지 물통", "water-purification-tablets": "아쿠아탭스",
  "metal-fuel-can": "철제 기름통", "fuel-siphon-nozzle": "주유 펌프",
  "portable-stove": "휴대 버너", "butane-canister": "부탄가스", "butane-torch": "부탄 토치",
  "self-heating-ration": "발열식량", rice: "쌀", "salt-jar": "소금(병)", "honey-gift-set": "벌꿀",
  candles: "양초", "hand-warmers": "손난로", "sleeping-bag": "캠핑 침낭",
  "large-plastic-bags": "대형 비닐", lighter: "라이터", "solid-fuel": "고체 연료",
  "child-id-card": "인식표", "home-solar-panel": "가정용 태양광200W", "portable-solar-panel": "휴대용 태양광60W",
  "manual-can-opener": "캔 따개", "insulated-bottle": "보온병", "cooler-ice-pack": "아이스박스",
  "portable-water-filter": "정수 필터", "storage-bin": "보관함", "long-storage-snacks": "간식",
  "infant-formula": "조제분유", "ready-to-feed-formula": "액상분유", "infant-feeding-supplies": "일회용 젖병",
  "power-bank": "휴대 보조배터리", "portable-power-station": "가정용 파워뱅크", "charging-cables": "휴대폰 충전기",
  "warm-clothes": "여벌 옷", raincoat: "우비", masks: "마스크", "gas-mask": "방독면",
  "gas-mask-filter": "방독면 필터", earplugs: "이어플러그", "compressed-towel": "압축 수건",
  "rubber-gloves": "고무장갑", "rubber-boots": "장화", "sealing-tape": "투명 테이프",
  "emergency-contact-card": "연락 카드", "family-photo": "가족 사진",
  "portable-toilet": "휴대용 변기", "toilet-coagulant": "변기 응고제", "cat-litter": "고양이 모래",
  "sanitation-bags": "위생 봉투", "thermal-mat": "단열 매트", "child-comfort-kit": "안심 꾸러미",
  "basic-documents": "신분증 사본", "door-window-locks": "현관 보조 잠금", "door-alarm": "문 알림",
  "lock-tools": "자물쇠 공구", "child-carrier": "산악 아기캐리어", "transport-cart": "웨건 수레",
  "water-sanitation-kit": "손 소독제", "hot-water-bag": "온수 주머니",
  "portable-radio-communication": "무전기", "emergency-payment-check": "비상 결제",
  "cash-krw": "원화 현금", "cash-usd": "달러 외화", "crypto-cold-wallet": "코인·지갑",
  "protective-goggles": "보호 안경",
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

const OPT_CAT_MAP = {
  water_cook: new Set(["mouthwash", "disposable-tableware", "plastic-wrap", "ice-packs", "water-container", "faucet-water-tank", "water-purification-tablets", "portable-stove", "butane-canister", "butane-torch", "self-heating-ration", "rice", "canned-food", "salt-jar", "honey-gift-set", "lighter", "solid-fuel", "manual-can-opener", "insulated-bottle", "cooler-ice-pack", "portable-water-filter", "long-storage-snacks", "water-sanitation-kit"]),
  power_light: new Set(["headlamp", "charging-cable", "radio", "candles", "home-solar-panel", "portable-solar-panel", "power-bank", "portable-power-station", "charging-cables", "portable-radio-communication", "door-alarm", "metal-fuel-can", "fuel-siphon-nozzle"]),
  care_infant: new Set(["infant-medicine", "infant-supplies", "prescription-preparedness", "infant-formula", "ready-to-feed-formula", "infant-feeding-supplies", "child-id-card", "child-comfort-kit", "child-carrier"]),
  gear_protect: new Set(["emergency-blanket", "spare-shoes", "aluminum-tape", "cable-ties", "hand-warmers", "sleeping-bag", "large-plastic-bags", "warm-clothes", "raincoat", "masks", "gas-mask", "gas-mask-filter", "earplugs", "compressed-towel", "rubber-gloves", "rubber-boots", "sealing-tape", "portable-toilet", "toilet-coagulant", "cat-litter", "sanitation-bags", "thermal-mat", "hot-water-bag", "protective-goggles"]),
  doc_move: new Set(["important-documents", "window-locks", "storage-bin", "emergency-contact-card", "family-photo", "basic-documents", "door-window-locks", "lock-tools", "transport-cart", "emergency-payment-check", "cash-krw", "cash-usd", "crypto-cold-wallet"]),
};

const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SLOT_PITCH_X = 1.04;
const ROW_PITCH_Z = 2.15;
const RACK_DEPTH = 1.25;
const CEILING_Y = 3.2;
const LAMP_Y = 2.92;
const MAX_SPOTS = 6;

const WEATHER_LABEL = { clear: "맑음", rain: "🌧 비", snow: "❄️ 눈", storm: "⛈ 뇌우" };

/** Map a Home Assistant weather condition onto the 4 scene weather modes. */
export function mapHaWeather(state) {
  switch (state) {
    case "rainy": case "pouring": case "hail": return "rain";
    case "lightning": case "lightning-rainy": return "storm";
    case "snowy": case "snowy-rainy": return "snow";
    default: return "clear";
  }
}

// ---------------------------------------------------------------- textures

function canvasTexture(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const sharedTextures = {};
function shared(key, make) {
  if (!sharedTextures[key]) sharedTextures[key] = make();
  return sharedTextures[key];
}

function beamTexture() {
  return shared("beam", () => {
    const tex = canvasTexture(4, 128, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.35, "rgba(255,255,255,0.45)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
  });
}

function poolTexture() {
  return shared("pool", () => {
    const tex = canvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.5, "rgba(255,255,255,0.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
  });
}

function flakeTexture() {
  return shared("flake", () => canvasTexture(32, 32, (ctx) => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  }));
}

function concreteTexture() {
  return shared("concrete", () => {
    const tex = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#e6e6e6";
      ctx.fillRect(0, 0, w, h);
      // Deterministic speckle so screenshots stay stable between runs.
      let seed = 1337;
      const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 2600; i++) {
        const v = 200 + Math.floor(rand() * 55);
        ctx.fillStyle = `rgba(${v},${v},${v},${0.35 + rand() * 0.4})`;
        ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2.2, 1 + rand() * 2.2);
      }
      ctx.strokeStyle = "rgba(150,150,150,0.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, w - 2, h - 2);
    });
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    return tex;
  });
}

function solarCellTexture() {
  return shared("solar", () => canvasTexture(256, 160, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#16337a");
    g.addColorStop(1, "#0b1d4a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(200,220,255,0.65)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += w / 8) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += h / 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.45, 0); ctx.lineTo(0, h * 0.7); ctx.fill();
  }));
}

function familyPhotoTexture() {
  return shared("photo", () => canvasTexture(128, 160, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#9bd4f5");
    sky.addColorStop(1, "#e8f6ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffd166";
    ctx.beginPath(); ctx.arc(100, 28, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6bbf59";
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    const people = [[34, 1, "#e76f51"], [64, 1.15, "#264653"], [94, 0.8, "#f4a261"]];
    for (const [x, s, color] of people) {
      ctx.fillStyle = "#f1c7a5";
      ctx.beginPath(); ctx.arc(x, h * 0.72 - 46 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(x - 9 * s, h * 0.72 - 36 * s, 18 * s, 36 * s);
    }
  }));
}

function makeLabelSprite(text, toneColor) {
  const tex = canvasTexture(256, 64, (ctx) => {
    ctx.fillStyle = "rgba(8, 22, 34, 0.84)";
    ctx.strokeStyle = toneColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 48, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f2fafb";
    ctx.font = 'bold 24px "Malgun Gothic", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 33);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(0.95, 0.24, 1);
  return sprite;
}

/** Industrial sign plate: accent stripe, big title, small subtitle. */
function makePlateTexture(title, subtitle, accent, w = 512, h = 160) {
  return canvasTexture(w, h, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1d3a4d");
    g.addColorStop(1, "#0d1f2c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 18, h);
    // Hazard chevrons on the right edge.
    ctx.save();
    ctx.beginPath(); ctx.rect(w - 40, 0, 40, h); ctx.clip();
    for (let y = -40; y < h + 40; y += 28) {
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.moveTo(w - 40, y); ctx.lineTo(w, y - 20); ctx.lineTo(w, y - 6); ctx.lineTo(w - 40, y + 14); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = "#f2fafb";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(h * 0.4)}px "Malgun Gothic", system-ui, sans-serif`;
    ctx.fillText(title, 40, subtitle ? h * 0.38 : h * 0.52);
    if (subtitle) {
      ctx.fillStyle = "#9fdce6";
      ctx.font = `600 ${Math.round(h * 0.2)}px "Malgun Gothic", system-ui, sans-serif`;
      ctx.fillText(subtitle, 42, h * 0.76);
    }
  });
}

/** Two back-to-back planes so a sign reads correctly from both sides. */
function makeSign(tex, w, h) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.2, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.28 });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  front.position.z = 0.012;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  back.rotation.y = Math.PI;
  back.position.z = -0.012;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x2f4858, roughness: 0.4, metalness: 0.7 }));
  frame.castShadow = true;
  group.add(frame, front, back);
  return group;
}

// ---------------------------------------------------------------- item mesh kit

class MaterialKit {
  constructor() {
    this.cache = new Map();
  }

  m(color, o = {}) {
    const key = `${color}|${o.r}|${o.mt}|${o.op}|${o.e}|${o.ei}|${o.side}|${o.map ? o.map.uuid : ""}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.MeshStandardMaterial({
        color,
        roughness: o.r ?? 0.5,
        metalness: o.mt ?? 0.1,
        emissive: o.e ?? 0x000000,
        emissiveIntensity: o.ei ?? 1,
        transparent: o.op != null,
        opacity: o.op ?? 1,
        side: o.side ?? THREE.FrontSide,
        map: o.map ?? null,
      }));
    }
    return this.cache.get(key);
  }

  glow(color) {
    const key = `glow|${color}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    }
    return this.cache.get(key);
  }
}

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (rt, rb, h, s = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open);
const T = (r, tube, rs = 8, ts = 24, arc = Math.PI * 2) => new THREE.TorusGeometry(r, tube, rs, ts, arc);
const S = (r, ws = 16, hs = 12) => new THREE.SphereGeometry(r, ws, hs);
const HALF = Math.PI / 2;

function add(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Lay `n` units on a grid of `cols` columns, centred on the slot. */
function lay(n, cols, dx, dz, fn) {
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const inRow = r === rows - 1 ? n - r * cols : cols;
    fn((c - (inRow - 1) / 2) * dx, (r - (rows - 1) / 2) * dz, i);
  }
}

/** Stack `n` units: `perLayer` per layer laid out on a grid, layers of height `h`. */
function stackGrid(n, perLayer, cols, dx, dz, h, fn) {
  for (let base = 0, layer = 0; base < n; base += perLayer, layer++) {
    const inLayer = Math.min(perLayer, n - base);
    lay(inLayer, cols, dx, dz, (x, z, i) => fn(x, layer * h, z, base + i, layer));
  }
}

function canRow(g, k, n, color, r = 0.11, h = 0.24) {
  const body = k.m(color, { r: 0.35, mt: 0.55 });
  const rim = k.m(0xd8e2dc, { r: 0.25, mt: 0.85 });
  const label = k.m(0xf8f9fa, { r: 0.6 });
  stackGrid(n, 3, 3, r * 2 + 0.01, 0, h + 0.01, (x, y, z) => {
    add(g, C(r, r, h), body, x, y + h / 2, z + 0.04);
    add(g, C(r * 1.005, r * 1.005, h * 0.35), label, x, y + h / 2, z + 0.04);
    add(g, C(r * 1.03, r * 1.03, 0.02), rim, x, y + h - 0.005, z + 0.04);
  });
}

function bottleRow(g, k, n, bodyColor, capColor, r = 0.085, h = 0.34, opacity = 0.82) {
  const body = k.m(bodyColor, { r: 0.12, mt: 0.05, op: opacity });
  const band = k.m(0xe0fbfc, { r: 0.5 });
  const cap = k.m(capColor, { r: 0.4 });
  lay(n, 3, r * 2 + 0.03, r * 2 + 0.05, (x, z) => {
    add(g, C(r, r, h), body, x, h / 2, z);
    add(g, C(r * 1.02, r * 1.02, h * 0.26), band, x, h * 0.55, z);
    add(g, C(r * 0.42, r * 0.85, h * 0.2), body, x, h + h * 0.1, z);
    add(g, C(r * 0.48, r * 0.48, 0.04), cap, x, h + h * 0.22, z);
  });
}

function foldedStack(g, k, n, colors, w = 0.5, h = 0.07, d = 0.36) {
  const layers = Math.max(1, Math.min(n, 4));
  for (let i = 0; i < layers; i++) {
    const m = k.m(colors[i % colors.length], { r: 0.85 });
    add(g, B(w - i * 0.015, h, d - i * 0.01), m, 0, h / 2 + i * (h + 0.005), 0, 0, (i % 2 ? 0.05 : -0.04), 0);
    add(g, C(h / 2, h / 2, d - i * 0.01, 10), m, w / 2 - i * 0.0075, h / 2 + i * (h + 0.005), 0, HALF, 0, 0);
  }
}

function packRow(g, k, n, colors, w, h, d, spacing) {
  const crimp = k.m(0xced4da, { r: 0.3, mt: 0.7 });
  lay(n, 6, spacing, 0, (x, z, i) => {
    const m = k.m(colors[i % colors.length], { r: 0.4, mt: 0.25 });
    const tilt = (i % 2 ? 1 : -1) * 0.06;
    add(g, B(w, h, d), m, x, h / 2, z, 0, 0, tilt);
    add(g, B(w * 1.02, 0.02, d * 1.05), crimp, x - Math.sin(tilt) * h / 2, h, z, 0, 0, tilt);
  });
}

/** Per-item 3D shapes. Each builder gets (group, kit, units 1..6, ctx). */
const SHAPES = {
  // ---------- water
  "drinking-water": (g, k, n) => bottleRow(g, k, n, 0x4cc9f0, 0x1d4ed8),
  "water-container": (g, k, n) => {
    const body = k.m(0x3a86ff, { r: 0.55 });
    const cap = k.m(0xf8f9fa, { r: 0.4 });
    lay(Math.min(n, 2), 2, 0.36, 0, (x, z) => {
      add(g, B(0.3, 0.42, 0.2), body, x, 0.21, z);
      add(g, T(0.06, 0.018, 8, 16, Math.PI), body, x - 0.03, 0.42, z);
      add(g, C(0.04, 0.04, 0.06), cap, x + 0.1, 0.45, z);
    });
  },
  "faucet-water-tank": (g, k) => {
    add(g, B(0.44, 0.36, 0.3), k.m(0xbde0fe, { r: 0.15, op: 0.75 }), 0, 0.18, 0);
    add(g, B(0.42, 0.24, 0.28), k.m(0x4cc9f0, { r: 0.1, op: 0.6 }), 0, 0.13, 0);
    add(g, C(0.022, 0.022, 0.1), k.m(0xadb5bd, { r: 0.2, mt: 0.9 }), 0.12, 0.06, 0.19, HALF, 0, 0);
    add(g, B(0.05, 0.03, 0.04), k.m(0xe63946, { r: 0.4 }), 0.12, 0.09, 0.24);
    add(g, C(0.05, 0.05, 0.04), k.m(0x1d4ed8), -0.1, 0.38, 0);
  },
  "water-purification-tablets": (g, k, n) => {
    const box = k.m(0xf8f9fa, { r: 0.6 });
    const stripe = k.m(0x0096c7, { r: 0.5 });
    stackGrid(Math.min(n, 6), 2, 2, 0.2, 0, 0.055, (x, y, z) => {
      add(g, B(0.17, 0.05, 0.11), box, x, y + 0.025, z);
      add(g, B(0.171, 0.014, 0.111), stripe, x, y + 0.03, z);
    });
  },
  "portable-water-filter": (g, k, n) => {
    const tube = k.m(0x0077b6, { r: 0.35, mt: 0.2 });
    const cap = k.m(0x212529, { r: 0.5 });
    lay(Math.min(n, 3), 3, 0.12, 0, (x, z) => {
      add(g, C(0.035, 0.035, 0.26), tube, x, 0.13, z);
      add(g, C(0.038, 0.038, 0.03), cap, x, 0.275, z);
      add(g, C(0.038, 0.038, 0.03), cap, x, 0.015, z);
    });
  },
  "water-sanitation-kit": (g, k) => {
    const bucket = k.m(0x48cae4, { r: 0.45, side: THREE.DoubleSide });
    add(g, C(0.17, 0.13, 0.26, 20, true), bucket, -0.06, 0.13, 0);
    add(g, C(0.13, 0.13, 0.012, 20), bucket, -0.06, 0.006, 0);
    add(g, T(0.17, 0.008, 6, 24, Math.PI), k.m(0x6c757d, { mt: 0.8, r: 0.3 }), -0.06, 0.26, 0);
    add(g, C(0.045, 0.045, 0.2), k.m(0xf8f9fa, { r: 0.4 }), 0.2, 0.1, 0.06);
    add(g, C(0.03, 0.03, 0.03), k.m(0x2a9d8f), 0.2, 0.215, 0.06);
  },
  // ---------- food
  "instant-rice": (g, k, n) => {
    const tray = k.m(0xf8f9fa, { r: 0.45 });
    const lid = k.m(0xf4a261, { r: 0.35, mt: 0.3 });
    stackGrid(n, 2, 2, 0.24, 0, 0.068, (x, y, z) => {
      add(g, B(0.2, 0.06, 0.16), tray, x, y + 0.03, z);
      add(g, B(0.205, 0.008, 0.165), lid, x, y + 0.064, z);
    });
  },
  "cup-noodles": (g, k, n) => {
    const cup = k.m(0xd62828, { r: 0.45 });
    const band = k.m(0xf8f9fa, { r: 0.5 });
    const lid = k.m(0xe9ecef, { r: 0.3, mt: 0.6 });
    stackGrid(n, 3, 3, 0.2, 0, 0.152, (x, y, z) => {
      add(g, C(0.09, 0.065, 0.14, 18), cup, x, y + 0.07, z);
      add(g, C(0.084, 0.078, 0.04, 18), band, x, y + 0.1, z);
      add(g, C(0.095, 0.095, 0.01, 18), lid, x, y + 0.145, z);
    });
  },
  "shelf-stable-meal": (g, k, n) => packRow(g, k, n, [0xe76f51, 0x2a9d8f, 0xe9c46a], 0.1, 0.22, 0.05, 0.12),
  "long-storage-snacks": (g, k, n) => packRow(g, k, n, [0xffb703, 0x8338ec, 0xfb5607, 0x3a86ff], 0.12, 0.2, 0.07, 0.13),
  "self-heating-ration": (g, k, n) => {
    const box = k.m(0x606c38, { r: 0.7 });
    const strip = k.m(0xfb8500, { r: 0.5 });
    for (let i = 0; i < Math.min(n, 4); i++) {
      add(g, B(0.3, 0.1, 0.2), box, 0, 0.05 + i * 0.105, 0, 0, i % 2 ? 0.08 : -0.05, 0);
      add(g, B(0.302, 0.025, 0.202), strip, 0, 0.07 + i * 0.105, 0, 0, i % 2 ? 0.08 : -0.05, 0);
    }
  },
  "spam-canned-ham": (g, k, n) => {
    const can = k.m(0x1d3f8f, { r: 0.3, mt: 0.6 });
    const band = k.m(0xffd166, { r: 0.4, mt: 0.4 });
    const lid = k.m(0xd8e2dc, { r: 0.25, mt: 0.85 });
    stackGrid(n, 3, 3, 0.19, 0, 0.1, (x, y, z) => {
      add(g, B(0.17, 0.09, 0.1), can, x, y + 0.045, z);
      add(g, B(0.172, 0.03, 0.102), band, x, y + 0.05, z);
      add(g, B(0.16, 0.008, 0.09), lid, x, y + 0.093, z);
    });
  },
  "canned-tuna": (g, k, n) => {
    const can = k.m(0x4ea8de, { r: 0.3, mt: 0.6 });
    const lid = k.m(0xd8e2dc, { r: 0.25, mt: 0.85 });
    lay(Math.min(n, 3), 3, 0.22, 0, (x, z, i) => {
      const tower = 2 + (i % 2);
      for (let l = 0; l < tower; l++) {
        add(g, C(0.1, 0.1, 0.055, 20), can, x, 0.028 + l * 0.06, z);
        add(g, C(0.098, 0.098, 0.006, 20), lid, x, 0.058 + l * 0.06, z);
      }
    });
  },
  "canned-pupa": (g, k, n) => canRow(g, k, n, 0xb5838d),
  "canned-whelk": (g, k, n) => canRow(g, k, n, 0x2ec4b6),
  "canned-fruit": (g, k, n) => canRow(g, k, n, 0xffd166),
  "canned-food": (g, k, n) => canRow(g, k, n, 0xe06f6c),
  rice: (g, k, n) => {
    const sack = k.m(0xf4ebd9, { r: 0.9 });
    const band = k.m(0xd94848, { r: 0.5 });
    for (let i = 0; i < Math.min(n, 3); i++) {
      const y = 0.07 + i * 0.145;
      const ry = (i % 2 ? 0.06 : -0.04);
      add(g, new THREE.CapsuleGeometry(0.07, 0.38, 4, 10), sack, 0, y, 0, 0, ry, HALF).scale.set(1, 1, 2.8);
      add(g, B(0.47, 0.03, 0.15), band, 0, y + 0.055, 0, 0, ry, 0);
    }
  },
  "salt-jar": (g, k, n) => {
    const glass = k.m(0xe9f5f9, { r: 0.05, op: 0.45 });
    const salt = k.m(0xffffff, { r: 0.95 });
    const lid = k.m(0xd62828, { r: 0.4 });
    lay(Math.min(n, 3), 3, 0.2, 0, (x, z) => {
      add(g, C(0.075, 0.075, 0.14, 16), salt, x, 0.07, z);
      add(g, C(0.085, 0.085, 0.18, 16), glass, x, 0.09, z);
      add(g, C(0.09, 0.09, 0.04, 16), lid, x, 0.2, z);
    });
  },
  "honey-gift-set": (g, k, n) => {
    add(g, B(0.56, 0.08, 0.36), k.m(0xc8a27a, { r: 0.85 }), 0, 0.04, 0);
    const honey = k.m(0xf4a300, { r: 0.08, op: 0.82 });
    const lid = k.m(0xb08968, { r: 0.6 });
    lay(Math.min(Math.max(n, 2), 3), 3, 0.17, 0, (x, z) => {
      add(g, C(0.065, 0.065, 0.16, 16), honey, x, 0.16, z);
      add(g, C(0.07, 0.07, 0.03, 16), lid, x, 0.255, z);
    });
  },
  "butane-canister": (g, k, n) => {
    const body = k.m(0xff8c42, { r: 0.3, mt: 0.55 });
    const top = k.m(0xced4da, { r: 0.2, mt: 0.9 });
    lay(Math.min(n, 6), 3, 0.15, 0.15, (x, z) => {
      add(g, C(0.06, 0.06, 0.3, 16), body, x, 0.15, z);
      add(g, C(0.028, 0.06, 0.035, 16), top, x, 0.318, z);
      add(g, C(0.012, 0.012, 0.025), top, x, 0.345, z);
    });
  },
  "insulated-bottle": (g, k, n) => {
    const steel = k.m(0xadb5bd, { r: 0.18, mt: 0.9 });
    const cap = k.m(0x264653, { r: 0.4 });
    lay(Math.min(n, 3), 3, 0.17, 0, (x, z) => {
      add(g, C(0.065, 0.065, 0.34, 18), steel, x, 0.17, z);
      add(g, C(0.068, 0.068, 0.08, 18), cap, x, 0.38, z);
    });
  },
  "cooler-ice-pack": (g, k) => {
    add(g, B(0.52, 0.28, 0.34), k.m(0xf8f9fa, { r: 0.45 }), 0, 0.14, 0);
    add(g, B(0.54, 0.06, 0.36), k.m(0x0077b6, { r: 0.4 }), 0, 0.31, 0);
    add(g, B(0.32, 0.03, 0.04), k.m(0x023e8a), 0, 0.36, 0);
    add(g, B(0.16, 0.03, 0.1), k.m(0x90e0ef, { r: 0.1, op: 0.8 }), 0.36, 0.015, 0.1);
  },
  "manual-can-opener": (g, k, n) => {
    const grip = k.m(0xd62828, { r: 0.45 });
    const steel = k.m(0xced4da, { r: 0.2, mt: 0.9 });
    lay(Math.min(n, 2), 2, 0.2, 0, (x, z) => {
      add(g, B(0.18, 0.02, 0.025), grip, x, 0.012, z - 0.02, 0, 0.12, 0);
      add(g, B(0.18, 0.02, 0.025), grip, x, 0.012, z + 0.02, 0, -0.12, 0);
      add(g, C(0.03, 0.03, 0.025, 12), steel, x - 0.1, 0.02, z);
    });
  },
  // ---------- hygiene & sanitation
  hygiene: (g, k, n) => {
    const roll = k.m(0xffffff, { r: 0.95 });
    const core = k.m(0x8d6e63, { r: 0.8 });
    const wrap = k.m(0xcfe8ff, { r: 0.1, op: 0.18 });
    const layers = n > 3 ? 2 : 1;
    for (let l = 0; l < layers; l++) {
      lay(6, 3, 0.18, 0.18, (x, z) => {
        add(g, C(0.085, 0.085, 0.17, 18), roll, x, 0.085 + l * 0.172, z);
        add(g, C(0.03, 0.03, 0.172, 12), core, x, 0.085 + l * 0.172, z);
      });
    }
    add(g, B(0.56, layers * 0.172 + 0.01, 0.38), wrap, 0, (layers * 0.172) / 2, 0);
  },
  "wet-wipes": (g, k, n) => {
    const pack = k.m(0xf8f9fa, { r: 0.5 });
    const flap = k.m(0x48cae4, { r: 0.4 });
    for (let i = 0; i < Math.min(n, 4); i++) {
      const ry = i % 2 ? 0.1 : -0.06;
      add(g, B(0.28, 0.07, 0.16), pack, 0, 0.035 + i * 0.072, 0, 0, ry, 0);
      add(g, B(0.11, 0.012, 0.07), flap, 0, 0.072 + i * 0.072, 0, 0, ry, 0);
    }
  },
  masks: (g, k, n) => {
    const box = k.m(0xf8f9fa, { r: 0.55 });
    const stripe = k.m(0x0096c7, { r: 0.4 });
    const mask = k.m(0xa9d6e5, { r: 0.8 });
    for (let i = 0; i < Math.min(n, 2); i++) {
      add(g, B(0.32, 0.12, 0.2), box, 0, 0.06 + i * 0.122, 0, 0, i * 0.08, 0);
      add(g, B(0.322, 0.03, 0.202), stripe, 0, 0.09 + i * 0.122, 0, 0, i * 0.08, 0);
    }
    add(g, B(0.14, 0.012, 0.09), mask, 0.02, 0.06 + Math.min(n, 2) * 0.122, 0, 0, 0.3, 0);
  },
  "compressed-towel": (g, k, n) => {
    const towel = k.m(0xffffff, { r: 0.95 });
    lay(Math.min(n * 2, 9), 3, 0.1, 0.1, (x, z) => add(g, C(0.04, 0.04, 0.035, 14), towel, x, 0.018, z));
  },
  "portable-toilet": (g, k) => {
    add(g, C(0.17, 0.15, 0.3, 22), k.m(0xf8f9fa, { r: 0.4 }), 0, 0.15, 0);
    add(g, T(0.13, 0.03, 8, 24), k.m(0xe9ecef, { r: 0.3 }), 0, 0.31, 0, HALF, 0, 0);
    add(g, C(0.17, 0.17, 0.012, 22), k.m(0xadb5bd, { r: 0.35 }), 0, 0.33, -0.02, -0.18, 0, 0);
  },
  "toilet-coagulant": (g, k, n) => {
    const box = k.m(0x52b788, { r: 0.6 });
    const label = k.m(0xf8f9fa, { r: 0.6 });
    lay(Math.min(n, 2), 2, 0.28, 0, (x, z) => {
      add(g, B(0.24, 0.16, 0.16), box, x, 0.08, z);
      add(g, B(0.16, 0.08, 0.162), label, x, 0.09, z);
    });
  },
  "cat-litter": (g, k) => {
    add(g, B(0.34, 0.4, 0.14), k.m(0x7b2cbf, { r: 0.75 }), 0, 0.2, 0, -0.06, 0, 0);
    add(g, B(0.342, 0.05, 0.142), k.m(0xe0aaff, { r: 0.6 }), 0, 0.37, -0.01, -0.06, 0, 0);
    add(g, S(0.05), k.m(0xffd166, { r: 0.7 }), 0, 0.2, 0.08);
  },
  "sanitation-bags": (g, k, n) => {
    const roll = k.m(0x212529, { r: 0.6, mt: 0.1 });
    lay(Math.min(n, 3), 1, 0, 0.13, (x, z) => add(g, C(0.055, 0.055, 0.32, 16), roll, x, 0.055, z, 0, 0, HALF));
  },
  "large-plastic-bags": (g, k, n) => {
    const roll = k.m(0x90e0ef, { r: 0.25, op: 0.7 });
    add(g, B(0.42, 0.1, 0.24), k.m(0x0077b6, { r: 0.5 }), 0, 0.05, 0);
    lay(Math.min(n, 2), 1, 0, 0.13, (x, z) => add(g, C(0.06, 0.06, 0.38, 16), roll, x, 0.16, z, 0, 0, HALF));
  },
  // ---------- power & light
  flashlight: (g, k, n, ctx) => {
    const body = k.m(0x495057, { r: 0.3, mt: 0.75 });
    const lens = ctx.ready ? k.glow(0xfff3b0) : k.m(0xffe066, { e: 0xffd43b, ei: 0.2 });
    lay(Math.min(n, 2), 1, 0, 0.24, (x, z) => {
      add(g, C(0.055, 0.055, 0.34, 14), body, -0.08, 0.1, z, 0, 0, HALF);
      add(g, C(0.095, 0.06, 0.12, 14), body, 0.14, 0.1, z, 0, 0, HALF);
      add(g, C(0.085, 0.085, 0.02, 14), lens, 0.205, 0.1, z, 0, 0, HALF);
      add(g, B(0.05, 0.02, 0.03), k.m(0xe63946), -0.02, 0.16, z);
    });
  },
  batteries: (g, k, n) => batteryTray(g, k, n * 2, 0x2d6a4f, 0.03, 0.11),
  "batteries-aaa": (g, k, n) => batteryTray(g, k, n * 2, 0x1b4965, 0.022, 0.09),
  "batteries-special": (g, k, n) => {
    const nine = k.m(0x212529, { r: 0.4, mt: 0.3 });
    const gold = k.m(0xd4a373, { r: 0.3, mt: 0.8 });
    const coin = k.m(0xced4da, { r: 0.2, mt: 0.95 });
    lay(Math.min(n, 3), 3, 0.1, 0, (x, z) => {
      add(g, B(0.07, 0.1, 0.045), nine, x - 0.1, 0.05, z);
      add(g, B(0.071, 0.025, 0.046), gold, x - 0.1, 0.09, z);
    });
    for (let i = 0; i < Math.min(n + 2, 6); i++) add(g, C(0.04, 0.04, 0.012, 18), coin, 0.2, 0.006 + i * 0.013, 0.05);
  },
  radio: (g, k, n, ctx) => {
    add(g, B(0.46, 0.26, 0.16), k.m(0x2b4c7e, { r: 0.45, mt: 0.2 }), 0, 0.13, 0);
    add(g, C(0.075, 0.075, 0.012, 20), k.m(0x14213d, { r: 0.8 }), -0.1, 0.13, 0.081, HALF, 0, 0);
    add(g, B(0.15, 0.06, 0.01), ctx.ready ? k.glow(0xffb703) : k.m(0x7a5c00), 0.11, 0.17, 0.082);
    add(g, C(0.022, 0.022, 0.02, 12), k.m(0xced4da, { mt: 0.8 }), 0.11, 0.08, 0.085, HALF, 0, 0);
    add(g, C(0.007, 0.007, 0.4, 6), k.m(0xdee2e6, { r: 0.2, mt: 0.95 }), 0.19, 0.44, -0.05, 0, 0, -0.25);
    add(g, T(0.05, 0.012, 6, 16, Math.PI), k.m(0xfb8500), -0.235, 0.13, 0, 0, HALF, HALF);
  },
  "power-bank": (g, k, n) => {
    const body = k.m(0x343a40, { r: 0.35, mt: 0.4 });
    const led = k.glow(0x56cfe1);
    const units = Math.min(n, 3);
    for (let i = 0; i < units; i++) {
      add(g, B(0.25, 0.035, 0.13), body, -0.08, 0.018 + i * 0.037, 0, 0, i * 0.12, 0);
      for (let d = 0; d < 4; d++) add(g, B(0.012, 0.008, 0.004), led, -0.13 + d * 0.02, 0.022 + i * 0.037, 0.066);
    }
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.02, 0.0), new THREE.Vector3(0.16, 0.02, 0.08),
      new THREE.Vector3(0.26, 0.012, -0.02), new THREE.Vector3(0.2, 0.012, -0.12), new THREE.Vector3(0.1, 0.012, -0.1),
    ]);
    add(g, new THREE.TubeGeometry(curve, 30, 0.008, 6), k.m(0xf8f9fa, { r: 0.5 }));
  },
  "portable-power-station": (g, k, n, ctx) => {
    add(g, B(0.5, 0.34, 0.3), k.m(0x495057, { r: 0.35, mt: 0.3 }), 0, 0.17, 0);
    const side = k.m(0xfb8500, { r: 0.5 });
    add(g, B(0.02, 0.32, 0.28), side, -0.255, 0.17, 0);
    add(g, B(0.02, 0.32, 0.28), side, 0.255, 0.17, 0);
    const grip = k.m(0x212529, { r: 0.6 });
    add(g, B(0.04, 0.07, 0.05), grip, -0.15, 0.375, 0);
    add(g, B(0.04, 0.07, 0.05), grip, 0.15, 0.375, 0);
    add(g, B(0.34, 0.035, 0.06), grip, 0, 0.42, 0);
    add(g, B(0.16, 0.09, 0.01), ctx.ready ? k.glow(0x80ffdb) : k.m(0x1b4332), -0.08, 0.24, 0.152);
    const sock = k.m(0x14213d);
    add(g, C(0.025, 0.025, 0.012), sock, 0.1, 0.12, 0.152, HALF, 0, 0);
    add(g, C(0.025, 0.025, 0.012), sock, 0.17, 0.12, 0.152, HALF, 0, 0);
  },
  "charging-cables": (g, k, n) => {
    const colors = [0xf8f9fa, 0x212529, 0x3a86ff];
    for (let i = 0; i < Math.min(n + 1, 3); i++) {
      const x = (i - 1) * 0.18;
      add(g, T(0.07, 0.011, 8, 28), k.m(colors[i], { r: 0.5 }), x, 0.012, 0, HALF, 0, 0);
      add(g, T(0.055, 0.011, 8, 28), k.m(colors[i], { r: 0.5 }), x, 0.034, 0, HALF, 0, 0);
      add(g, B(0.04, 0.02, 0.025), k.m(0xadb5bd, { mt: 0.8, r: 0.3 }), x + 0.07, 0.05, 0.03);
    }
  },
  "home-solar-panel": (g, k) => {
    const frame = k.m(0xced4da, { r: 0.25, mt: 0.9 });
    const cells = k.m(0xffffff, { r: 0.15, mt: 0.4, map: solarCellTexture() });
    const panel = new THREE.Group();
    add(panel, B(0.8, 0.025, 0.5), frame, 0, 0, 0);
    add(panel, B(0.76, 0.028, 0.46), cells, 0, 0.002, 0);
    panel.position.set(0, 0.22, -0.02);
    panel.rotation.x = 0.55;
    g.add(panel);
    add(g, C(0.012, 0.012, 0.24, 8), frame, -0.34, 0.12, -0.14);
    add(g, C(0.012, 0.012, 0.24, 8), frame, 0.34, 0.12, -0.14);
  },
  "portable-solar-panel": (g, k) => {
    const cells = k.m(0xffffff, { r: 0.2, mt: 0.3, map: solarCellTexture() });
    const cloth = k.m(0x343a40, { r: 0.9 });
    [-1, 0, 1].forEach((i) => {
      const leaf = new THREE.Group();
      add(leaf, B(0.22, 0.34, 0.012), cloth, 0, 0, 0);
      add(leaf, B(0.19, 0.3, 0.014), cells, 0, 0, 0.001);
      leaf.position.set(i * 0.2, 0.17, i === 0 ? 0.04 : -0.02);
      leaf.rotation.y = i * -0.45;
      g.add(leaf);
    });
  },
  candles: (g, k, n, ctx) => {
    const wax = k.m(0xfff8e7, { r: 0.7 });
    const wick = k.m(0x212529);
    const flame = k.glow(0xffb703);
    lay(Math.min(n, 6), 3, 0.12, 0.12, (x, z, i) => {
      const h = 0.14 + (i % 3) * 0.025;
      add(g, C(0.035, 0.035, h, 14), wax, x, h / 2, z);
      add(g, C(0.004, 0.004, 0.02, 4), wick, x, h + 0.01, z);
      if (ctx.ready) {
        const f = add(g, new THREE.ConeGeometry(0.016, 0.055, 10), flame, x, h + 0.045, z);
        f.castShadow = false;
        ctx.flames.push(f);
      }
    });
  },
  lighter: (g, k, n) => {
    const colors = [0xe63946, 0x3a86ff, 0xffd166, 0x52b788, 0x8338ec, 0xfb8500];
    const top = k.m(0xced4da, { r: 0.2, mt: 0.9 });
    lay(Math.min(n, 6), 6, 0.06, 0, (x, z, i) => {
      add(g, B(0.04, 0.1, 0.022), k.m(colors[i % colors.length], { r: 0.15, op: 0.88 }), x, 0.05, z);
      add(g, B(0.04, 0.022, 0.022), top, x, 0.111, z);
    });
  },
  "portable-stove": (g, k) => {
    add(g, B(0.4, 0.11, 0.28), k.m(0xced4da, { r: 0.25, mt: 0.85 }), 0, 0.055, 0);
    add(g, B(0.14, 0.1, 0.29), k.m(0x495057, { r: 0.4, mt: 0.5 }), 0.13, 0.055, 0);
    const grate = k.m(0x212529, { r: 0.5, mt: 0.6 });
    add(g, T(0.075, 0.008, 6, 24), grate, -0.05, 0.115, 0, HALF, 0, 0);
    for (let a = 0; a < 4; a++) add(g, B(0.1, 0.012, 0.012), grate, -0.05, 0.122, 0, 0, a * Math.PI / 4, 0);
    add(g, C(0.022, 0.022, 0.02, 12), k.m(0xe63946), 0.13, 0.06, 0.145, HALF, 0, 0);
  },
  "butane-torch": (g, k, n) => {
    const can = k.m(0xff8c42, { r: 0.3, mt: 0.55 });
    const head = k.m(0x212529, { r: 0.45 });
    const steel = k.m(0xced4da, { r: 0.2, mt: 0.9 });
    lay(Math.min(n, 2), 2, 0.26, 0, (x, z) => {
      add(g, C(0.055, 0.055, 0.22, 16), can, x - 0.04, 0.11, z);
      add(g, B(0.06, 0.07, 0.06), head, x - 0.04, 0.255, z);
      add(g, C(0.014, 0.02, 0.14, 10), steel, x + 0.06, 0.27, z, 0, 0, HALF);
    });
  },
  "solid-fuel": (g, k, n) => {
    const can = k.m(0xced4da, { r: 0.25, mt: 0.85 });
    const lid = k.m(0x0077b6, { r: 0.4 });
    lay(Math.min(n, 6), 3, 0.14, 0.14, (x, z) => {
      add(g, C(0.06, 0.06, 0.06, 16), can, x, 0.03, z);
      add(g, C(0.062, 0.062, 0.012, 16), lid, x, 0.064, z);
    });
  },
  "metal-fuel-can": (g, k) => {
    const red = k.m(0xc92a2a, { r: 0.35, mt: 0.65 });
    add(g, B(0.36, 0.44, 0.18), red, 0, 0.22, 0);
    const emboss = k.m(0xa61e1e, { r: 0.35, mt: 0.65 });
    add(g, B(0.4, 0.025, 0.012), emboss, 0, 0.22, 0.092, 0, 0, 0.85);
    add(g, B(0.4, 0.025, 0.012), emboss, 0, 0.22, 0.092, 0, 0, -0.85);
    for (const hx of [-0.1, 0, 0.1]) add(g, B(0.022, 0.05, 0.1), red, hx, 0.465, 0);
    add(g, B(0.26, 0.022, 0.1), red, 0, 0.495, 0);
    add(g, C(0.045, 0.045, 0.07, 12), k.m(0xffd166, { r: 0.3, mt: 0.7 }), 0.15, 0.47, 0, 0, 0, -0.5);
  },
  "fuel-siphon-nozzle": (g, k) => {
    add(g, T(0.1, 0.012, 8, 30), k.m(0xfff3b0, { r: 0.1, op: 0.7 }), 0, 0.015, 0, HALF, 0, 0);
    add(g, T(0.08, 0.012, 8, 30), k.m(0xfff3b0, { r: 0.1, op: 0.7 }), 0, 0.04, 0, HALF, 0, 0);
    add(g, S(0.04), k.m(0xd62828, { r: 0.5 }), 0.16, 0.04, 0.05);
  },
  "door-alarm": (g, k, n, ctx) => {
    const body = k.m(0xf8f9fa, { r: 0.4 });
    lay(Math.min(n, 3), 3, 0.14, 0, (x, z) => {
      add(g, B(0.05, 0.12, 0.03), body, x - 0.02, 0.06, z);
      add(g, B(0.02, 0.12, 0.03), body, x + 0.025, 0.06, z);
      const led = add(g, S(0.008, 8, 6), k.glow(0xff3b3b), x - 0.02, 0.1, z + 0.016);
      led.castShadow = false;
      ctx.blinkers.push(led);
    });
  },
  "portable-radio-communication": (g, k, n, ctx) => {
    const body = k.m(0xffb703, { r: 0.45 });
    const black = k.m(0x212529, { r: 0.5 });
    lay(Math.min(n, 2), 2, 0.16, 0, (x, z) => {
      add(g, B(0.085, 0.2, 0.045), body, x, 0.1, z);
      add(g, B(0.087, 0.07, 0.047), black, x, 0.04, z);
      add(g, C(0.01, 0.013, 0.15, 8), black, x - 0.022, 0.275, z);
      add(g, C(0.013, 0.013, 0.025, 10), black, x + 0.022, 0.212, z);
      add(g, B(0.055, 0.04, 0.004), ctx.ready ? k.glow(0x95d5b2) : k.m(0x2d6a4f), x, 0.15, z + 0.024);
    });
  },
  // ---------- warmth & protection
  blanket: (g, k, n) => foldedStack(g, k, n, [0xb5838d, 0x6d597a, 0xe5989b]),
  "warm-clothes": (g, k, n) => foldedStack(g, k, n, [0x1d3557, 0x6c757d, 0xc1121f], 0.42, 0.06, 0.3),
  raincoat: (g, k, n) => foldedStack(g, k, Math.min(n, 2), [0xffd60a], 0.28, 0.08, 0.2),
  "sleeping-bag": (g, k) => {
    add(g, C(0.13, 0.13, 0.44, 20), k.m(0x2b8a3e, { r: 0.75 }), 0, 0.13, 0, 0, 0, HALF);
    add(g, C(0.1, 0.1, 0.442, 20), k.m(0x1b4332, { r: 0.8 }), 0, 0.13, 0, 0, 0, HALF);
    const strap = k.m(0x212529, { r: 0.6 });
    for (const sx of [-0.12, 0.12]) add(g, T(0.133, 0.012, 6, 24), strap, sx, 0.13, 0, 0, HALF, 0);
  },
  "thermal-mat": (g, k) => {
    add(g, C(0.12, 0.12, 0.48, 20), k.m(0xced4da, { r: 0.3, mt: 0.7 }), 0, 0.12, 0, 0, 0, HALF);
    const band = k.m(0x0077b6, { r: 0.6 });
    for (const sx of [-0.15, 0.15]) add(g, C(0.123, 0.123, 0.05, 20), band, sx, 0.12, 0, 0, 0, HALF);
  },
  "hand-warmers": (g, k, n) => {
    const pack = k.m(0xfb8500, { r: 0.55 });
    const label = k.m(0xf8f9fa, { r: 0.6 });
    stackGrid(Math.min(n, 6), 3, 3, 0.15, 0, 0.018, (x, y, z) => {
      add(g, B(0.12, 0.016, 0.16), pack, x, y + 0.008, z);
      add(g, B(0.06, 0.017, 0.06), label, x, y + 0.009, z);
    });
  },
  "hot-water-bag": (g, k) => {
    const bag = add(g, new THREE.CapsuleGeometry(0.09, 0.18, 6, 14), k.m(0xc1121f, { r: 0.55 }), 0, 0.05, 0, HALF, 0, HALF);
    bag.scale.set(1, 1, 0.5);
    add(g, C(0.03, 0.035, 0.06, 12), k.m(0x212529), 0.2, 0.05, 0, 0, 0, HALF);
  },
  "gas-mask": (g, k) => {
    const rubber = k.m(0x343a40, { r: 0.65 });
    add(g, new THREE.SphereGeometry(0.14, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), rubber, 0, 0.16, 0, HALF, 0, 0);
    const lens = k.m(0x90e0ef, { r: 0.05, mt: 0.2, op: 0.7 });
    add(g, C(0.042, 0.042, 0.012, 18), lens, -0.055, 0.2, 0.11, HALF - 0.3, 0, 0);
    add(g, C(0.042, 0.042, 0.012, 18), lens, 0.055, 0.2, 0.11, HALF - 0.3, 0, 0);
    add(g, C(0.05, 0.055, 0.08, 18), k.m(0x606c38, { r: 0.5, mt: 0.3 }), 0, 0.09, 0.14, HALF, 0, 0);
    add(g, T(0.13, 0.01, 6, 24, Math.PI), k.m(0x212529), 0, 0.16, -0.02, 0, 0, 0);
  },
  "gas-mask-filter": (g, k, n) => {
    const body = k.m(0x606c38, { r: 0.45, mt: 0.35 });
    const ring = k.m(0x343a40, { r: 0.4, mt: 0.5 });
    lay(Math.min(n, 6), 3, 0.17, 0.17, (x, z) => {
      add(g, C(0.07, 0.07, 0.08, 20), body, x, 0.04, z);
      add(g, T(0.07, 0.006, 6, 24), ring, x, 0.03, z, HALF, 0, 0);
      add(g, C(0.03, 0.03, 0.025, 14), ring, x, 0.09, z);
    });
  },
  earplugs: (g, k, n) => {
    add(g, C(0.06, 0.06, 0.08, 18), k.m(0xe9f5f9, { r: 0.05, op: 0.5 }), -0.06, 0.04, 0);
    const plug = k.m(0xfb8500, { r: 0.8 });
    lay(Math.min(n * 2, 8), 4, 0.04, 0.04, (x, z) => add(g, C(0.012, 0.015, 0.03, 8), plug, x + 0.12, 0.015, z));
  },
  "protective-goggles": (g, k) => {
    const lens = k.m(0xffd166, { r: 0.05, op: 0.55 });
    const frame = k.m(0x212529, { r: 0.5 });
    add(g, C(0.05, 0.05, 0.035, 18), lens, -0.06, 0.06, 0.02, HALF, 0, 0);
    add(g, C(0.05, 0.05, 0.035, 18), lens, 0.06, 0.06, 0.02, HALF, 0, 0);
    add(g, T(0.05, 0.008, 6, 20), frame, -0.06, 0.06, 0.038);
    add(g, T(0.05, 0.008, 6, 20), frame, 0.06, 0.06, 0.038);
    add(g, T(0.13, 0.007, 6, 24, Math.PI), frame, 0, 0.06, -0.01, -HALF, 0, 0);
  },
  "rubber-gloves": (g, k) => {
    const yellow = k.m(0xffd60a, { r: 0.4 });
    for (const [sx, ry] of [[-0.08, 0.15], [0.08, -0.2]]) {
      const glove = new THREE.Group();
      add(glove, B(0.1, 0.02, 0.14), yellow, 0, 0.01, 0);
      for (let f = 0; f < 4; f++) add(glove, B(0.02, 0.018, 0.07), yellow, -0.036 + f * 0.024, 0.01, -0.1);
      add(glove, B(0.022, 0.018, 0.06), yellow, 0.065, 0.01, -0.02, 0, -0.6, 0);
      add(glove, B(0.11, 0.02, 0.1), yellow, 0, 0.01, 0.12);
      glove.position.x = sx;
      glove.rotation.y = ry;
      g.add(glove);
    }
  },
  "rubber-boots": (g, k) => {
    const black = k.m(0x1b263b, { r: 0.35 });
    const sole = k.m(0xe63946, { r: 0.6 });
    for (const sx of [-0.08, 0.08]) {
      add(g, B(0.1, 0.32, 0.12), black, sx, 0.16, -0.04);
      add(g, B(0.1, 0.08, 0.2), black, sx, 0.04, 0.03);
      add(g, B(0.105, 0.02, 0.205), sole, sx, 0.01, 0.03);
    }
  },
  "sealing-tape": (g, k, n) => {
    const tape = k.m(0xadb5bd, { r: 0.35, mt: 0.55 });
    const core = k.m(0xd4a373, { r: 0.8 });
    const tower = Math.min(n, 3);
    for (let i = 0; i < tower; i++) {
      add(g, T(0.065, 0.028, 10, 26), tape, -0.1, 0.028 + i * 0.058, 0, HALF, 0, 0);
      add(g, C(0.04, 0.04, 0.054, 18, true), k.m(0xd4a373, { r: 0.8, side: THREE.DoubleSide }), -0.1, 0.028 + i * 0.058, 0);
    }
    add(g, T(0.065, 0.028, 10, 26), tape, 0.16, 0.095, 0);
    add(g, C(0.04, 0.04, 0.054, 18, true), core, 0.16, 0.095, 0, HALF, 0, 0);
  },
  // ---------- medical & care
  "first-aid-kit": (g, k) => {
    add(g, B(0.56, 0.24, 0.44), k.m(0xf8f9fa, { r: 0.35 }), 0, 0.12, 0);
    const cross = k.m(0xe63946, { r: 0.3, e: 0x3a080c });
    add(g, B(0.24, 0.02, 0.08), cross, 0, 0.25, 0);
    add(g, B(0.08, 0.02, 0.24), cross, 0, 0.25, 0);
    add(g, B(0.2, 0.03, 0.04), k.m(0x495057), 0, 0.12, 0.235);
  },
  "otc-medicine": (g, k, n) => {
    const bottle = k.m(0xd97706, { r: 0.08, op: 0.82 });
    const cap = k.m(0xf8f9fa, { r: 0.4 });
    lay(Math.min(n, 6), 3, 0.11, 0.11, (x, z) => {
      add(g, C(0.04, 0.04, 0.1, 14), bottle, x, 0.05, z);
      add(g, C(0.043, 0.043, 0.03, 14), cap, x, 0.115, z);
    });
  },
  "prescription-preparedness": (g, k) => {
    add(g, B(0.44, 0.04, 0.12), k.m(0xf8f9fa, { r: 0.35, op: 0.85 }), 0, 0.02, 0);
    const lids = [0xe63946, 0xfb8500, 0xffd166, 0x52b788, 0x3a86ff, 0x8338ec, 0xff006e];
    lids.forEach((c, i) => add(g, B(0.055, 0.012, 0.11), k.m(c, { r: 0.4 }), -0.18 + i * 0.06, 0.046, 0));
  },
  "infant-supplies": (g, k) => {
    add(g, B(0.38, 0.26, 0.22), k.m(0xa2d2ff, { r: 0.6 }), 0, 0.13, 0);
    add(g, B(0.22, 0.14, 0.222), k.m(0xffffff, { r: 0.6 }), 0, 0.13, 0);
    add(g, C(0.035, 0.035, 0.005, 16), k.m(0xffafcc), 0, 0.14, 0.113, HALF, 0, 0);
  },
  "infant-formula": (g, k, n) => {
    const can = k.m(0xf8f9fa, { r: 0.3, mt: 0.4 });
    const lid = k.m(0xffd166, { r: 0.4 });
    lay(Math.min(n, 3), 3, 0.22, 0, (x, z) => {
      add(g, C(0.1, 0.1, 0.18, 20), can, x, 0.09, z);
      add(g, C(0.104, 0.104, 0.03, 20), lid, x, 0.195, z);
    });
  },
  "ready-to-feed-formula": (g, k, n) => {
    const bottle = k.m(0xf8f9fa, { r: 0.4 });
    const cap = k.m(0x4ea8de, { r: 0.4 });
    lay(Math.min(n, 6), 3, 0.12, 0.12, (x, z) => {
      add(g, C(0.045, 0.045, 0.14, 14), bottle, x, 0.07, z);
      add(g, C(0.03, 0.03, 0.03, 12), cap, x, 0.155, z);
    });
  },
  "infant-feeding-supplies": (g, k, n) => {
    const body = k.m(0xf1faee, { r: 0.08, op: 0.65 });
    const collar = k.m(0xffafcc, { r: 0.4 });
    const nipple = k.m(0xe9c46a, { r: 0.3, op: 0.85 });
    lay(Math.min(n, 3), 3, 0.15, 0, (x, z) => {
      add(g, C(0.055, 0.055, 0.17, 16), body, x, 0.085, z);
      add(g, C(0.06, 0.06, 0.03, 16), collar, x, 0.185, z);
      add(g, C(0.014, 0.032, 0.05, 12), nipple, x, 0.225, z);
    });
  },
  "child-id-card": (g, k) => {
    add(g, B(0.14, 0.09, 0.006), k.m(0xf8f9fa, { r: 0.4 }), 0, 0.06, 0, -0.35, 0, 0);
    add(g, B(0.04, 0.05, 0.007), k.m(0x4ea8de), -0.035, 0.065, 0.001, -0.35, 0, 0);
    add(g, T(0.08, 0.006, 6, 24), k.m(0xe63946, { r: 0.6 }), 0, 0.006, 0.08, HALF, 0, 0);
  },
  "child-comfort-kit": (g, k) => {
    const fur = k.m(0xb07d56, { r: 0.95 });
    const tan = k.m(0xe9c9a5, { r: 0.95 });
    const eye = k.m(0x14213d, { r: 0.2 });
    add(g, S(0.1), fur, 0, 0.1, 0).scale.set(1, 1.05, 0.85);
    add(g, S(0.075), fur, 0, 0.24, 0.01);
    add(g, S(0.028), fur, -0.055, 0.3, 0);
    add(g, S(0.028), fur, 0.055, 0.3, 0);
    add(g, S(0.03), tan, 0, 0.225, 0.07);
    add(g, S(0.01, 8, 6), eye, -0.025, 0.255, 0.065);
    add(g, S(0.01, 8, 6), eye, 0.025, 0.255, 0.065);
    add(g, S(0.035), fur, -0.09, 0.03, 0.06);
    add(g, S(0.035), fur, 0.09, 0.03, 0.06);
    add(g, S(0.06), tan, 0, 0.1, 0.06).scale.set(1, 1, 0.4);
  },
  "child-carrier": (g, k) => {
    const alu = k.m(0xced4da, { r: 0.2, mt: 0.9 });
    add(g, C(0.012, 0.012, 0.5, 8), alu, -0.13, 0.25, -0.06);
    add(g, C(0.012, 0.012, 0.5, 8), alu, 0.13, 0.25, -0.06);
    add(g, C(0.012, 0.012, 0.27, 8), alu, 0, 0.49, -0.06, 0, 0, HALF);
    add(g, B(0.3, 0.2, 0.16), k.m(0xd62828, { r: 0.75 }), 0, 0.26, 0.02);
    add(g, T(0.12, 0.012, 6, 20, Math.PI), alu, 0, 0.03, 0.05, -HALF, 0, 0);
  },
  // ---------- documents, security, mobility
  backpack: (g, k) => {
    const body = add(g, new THREE.CapsuleGeometry(0.15, 0.2, 6, 16), k.m(0xe76f51, { r: 0.8 }), 0, 0.25, 0);
    body.scale.set(1.15, 1, 0.62);
    add(g, B(0.24, 0.14, 0.06), k.m(0xc2522f, { r: 0.8 }), 0, 0.17, 0.1);
    add(g, B(0.24, 0.012, 0.062), k.m(0x212529), 0, 0.235, 0.1);
    add(g, T(0.05, 0.012, 6, 16, Math.PI), k.m(0x212529), 0, 0.49, 0);
    const strap = k.m(0x343a40, { r: 0.7 });
    add(g, B(0.04, 0.3, 0.02), strap, -0.08, 0.26, -0.1);
    add(g, B(0.04, 0.3, 0.02), strap, 0.08, 0.26, -0.1);
  },
  "storage-bin": (g, k) => {
    add(g, B(0.56, 0.3, 0.4), k.m(0xe9f5f9, { r: 0.1, op: 0.42 }), 0, 0.15, 0);
    add(g, B(0.58, 0.03, 0.42), k.m(0x0077b6, { r: 0.4 }), 0, 0.315, 0);
    add(g, B(0.2, 0.14, 0.16), k.m(0xe63946, { r: 0.6 }), -0.14, 0.07, 0);
    add(g, B(0.16, 0.1, 0.2), k.m(0x52b788, { r: 0.6 }), 0.12, 0.05, 0.04);
  },
  "emergency-contact-card": (g, k) => {
    add(g, B(0.17, 0.11, 0.006), k.m(0xfff3b0, { r: 0.3 }), 0, 0.07, 0, -0.3, 0, 0);
    for (let l = 0; l < 3; l++) add(g, B(0.12, 0.008, 0.007), k.m(0x495057), 0, 0.09 - l * 0.022, 0.003 + l * 0.007, -0.3, 0, 0);
    add(g, B(0.12, 0.015, 0.06), k.m(0x343a40), 0, 0.008, -0.03);
  },
  "basic-documents": (g, k) => {
    add(g, B(0.34, 0.04, 0.25), k.m(0x3b82f6, { r: 0.5 }), 0, 0.02, 0);
    add(g, B(0.3, 0.02, 0.22), k.m(0xffffff, { r: 0.8 }), 0.02, 0.05, -0.01, 0, 0.06, 0);
    add(g, B(0.34, 0.012, 0.02), k.m(0x212529), 0, 0.045, 0.12);
  },
  "family-photo": (g, k) => {
    const frame = new THREE.Group();
    add(frame, B(0.22, 0.28, 0.025), k.m(0x8d5524, { r: 0.6 }), 0, 0, 0);
    add(frame, B(0.17, 0.22, 0.026), k.m(0xffffff, { r: 0.6, map: familyPhotoTexture() }), 0, 0, 0.001);
    frame.position.set(0, 0.14, 0);
    frame.rotation.x = -0.18;
    g.add(frame);
    add(g, B(0.02, 0.2, 0.02), k.m(0x8d5524), 0, 0.1, -0.08, 0.5, 0, 0);
  },
  "door-window-locks": (g, k, n) => padlocks(g, k, Math.min(n, 3)),
  "lock-tools": (g, k) => {
    const steel = k.m(0xadb5bd, { r: 0.25, mt: 0.9 });
    add(g, B(0.26, 0.02, 0.03), steel, -0.02, 0.012, -0.06, 0, 0.2, 0);
    add(g, T(0.03, 0.012, 6, 16, Math.PI * 1.4), steel, 0.12, 0.012, -0.09, HALF, 0, 0);
    add(g, C(0.022, 0.022, 0.1, 12), k.m(0xd62828, { r: 0.5 }), -0.1, 0.022, 0.06, 0, 0, HALF);
    add(g, C(0.006, 0.006, 0.14, 6), steel, 0.02, 0.022, 0.06, 0, 0, HALF);
    padlocks(g, k, 1, 0.14);
  },
  "transport-cart": (g, k) => {
    add(g, B(0.56, 0.16, 0.36), k.m(0x2a9d8f, { r: 0.55 }), 0, 0.15, 0);
    const wheel = k.m(0x212529, { r: 0.7 });
    for (const wx of [-0.2, 0.2]) for (const wz of [-0.17, 0.17]) add(g, C(0.055, 0.055, 0.03, 16), wheel, wx, 0.055, wz, HALF, 0, 0);
    add(g, C(0.01, 0.01, 0.34, 8), k.m(0x495057, { mt: 0.8 }), 0.4, 0.22, 0, 0, 0, 0.9);
    add(g, C(0.02, 0.02, 0.1, 10), k.m(0x212529), 0.53, 0.33, 0, HALF, 0, 0);
  },
  "emergency-payment-check": (g, k) => {
    add(g, B(0.17, 0.006, 0.11), k.m(0x495057, { r: 0.3, mt: 0.5 }), 0.03, 0.003, 0.02, 0, 0.3, 0);
    add(g, B(0.17, 0.006, 0.11), k.m(0xffd166, { r: 0.25, mt: 0.6 }), 0, 0.01, 0);
    add(g, B(0.03, 0.002, 0.025), k.m(0xd4a373, { mt: 0.9, r: 0.2 }), -0.045, 0.014, -0.01);
  },
  "cash-krw": (g, k, n) => cashBundles(g, k, n, 0xf4a261, 0xffffff),
  "cash-usd": (g, k, n) => cashBundles(g, k, n, 0x74a57f, 0xc9a227),
  "crypto-cold-wallet": (g, k, n, ctx) => {
    add(g, B(0.13, 0.02, 0.045), k.m(0x212529, { r: 0.3, mt: 0.6 }), -0.1, 0.01, 0);
    add(g, B(0.06, 0.004, 0.03), ctx.ready ? k.glow(0x80ffdb) : k.m(0x1b4332), -0.12, 0.022, 0);
    add(g, C(0.055, 0.055, 0.012, 24), k.m(0xf7931a, { r: 0.25, mt: 0.85 }), 0.12, 0.06, 0, HALF - 0.25, 0, 0);
    add(g, B(0.13, 0.005, 0.08), k.m(0xced4da, { r: 0.2, mt: 0.95 }), 0.0, 0.003, 0.1);
  },
};

function batteryTray(g, k, cells, color, r, h) {
  add(g, B(0.46, 0.025, 0.24), k.m(0x212529, { r: 0.6 }), 0, 0.012, 0);
  const body = k.m(color, { r: 0.35, mt: 0.4 });
  const top = k.m(0xc77d2f, { r: 0.3, mt: 0.75 });
  const nub = k.m(0xdee2e6, { r: 0.2, mt: 0.95 });
  lay(Math.min(cells, 12), 6, r * 2 + 0.02, r * 2 + 0.03, (x, z) => {
    add(g, C(r, r, h, 12), body, x, 0.025 + h / 2, z);
    add(g, C(r * 1.02, r * 1.02, h * 0.25, 12), top, x, 0.025 + h * 0.86, z);
    add(g, C(r * 0.35, r * 0.35, 0.01, 8), nub, x, 0.03 + h, z);
  });
}

function padlocks(g, k, n, offsetX = 0) {
  const brass = k.m(0xd4a373, { r: 0.25, mt: 0.85 });
  const steel = k.m(0xdee2e6, { r: 0.2, mt: 0.95 });
  lay(n, 3, 0.15, 0, (x, z) => {
    add(g, B(0.1, 0.09, 0.04), brass, x + offsetX, 0.045, z);
    add(g, T(0.033, 0.009, 8, 16, Math.PI), steel, x + offsetX, 0.09, z);
    add(g, C(0.009, 0.009, 0.005, 8), k.m(0x212529), x + offsetX, 0.05, z + 0.021, HALF, 0, 0);
  });
}

function cashBundles(g, k, n, noteColor, bandColor) {
  const note = k.m(noteColor, { r: 0.85 });
  const band = k.m(bandColor, { r: 0.6 });
  stackGrid(Math.min(n, 6), 2, 2, 0.32, 0, 0.052, (x, y, z, i) => {
    const ry = (i % 3 - 1) * 0.06;
    add(g, B(0.3, 0.05, 0.14), note, x, y + 0.025, z, 0, ry, 0);
    add(g, B(0.05, 0.052, 0.142), band, x, y + 0.025, z, 0, ry, 0);
  });
}

function defaultCrates(g, k, ratio, ready) {
  const crate = k.m(ready ? 0x38b000 : ratio > 0 ? 0x4895ef : 0xadb5bd, { r: 0.45, mt: 0.25 });
  const band = k.m(0xf8f9fa, { r: 0.5 });
  const h = 0.16;
  const layers = Math.max(1, Math.min(3, Math.ceil(ratio * 3)));
  for (let l = 0; l < layers; l++) {
    const y = h / 2 + l * (h + 0.02);
    add(g, B(0.58 - l * 0.04, h, 0.52 - l * 0.04), crate, 0, y, 0);
    add(g, B(0.6 - l * 0.04, 0.03, 0.12), band, 0, y, 0);
  }
}

export function buildItemMesh(item, ratio, toneColor, isReady, kit = new MaterialKit(), ctx = { flames: [], blinkers: [] }) {
  const group = new THREE.Group();
  const count = ratio <= 0 ? 0 : Math.max(1, Math.min(6, Math.ceil(ratio * 5)));

  if (count === 0) {
    // Empty hologram slot outline.
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.62, 0.42, 0.62));
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: toneColor, transparent: true, opacity: 0.7 }));
    line.position.y = 0.22;
    group.add(line);
    return group;
  }

  const shape = SHAPES[item.id];
  if (shape) shape(group, kit, count, { ...ctx, ratio, ready: isReady, tone: toneColor, flames: ctx.flames, blinkers: ctx.blinkers });
  else defaultCrates(group, kit, ratio, isReady);
  return group;
}

/** Item ids that have a dedicated 3D shape (used by tests). */
export const SHAPED_ITEM_IDS = Object.keys(SHAPES);

// ---------------------------------------------------------------- engine

function disposeTree(root) {
  const mats = new Set();
  root.traverse((obj) => {
    obj.geometry?.dispose?.();
    const m = obj.material;
    if (Array.isArray(m)) m.forEach((x) => mats.add(x));
    else if (m) mats.add(m);
  });
  for (const m of mats) {
    // Shared module textures are reused across rebuilds; only free per-build ones.
    if (m.map && !Object.values(sharedTextures).includes(m.map)) m.map.dispose();
    m.dispose();
  }
}

export class KrWarehouseThreeEngine {
  constructor(canvas, tooltipEl, getSnapshot, getFilter, onSelectItem, getTheme, getEnvironment) {
    this.canvas = canvas;
    this.tooltip = tooltipEl;
    this.getSnapshot = getSnapshot;
    this.getFilter = getFilter;
    this.onSelectItem = onSelectItem;
    this.getTheme = getTheme;
    this.getEnvironment = getEnvironment;
    this.onEnvChange = null;

    this.yaw = -0.62;
    this.pitch = 0.48;
    this.distance = 8.4;
    // User preference (the "자동 회전" button). Touching the view only pauses it for a moment.
    this.autoRotate = true;
    this.pauseUntil = 0;
    this.zone = "essentials";
    this.optCategory = "all";
    this.onlyActive = false;
    this.timeMode = "auto";
    this.weatherMode = "auto";
    this.dragging = false;
    this.dragMoved = false;
    this.lastX = 0;
    this.lastY = 0;
    this.hoveredSlot = null;
    this.slotGroups = [];
    this.flames = [];
    this.blinkers = [];
    this.lamps = { beams: [], pools: [], bulbs: [], spots: [] };
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-9, -9);
    this.reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

    this._cur = { hemi: 0.9, dir: 1.55, spot: 4, beam: 0.05, stars: 0, moon: 0, snow: 0, wet: 0 };
    this._bg = new THREE.Color(0x07131e);
    this._bgShown = new THREE.Color(0x07131e);
    this._flashColor = new THREE.Color(0xdde8ff);
    this._dirColor = new THREE.Color(0xffffff);
    this._deckBase = new THREE.Color(0x4f6b7d);
    this._deckSnow = new THREE.Color(0xe9f1f5);
    this._flash = 0;
    this._envKey = "";
    this._envReady = false;

    this._initScene();
    this.rebuild();
    this._bindEvents();
    this._startLoop();
  }

  _initScene() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(300, rect.width || 800);
    const h = Math.max(360, rect.height || 500);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = this._bgShown;
    this.scene.fog = new THREE.Fog(0x07131e, 30, 70);
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 90);

    this.hemiLight = new THREE.HemisphereLight(0xb8e6f5, 0x102230, 0.9);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.55);
    this.dirLight.position.set(6, 11, 7);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 40;
    this.dirLight.shadow.bias = -0.0006;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.accentLight = new THREE.PointLight(0x4cc9f0, 1.4, 18);
    this.accentLight.position.set(-4, 4, -3);
    this.scene.add(this.accentLight);

    this.floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 44),
      new THREE.MeshStandardMaterial({ color: 0x0b1926, roughness: 0.75, metalness: 0.2, map: concreteTexture() }),
    );
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    const grid = new THREE.GridHelper(40, 40, 0x3c8dad, 0x193b4d);
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    grid.position.y = 0.004;
    this.scene.add(grid);

    this._buildSky();

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.weatherGroup = new THREE.Group();
    this.scene.add(this.weatherGroup);
  }

  _buildSky() {
    // Star field (night, clear sky only).
    const count = 700;
    const pos = new Float32Array(count * 3);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(0.15 + rand() * 0.85);
      const r = 40;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, map: flakeTexture(), transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.stars = new THREE.Points(geo, this.starMat);
    this.scene.add(this.stars);

    this.moonMat = new THREE.MeshBasicMaterial({ color: 0xf1f5ff, transparent: true, opacity: 0, fog: false });
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), this.moonMat);
    this.moon.position.set(-18, 20, -26);
    this.scene.add(this.moon);
  }

  rebuild() {
    for (const child of [...this.worldGroup.children]) {
      this.worldGroup.remove(child);
      disposeTree(child);
    }
    this.slotGroups = [];
    this.hoveredSlot = null;
    if (this.tooltip) this.tooltip.hidden = true;
    this.flames = [];
    this.blinkers = [];
    this.lamps = { beams: [], pools: [], bulbs: [], spots: [] };
    const snapshot = this.getSnapshot();
    if (!snapshot) return;

    const filter = this.getFilter();
    const readyIds = new Set(snapshot.catalog.filter((item) => {
      const r = snapshot.items[item.id];
      const s = snapshot.summary?.items?.[item.id];
      return Boolean(r?.applicable && s?.state === "sufficient" && s?.confirmed && s?.verified_on && s?.stale === false && s?.target > 0 && s?.usable >= s?.target && !(s?.expiring_quantity > 0) && !(s?.expired_quantity > 0) && !(s?.unknown_date_quantity > 0));
    }).map((i) => i.id));

    const essentials = snapshot.catalog.filter((i) => !["household", "optional"].includes(i.tier));
    let allOptional = snapshot.catalog.filter((i) => ["household", "optional"].includes(i.tier));
    if (this.onlyActive) allOptional = allOptional.filter((i) => snapshot.items[i.id]?.applicable);
    if (this.optCategory === "custom") {
      allOptional = allOptional.filter((i) => i.custom === true);
    } else if (this.optCategory !== "all" && OPT_CAT_MAP[this.optCategory]) {
      allOptional = allOptional.filter((i) => OPT_CAT_MAP[this.optCategory].has(i.id));
    }
    const itemsToShow = this.zone === "optional" ? allOptional : essentials;

    const cols = itemsToShow.length > 35 ? 8 : 6;
    const rows = Math.max(1, Math.ceil(itemsToShow.length / cols));
    const rackW = cols * SLOT_PITCH_X + 0.5;
    const rowZ = (r) => (r - (rows - 1) / 2) * ROW_PITCH_Z;
    const frontZ = rowZ(rows - 1) + RACK_DEPTH / 2;
    const backZ = rowZ(0) - RACK_DEPTH / 2;
    this._bounds = { w: rackW, frontZ, backZ };
    this._targetCamDist = rows > 5 ? 13.5 : rows > 3 ? 10.5 : 8.4;
    if (!this._userZoomed) this.distance = this._targetCamDist;

    const shadowSpan = Math.max(rackW, frontZ - backZ) / 2 + 2;
    Object.assign(this.dirLight.shadow.camera, { left: -shadowSpan, right: shadowSpan, top: shadowSpan, bottom: -shadowSpan });
    this.dirLight.shadow.camera.updateProjectionMatrix();

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x3b5b6e, roughness: 0.35, metalness: 0.78 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x1a3547, roughness: 0.55, metalness: 0.4 });
    this.topDeckMat = new THREE.MeshStandardMaterial({ color: 0x4f6b7d, roughness: 0.4, metalness: 0.7 });
    const beamOrange = new THREE.MeshStandardMaterial({ color: 0xe76f51, roughness: 0.45, metalness: 0.6 });
    const zoneTitle = this.zone === "optional" ? "선택 물품 랙" : "기본 비축 랙";
    const zoneShort = this.zone === "optional" ? "선택" : "기본";

    for (let r = 0; r < rows; r++) {
      const z = rowZ(r);
      const deck = add(this.worldGroup, B(rackW, 0.1, RACK_DEPTH), deckMat, 0, 0.32, z);
      deck.castShadow = true;
      // Open wire decking on the top level so items stay visible from above.
      const bars = Math.round(rackW / 0.3);
      for (let b = 0; b <= bars; b++) {
        add(this.worldGroup, B(0.025, 0.025, RACK_DEPTH - 0.06), this.topDeckMat, -rackW / 2 + (b * rackW) / bars, 1.535, z).castShadow = false;
      }
      add(this.worldGroup, B(rackW, 0.02, 0.02), this.topDeckMat, 0, 1.55, z).castShadow = false;
      // Orange load beams on the front/back of each level, like pallet racking.
      for (const y of [0.25, 1.49]) {
        add(this.worldGroup, B(rackW, 0.06, 0.05), beamOrange, 0, y, z + RACK_DEPTH / 2 - 0.02);
        add(this.worldGroup, B(rackW, 0.06, 0.05), beamOrange, 0, y, z - RACK_DEPTH / 2 + 0.02);
      }
      for (const px of [-rackW / 2 + 0.08, rackW / 2 - 0.08]) {
        for (const pz of [z - RACK_DEPTH / 2 + 0.08, z + RACK_DEPTH / 2 - 0.08]) {
          add(this.worldGroup, B(0.09, 1.65, 0.09), metalMat, px, 0.825, pz);
        }
        // Diagonal bracing on the rack ends.
        add(this.worldGroup, B(0.03, 1.5, 0.03), metalMat, px, 0.85, z, 0.72, 0, 0);
      }
      // End-cap row signs on both rack ends.
      const first = r * cols + 1;
      const last = Math.min(itemsToShow.length, (r + 1) * cols);
      const tex = makePlateTexture(`${ROW_LETTERS[r % ROW_LETTERS.length]}열`, `${zoneShort} · ${String(first).padStart(2, "0")}–${String(last).padStart(2, "0")}번`, "#52f2a8");
      for (const side of [-1, 1]) {
        const sign = makeSign(tex, 0.86, 0.27);
        sign.position.set(side * (rackW / 2 + 0.03), 1.25, z);
        sign.rotation.y = side * HALF;
        this.worldGroup.add(sign);
      }
    }

    this._buildCeiling(rows, rowZ, rackW);
    this._buildFloorMarks(rows, rowZ, rackW, frontZ, backZ);

    // Hanging zone signboard behind the last rack so it never hides items from the default view.
    const counts = itemsToShow.reduce((acc, item) => {
      const s = snapshot.summary.items[item.id];
      if (readyIds.has(item.id)) acc.ready++;
      else if (s?.state === "shortage" || s?.expired_quantity > 0) acc.short++;
      return acc;
    }, { ready: 0, short: 0 });
    const boardTex = makePlateTexture(`${zoneTitle} · ${itemsToShow.length}종`, `완비 ${counts.ready} · 부족 ${counts.short} · 클릭해서 수정`, "#ffd166", 768, 160);
    const board = makeSign(boardTex, 2.9, 0.6);
    const boardZ = backZ - 0.45;
    board.position.set(0, 2.5, boardZ);
    this.worldGroup.add(board);
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x6c757d, metalness: 0.8, roughness: 0.3 });
    for (const cx of [-1.3, 1.3]) add(this.worldGroup, C(0.008, 0.008, CEILING_Y - 2.8, 6), cordMat, cx, (CEILING_Y + 2.8) / 2, boardZ);

    const kit = new MaterialKit();
    itemsToShow.forEach((item, idx) => {
      const r = Math.floor(idx / cols);
      const col = idx % cols;
      const xPos = (col - (cols - 1) / 2) * SLOT_PITCH_X;
      const zPos = rowZ(r);
      const status = snapshot.summary.items[item.id];
      const matchesFilter = filter === "all" || (filter === "expiring" ? status.expiring_quantity > 0 : status.state === filter);
      const ready = readyIds.has(item.id);
      const ratio = status.target > 0 ? Math.min(1, (status.usable || 0) / status.target) : (ready ? 1 : 0);
      const bad = status.state === "shortage" || status.expired_quantity > 0;
      const toneHex = ready ? "#52f2a8" : bad ? "#ff7b7b" : "#ffd166";
      const toneNum = ready ? 0x52f2a8 : bad ? 0xff7b7b : 0xffd166;

      const slot = new THREE.Group();
      slot.position.set(xPos, 0.37, zPos);
      if (!matchesFilter) slot.scale.setScalar(0.72);

      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.035, 0.05),
        new THREE.MeshStandardMaterial({ color: toneNum, emissive: toneNum, emissiveIntensity: matchesFilter ? 0.9 : 0.15 }),
      );
      led.position.set(0, -0.02, RACK_DEPTH / 2 - 0.02);
      slot.add(led);

      const ctx = { flames: this.flames, blinkers: this.blinkers };
      slot.add(buildItemMesh(item, ratio, toneNum, ready, kit, ctx));

      const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.82, 0.84), new THREE.MeshBasicMaterial({ visible: false }));
      hitMesh.position.y = 0.41;
      slot.add(hitMesh);

      const shortName = SHORT_NAMES[item.id] || item.name;
      const sprite = makeLabelSprite(shortName, toneHex);
      sprite.position.set(0, 0.92, 0);
      slot.add(sprite);

      const unit = item.id === "drinking-water" ? "L" : item.unit;
      const scale = item.id === "drinking-water" ? 1000 : 1;
      const qtyText = `${((status.usable ?? 0) + (status.unknown_date_quantity ?? 0)) / scale} ${unit} / ${status.target == null ? "미설정" : `${status.target / scale} ${unit}`}`;
      const statusLabel = ready ? "완비" : status.state === "shortage" ? "부족" : status.expiring_quantity > 0 ? "기한 임박" : "실사 필요";
      const slotNo = `${ROW_LETTERS[r % ROW_LETTERS.length]}-${String(col + 1).padStart(2, "0")}`;

      const places = [...new Set((snapshot.items[item.id]?.lots || []).map((lot) => String(lot.location || "").trim()).filter(Boolean))];
      slot.userData = { item, name: shortName, slotNo, qtyText, statusLabel, places, baseY: 0.37, hitMesh };
      hitMesh.userData = { slot };
      this.worldGroup.add(slot);
      this.slotGroups.push(slot);
    });

    this._buildWeather();
    this._envKey = "";
  }

  _buildCeiling(rows, rowZ, rackW) {
    const steel = new THREE.MeshStandardMaterial({ color: 0x4a6272, roughness: 0.4, metalness: 0.8 });
    const shade = new THREE.MeshStandardMaterial({ color: 0x7d9aa6, roughness: 0.35, metalness: 0.75, side: THREE.DoubleSide });
    const cord = new THREE.MeshStandardMaterial({ color: 0x212529, roughness: 0.8 });
    const spanX = rackW + 1.2;
    const z0 = rowZ(0) - RACK_DEPTH / 2 - 0.6;
    const z1 = rowZ(rows - 1) + RACK_DEPTH / 2 + 1.6;

    // Truss: two longitudinal girders plus one cross beam per aisle.
    for (const gx of [-spanX / 2, spanX / 2]) {
      add(this.worldGroup, B(0.06, 0.06, z1 - z0), steel, gx, CEILING_Y, (z0 + z1) / 2).castShadow = false;
    }
    const aisles = [];
    for (let r = 0; r < rows; r++) aisles.push(rowZ(r) + RACK_DEPTH / 2 + (ROW_PITCH_Z - RACK_DEPTH) / 2);
    // Thin catenary cables (not heavy beams) so the overhead view of the racks stays clear.
    for (const az of aisles) {
      add(this.worldGroup, C(0.008, 0.008, spanX, 6), cord, 0, CEILING_Y, az, 0, 0, HALF).castShadow = false;
    }

    const lampsPerAisle = rackW > 7 ? 3 : 2;
    const spotEvery = Math.max(1, Math.ceil(aisles.length / MAX_SPOTS));
    aisles.forEach((az, ai) => {
      for (let j = 0; j < lampsPerAisle; j++) {
        const lx = (j - (lampsPerAisle - 1) / 2) * (rackW / lampsPerAisle);
        add(this.worldGroup, C(0.006, 0.006, CEILING_Y - LAMP_Y, 4), cord, lx, (CEILING_Y + LAMP_Y) / 2, az).castShadow = false;
        add(this.worldGroup, C(0.035, 0.15, 0.09, 20, true), shade, lx, LAMP_Y, az).castShadow = false;

        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff1c1 });
        const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), bulbMat);
        bulb.rotation.x = HALF;
        bulb.position.set(lx, LAMP_Y - 0.044, az);
        this.worldGroup.add(bulb);
        this.lamps.bulbs.push(bulbMat);

        const beamH = LAMP_Y - 0.1;
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe6a8, map: beamTexture(), transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.95, beamH, 28, 1, true), beamMat);
        beam.position.set(lx, LAMP_Y - 0.07 - beamH / 2, az);
        this.worldGroup.add(beam);
        this.lamps.beams.push(beamMat);

        const poolMat = new THREE.MeshBasicMaterial({ color: 0xffe6a8, map: poolTexture(), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
        const pool = new THREE.Mesh(new THREE.CircleGeometry(0.95, 28), poolMat);
        pool.rotation.x = -HALF;
        pool.position.set(lx, 0.012, az);
        this.worldGroup.add(pool);
        this.lamps.pools.push(poolMat);
      }
      if (ai % spotEvery === 0) {
        const spot = new THREE.SpotLight(0xffe2a8, 4, 9, 0.95, 0.65, 1.6);
        spot.position.set(0, LAMP_Y, az);
        spot.target.position.set(0, 0.5, az - 0.55);
        this.worldGroup.add(spot, spot.target);
        this.lamps.spots.push(spot);
      }
    });
  }

  _buildFloorMarks(rows, rowZ, rackW, frontZ, backZ) {
    const yellow = new THREE.MeshBasicMaterial({ color: 0xffc300, transparent: true, opacity: 0.85 });
    const strip = (w, d, x, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), yellow);
      m.rotation.x = -HALF;
      m.position.set(x, 0.008, z);
      this.worldGroup.add(m);
    };
    // Keep-clear line along each rack face.
    for (let r = 0; r < rows; r++) {
      strip(rackW + 0.4, 0.05, 0, rowZ(r) + RACK_DEPTH / 2 + 0.14);
      strip(rackW + 0.4, 0.05, 0, rowZ(r) - RACK_DEPTH / 2 - 0.14);
    }
    // Zone outline.
    const x0 = rackW / 2 + 0.7;
    const zA = backZ - 0.7;
    const zB = frontZ + 1.7;
    strip(x0 * 2, 0.09, 0, zA);
    strip(x0 * 2, 0.09, 0, zB);
    strip(0.09, zB - zA, -x0, (zA + zB) / 2);
    strip(0.09, zB - zA, x0, (zA + zB) / 2);
    // Hazard chevrons at the front entrance.
    const hazard = new THREE.MeshBasicMaterial({ color: 0xffc300, transparent: true, opacity: 0.7 });
    for (let i = -3; i <= 3; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.42), hazard);
      m.rotation.set(-HALF, 0, 0.6);
      m.position.set(i * 0.34, 0.009, zB + 0.35);
      this.worldGroup.add(m);
    }
  }

  _buildWeather() {
    for (const child of [...this.weatherGroup.children]) {
      this.weatherGroup.remove(child);
      disposeTree(child);
    }
    const b = this._bounds || { w: 8, frontZ: 3, backZ: -3 };
    const W = b.w + 10;
    const D = (b.frontZ - b.backZ) + 10;
    const H = 7.5;
    const cz = (b.frontZ + b.backZ) / 2;
    this._weatherBox = { W, D, H, cz };
    let seed = 99;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    const RAIN = 2400;
    const rainPos = new Float32Array(RAIN * 6);
    this._rainSpeed = new Float32Array(RAIN);
    for (let i = 0; i < RAIN; i++) {
      const x = (rand() - 0.5) * W;
      const y = rand() * H;
      const z = cz + (rand() - 0.5) * D;
      rainPos.set([x, y, z, x + 0.04, y + 0.28, z], i * 6);
      this._rainSpeed[i] = 7 + rand() * 4;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    this.rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xaecbe0, transparent: true, opacity: 0.55, depthWrite: false }));
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.weatherGroup.add(this.rain);

    const SNOW = 1100;
    const snowPos = new Float32Array(SNOW * 3);
    this._snowPhase = new Float32Array(SNOW);
    this._snowSpeed = new Float32Array(SNOW);
    for (let i = 0; i < SNOW; i++) {
      snowPos.set([(rand() - 0.5) * W, rand() * H, cz + (rand() - 0.5) * D], i * 3);
      this._snowPhase[i] = rand() * Math.PI * 2;
      this._snowSpeed[i] = 0.35 + rand() * 0.45;
    }
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
    this.snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.085, map: flakeTexture(), transparent: true, opacity: 0.92, depthWrite: false }));
    this.snow.frustumCulled = false;
    this.snow.visible = false;
    this.weatherGroup.add(this.snow);
  }

  _resolveEnv() {
    const ext = this.getEnvironment?.() || {};
    let night;
    if (this.timeMode === "day") night = false;
    else if (this.timeMode === "night") night = true;
    else if (ext.sun) night = ext.sun === "below_horizon" || ext.weather === "clear-night";
    else {
      const hour = new Date().getHours();
      night = hour < 6 || hour >= 19;
    }
    const weather = this.weatherMode === "auto" ? mapHaWeather(ext.weather) : this.weatherMode;
    const synced = this.timeMode === "auto" || this.weatherMode === "auto";
    const source = synced ? (ext.sun || ext.weather ? "HA 연동" : "시계 기준") : "수동";
    return { night, weather, source };
  }

  _envTargets(env, theme) {
    const light = theme === "white" || theme === "ivory";
    const wet = env.weather === "rain" || env.weather === "storm";
    const bgHex = env.night
      ? (light ? (wet ? 0x263340 : 0x2b3a4a) : (wet ? 0x050b12 : 0x03080f))
      : light
        ? (wet ? 0xa9b6c0 : env.weather === "snow" ? 0xe9eef2 : theme === "ivory" ? 0xe8dec8 : 0xdbe6ec)
        : (wet ? 0x1c2b36 : env.weather === "snow" ? 0x34495a : 0x1f4a66);
    return {
      bg: bgHex,
      hemi: env.night ? (light ? 0.55 : 0.32) : (light ? 1.35 : 1.25) * (wet ? 0.75 : 1),
      dir: env.night ? 0.22 : wet ? 0.7 : env.weather === "snow" ? 1.1 : 1.8,
      dirColor: env.night ? 0x9db4ff : 0xffffff,
      spot: env.night ? 26 : wet ? 10 : 4,
      beam: env.night ? 0.17 : wet ? 0.09 : 0.04,
      stars: env.night && env.weather === "clear" ? 0.9 : 0,
      moon: env.night && env.weather === "clear" ? 1 : 0,
      snow: env.weather === "snow" ? 1 : 0,
      wet: wet ? 1 : 0,
      fogNear: wet ? 11 : env.weather === "snow" ? 9 : 30,
      fogFar: wet ? 30 : env.weather === "snow" ? 26 : 70,
    };
  }

  _applyEnvironment(dt, t) {
    const env = this._resolveEnv();
    const key = `${env.night}|${env.weather}|${env.source}`;
    if (key !== this._envKey) {
      this._envKey = key;
      if (this.rain) {
        this.rain.visible = env.weather === "rain" || env.weather === "storm";
        this.rain.geometry.setDrawRange(0, (env.weather === "storm" ? 2400 : 1400) * 2);
      }
      if (this.snow) this.snow.visible = env.weather === "snow";
      const label = `${env.night ? "🌙 밤" : "☀️ 낮"} · ${WEATHER_LABEL[env.weather]} · ${env.source}`;
      this.envLabel = label;
      this.onEnvChange?.(label, env);
    }

    const tg = this._envTargets(env, this.getTheme());
    const a = this._envReady ? Math.min(1, dt * 2.2) : 1;
    this._envReady = true;
    const c = this._cur;
    for (const k of ["hemi", "dir", "spot", "beam", "stars", "moon", "snow", "wet"]) c[k] += (tg[k] - c[k]) * a;
    this._bg.lerp(new THREE.Color(tg.bg), a);
    this._dirColor.lerp(new THREE.Color(tg.dirColor), a);

    // Lightning: random double flash during storms.
    if (env.weather === "storm" && !this.reducedMotion) {
      if (Math.random() < dt * 0.22) { this._flash = 1; this._flash2At = t + 0.14; }
      if (this._flash2At && t >= this._flash2At) { this._flash = Math.max(this._flash, 0.8); this._flash2At = 0; }
    }
    this._flash *= Math.pow(0.02, dt);
    const f = this._flash > 0.01 ? this._flash : 0;

    this._bgShown.copy(this._bg).lerp(this._flashColor, f * 0.55);
    this.scene.fog.color.copy(this._bgShown);
    this.scene.fog.near += (tg.fogNear - this.scene.fog.near) * a;
    this.scene.fog.far += (tg.fogFar - this.scene.fog.far) * a;
    this.hemiLight.intensity = c.hemi + f * 2.4;
    this.dirLight.intensity = c.dir;
    this.dirLight.color.copy(this._dirColor);
    this.accentLight.intensity = env.night ? 2.2 : 1.4;
    this.starMat.opacity = c.stars;
    this.moonMat.opacity = c.moon;
    this.stars.visible = c.stars > 0.02;
    this.moon.visible = c.moon > 0.02;

    for (const s of this.lamps.spots) s.intensity = c.spot;
    for (const m of this.lamps.beams) m.opacity = c.beam;
    for (const m of this.lamps.pools) m.opacity = c.beam * 1.6;
    const bulbHeat = Math.min(1, 0.55 + c.beam * 3);
    for (const m of this.lamps.bulbs) m.color.setRGB(1, 0.93 * bulbHeat + 0.05, 0.72 * bulbHeat + 0.1);

    // Snow settles on the top decks; rain makes the floor glossy.
    this.topDeckMat?.color.lerpColors(this._deckBase, this._deckSnow, c.snow);
    this.floorMesh.material.roughness = 0.75 - 0.5 * c.wet;
    this.floorMesh.material.metalness = 0.2 + 0.35 * c.wet;
  }

  _animateWeather(dt, t) {
    if (this.reducedMotion || !this._weatherBox) return;
    const { W, D, H, cz } = this._weatherBox;
    if (this.rain?.visible) {
      const pos = this.rain.geometry.attributes.position.array;
      const n = this.rain.geometry.drawRange.count / 2;
      const len = this._envKey.includes("storm") ? 0.42 : 0.28;
      for (let i = 0; i < n; i++) {
        const o = i * 6;
        let y = pos[o + 1] - this._rainSpeed[i] * dt;
        let x = pos[o] + dt * 0.9;
        let z = pos[o + 2];
        if (y < 0) {
          y = H + Math.random() * 1.5;
          x = (Math.random() - 0.5) * W;
          z = cz + (Math.random() - 0.5) * D;
        }
        pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
        pos[o + 3] = x + 0.05; pos[o + 4] = y + len; pos[o + 5] = z;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
    if (this.snow?.visible) {
      const pos = this.snow.geometry.attributes.position.array;
      for (let i = 0; i < this._snowSpeed.length; i++) {
        const o = i * 3;
        pos[o + 1] -= this._snowSpeed[i] * dt;
        pos[o] += Math.sin(t * 0.9 + this._snowPhase[i]) * dt * 0.25;
        pos[o + 2] += Math.cos(t * 0.7 + this._snowPhase[i]) * dt * 0.18;
        if (pos[o + 1] < 0) {
          pos[o + 1] = H;
          pos[o] = (Math.random() - 0.5) * W;
          pos[o + 2] = cz + (Math.random() - 0.5) * D;
        }
      }
      this.snow.geometry.attributes.position.needsUpdate = true;
    }
  }

  _bindEvents() {
    this._onPointerDown = (e) => {
      this.dragging = true;
      this.dragMoved = false;
      this.pauseUntil = Infinity;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.setPointerCapture?.(e.pointerId);
    };
    this._onPointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (this.dragging) {
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.dragMoved = true;
        this.yaw -= dx * 0.008;
        this.pitch = Math.max(0.18, Math.min(1.22, this.pitch + dy * 0.007));
        this.lastX = e.clientX;
        this.lastY = e.clientY;
      } else {
        this._raycast(e.clientX - rect.left, e.clientY - rect.top);
      }
    };
    this._onPointerUp = (e) => {
      if (this.dragging && !this.dragMoved) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this._raycast(e.clientX - rect.left, e.clientY - rect.top);
        if (this.hoveredSlot) this.onSelectItem(this.hoveredSlot.userData.item);
      }
      this.dragging = false;
      this._resumeSoon();
    };
    this._onPointerLeave = () => {
      if (this.dragging) this._resumeSoon();
      this.dragging = false;
      this.hoveredSlot = null;
      if (this.tooltip) this.tooltip.hidden = true;
    };
    this._onWheel = (e) => {
      e.preventDefault();
      this._userZoomed = true;
      this._resumeSoon();
      this.distance = Math.max(4.5, Math.min(22.0, this.distance + e.deltaY * 0.008));
    };
    this._onResize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(280, rect.width);
      const h = Math.max(340, rect.height);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    };

    this.canvas.addEventListener("pointerdown", this._onPointerDown);
    this.canvas.addEventListener("pointermove", this._onPointerMove);
    this.canvas.addEventListener("pointerup", this._onPointerUp);
    this.canvas.addEventListener("pointerleave", this._onPointerLeave);
    this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
    window.addEventListener("resize", this._onResize);
  }

  _raycast(px, py) {
    const hitMeshes = this.slotGroups.map((s) => s.userData.hitMesh);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(hitMeshes, false)[0]?.object?.userData?.slot || null;
    this.hoveredSlot = hit;
    this.canvas.style.cursor = hit ? "pointer" : this.dragging ? "grabbing" : "grab";
    if (!this.tooltip) return;
    if (hit) {
      const rect = this.canvas.getBoundingClientRect();
      this.tooltip.hidden = false;
      this.tooltip.style.left = `${Math.min(rect.width - 190, Math.max(10, px + 14))}px`;
      this.tooltip.style.top = `${Math.max(10, py - 20)}px`;
      const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      const places = hit.userData.places?.length ? `<span>📍 ${esc(hit.userData.places.join(" · "))}</span>` : "";
      this.tooltip.innerHTML = `<strong>${esc(hit.userData.name)} <small>${hit.userData.slotNo}</small></strong><span>${esc(hit.userData.qtyText)} · ${hit.userData.statusLabel}</span>${places}<small>클릭하여 수정</small>`;
    } else {
      this.tooltip.hidden = true;
    }
  }

  _startLoop() {
    let last = performance.now();
    const animate = (now) => {
      this.rafId = requestAnimationFrame(animate);
      const nowMs = now ?? performance.now();
      const dt = Math.min(0.05, Math.max(0, (nowMs - last) / 1000));
      last = nowMs;
      const t = nowMs / 1000;
      if (this.autoRotate && !this.dragging && nowMs >= this.pauseUntil) this.yaw += 0.15 * dt;

      const theme = this.getTheme();
      const isLight = theme === "white" || theme === "ivory";
      this.floorMesh.material.color.setHex(isLight ? 0xc2d3dc : 0x0b1926);
      this._applyEnvironment(dt, t);
      this._animateWeather(dt, t);

      for (const slot of this.slotGroups) {
        const targetY = slot === this.hoveredSlot ? slot.userData.baseY + 0.14 : slot.userData.baseY;
        slot.position.y += (targetY - slot.position.y) * 0.18;
      }
      if (!this.reducedMotion) {
        this.flames.forEach((f, i) => {
          const s = 0.85 + Math.sin(t * 13 + i * 1.7) * 0.1 + Math.sin(t * 23 + i) * 0.06;
          f.scale.set(1, s, 1);
        });
        const blink = Math.sin(t * 4) > 0.2;
        for (const b of this.blinkers) b.visible = blink;
      }

      const cx = this.distance * Math.cos(this.pitch) * Math.sin(this.yaw);
      const cy = this.distance * Math.sin(this.pitch) + 0.7;
      const cz = this.distance * Math.cos(this.pitch) * Math.cos(this.yaw);
      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(0, 0.75, 0);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  /** Resume auto-rotation a few seconds after the user stops touching the view. */
  _resumeSoon() {
    this.pauseUntil = performance.now() + KR_SPIN_RESUME_MS;
  }

  resetCamera() {
    this.yaw = -0.62;
    this.pitch = 0.48;
    this._userZoomed = false;
    this.distance = this._targetCamDist || 8.4;
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this._onResize);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    this.canvas.removeEventListener("pointermove", this._onPointerMove);
    this.canvas.removeEventListener("pointerup", this._onPointerUp);
    this.canvas.removeEventListener("pointerleave", this._onPointerLeave);
    this.canvas.removeEventListener("wheel", this._onWheel);
    disposeTree(this.worldGroup);
    disposeTree(this.weatherGroup);
    this.renderer?.dispose();
  }
}
