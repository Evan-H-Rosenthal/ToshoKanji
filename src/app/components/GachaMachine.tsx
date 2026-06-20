import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { KANJI, RADICALS } from "../data/kanjiData";

export const DOME_BALLS = [
  {color:"#ff3d71",x:18,y:28},{color:"#00d2ff",x:52,y:50},{color:"#ffd700",x:88,y:20},
  {color:"#7fff00",x:125,y:48},{color:"#a855f7",x:158,y:25},{color:"#ff8c00",x:34,y:68},
  {color:"#00d2ff",x:105,y:72},{color:"#ff3d71",x:142,y:65},{color:"#ffd700",x:72,y:16},
];

export function GachaMachine({ onUnlock, getItem, allUnlocked }: {
  onUnlock: (type: "kanji"|"radical", id: string) => void;
  getItem: () => { type:"kanji"|"radical"; id:string } | null;
  allUnlocked: boolean;
}) {
  const [knobDeg, setKnobDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [capsule, setCapsule] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [capsuleChar, setCapsuleChar] = useState("");

  const handleSpin = useCallback(() => {
    if (spinning || capsule || allUnlocked) return;
    setSpinning(true);
    setKnobDeg(d => d + 900);
    setTimeout(() => {
      const item = getItem();
      if (item) {
        const entry = item.type === "kanji"
          ? KANJI.find(k => k.id === item.id)
          : RADICALS.find(r => r.id === item.id);
        setCapsuleChar(entry?.char ?? "?");
        setCapsule(item);
      }
      setSpinning(false);
    }, 1300);
  }, [spinning, capsule, allUnlocked, getItem]);

  const handleCapsuleTap = () => {
    if (!capsule || capsuleOpen) return;
    setCapsuleOpen(true);
    setTimeout(() => {
      onUnlock(capsule.type, capsule.id);
      setCapsule(null);
      setCapsuleOpen(false);
      setCapsuleChar("");
    }, 1800);
  };

  const capsuleColor = capsule?.type === "kanji" ? "#ff3d71" : "#00d2ff";

  return (
    <div className="flex flex-col items-center select-none">
      {/* Glass dome */}
      <div className="relative" style={{ width: 224, height: 130 }}>
        <div className="absolute inset-0 overflow-hidden" style={{
          borderRadius: "112px 112px 0 0",
          background: "linear-gradient(160deg, rgba(180,230,255,0.22) 0%, rgba(100,160,255,0.08) 100%)",
          border: "2px solid rgba(130,200,255,0.35)",
          borderBottom: "none",
        }}>
          {DOME_BALLS.map((b, i) => (
            <motion.div key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              style={{ position:"absolute", left: b.x, top: b.y, width: 16, height: 20, borderRadius: "50%", background: b.color, boxShadow: `0 2px 8px ${b.color}88` }}
            />
          ))}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 60%)", borderRadius:"inherit", pointerEvents:"none" }} />
        </div>
        {/* dome base rim */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:8, background:"linear-gradient(90deg,#cc2255,#ff6b35,#cc2255)", borderRadius:"0 0 4px 4px" }} />
      </div>

      {/* Machine body */}
      <div className="relative" style={{
        width: 224, minHeight: 180,
        background: "linear-gradient(135deg, #ff4567 0%, #cc2255 50%, #e8362e 100%)",
        borderRadius: "0 0 20px 20px",
        boxShadow: "0 12px 40px rgba(255,61,113,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
        padding: "16px 16px 20px",
      }}>
        {/* decorative stripes */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"linear-gradient(90deg,#ffd700,#ff8c00,#ffd700)", opacity:0.9 }} />

        <div className="text-center mb-3">
          <div style={{ fontFamily:"Nunito, sans-serif", fontWeight:900, fontSize:20, color:"#fff", letterSpacing:"0.1em", textShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>TOSHO KANJI</div>
          <div style={{ fontFamily:"Noto Serif JP, serif", fontWeight:700, fontSize:13, color:"#ffd700", letterSpacing:"0.15em" }}>ガチャ　¥100</div>
        </div>

        {/* Display window showing ball count */}
        <div style={{ background:"rgba(0,0,0,0.35)", borderRadius:8, padding:"6px 10px", marginBottom:12, textAlign:"center", border:"1px solid rgba(255,255,255,0.15)" }}>
          <span style={{ fontFamily:"Nunito, sans-serif", fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:700 }}>
            {allUnlocked ? "✓ ALL UNLOCKED" : `${KANJI.length + RADICALS.length} entries to discover`}
          </span>
        </div>

        {/* Stars decoration */}
        <div className="flex justify-center gap-1 mb-3">
          {["★","★","★","★","★"].map((s, i) => (
            <span key={i} style={{ fontSize:14, color:"#ffd700", opacity: spinning ? 1 : 0.7, textShadow: spinning ? "0 0 12px #ffd700" : "none", transition:"all 0.3s" }}>{s}</span>
          ))}
        </div>

        {/* Knob section */}
        <div className="flex items-center justify-between">
          {/* Coin slot */}
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ width:8, height:28, background:"rgba(0,0,0,0.5)", borderRadius:4, border:"1px solid rgba(255,255,255,0.1)" }} />
            <div style={{ width:24, height:5, background:"rgba(0,0,0,0.6)", borderRadius:3, border:"1px solid rgba(255,255,255,0.1)" }} />
          </div>

          {/* Knob */}
          <div className="relative flex items-center justify-center" style={{ width:72, height:72 }}>
            <div style={{ position:"absolute", width:72, height:72, borderRadius:"50%", background:"rgba(0,0,0,0.3)", boxShadow:"0 4px 12px rgba(0,0,0,0.4)" }} />
            <motion.button
              onClick={handleSpin}
              disabled={spinning || !!capsule || allUnlocked}
              animate={{ rotate: knobDeg }}
              transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                width: 58, height: 58, borderRadius: "50%",
                background: "linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)",
                boxShadow: spinning ? "0 0 24px rgba(255,215,0,0.8)" : "0 4px 16px rgba(255,140,0,0.4)",
                cursor: (spinning || !!capsule || allUnlocked) ? "default" : "pointer",
                border: "3px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 3,
                position: "relative", zIndex: 1,
                transition: "box-shadow 0.3s",
              }}
              whileHover={(!spinning && !capsule && !allUnlocked) ? { scale: 1.05 } : {}}
              whileTap={(!spinning && !capsule && !allUnlocked) ? { scale: 0.95 } : {}}
            >
              {[0,60,120].map(deg => (
                <div key={deg} style={{ position:"absolute", width:4, height:18, background:"rgba(180,100,0,0.5)", borderRadius:2, transform:`rotate(${deg}deg)`, top:"50%", left:"50%", marginLeft:-2, marginTop:-9 }} />
              ))}
              <div style={{ width:12, height:12, borderRadius:"50%", background:"rgba(0,0,0,0.3)", border:"2px solid rgba(255,255,255,0.4)", position:"relative", zIndex:2 }} />
            </motion.button>
          </div>

          {/* Label */}
          <div style={{ width:36, textAlign:"center" }}>
            <div style={{ fontFamily:"Nunito, sans-serif", fontSize:9, fontWeight:800, color:"rgba(255,255,255,0.8)", lineHeight:1.2, letterSpacing:"0.05em" }}>
              {spinning ? "..." : (capsule ? "TAP!" : "TURN")}
            </div>
          </div>
        </div>

        {/* Bottom rim */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:6, background:"rgba(0,0,0,0.3)", borderRadius:"0 0 20px 20px" }} />
      </div>

      {/* Capsule chute & tray */}
      <div className="relative flex flex-col items-center" style={{ width:224 }}>
        <div style={{ width:80, height:36, background:"linear-gradient(to bottom, #1a1040, #120c30)", borderRadius:"0 0 16px 16px", border:"2px solid rgba(100,80,160,0.4)", borderTop:"none", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:4, left:"50%", transform:"translateX(-50%)", width:40, height:28, background:"rgba(0,0,0,0.4)", borderRadius:10 }} />
        </div>

        {/* Capsule */}
        <AnimatePresence>
          {capsule && (
            <motion.div
              key="capsule"
              initial={{ y: -80, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              style={{ position:"absolute", top: 4 }}
              onClick={handleCapsuleTap}
            >
              <motion.div
                animate={!capsuleOpen ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ position:"relative", width:60, height:64, cursor:"pointer" }}
              >
                {/* Top half */}
                <motion.div
                  animate={capsuleOpen ? { y: -30, opacity: 0 } : { y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    position:"absolute", top:0, left:0, right:0, height:"52%",
                    borderRadius:"30px 30px 0 0",
                    background: `linear-gradient(135deg, ${capsuleColor}dd, ${capsuleColor}99)`,
                    boxShadow: capsuleOpen ? "none" : `0 0 20px ${capsuleColor}66`,
                  }}
                >
                  <div style={{ position:"absolute", top:6, left:8, width:18, height:10, background:"rgba(255,255,255,0.35)", borderRadius:"50%", transform:"rotate(-20deg)" }} />
                </motion.div>
                {/* Bottom half */}
                <motion.div
                  animate={capsuleOpen ? { y: 30, opacity: 0 } : { y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    position:"absolute", bottom:0, left:0, right:0, height:"52%",
                    borderRadius:"0 0 30px 30px",
                    background: "linear-gradient(135deg, #f0f0f0, #d0d0d0)",
                  }}
                />
                {/* Center seam */}
                <div style={{ position:"absolute", top:"48%", left:0, right:0, height:3, background:"rgba(0,0,0,0.15)", zIndex:2 }} />
                {/* Revealed char */}
                <AnimatePresence>
                  {capsuleOpen && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.25, type:"spring", stiffness:500, damping:15 }}
                      style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}
                    >
                      <span style={{ fontFamily:"Noto Serif JP, serif", fontSize:32, fontWeight:700, color: capsuleColor, filter:"drop-shadow(0 0 12px " + capsuleColor + ")" }}>
                        {capsuleChar}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Glow ring */}
                {!capsuleOpen && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`2px solid ${capsuleColor}`, pointerEvents:"none" }}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint text */}
      <div className="mt-6 text-center" style={{ minHeight:32 }}>
        {allUnlocked ? (
          <p style={{ fontFamily:"Nunito", fontWeight:700, fontSize:13, color:"#ffd700" }}>You have unlocked everything! 🎉</p>
        ) : spinning ? (
          <motion.p animate={{ opacity:[1,0.4,1] }} transition={{ duration:0.6, repeat:Infinity }} style={{ fontFamily:"Nunito", fontWeight:700, fontSize:13 }} className="text-muted-foreground">Spinning...</motion.p>
        ) : capsule ? (
          <p style={{ fontFamily:"Nunito", fontWeight:800, fontSize:13, color:"#ffd700" }}>Tap the capsule to reveal! ✨</p>
        ) : (
          <p style={{ fontFamily:"Nunito", fontWeight:700, fontSize:12 }} className="text-muted-foreground">Turn the knob to get a new kanji or radical</p>
        )}
      </div>
    </div>
  );
}

// ── Collection Card ────────────────────────────────────────────────────────────
