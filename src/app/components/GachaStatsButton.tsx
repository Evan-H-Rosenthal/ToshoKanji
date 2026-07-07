import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { KANJI_IDS, KANJI_IDS_BY_CATEGORY } from "../data/entryIndexes";
import { LEARNING_CATEGORIES } from "../data/ui/categoryColors";

const CATEGORY_TOTALS = LEARNING_CATEGORIES.map((category) => ({
  category: category.id,
  label: category.label,
  emoji: category.emoji,
  kanjiIds: KANJI_IDS_BY_CATEGORY.get(category.id) ?? [],
  color1: category.colors[0],
  color2: category.colors[1],
})).filter((stat) => stat.kanjiIds.length > 0);

export function GachaStatsButton({
  unlockedKanji,
}: {
  unlockedKanji: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const categoryStats = useMemo(() => {
    return CATEGORY_TOTALS.map((category) => {
      const unlocked = category.kanjiIds.reduce((count, kanjiId) => count + (unlockedKanji.has(kanjiId) ? 1 : 0), 0);
      return {
        category: category.category,
        label: category.label,
        emoji: category.emoji,
        unlocked,
        total: category.kanjiIds.length,
        color1: category.color1,
        color2: category.color2,
        percent: category.kanjiIds.length ? (unlocked / category.kanjiIds.length) * 100 : 0,
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
            <StatPill label="Kanji" value={`${unlockedKanji.size}/${KANJI_IDS.length}`} />
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
                maxWidth: 312,
                maxHeight: "min(620px, calc(100% - 24px))",
                borderRadius: 22,
                background: "linear-gradient(180deg, var(--card), color-mix(in srgb, var(--card) 88%, var(--primary)))",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
                padding: 16,
                position: "relative",
                overflow: "hidden",
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
                <SummaryCard label="Kanji" value={unlockedKanji.size} total={KANJI_IDS.length} />
              </div>

              <div style={{ maxHeight: 388, overflowY: "auto", paddingRight: 4 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  {categoryStats.map((stat) => (
                    <div key={stat.category} style={{ minWidth: 0 }}>
                      <CategoryProgressBox {...stat} />
                      <p
                        title={stat.label}
                        style={{
                          minHeight: 24,
                          marginTop: 5,
                          padding: "0 3px",
                          fontFamily: "var(--ui-font)",
                          fontSize: 10,
                          fontWeight: 900,
                          lineHeight: 1.15,
                          textAlign: "center",
                          color: "var(--foreground)",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CategoryProgressBox({
  label,
  emoji,
  unlocked,
  total,
  color1,
  color2,
  percent,
}: {
  label: string;
  emoji: string;
  unlocked: number;
  total: number;
  color1: string;
  color2: string;
  percent: number;
}) {
  const complete = unlocked >= total;
  const capsuleSize = 96;
  const halfSize = capsuleSize / 2;
  const bottomFillHeight = Math.min(halfSize, percent / 50 * halfSize);
  const topTintOpacity = Math.min(0.38, 0.08 + percent / 100 * 0.26);
  const colorAlpha = Math.round(topTintOpacity * 255).toString(16).padStart(2, "0");
  const grayTop = "linear-gradient(145deg, rgba(255,255,255,0.38), rgba(226,232,240,0.18))";
  const grayBottom = "linear-gradient(145deg, rgba(148,163,184,0.98), rgba(71,85,105,0.98))";
  const colorFill = `linear-gradient(145deg, ${color1}, ${color2})`;

  return (
    <div
      title={`${label}: ${unlocked}/${total}`}
      aria-label={`${label}: ${unlocked} of ${total}`}
      style={{
        width: "100%",
        height: 112,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <motion.div
        initial={{ y: 6, rotate: -3, scale: 0.96 }}
        animate={{ y: 0, rotate: complete ? 3 : -3, scale: complete ? 1.03 : 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 22 }}
        style={{
          width: capsuleSize,
          height: capsuleSize,
          borderRadius: "50%",
          boxShadow: unlocked > 0
            ? `0 13px 28px ${color1}38, 0 0 18px ${color1}38`
            : "0 10px 22px rgba(15,23,42,0.18)",
          position: "relative",
        }}
      >
        <motion.div
          initial={{ scale: 0.84, opacity: 0.7 }}
          animate={{ scale: complete ? 1.08 : 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 56,
            height: 56,
            marginTop: -28,
            marginLeft: -28,
            borderRadius: "50%",
            background: `radial-gradient(circle at 32% 24%, rgba(255,255,255,0.96), ${color1} 54%, ${color2} 100%)`,
            border: "1px solid rgba(255,255,255,0.72)",
            boxShadow: `0 12px 22px rgba(15,23,42,0.3), 0 0 24px ${color1}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 31,
            textShadow: "0 2px 8px rgba(0,0,0,0.24)",
            zIndex: 1,
          }}
        >
          {emoji}
        </motion.div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: capsuleSize,
            height: halfSize,
            borderRadius: `${halfSize}px ${halfSize}px 8px 8px`,
            background: `${grayTop}, linear-gradient(145deg, ${color1}${colorAlpha}, ${color2}22)`,
            border: `2px solid ${complete ? color1 : "rgba(255,255,255,0.72)"}`,
            borderBottom: "none",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72), 0 10px 20px rgba(15,23,42,0.16)",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 19,
              width: 28,
              height: 11,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.58)",
              transform: "rotate(-24deg)",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            width: capsuleSize,
            bottom: 0,
            height: halfSize,
            borderRadius: `8px 8px ${halfSize}px ${halfSize}px`,
            background: grayBottom,
            border: `2px solid ${complete ? color1 : "rgba(255,255,255,0.72)"}`,
            borderTop: "none",
            boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.18), 0 10px 20px rgba(15,23,42,0.18)",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: bottomFillHeight }}
            transition={{ duration: 0.62, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              background: colorFill,
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: halfSize - 3,
            height: 7,
            background: "rgba(30,41,59,0.26)",
            boxShadow: "0 -1px 0 rgba(255,255,255,0.28), 0 1px 0 rgba(255,255,255,0.16)",
            zIndex: 3,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: 10,
            transform: "translateX(-50%)",
            minWidth: 42,
            padding: "3px 6px",
            borderRadius: 999,
            background: "rgba(15,23,42,0.28)",
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#fff",
            fontFamily: "var(--ui-font)",
            fontSize: 9,
            fontWeight: 1000,
            lineHeight: 1,
            textAlign: "center",
            textShadow: "0 1px 3px rgba(0,0,0,0.35)",
            zIndex: 4,
          }}
        >
          {unlocked}/{total}
        </span>
      </motion.div>
    </div>
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
