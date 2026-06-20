import type { ReactNode } from "react";
import { motion } from "motion/react";
import { BookOpen, Layers, Sparkles } from "lucide-react";
import type { Tab } from "../types";

export function TabBar({ active, onChange }: { active: Tab; onChange:(t:Tab)=>void }) {
  const tabs: { id:Tab; label:string; icon:ReactNode; jp:string }[] = [
    { id:"kanji",    label:"Kanji",    jp:"漢字", icon:<BookOpen size={18} /> },
    { id:"gacha",    label:"Gacha",    jp:"ガチャ", icon:<Sparkles size={18} /> },
    { id:"radicals", label:"Radicals", jp:"部首", icon:<Layers size={18} /> },
  ];
  return (
    <div style={{
      display:"flex", height:64,
      background:"var(--card)", borderTop:"1px solid var(--border)",
      paddingBottom:8,
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, cursor:"pointer", border:"none", background:"transparent", transition:"all 0.2s" }}>
            <motion.div animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }} transition={{ type:"spring", stiffness:500, damping:25 }}>
              <div style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)", transition:"color 0.2s" }}>{t.icon}</div>
            </motion.div>
            <span style={{
              fontFamily:"Nunito,sans-serif", fontSize:10, fontWeight: isActive ? 800 : 600,
              color: isActive ? "var(--primary)" : "var(--muted-foreground)",
              transition:"color 0.2s",
            }}>{t.jp}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Unlock Prompt Modal ────────────────────────────────────────────────────────
