import { Check, ChevronLeft, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { ACHIEVEMENTS } from "../data/kanjiData";

export function AchievementsPage({ unlockedKanji, unlockedRadicals, favorites, notes, onBack }: {
  unlockedKanji: Set<string>; unlockedRadicals: Set<string>;
  favorites: Set<string>; notes: Record<string,string>; onBack:()=>void;
}) {
  const unlocked = ACHIEVEMENTS.filter(a=>a.check(unlockedKanji,unlockedRadicals,favorites,notes));
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-3 pb-4 shrink-0">
        <button onClick={onBack} className="text-muted-foreground"><ChevronLeft size={22} /></button>
        <div>
          <h2 style={{ fontFamily:"Nunito,sans-serif", fontWeight:900, fontSize:20 }} className="text-foreground">Achievements</h2>
          <p style={{ fontFamily:"Nunito,sans-serif", fontSize:12 }} className="text-muted-foreground">{unlocked.length}/{ACHIEVEMENTS.length} unlocked</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4 shrink-0">
        <div style={{ height:8, borderRadius:4, background:"var(--muted)", overflow:"hidden" }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${(unlocked.length/ACHIEVEMENTS.length)*100}%` }} transition={{ duration:1, ease:"easeOut" }}
            style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#ff3d71,#ffd700)" }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-3">
          {ACHIEVEMENTS.map(a=>{
            const done = a.check(unlockedKanji,unlockedRadicals,favorites,notes);
            return (
              <motion.div key={a.id}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{
                  display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:16,
                  background: done ? "linear-gradient(135deg, rgba(255,61,113,0.12), rgba(255,215,0,0.08))" : "var(--card)",
                  border:`1px solid ${done ? "rgba(255,61,113,0.25)" : "var(--border)"}`,
                  opacity: done ? 1 : 0.5,
                }}>
                <div style={{
                  width:48, height:48, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26,
                  background: done ? "linear-gradient(135deg,rgba(255,61,113,0.2),rgba(255,215,0,0.2))" : "var(--muted)",
                  border: done ? "1px solid rgba(255,215,0,0.3)" : "1px solid var(--border)",
                  filter: done ? "none" : "grayscale(1)",
                }}>{a.icon}</div>
                <div className="flex-1">
                  <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:14 }} className="text-foreground">{a.name}</p>
                  <p style={{ fontFamily:"Nunito,sans-serif", fontSize:12 }} className="text-muted-foreground">{a.desc}</p>
                </div>
                {done && <Check size={18} color="#ffd700" />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Settings Page ──────────────────────────────────────────────────────────────
