import * as THREE from "./three.module.min.js";

const SHORT_NAMES = {
  "drinking-water": "생수", "instant-rice": "즉석밥", "cup-noodles": "컵라면", "shelf-stable-meal": "레토르트 간편식",
  "spam-canned-ham": "스팸", "canned-tuna": "참치캔", "canned-pupa": "번데기캔", "canned-whelk": "골뱅이캔", "canned-fruit": "과일캔",
  "canned-food": "기타 통조림", hygiene: "두루마리 휴지", "wet-wipes": "물티슈",
  flashlight: "손전등", batteries: "AA 건전지", "batteries-aaa": "AAA 건전지", "batteries-special": "특수 건전지",
  backpack: "대피 가방", blanket: "담요", "first-aid-kit": "응급 처치", "otc-medicine": "상비약",
  "infant-supplies": "영유아 용품", "prescription-preparedness": "처방약", radio: "자가발전 라디오",
  "water-container": "20L 말통", "faucet-water-tank": "수도꼭지 물통", "water-purification-tablets": "아쿠아탭스",
  "metal-fuel-can": "철제 기름통", "fuel-siphon-nozzle": "자바라 노즐",
  "portable-stove": "휴대 버너", "butane-canister": "부탄가스", "butane-torch": "부탄 토치",
  "self-heating-ration": "발열식량", rice: "쌀", "spam-canned-ham": "스팸", "canned-tuna": "참치캔",
  "salt-jar": "소금(병)", "honey-gift-set": "벌꿀",
  candles: "양초", "hand-warmers": "손난로", "sleeping-bag": "캠핑 침낭",
  "large-plastic-bags": "특대 김장비닐", lighter: "라이터", "solid-fuel": "고체 연료",
  "child-id-card": "인식표", "home-solar-panel": "가정용 태양광200W", "portable-solar-panel": "휴대용 태양광60W",
  "manual-can-opener": "캔 따개", "insulated-bottle": "보온병", "cooler-ice-pack": "아이스박스",
  "portable-water-filter": "정수 필터", "storage-bin": "보관함", "long-storage-snacks": "간식",
  "infant-formula": "조제분유", "ready-to-feed-formula": "액상분유", "infant-feeding-supplies": "수유 용품",
  "power-bank": "휴대 보조배터리", "portable-power-station": "가정용 파워뱅크", "charging-cables": "충전선",
  "warm-clothes": "방한복", raincoat: "우비", masks: "마스크", "gas-mask": "방독면",
  "gas-mask-filter": "방독면 필터", earplugs: "이어플러그", "compressed-towel": "압축 수건",
  "rubber-gloves": "고무장갑", "rubber-boots": "장화", "sealing-tape": "밀봉 테이프",
  "emergency-contact-card": "연락 카드", "family-photo": "가족 사진",
  "portable-toilet": "휴대용 변기", "toilet-coagulant": "변기 응고제", "cat-litter": "고양이 모래",
  "sanitation-bags": "위생 봉투", "thermal-mat": "단열 매트", "child-comfort-kit": "안심 꾸러미",
  "basic-documents": "서류 사본", "door-window-locks": "문·창 잠금", "door-alarm": "문 알림",
  "lock-tools": "자물쇠 공구", "child-carrier": "산악 아기캐리어", "transport-cart": "웨건 수레",
  "water-sanitation-kit": "물 위생 도구", "hot-water-bag": "온수 주머니",
  "portable-radio-communication": "무전기", "emergency-payment-check": "비상 결제",
  "cash-krw": "원화 현금", "cash-usd": "달러 외화", "crypto-cold-wallet": "코인·지갑",
  "protective-goggles": "보호 안경",
};

function makeLabelSprite(text, toneColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
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
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.95, 0.24, 1);
  return sprite;
}

