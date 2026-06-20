import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { KANJI, RADICALS } from "../data/kanjiData";

const BANK_CAPSULES = [
  { color: "#ef4444", x: 8, y: 96, size: 42, rotate: -18 },
  { color: "#2563eb", x: 42, y: 88, size: 39, rotate: 14 },
  { color: "#f59e0b", x: 76, y: 102, size: 43, rotate: 28 },
  { color: "#22c55e", x: 116, y: 91, size: 40, rotate: -31 },
  { color: "#e11d48", x: 151, y: 100, size: 45, rotate: 9 },
  { color: "#7c3aed", x: 30, y: 124, size: 46, rotate: 34 },
  { color: "#06b6d4", x: 70, y: 122, size: 42, rotate: -8 },
  { color: "#f97316", x: 108, y: 126, size: 44, rotate: 19 },
  { color: "#ec4899", x: 149, y: 128, size: 39, rotate: -21 },
  { color: "#84cc16", x: 178, y: 120, size: 41, rotate: 22 },
  { color: "#fb7185", x: 5, y: 135, size: 42, rotate: -38 },
  { color: "#38bdf8", x: 47, y: 143, size: 43, rotate: 11 },
  { color: "#fbbf24", x: 91, y: 145, size: 45, rotate: -13 },
  { color: "#a855f7", x: 136, y: 145, size: 42, rotate: 36 },
  { color: "#10b981", x: 177, y: 143, size: 40, rotate: -16 },
];

const SHUFFLE_CAPSULES = [
  { color: "#ef4444", x: 39, y: 115, size: 39, rotate: 18, delay: 0 },
  { color: "#06b6d4", x: 101, y: 108, size: 35, rotate: -23, delay: 0.12 },
  { color: "#f59e0b", x: 154, y: 119, size: 37, rotate: 31, delay: 0.22 },
];

function CapsuleBall({ color, size, rotate = 0 }: { color: string; size: number; rotate?: number }) {
  const halfHeight = Math.max(5, size * 0.48);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        transform: `rotate(${rotate}deg)`,
        filter: "drop-shadow(0 5px 8px rgba(30,25,15,0.22))",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "linear-gradient(145deg, rgba(255,255,255,0.88), rgba(222,226,232,0.92))",
          border: "1px solid rgba(255,255,255,0.75)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: halfHeight,
            background: `linear-gradient(145deg, ${color}, ${color}bb)`,
            borderRadius: `${size}px ${size}px 4px 4px`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: halfHeight - 1,
            left: 0,
            right: 0,
            height: 3,
            background: "rgba(45,45,45,0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: size * 0.14,
            left: size * 0.18,
            width: size * 0.26,
            height: size * 0.12,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.55)",
            transform: "rotate(-25deg)",
          }}
        />
      </div>
    </div>
  );
}

