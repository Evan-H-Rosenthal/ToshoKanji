import type { Achievement } from "../../types";
import { KANJI } from "../generated/kanji.generated";
import { RADICALS } from "../generated/radicals.generated";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-k", name: "First Steps", desc: "Unlock your first kanji", icon: "*", check: (uk) => uk.size >= 1 },
  { id: "first-r", name: "Radical Starter", desc: "Unlock your first radical", icon: "+", check: (_, ur) => ur.size >= 1 },
  { id: "grade1", name: "First Grade", desc: "Unlock all grade 1 kanji", icon: "1", check: (uk) => KANJI.filter((k) => k.grade === 1).every((k) => uk.has(k.id)) },
  { id: "half", name: "Halfway There", desc: `Unlock ${Math.ceil(KANJI.length / 2)} kanji`, icon: "50", check: (uk) => uk.size >= Math.ceil(KANJI.length / 2) },
  { id: "all-k", name: "Kanji Master", desc: "Unlock every kanji", icon: "K", check: (uk) => uk.size >= KANJI.length },
  { id: "all-r", name: "Radical Expert", desc: "Unlock every radical", icon: "R", check: (_, ur) => ur.size >= RADICALS.length },
  { id: "stars", name: "Stargazer", desc: "Favorite 10 items", icon: "*", check: (_, __, fav) => fav.size >= 10 },
  { id: "scholar", name: "Scholar", desc: "Write notes on 5 entries", icon: "N", check: (_, __, ___, notes) => Object.values(notes).filter((n) => n.trim().length > 0).length >= 5 },
];
