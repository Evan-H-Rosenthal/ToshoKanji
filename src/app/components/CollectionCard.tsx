import { motion } from "motion/react";
import { Lock, Star } from "lucide-react";

export function CollectionCard({ char, label, color1, color2, starred, highlighted = false, onStar, onClick }: {
  char: string; label: string; color1: string; color2: string;
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
          {[0, 1, 2, 3].map((sparkle) => (
            <motion.span
              key={sparkle}
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1.2, 0.7], rotate: [0, 25, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: sparkle * 0.16 }}
              style={{
                position: "absolute",
                left: `${18 + sparkle * 18}%`,
                top: sparkle % 2 === 0 ? 9 : 68,
                color: "#fff7a8",
                fontSize: 13,
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              *
            </motion.span>
          ))}
        </>
      )}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:"8px 4px 4px" }}>
        <span style={{ fontFamily:"Noto Serif JP, serif", fontWeight:700, fontSize:36, color:"rgba(255,255,255,0.95)", lineHeight:1, textShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>{char}</span>
        <span style={{ fontFamily:"Nunito, sans-serif", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.8)", marginTop:4, textAlign:"center", lineHeight:1.1, padding:"0 4px" }}>{label}</span>
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
