import type { ReactNode } from "react";
import { motion } from "motion/react";
import { BookOpen, Dumbbell, Sparkles } from "lucide-react";
import type { Tab } from "../types";

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: ReactNode; jp: string }[] = [
    { id: "collection", label: "Collection", jp: "収集", icon: <BookOpen size={22} /> },
    { id: "gacha", label: "Gacha", jp: "ガチャ", icon: <Sparkles size={22} /> },
    { id: "practice", label: "Practice", jp: "練習", icon: <Dumbbell size={22} /> },
  ];

  return (
    <div
      style={{
        display: "flex",
        minHeight: 92,
        height: "calc(92px + max(env(safe-area-inset-bottom), 14px))",
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "max(env(safe-area-inset-bottom), 14px)",
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const color = isActive ? "var(--primary)" : "var(--muted-foreground)";

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              cursor: "pointer",
              border: "none",
              background: "transparent",
              transition: "all 0.2s",
            }}
          >
            <motion.div
              animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -2 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <div style={{ color, transition: "color 0.2s" }}>{tab.icon}</div>
            </motion.div>
            <span
              style={{
                fontFamily: "var(--jp-font)",
                fontSize: 12,
                fontWeight: isActive ? 900 : 700,
                color,
                transition: "color 0.2s",
                lineHeight: 1.05,
              }}
            >
              {tab.jp}
            </span>
            <span
              style={{
                fontFamily: "var(--ui-font)",
                fontSize: 9,
                fontWeight: isActive ? 850 : 700,
                color,
                opacity: isActive ? 0.9 : 0.76,
                transition: "color 0.2s",
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
