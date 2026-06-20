import { motion } from "motion/react";
import { Lock, Star } from "lucide-react";

export function CollectionCard({ char, label, color1, color2, starred, onStar, onClick }: {
  char: string; label: string; color1: string; color2: string;
  starred: boolean; onStar: (e: React.MouseEvent) => void; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-2xl overflow-hidden text-left"
      style={{
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
        boxShadow: `0 4px 16px ${color1}44`,
        aspectRatio: "1",
        padding: 0,
      }}
    >
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
    </motion.button>
  );
}

// ── Kanji Screen ───────────────────────────────────────────────────────────────
