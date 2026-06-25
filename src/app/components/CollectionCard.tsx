import { motion } from "motion/react";
import { Lock, Star } from "lucide-react";
import { getReadableTextColor } from "../data/ui/categoryColors";

const CARD_SPARKLES = [
  { x: [15, 74, 42, 83], y: [12, 18, 76, 52], size: 12, delay: 0 },
  { x: [68, 22, 81, 34], y: [72, 44, 14, 84], size: 14, delay: 0.18 },
  { x: [38, 88, 18, 62], y: [18, 76, 62, 28], size: 11, delay: 0.36 },
  { x: [82, 48, 27, 72], y: [39, 86, 21, 77], size: 13, delay: 0.54 },
];

export function CollectionCard({ char, label, color1, color2, textColor = getReadableTextColor(color1, color2), starred, highlighted = false, onStar, onClick }: {
  char: string; label: string; color1: string; color2: string; textColor?: string;
  starred: boolean; highlighted?: boolean; onStar: (e: React.MouseEvent) => void; onClick: () => void;
}) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      animate={highlighted ? { scale: [1, 1.06, 1], y: [0, -3, 0] } : { scale: 1, y: 0 }}
      transition={highlighted ? { duration: 1.15, repeat: Infinity, ease: "easeInOut" } : { duration: 0.18 }}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-2xl overflow-hidden text-left"
      style={{
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
        boxShadow: highlighted ? `0 0 0 3px rgba(255,255,255,0.95), 0 0 26px ${color1}` : `0 4px 16px ${color1}44`,
        aspectRatio: "1",
        padding: 0,
        cursor: "pointer",
      }}
    >
      {highlighted && (
        <>
          {CARD_SPARKLES.map((sparkle, index) =>
            sparkle.x.map((x, pointIndex) => (
              <motion.span
                key={`${index}-${pointIndex}`}
                animate={{
                  opacity: [0, 1, 0.6, 0],
                  scale: [0, 1.25, 0.84, 0],
                  rotate: [0, 24, -8, 0],
                }}
                transition={{
                  duration: 0.68,
                  repeat: Infinity,
                  repeatDelay: 2.32,
                  delay: sparkle.delay + pointIndex * 0.75,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${sparkle.y[pointIndex]}%`,
                  color: "#fff7a8",
                  fontSize: sparkle.size,
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                *
              </motion.span>
            ))
          )}
        </>
      )}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:"8px 4px 4px" }}>
        <span style={{ fontFamily:"var(--jp-font)", fontWeight:700, fontSize:36, color:textColor, lineHeight:1, textShadow: textColor === "#111827" ? "none" : "0 2px 8px rgba(0,0,0,0.3)" }}>{char}</span>
        <span style={{ fontFamily:"var(--ui-font)", fontSize:20, fontWeight:700, color:textColor, marginTop:4, textAlign:"center", lineHeight:1.1, padding:"0 4px" }}>{label}</span>
      </div>
      <button
        onClick={onStar}
        style={{
          position:"absolute", top:6, right:6,
          width:24, height:24, borderRadius:"50%",
          background:"rgba(0,0,0,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center",
          border:"none", cursor:"pointer",
          padding:0,
        }}
      >
        <Star size={12} fill={starred ? "#ffd700" : "none"} color={starred ? "#ffd700" : "rgba(255,255,255,0.8)"} />
      </button>
    </motion.div>
  );
}

// ── Kanji Screen ───────────────────────────────────────────────────────────────
