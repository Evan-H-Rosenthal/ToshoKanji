import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { KANJI } from "../data/generated/kanji.generated";
import { LEARNING_CATEGORIES } from "../data/ui/categoryColors";

export function GachaStatsButton({
  unlockedKanji,
}: {
  unlockedKanji: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const categoryStats = useMemo(() => {
    return LEARNING_CATEGORIES.map((category) => {
      const entries = KANJI.filter((kanji) => kanji.learningCategory === category.id);
      const unlocked = entries.filter((kanji) => unlockedKanji.has(kanji.id)).length;
      const [color1, color2] = category.colors;

      return {
        category: category.id,
        label: category.label,
        unlocked,
        total: entries.length,
        color1,
        color2,
        percent: entries.length ? (unlocked / entries.length) * 100 : 0,
      };
    });
  }, [unlockedKanji]);

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        style={{
          width: "min(320px, calc(100vw - 64px))",
          minHeight: 62,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.28)",
          background:
            "linear-gradient(135deg, rgba(255,61,113,0.95), rgba(124,58,237,0.94) 54%, rgba(14,165,233,0.92))",
          boxShadow: "0 12px 26px rgba(13,10,30,0.28), inset 0 1px 0 rgba(255,255,255,0.34)",
          color: "#fff",
          cursor: "pointer",
          padding: "10px 14px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <motion.div
          aria-hidden
          animate={{ x: ["-115%", "115%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.1 }}
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(100deg, transparent 16%, rgba(255,255,255,0.32) 48%, transparent 72%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontFamily: "var(--ui-font)", fontSize: 12, fontWeight: 1000, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.9 }}>
              Collection
            </p>
          </div>
          <div style={{ display: "flex", gap: 9, transform: "translateY(-1px)" }}>
            <StatPill label="Kanji" value={`${unlockedKanji.size}/${KANJI.length}`} />
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 40,
              background: "rgba(5,4,17,0.48)",
              backdropFilter: "blur(5px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 18,
            }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ type: "spring", stiffness: 430, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 286,
                borderRadius: 22,
                background: "linear-gradient(180deg, var(--card), color-mix(in srgb, var(--card) 88%, var(--primary)))",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
                padding: 16,
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close stats"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>

              <p style={{ fontFamily: "var(--ui-font)", fontSize: 19, fontWeight: 1000, marginBottom: 4 }} className="text-foreground">
                Collection Stats
              </p>
              <p style={{ fontFamily: "var(--ui-font)", fontSize: 11, marginBottom: 14 }} className="text-muted-foreground">
                Progress by kanji category
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 14 }}>
                <SummaryCard label="Kanji" value={unlockedKanji.size} total={KANJI.length} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {categoryStats.map((stat) => (
                  <div key={stat.category}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--ui-font)", fontSize: 11, fontWeight: 900 }} className="text-foreground">
                        {stat.label}
                      </span>
                      <span style={{ fontFamily: "var(--ui-font)", fontSize: 10, fontWeight: 800 }} className="text-muted-foreground">
                        {stat.unlocked}/{stat.total}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 9,
                        borderRadius: 999,
                        background: "var(--muted)",
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.percent}%` }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        style={{
                          height: "100%",
                          borderRadius: 999,
                          background: `linear-gradient(90deg, ${stat.color1}, ${stat.color2})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        minWidth: 64,
        borderRadius: 14,
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.24)",
        padding: "7px 9px",
        textAlign: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      <p style={{ fontFamily: "var(--ui-font)", fontSize: 10, fontWeight: 900, lineHeight: 1, opacity: 0.84 }}>{label}</p>
      <p style={{ fontFamily: "var(--ui-font)", fontSize: 17, fontWeight: 1000, lineHeight: 1.12 }}>{value}</p>
    </div>
  );
}

function SummaryCard({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "var(--muted)",
        border: "1px solid var(--border)",
        padding: "10px 9px",
      }}
    >
      <p style={{ fontFamily: "var(--ui-font)", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }} className="text-muted-foreground">
        {label}
      </p>
      <p style={{ fontFamily: "var(--ui-font)", fontSize: 20, fontWeight: 1000, lineHeight: 1.05 }} className="text-foreground">
        {value}
        <span style={{ fontSize: 12, opacity: 0.62 }}>/{total}</span>
      </p>
    </div>
  );
}
