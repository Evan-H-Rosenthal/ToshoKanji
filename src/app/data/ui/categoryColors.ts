export const FALLBACK_LEARNING_CATEGORY = "Misc";

export const LEARNING_CATEGORIES = [
  { id: "Nature", label: "Nature", colors: ["#22c55e", "#16a34a"] },
  { id: "PeopleSociety", label: "People & Society", colors: ["#3b82f6", "#2563eb"] },
  { id: "PlacesBuildings", label: "Places & Buildings", colors: ["#f97316", "#ea580c"] },
  { id: "ActionsMovements", label: "Actions & Movements", colors: ["#ef4444", "#dc2626"] },
  { id: "AbstractConcepts", label: "Abstract Concepts", colors: ["#a855f7", "#7c3aed"] },
  { id: "NumbersTime", label: "Numbers & Time", colors: ["#f59e0b", "#d97706"] },
  { id: "ObjectsMaterials", label: "Objects & Materials", colors: ["#14b8a6", "#0d9488"] },
  { id: "FoodLiving", label: "Food & Living", colors: ["#eab308", "#ca8a04"] },
  { id: "LanguageCommunication", label: "Language & Communication", colors: ["#ec4899", "#db2777"] },
  { id: "BodyHealth", label: "Body & Health", colors: ["#f43f5e", "#e11d48"] },
  { id: "Colors", label: "Colors", colors: ["#f8fafc", "#cbd5e1"] },
  { id: FALLBACK_LEARNING_CATEGORY, label: "Misc & Fallback", colors: ["#6b7280", "#4b5563"] },
] as const;

export const LEARNING_CATEGORY_ORDER = new Map(LEARNING_CATEGORIES.map((category, index) => [category.id, index]));
export const LEARNING_CATEGORY_LABELS = Object.fromEntries(LEARNING_CATEGORIES.map((category) => [category.id, category.label]));
export const CAT_COLORS = Object.fromEntries(LEARNING_CATEGORIES.map((category) => [category.id, category.colors])) as Record<string, [string, string]>;

export function getLearningCategory(value?: string) {
  return value && value in LEARNING_CATEGORY_LABELS ? value : FALLBACK_LEARNING_CATEGORY;
}

export function getLearningCategoryLabel(value?: string) {
  const category = getLearningCategory(value);
  return LEARNING_CATEGORY_LABELS[category] ?? LEARNING_CATEGORY_LABELS[FALLBACK_LEARNING_CATEGORY];
}

export function getLearningCategoryColors(value?: string): [string, string] {
  return CAT_COLORS[getLearningCategory(value)] ?? CAT_COLORS[FALLBACK_LEARNING_CATEGORY];
}

export function compareLearningCategories(a?: string, b?: string) {
  return (LEARNING_CATEGORY_ORDER.get(getLearningCategory(a)) ?? 999) - (LEARNING_CATEGORY_ORDER.get(getLearningCategory(b)) ?? 999);
}

function hexToRgb(color: string): [number, number, number] | null {
  const match = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getReadableTextColor(primary: string, secondary?: string) {
  const average = secondary ? (luminance(primary) + luminance(secondary)) / 2 : luminance(primary);
  return average > 0.72 ? "#111827" : "rgba(255,255,255,0.95)";
}

export const RAD_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
  "#22c55e",
  "#a855f7",
  "#0ea5e9",
  "#fb923c",
  "#84cc16",
  "#e879f9",
];