export function GachaMachine({
  onUnlock,
  getItem,
  allUnlocked,
}: {
  onUnlock: (type: "kanji" | "radical", id: string) => void;
  getItem: () => { type: "kanji" | "radical"; id: string } | null;
  allUnlocked: boolean;
}) {
  const [knobDeg, setKnobDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [capsule, setCapsule] = useState<{ type: "kanji" | "radical"; id: string } | null>(null);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [capsuleChar, setCapsuleChar] = useState("");
  const [capsuleRotation, setCapsuleRotation] = useState(0);

  const handleSpin = useCallback(() => {
    if (spinning || capsule || allUnlocked) return;

    setSpinning(true);
    setKnobDeg((degrees) => degrees + 360);

    setTimeout(() => {
      const item = getItem();
      if (item) {
        const entry =
          item.type === "kanji"
            ? KANJI.find((kanji) => kanji.id === item.id)
            : RADICALS.find((radical) => radical.id === item.id);

        setCapsuleChar(entry?.char ?? "?");
        setCapsuleRotation(Math.round(Math.random() * 70 - 35));
        setCapsule(item);
      }
      setSpinning(false);
    }, 1350);
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

  const capsuleColor = capsule?.type === "kanji" ? "#ef4444" : "#2563eb";

  return (
    <div className="flex flex-col items-center select-none" style={{ width: 270 }}>
      <motion.div
        animate={spinning ? { y: [0, -7, 5, -6, 4, -4, 2, 0] } : { y: 0 }}
        transition={spinning ? { duration: 0.72, repeat: 1, ease: "easeInOut" } : { duration: 0.2 }}
        style={{
          width: 244,
          position: "relative",
          filter: "drop-shadow(0 22px 36px rgba(0,0,0,0.34))",
        }}
      >
        <div
          style={{
            height: 42,
            borderRadius: "18px 18px 8px 8px",
            background: "linear-gradient(180deg, #fffef7 0%, #eee9d9 100%)",
            border: "1px solid rgba(80,74,62,0.16)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -5px 10px rgba(80,70,45,0.08)",
            position: "relative",
            zIndex: 3,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 13,
              width: 35,
              height: 24,
              borderRadius: 3,
              background: "#c8102e",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Nunito,sans-serif",
              fontWeight: 1000,
              fontSize: 11,
              lineHeight: 0.9,
              letterSpacing: "0.02em",
            }}
          >
            KAN<br />PON
          </div>
          <div
            style={{
              position: "absolute",
              right: 15,
              top: 10,
              color: "#1d5f9f",
              fontFamily: "Nunito,sans-serif",
              fontSize: 15,
              fontWeight: 1000,
              letterSpacing: "0.02em",
              textShadow: "0 1px 0 #fff",
            }}
          >
            かんじ カプセル
          </div>
        </div>

        <div
          style={{
            height: 176,
            marginTop: -2,
            borderRadius: "8px 8px 14px 14px",
            background: "linear-gradient(180deg, rgba(245,238,210,0.42), rgba(226,214,178,0.24))",
            border: "2px solid rgba(53,48,40,0.34)",
            borderTop: "1px solid rgba(53,48,40,0.18)",
            boxShadow: "inset 0 0 32px rgba(255,255,255,0.36), inset 0 -22px 40px rgba(96,72,32,0.13)",
            position: "relative",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "15px 17px 45px",
              borderRadius: 4,
              background: "linear-gradient(180deg, rgba(95,70,42,0.12), rgba(255,255,255,0.04))",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          />

          <AnimatePresence>
            {spinning &&
              SHUFFLE_CAPSULES.map((ball, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: [18, -72, 8, -46, 18], opacity: [0, 1, 1, 0.9, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.95, ease: "easeInOut", delay: ball.delay, repeat: 1 }}
                  style={{ position: "absolute", left: ball.x, top: ball.y, zIndex: 1 }}
                >
                  <CapsuleBall color={ball.color} size={ball.size} rotate={ball.rotate} />
                </motion.div>
              ))}
          </AnimatePresence>

          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 20,
              height: 62,
              borderRadius: "8px 8px 12px 12px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(218,211,190,0.92))",
              boxShadow: "0 -2px 0 rgba(255,255,255,0.55), inset 0 -9px 13px rgba(75,64,42,0.1)",
              zIndex: 3,
            }}
          >
            {[33, 79, 126, 172].map((left) => (
              <div
                key={left}
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 6,
                  left,
                  width: 2,
                  background: "rgba(126,116,91,0.22)",
                }}
              />
            ))}
          </div>

          <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
            {BANK_CAPSULES.map((ball, index) => (
              <div key={index} style={{ position: "absolute", left: ball.x, top: ball.y }}>
                <CapsuleBall color={ball.color} size={ball.size} rotate={ball.rotate} />
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(105deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.08) 18%, transparent 24%, transparent 68%, rgba(255,255,255,0.2) 76%, transparent 88%)",
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 11,
              top: 10,
              bottom: 10,
              width: 9,
              borderRadius: 6,
              background: "rgba(255,255,255,0.32)",
              filter: "blur(1px)",
              zIndex: 6,
            }}
          />
        </div>

        <div
          style={{
            height: 252,
            marginTop: 0,
            borderRadius: "8px 8px 22px 22px",
            background: "linear-gradient(180deg, #fffdf2 0%, #f0ead9 67%, #dfd5bd 100%)",
            border: "1px solid rgba(80,74,62,0.18)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -14px 25px rgba(76,63,38,0.11)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 19,
              left: 23,
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "linear-gradient(145deg,#fafafa,#d8d5cc)",
              border: "2px solid rgba(128,110,86,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c8102e",
              fontFamily: "Nunito,sans-serif",
              fontSize: 15,
              fontWeight: 1000,
            }}
          >
            ¥100
          </div>

          <div
            style={{
              position: "absolute",
              top: 22,
              right: 28,
              width: 46,
              height: 46,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 32% 28%, #ffffff 0%, #efefef 22%, #9ca3af 52%, #f8fafc 67%, #64748b 100%)",
              border: "2px solid rgba(90,88,80,0.36)",
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.35)",
            }}
          >
            <div style={{ position: "absolute", left: 19, top: 5, width: 4, height: 32, background: "#1f2937", borderRadius: 4 }} />
          </div>

          <div
            style={{
              position: "absolute",
              top: 69,
              left: 70,
              width: 104,
              height: 104,
              borderRadius: "50%",
              background: "#034fbb",
              boxShadow: "inset 0 0 0 4px #f7e54a, inset 0 0 0 12px #034fbb, 0 8px 18px rgba(22,50,90,0.22)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 14,
                borderRadius: "50%",
                background: "linear-gradient(145deg,#fffef5,#dcd4c2)",
                boxShadow: "inset -9px -9px 18px rgba(97,84,62,0.16), inset 5px 5px 10px rgba(255,255,255,0.85)",
              }}
            />
            <motion.button
              onClick={handleSpin}
              disabled={spinning || !!capsule || allUnlocked}
              animate={{ rotate: knobDeg }}
              transition={{ duration: 0.8, ease: [0.22, 0.9, 0.32, 1] }}
              whileHover={!spinning && !capsule && !allUnlocked ? { scale: 1.03 } : {}}
              whileTap={!spinning && !capsule && !allUnlocked ? { scale: 0.97 } : {}}
              style={{
                position: "absolute",
                inset: 22,
                border: "none",
                borderRadius: "50%",
                cursor: spinning || capsule || allUnlocked ? "default" : "pointer",
                background: "linear-gradient(145deg,#fffef7,#d5ccbb)",
                boxShadow: "0 7px 12px rgba(55,45,30,0.26), inset 4px 4px 9px rgba(255,255,255,0.9), inset -6px -6px 12px rgba(90,75,52,0.14)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 11,
                  right: 11,
                  top: "50%",
                  height: 10,
                  marginTop: -5,
                  borderRadius: 20,
                  background: "linear-gradient(180deg,#e7dfcd,#bfb49d)",
                  transform: "rotate(26deg)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              />
            </motion.button>
          </div>

          <div
            style={{
              position: "absolute",
              top: 30,
              left: 87,
              width: 69,
              height: 27,
              borderRadius: 7,
              background: "#064fae",
              color: "#fff",
              fontFamily: "Nunito,sans-serif",
              fontSize: 10,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            COIN IN <span style={{ color: "#facc15" }}>{">"}</span>
          </div>

          <div
            style={{
              position: "absolute",
              left: 15,
              bottom: 15,
              width: 72,
              height: 70,
              borderRadius: "19px 19px 24px 24px",
              background: "linear-gradient(145deg,#20242a,#060709)",
              border: "5px solid #e8e0c8",
              boxShadow: "inset 0 7px 14px rgba(0,0,0,0.62), 0 3px 0 rgba(80,67,45,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.08)",
              fontFamily: "Nunito,sans-serif",
              fontSize: 19,
              fontWeight: 1000,
            }}
          >
            KAN<br />PON
            <div style={{ position: "absolute", bottom: -3, left: "50%", width: 28, height: 8, marginLeft: -14, borderRadius: "8px 8px 0 0", background: "#0a0b0d" }} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 10,
              top: 70,
              width: 50,
              bottom: 100,
              background: "linear-gradient(180deg, #fffdf2 0%, #f0ead9 67%, #dfd5bd 100%)",
              pointerEvents: "none",
              zIndex: 7,
            }}
          />

          <div
            style={{
              position: "absolute",
              right: 30,
              bottom: 31,
              width: 38,
              height: 52,
              borderRadius: "8px 8px 14px 14px",
              background: "linear-gradient(180deg,#ded8c9,#a9a08d)",
              border: "3px solid #f8f2df",
              boxShadow: "inset 0 7px 13px rgba(60,50,35,0.26), 0 2px 0 rgba(90,75,50,0.2)",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -2, left: 12, width: 12, height: 9, borderRadius: "0 0 5px 5px", background: "#fff9e8" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 18, background: "rgba(70,60,45,0.16)" }} />
          </div>

          <AnimatePresence>
            {capsule && (
              <motion.div
                key="capsule"
                initial={{ y: -128, rotate: capsuleRotation - 96 }}
                animate={{
                  y: [-128, 0, -22, 0, -9, 0],
                  rotate: [
                    capsuleRotation - 96,
                    capsuleRotation - 34,
                    capsuleRotation - 18,
                    capsuleRotation + 9,
                    capsuleRotation - 4,
                    capsuleRotation,
                  ],
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{
                  y: { duration: 1.45, times: [0, 0.56, 0.72, 0.84, 0.93, 1], ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] },
                  rotate: { duration: 1.45, times: [0, 0.56, 0.72, 0.84, 0.93, 1], ease: "easeOut" },
                }}
                onClick={handleCapsuleTap}
                style={{
                  position: "absolute",
                  left: 31,
                  bottom: 17,
                  width: 40,
                  height: 40,
                  cursor: capsuleOpen ? "default" : "pointer",
                  zIndex: 6,
                }}
              >
                <motion.div
                  style={{ position: "relative", width: 40, height: 40 }}
                >
                  <motion.div
                    animate={capsuleOpen ? { y: -24, opacity: 0, rotate: -18 } : { y: 0, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.42, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "linear-gradient(145deg,#f8fafc,#d6d6d6)",
                      boxShadow: `0 3px 10px ${capsuleColor}66, 0 7px 12px rgba(0,0,0,0.22)`,
                    }}
                  >
                    <div style={{ position: "absolute", inset: "0 0 19px", background: `linear-gradient(145deg, ${capsuleColor}, ${capsuleColor}bb)` }} />
                    <div style={{ position: "absolute", top: 18, left: 0, right: 0, height: 3, background: "rgba(0,0,0,0.18)" }} />
                    <div style={{ position: "absolute", top: 7, left: 8, width: 12, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.52)", transform: "rotate(-25deg)" }} />
                  </motion.div>
                  <AnimatePresence>
                    {capsuleOpen && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.22, type: "spring", stiffness: 500, damping: 16 }}
                        style={{
                          position: "absolute",
                          inset: -2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Noto Serif JP,serif",
                            fontSize: 31,
                            fontWeight: 800,
                            color: capsuleColor,
                            filter: `drop-shadow(0 0 10px ${capsuleColor}88)`,
                          }}
                        >
                          {capsuleChar}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 26px",
            marginTop: -1,
          }}
        >
          {[0, 1].map((wheel) => (
            <div
              key={wheel}
              style={{
                width: 28,
                height: 24,
                borderRadius: "0 0 10px 10px",
                background: "linear-gradient(180deg,#2f2f2f,#080808)",
                boxShadow: "inset 0 -4px 7px rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
      </motion.div>

      <div className="mt-4 text-center" style={{ minHeight: 32 }}>
        {allUnlocked ? (
          <p style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 13, color: "#ffd700" }}>
            You have unlocked everything!
          </p>
        ) : spinning ? (
          <motion.p
            animate={{ opacity: [1, 0.45, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 13 }}
            className="text-muted-foreground"
          >
            Stirring capsules...
          </motion.p>
        ) : capsule ? (
          <p style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: 13, color: "#ffd700" }}>
            Tap the capsule to reveal!
          </p>
        ) : (
          <p style={{ fontFamily: "Nunito,sans-serif", fontWeight: 700, fontSize: 12 }} className="text-muted-foreground">
            Turn the knob to get a new kanji or radical
          </p>
        )}
      </div>
    </div>
  );
}
