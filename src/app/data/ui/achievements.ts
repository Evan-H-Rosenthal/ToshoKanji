import type { Achievement } from "../../types";
import { KANJI } from "../generated/kanji.generated";
import { RADICALS } from "../generated/radicals.generated";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-k", name: "First Steps", desc: "Unlock your first kanji", icon: "🌱", check: (uk) => uk.size >= 1 },
  { id: "grade1", name: "First Grade", desc: "Unlock all grade 1 kanji", icon: "🍎", check: (uk) => KANJI.filter((k) => k.grade === 1).every((k) => uk.has(k.id)) },
  { id: "half", name: "Halfway There", desc: `Unlock ${Math.ceil(KANJI.length / 2)} kanji`, icon: "🌓", check: (uk) => uk.size >= Math.ceil(KANJI.length / 2) },
  { id: "all-k", name: "Kanji Master", desc: "Unlock every kanji", icon: "🎓", check: (uk) => uk.size >= KANJI.length },
  { id: "stars", name: "Stargazer", desc: "Favorite 10 items", icon: "🌠", check: (_, __, fav) => fav.size >= 10 },
  { id: "scholar", name: "Scholar", desc: "Write notes on 5 entries", icon: "✍️", check: (_, __, ___, notes) => Object.values(notes).filter((n) => n.trim().length > 0).length >= 5 },
];