function buildItemMesh(item, ratio, toneColor, isReady) {
  const group = new THREE.Group();
  const id = item.id;
  const count = ratio <= 0 ? 0 : Math.max(1, Math.min(6, Math.ceil(ratio * 5)));

  if (count === 0) {
    // Empty hologram slot outline
    const geo = new THREE.BoxGeometry(0.62, 0.42, 0.62);
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: toneColor, transparent: true, opacity: 0.7 }));
    line.position.y = 0.22;
    group.add(line);
    return group;
  }

  if (id === "drinking-water" || id === "water-container" || id === "faucet-water-tank") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4cc9f0, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.88 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xe0fbfc, roughness: 0.4 });
    const bottleGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.36, 12);
    const neckGeo = new THREE.CylinderGeometry(0.035, 0.07, 0.07, 10);
    const capGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 10);
    for (let i = 0; i < count; i++) {
      const b = new THREE.Group();
      const m1 = new THREE.Mesh(bottleGeo, bodyMat); m1.position.y = 0.18; m1.castShadow = true;
      const m2 = new THREE.Mesh(neckGeo, bodyMat); m2.position.y = 0.39;
      const m3 = new THREE.Mesh(capGeo, capMat); m3.position.y = 0.44;
      b.add(m1, m2, m3);
      const col = i % 3, row = Math.floor(i / 3);
      b.position.set((col - 1) * 0.2, 0, (row - 0.5) * 0.22);
      group.add(b);
    }
  } else if (["canned-food", "butane-canister", "insulated-bottle", "infant-formula", "candles", "spam-canned-ham", "canned-tuna", "canned-pupa", "canned-whelk", "canned-fruit", "salt-jar", "honey-gift-set", "gas-mask-filter"].includes(id)) {
    const color = id === "butane-canister" ? 0xff9f68 : id === "infant-formula" || id === "honey-gift-set" || id === "canned-fruit" ? 0xffd166 : id === "gas-mask-filter" ? 0x495057 : id === "canned-tuna" ? 0x4ea8de : id === "canned-whelk" ? 0x2ec4b6 : id === "canned-pupa" ? 0xb5838d : 0xe06f6c;
    const canMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.55 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8e2dc, roughness: 0.25, metalness: 0.8 });
    const geo = new THREE.CylinderGeometry(0.11, 0.11, 0.24, 16);
    const rimGeo = new THREE.CylinderGeometry(0.114, 0.114, 0.03, 16);
    for (let i = 0; i < count; i++) {
      const c = new THREE.Group();
      const body = new THREE.Mesh(geo, canMat); body.castShadow = true;
      const top = new THREE.Mesh(rimGeo, rimMat); top.position.y = 0.12;
      c.add(body, top);
      const layer = Math.floor(i / 3);
      const idx = i % 3;
      c.position.set((idx - 1) * 0.23, 0.12 + layer * 0.25, layer > 0 ? 0 : 0.04);
      group.add(c);
    }
  } else if (id === "first-aid-kit" || id === "otc-medicine") {
    const caseMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.35, metalness: 0.1 });
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.3, emissive: 0x3a080c });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.44), caseMat);
    box.position.y = 0.12; box.castShadow = true; box.receiveShadow = true;
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.08), crossMat); c1.position.y = 0.25;
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.24), crossMat); c2.position.y = 0.25;
    group.add(box, c1, c2);
  } else if (id === "flashlight") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x495057, roughness: 0.3, metalness: 0.75 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffd43b, emissiveIntensity: isReady ? 0.9 : 0.2 });
    for (let i = 0; i < Math.min(count, 2); i++) {
      const f = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 12), bodyMat);
      handle.rotation.z = Math.PI / 2; handle.castShadow = true;
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.06, 0.12, 12), bodyMat);
      head.rotation.z = Math.PI / 2; head.position.x = 0.22;
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 12), lensMat);
      lens.rotation.z = Math.PI / 2; lens.position.x = 0.28;
      f.add(handle, head, lens);
      f.position.set(-0.08, 0.1, (i - 0.5) * 0.24);
      group.add(f);
    }
  } else if (["batteries", "batteries-aaa", "batteries-special", "power-bank", "portable-power-station", "radio"].includes(id)) {
    const color = id === "batteries" ? 0x52b788 : id === "radio" ? 0x4ea8de : 0x2ec4b6;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.45 });
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x80ffdb, emissive: 0x56cfe1, emissiveIntensity: 0.7 });
    const h = 0.22 + ratio * 0.28;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.54, h, 0.42), mat);
    box.position.y = h / 2; box.castShadow = true; box.receiveShadow = true;
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.04), ledMat);
    led.position.set(0, h * 0.7, 0.22);
    group.add(box, led);
  } else {
    // Stacked supply crates / packs
    const baseColor = isReady ? 0x38b000 : ratio > 0 ? 0x4895ef : 0xadb5bd;
    const crateMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.45, metalness: 0.25 });
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.5 });
    const crateH = 0.16;
    const layers = Math.max(1, Math.min(3, Math.ceil(ratio * 3)));
    for (let l = 0; l < layers; l++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.58 - l * 0.04, crateH, 0.52 - l * 0.04), crateMat);
      box.position.y = crateH / 2 + l * (crateH + 0.02);
      box.castShadow = true; box.receiveShadow = true;
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.6 - l * 0.04, 0.03, 0.12), bandMat);
      band.position.y = box.position.y;
      group.add(box, band);
    }
  }

  return group;
}

