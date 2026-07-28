import { Check, ChevronLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AchievementEmoji } from "../components/AchievementEmoji";
import { ACHIEVEMENTS } from "../data/ui/achievements";
import type { AchievementCategory } from "../types";

const ACHIEVEMENT_SECTIONS: { id: AchievementCategory; label: string }[] = [
  { id: "rarity", label: "Rarity Collection" },
  { id: "category", label: "Category Collection" },
  { id: "favorites", label: "Favorites" },
  { id: "notes", label: "Notes" },
  { id: "ai-chat", label: "AI Chat interaction" },
];

export function AchievementsPage({ unlockedKanji, unlockedRadicals, favorites, notes, chatInteractionCount, onBack }: {
  unlockedKanji: Set<string>;
  unlockedRadicals: Set<string>;
  favorites: Set<string>;
  notes: Record<string,string>;
  chatInteractionCount: number;
  onBack:()=>void;
}) {
  const reduceMotion = useReducedMotion();
  const isDone = (achievement: (typeof ACHIEVEMENTS)[number]) => achievement.check(
    unlockedKanji,
    unlockedRadicals,
    favorites,
    notes,
    chatInteractionCount,
  );
  const unlocked = ACHIEVEMENTS.filter(isDone);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-3 pb-4 shrink-0">
        <button onClick={onBack} aria-label="Back" className="text-muted-foreground app-reactive" style={{ width:44, height:44, marginLeft:-8, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 style={{ fontFamily:"var(--ui-font)", fontWeight:900, fontSize:20 }} className="text-foreground">Achievements</h2>
          <p style={{ fontFamily:"var(--ui-font)", fontSize:12 }} className="text-muted-foreground">{unlocked.length}/{ACHIEVEMENTS.length} unlocked</p>
        </div>
      </div>

      <div className="px-4 mb-4 shrink-0">
        <div style={{ height:8, borderRadius:4, background:"var(--muted)", overflow:"hidden" }}>
          <motion.div
            initial={reduceMotion ? false : { width:0 }}
            animate={{ width:`${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
            transition={{ duration:reduceMotion ? 0 : 0.8, ease:"easeOut" }}
            style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#ff3d71,#ffd700)" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col gap-6">
          {ACHIEVEMENT_SECTIONS.map((section) => {
            const achievements = ACHIEVEMENTS.filter((achievement) => achievement.category === section.id);
            const doneCount = achievements.filter(isDone).length;
            return (
              <section key={section.id} aria-labelledby={`achievement-${section.id}`}>
                <div className="flex items-end justify-between gap-3 mb-2 px-1">
                  <h3 id={`achievement-${section.id}`} style={{ fontFamily:"var(--ui-font)", fontWeight:900, fontSize:15 }} className="text-foreground">{section.label}</h3>
                  <span style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:10 }} className="text-muted-foreground">{doneCount}/{achievements.length}</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {achievements.map((achievement) => {
                    const done = isDone(achievement);
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={reduceMotion ? false : { opacity:0, y:8 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ duration:reduceMotion ? 0 : 0.2, ease:"easeOut" }}
                        style={{
                          display:"flex", alignItems:"center", gap:13, padding:"13px 14px", borderRadius:16,
                          background: done ? "linear-gradient(135deg, rgba(255,61,113,0.12), rgba(255,215,0,0.08))" : "var(--card)",
                          border:`1px solid ${done ? "rgba(255,61,113,0.25)" : "var(--border)"}`,
                          filter: done ? "none" : "grayscale(1)",
                        }}
                      >
                        <div style={{
                          width:48, height:48, flexShrink:0, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26,
                          background: done ? "linear-gradient(135deg,rgba(255,61,113,0.2),rgba(255,215,0,0.2))" : "var(--muted)",
                          border: done ? "1px solid rgba(255,215,0,0.3)" : "1px solid var(--border)",
                          opacity: done ? 1 : 0.56,
                        }}>
                          <AchievementEmoji emoji={achievement.icon} />
                        </div>
                        <div className="flex-1 min-w-0" style={{ opacity:done ? 1 : 0.58 }}>
                          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:14 }} className="text-foreground">{achievement.name}</p>
                          <p style={{ fontFamily:"var(--ui-font)", fontSize:12 }} className="text-muted-foreground">{achievement.desc}</p>
                        </div>
                        {done && <Check size={18} color="#d6aa00" />}
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}