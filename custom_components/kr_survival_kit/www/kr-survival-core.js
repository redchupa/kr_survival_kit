/**
 * KR Survival Kit — Pure Domain Core Engine
 * Zero Home Assistant / DOM dependencies, so the scoring logic can be unit-tested in plain Node.
 */

export const STOCK_WEIGHTS = {
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

export const SHELTER_RANKS = [
  { name: "아이언", color: "#c0c8cd", percentile: "대비 시작" },
  { name: "브론즈", color: "#ffc493", percentile: "상위 82%" },
  { name: "실버", color: "#dbe8ff", percentile: "상위 68%" },
  { name: "골드", color: "#ffe393", percentile: "상위 52%" },
  { name: "플레티넘", color: "#8cf4de", percentile: "상위 38%" },
  { name: "에메랄드", color: "#8cf2ad", percentile: "상위 25%" },
  { name: "다이아", color: "#9adaff", percentile: "상위 15%" },
  { name: "마스터", color: "#d4bbff", percentile: "상위 7%" },
  { name: "그랜드마스터", color: "#ffa9b2", percentile: "상위 3%" },
  { name: "챌린저", color: "#ffe39a", percentile: "상위 1%" },
];

export const FOOD_SERVING_MULTIPLIERS = {
  "instant-rice": 1,
  "cup-noodles": 1,
  "shelf-stable-meal": 1,
  "spam-canned-ham": 2,
  "canned-tuna": 1.5,
  "canned-pupa": 1,
  "canned-whelk": 1.5,
  "canned-fruit": 1,
  "self-heating-ration": 1,
  "long-storage-snacks": 0.5,
  rice: 8, // 1kg ~ 8 servings
};

export function calculateSurvivalDays(snapshot) {
  if (!snapshot?.summary?.items) return { waterDays: 0, foodDays: 0 };
  const people = Math.max(1, snapshot.household_size || 4);
  const items = snapshot.summary.items;
  const waterMl = items["drinking-water"]?.usable || 0;
  const waterDays = Math.round((waterMl / (people * 2000)) * 10) / 10;

  let totalServings = 0;
  for (const [id, mult] of Object.entries(FOOD_SERVING_MULTIPLIERS)) {
    const qty = items[id]?.usable || 0;
    if (qty > 0) totalServings += qty * mult;
  }
  const foodDays = Math.round((totalServings / (people * 3)) * 10) / 10;
  return { waterDays, foodDays };
}

export function calculateStockScore(snapshot) {
  if (!snapshot?.catalog) return 0;
  let possible = 0;
  let earned = 0;
  for (const item of snapshot.catalog) {
    const weight = STOCK_WEIGHTS[item.id];
    if (!weight) continue;
    possible += weight;
    const status = snapshot.summary?.items?.[item.id];
    if (!status || snapshot.items?.[item.id]?.applicable === false || !status.confirmed ||
        !status.verified_on || status.stale !== false || !(status.target > 0)) continue;
    const usable = Math.max(0, status.usable - (status.expiring_quantity ?? 0));
    earned += weight * Math.min(1, usable / status.target);
  }
  return possible ? Math.floor((earned * 100) / possible + 1e-9) : 0;
}

export function getShelterRank(score) {
  const index = Math.min(SHELTER_RANKS.length - 1, Math.max(0, Math.floor(score / 10)));
  return { ...SHELTER_RANKS[index], index, score };
}

export function serializeBackup(snapshot) {
  return JSON.stringify({
    schema: "kr-survival-kit-backup-v1",
    exported_at: new Date().toISOString(),
    household_size: snapshot?.household_size ?? 4,
    items: snapshot?.items ?? {},
  }, null, 2);
}

export function parseBackup(rawJson) {
  const parsed = JSON.parse(rawJson);
  if (!parsed || parsed.schema !== "kr-survival-kit-backup-v1" || typeof parsed.items !== "object" || Array.isArray(parsed.items)) {
    throw new Error("유효한 KR Survival Kit 백업 파일이 아닙니다.");
  }
  return parsed;
}