export class KrWarehouseThreeEngine {
  constructor(canvas, tooltipEl, getSnapshot, getFilter, onSelectItem, getTheme) {
    this.canvas = canvas;
    this.tooltip = tooltipEl;
    this.getSnapshot = getSnapshot;
    this.getFilter = getFilter;
    this.onSelectItem = onSelectItem;
    this.getTheme = getTheme;

    this.yaw = -0.62;
    this.pitch = 0.48;
    this.distance = 8.4;
    this.autoRotate = true;
    this.zone = "essentials";
    this.dragging = false;
    this.dragMoved = false;
    this.lastX = 0;
    this.lastY = 0;
    this.hoveredSlot = null;
    this.slotGroups = [];
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-9, -9);

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
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 80);

    // Lighting
    this.hemiLight = new THREE.HemisphereLight(0xb8e6f5, 0x102230, 0.9);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.55);
    this.dirLight.position.set(6, 11, 7);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 30;
    const d = 7;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    this.accentLight = new THREE.PointLight(0x4cc9f0, 1.4, 18);
    this.accentLight.position.set(-4, 4, -3);
    this.scene.add(this.accentLight);

    // Floor & Grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x0b1926, roughness: 0.75, metalness: 0.2 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floorMesh = floor;

    const grid = new THREE.GridHelper(20, 20, 0x3c8dad, 0x193b4d);
    grid.position.y = 0.005;
    this.scene.add(grid);

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
  }

  rebuild() {
    while (this.worldGroup.children.length) {
      this.worldGroup.remove(this.worldGroup.children[0]);
    }
    this.slotGroups = [];
    const snapshot = this.getSnapshot();
    if (!snapshot) return;

    const filter = this.getFilter();
    const readyIds = new Set(snapshot.catalog.filter((item) => {
      const r = snapshot.items[item.id];
      const s = snapshot.summary?.items?.[item.id];
      return Boolean(r?.applicable && s?.state === "sufficient" && s?.confirmed && s?.verified_on && s?.stale === false && s?.target > 0 && s?.usable >= s?.target && !(s?.expiring_quantity > 0) && !(s?.expired_quantity > 0) && !(s?.unknown_date_quantity > 0));
    }).map((i) => i.id));

    const essentials = snapshot.catalog.filter((i) => !["household", "optional"].includes(i.tier));
    const allOptional = snapshot.catalog.filter((i) => ["household", "optional"].includes(i.tier));
    const itemsToShow = this.zone === "optional" ? allOptional : essentials;

    const cols = itemsToShow.length > 35 ? 8 : 6;
    const rows = Math.max(1, Math.ceil(itemsToShow.length / cols));
    const rackW = cols * 1.04 + 0.5;
    const rackD = 1.25;
    this._targetCamDist = rows > 5 ? 13.5 : rows > 3 ? 10.5 : 8.4;
    if (!this._userZoomed) this.distance = this._targetCamDist;
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x3b5b6e, roughness: 0.35, metalness: 0.78 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x1a3547, roughness: 0.55, metalness: 0.4 });

    for (let r = 0; r < rows; r++) {
      const zPos = (r - (rows - 1) / 2) * 2.15;
      // Shelf base deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(rackW, 0.1, rackD), deckMat);
      deck.position.set(0, 0.32, zPos);
      deck.castShadow = true; deck.receiveShadow = true;
      this.worldGroup.add(deck);

      // Top canopy deck
      const topDeck = new THREE.Mesh(new THREE.BoxGeometry(rackW, 0.07, rackD), deckMat);
      topDeck.position.set(0, 1.55, zPos);
      topDeck.castShadow = true;
      this.worldGroup.add(topDeck);

      // Four corner posts
      for (const px of [-rackW / 2 + 0.08, rackW / 2 - 0.08]) {
        for (const pz of [zPos - rackD / 2 + 0.08, zPos + rackD / 2 - 0.08]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.65, 0.09), metalMat);
          post.position.set(px, 0.825, pz);
          post.castShadow = true;
          this.worldGroup.add(post);
        }
      }
    }

    itemsToShow.forEach((item, idx) => {
      const r = Math.floor(idx / cols);
      const col = idx % cols;
      const xPos = (col - (cols - 1) / 2) * 1.04;
      const zPos = (r - (rows - 1) / 2) * 2.15;
      const status = snapshot.summary.items[item.id];
      const matchesFilter = filter === "all" || (filter === "expiring" ? status.expiring_quantity > 0 : status.state === filter);
      const ready = readyIds.has(item.id);
      const ratio = status.target > 0 ? Math.min(1, (status.usable || 0) / status.target) : (ready ? 1 : 0);

      const toneHex = ready ? "#52f2a8" : (status.state === "shortage" || status.expired_quantity > 0) ? "#ff7b7b" : "#ffd166";
      const toneNum = ready ? 0x52f2a8 : (status.state === "shortage" || status.expired_quantity > 0) ? 0xff7b7b : 0xffd166;

      const slot = new THREE.Group();
      slot.position.set(xPos, 0.37, zPos);
      if (!matchesFilter) slot.scale.setScalar(0.72);

      // LED status strip on rack edge
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.035, 0.05),
        new THREE.MeshStandardMaterial({ color: toneNum, emissive: toneNum, emissiveIntensity: matchesFilter ? 0.9 : 0.15 }),
      );
      led.position.set(0, -0.02, rackD / 2 - 0.02);
      slot.add(led);

      // 3D item mesh
      const meshGroup = buildItemMesh(item, ratio, toneNum, ready);
      slot.add(meshGroup);

      // Invisible hit box for smooth raycasting
      const hitMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.84, 0.82, 0.84),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hitMesh.position.y = 0.41;
      slot.add(hitMesh);

      // Floating name tag
      const shortName = SHORT_NAMES[item.id] || item.name;
      const sprite = makeLabelSprite(shortName, toneHex);
      sprite.position.set(0, 0.92, 0);
      slot.add(sprite);

      const unit = item.id === "drinking-water" ? "L" : item.unit;
      const scale = item.id === "drinking-water" ? 1000 : 1;
      const qtyText = `${(status.usable ?? 0) / scale} ${unit} / ${status.target == null ? "미설정" : `${status.target / scale} ${unit}`}`;
      const statusLabel = ready ? "완비" : status.state === "shortage" ? "부족" : status.expiring_quantity > 0 ? "기한 임박" : "실사 필요";

      slot.userData = { item, name: shortName, qtyText, statusLabel, baseY: 0.37, hitMesh };
      hitMesh.userData = { slot };
      this.worldGroup.add(slot);
      this.slotGroups.push(slot);
    });
  }

  _bindEvents() {
    this._onPointerDown = (e) => {
      this.dragging = true;
      this.dragMoved = false;
      this.autoRotate = false;
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
        if (this.hoveredSlot) {
          this.onSelectItem(this.hoveredSlot.userData.item);
        }
      }
      this.dragging = false;
    };
    this._onWheel = (e) => {
      e.preventDefault();
      this._userZoomed = true;
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
    this.canvas.addEventListener("pointerleave", () => {
      this.dragging = false;
      this.hoveredSlot = null;
      if (this.tooltip) this.tooltip.hidden = true;
    });
    this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
    window.addEventListener("resize", this._onResize);
  }

  _raycast(px, py) {
    const hitMeshes = this.slotGroups.map((s) => s.userData.hitMesh);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(hitMeshes, false);
    const hit = intersects[0]?.object?.userData?.slot || null;
    this.hoveredSlot = hit;
    this.canvas.style.cursor = hit ? "pointer" : this.dragging ? "grabbing" : "grab";
    if (this.tooltip) {
      if (hit) {
        const rect = this.canvas.getBoundingClientRect();
        this.tooltip.hidden = false;
        this.tooltip.style.left = `${Math.min(rect.width - 190, Math.max(10, px + 14))}px`;
        this.tooltip.style.top = `${Math.max(10, py - 20)}px`;
        this.tooltip.innerHTML = `<strong>${hit.userData.name}</strong><span>${hit.userData.qtyText} · ${hit.userData.statusLabel}</span><small>클릭하여 수정</small>`;
      } else {
        this.tooltip.hidden = true;
      }
    }
  }

  _startLoop() {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const animate = () => {
      this.rafId = requestAnimationFrame(animate);
      if (this.autoRotate && !this.dragging && !reduced) {
        this.yaw += 0.0025;
      }
      const theme = this.getTheme();
      const isLight = theme === "white" || theme === "ivory";
      this.scene.background = new THREE.Color(isLight ? (theme === "ivory" ? 0xe8dec8 : 0xdbe6ec) : 0x07131e);
      this.floorMesh.material.color.setHex(isLight ? 0xc2d3dc : 0x0b1926);
      this.hemiLight.intensity = isLight ? 1.35 : 0.9;

      // Smooth hover lift
      for (const slot of this.slotGroups) {
        const targetY = slot === this.hoveredSlot ? slot.userData.baseY + 0.14 : slot.userData.baseY;
        slot.position.y += (targetY - slot.position.y) * 0.18;
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

  resetCamera() {
    this.yaw = -0.62;
    this.pitch = 0.48;
    this._userZoomed = false;
    this.distance = this._targetCamDist || 8.4;
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this._onResize);
    this.renderer?.dispose();
  }
}
