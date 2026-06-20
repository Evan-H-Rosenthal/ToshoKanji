import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CAT_COLORS, KANJI, RAD_COLORS, RADICALS } from "../data/kanjiData";

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
  const [rewardStage, setRewardStage] = useState<"idle" | "dispensed" | "center" | "opened" | "collecting">("idle");

  const handleSpin = useCallback(() => {
    if (spinning || capsule || rewardStage !== "idle" || allUnlocked) return;

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
        setRewardStage("dispensed");
        setTimeout(() => {
          setRewardStage("center");
        }, 1650);
      }
      setSpinning(false);
    }, 1350);
  }, [spinning, capsule, rewardStage, allUnlocked, getItem]);

  const handleCapsuleTap = () => {
    if (!capsule || capsuleOpen || rewardStage !== "center") return;

    setCapsuleOpen(true);
    setRewardStage("opened");
  };

  const handleCollectReward = () => {
    if (!capsule || rewardStage !== "opened") return;

    setRewardStage("collecting");
    setTimeout(() => {
      onUnlock(capsule.type, capsule.id);
      setCapsule(null);
      setCapsuleOpen(false);
      setCapsuleChar("");
      setRewardStage("idle");
    }, 720);
  };

  const rewardColors = (() => {
    if (!capsule) return { primary: "#ef4444", secondary: "#f97316" };

    if (capsule.type === "kanji") {
      const entry = KANJI.find((kanji) => kanji.id === capsule.id);
      const [primary, secondary] = CAT_COLORS[entry?.category ?? "nature"] ?? ["#ef4444", "#f97316"];
      return { primary, secondary };
    }

    const index = Math.max(0, RADICALS.findIndex((radical) => radical.id === capsule.id));
    return {
      primary: RAD_COLORS[index % RAD_COLORS.length],
      secondary: RAD_COLORS[(index + 4) % RAD_COLORS.length],
    };
  })();

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
              left: 21,
              right: 21,
              bottom: 36,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #fffbeb 0%, #facc15 45%, #f97316 100%)",
              border: "2px solid rgba(255,255,255,0.78)",
              boxShadow: "0 7px 16px rgba(120,74,20,0.28), inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -4px 8px rgba(154,80,14,0.18)",
              color: "#7c2d12",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Nunito, Noto Serif JP, sans-serif",
              fontSize: 13,
              fontWeight: 1000,
              letterSpacing: "0.02em",
              textShadow: "0 1px 0 rgba(255,255,255,0.65)",
              zIndex: 3,
            }}
          >
            ハンドルを回せ！漢字ゲット！
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
              overflow: "hidden",
              zIndex: 7,
            }}
          >
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
              KAN<br />PON
            </div>

            <AnimatePresence>
              {capsule && rewardStage === "dispensed" && (
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
                    left: 16,
                    bottom: 2,
                    width: 40,
                    height: 40,
                    cursor: capsuleOpen ? "default" : "pointer",
                    zIndex: 2,
                  }}
                >
                  <motion.div style={{ position: "relative", width: 40, height: 40 }}>
                    <motion.div
                      animate={capsuleOpen ? { y: -24, opacity: 0, rotate: -18 } : { y: 0, opacity: 1, rotate: 0 }}
                      transition={{ duration: 0.42, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: `linear-gradient(145deg, ${rewardColors.secondary}, ${rewardColors.secondary}bb)`,
                        boxShadow: `0 3px 10px ${rewardColors.primary}66, 0 7px 12px rgba(0,0,0,0.22)`,
                      }}
                    >
                      <div style={{ position: "absolute", inset: "0 0 19px", background: `linear-gradient(145deg, ${rewardColors.primary}, ${rewardColors.primary}bb)` }} />
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
                              color: rewardColors.primary,
                              filter: `drop-shadow(0 0 10px ${rewardColors.primary}88)`,
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
        ) : rewardStage === "opened" ? (
          <p style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: 13, color: "#ffd700" }}>
            Tap the character to collect!
          </p>
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

      <AnimatePresence>
        {capsule && rewardStage !== "dispensed" && (
          <motion.div
            key="reward-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: rewardStage === "collecting" ? "transparent" : "rgba(5,4,17,0.56)",
              zIndex: 80,
              pointerEvents: "auto",
            }}
          >
            <motion.div
              initial={{ x: -98, y: 176, scale: 0.42, rotate: capsuleRotation }}
              animate={
                rewardStage === "collecting"
                  ? {
                      x: capsule.type === "kanji" ? -118 : 118,
                      y: 300,
                      scale: 0.28,
                      rotate: 0,
                      opacity: 0,
                    }
                  : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }
              }
              transition={
                rewardStage === "collecting"
                  ? { duration: 0.65, ease: [0.2, 0.9, 0.25, 1] }
                  : { duration: 0.72, ease: [0.19, 1, 0.22, 1] }
              }
              onClick={rewardStage === "center" ? handleCapsuleTap : rewardStage === "opened" ? handleCollectReward : undefined}
              style={{
                width: 146,
                height: 146,
                position: "relative",
                cursor: rewardStage === "center" || rewardStage === "opened" ? "pointer" : "default",
              }}
            >
              <AnimatePresence>
                {rewardStage === "center" && (
                  <motion.div
                    key="closed-reward-capsule"
                    initial={{ scale: 0.94 }}
                    animate={{ scale: [1, 1.03, 1] }}
                    exit={{ scale: [1, 0.82, 1.18], opacity: 0 }}
                    transition={{ duration: 0.38, ease: "easeInOut" }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: `linear-gradient(145deg, ${rewardColors.secondary}, ${rewardColors.secondary}bb)`,
                      boxShadow: `0 22px 48px rgba(0,0,0,0.32), 0 0 34px ${rewardColors.primary}88`,
                    }}
                  >
                    <div style={{ position: "absolute", inset: "0 0 70px", background: `linear-gradient(145deg, ${rewardColors.primary}, ${rewardColors.primary}bb)` }} />
                    <div style={{ position: "absolute", top: 70, left: 0, right: 0, height: 7, background: "rgba(0,0,0,0.16)" }} />
                    <div style={{ position: "absolute", top: 24, left: 28, width: 42, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.52)", transform: "rotate(-25deg)" }} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(rewardStage === "opened" || rewardStage === "collecting") && (
                  <motion.div
                    key="opened-reward"
                    initial={{ scale: 0.72, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 18 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <motion.div
                      initial={{ y: 0, rotate: 0 }}
                      animate={{ y: -54, rotate: -18, opacity: 0.72 }}
                      transition={{ duration: 0.42, ease: [0.2, 0.9, 0.25, 1] }}
                      style={{
                        position: "absolute",
                        width: 144,
                        height: 72,
                        top: 0,
                        borderRadius: "72px 72px 8px 8px",
                        background: `linear-gradient(145deg, ${rewardColors.primary}, ${rewardColors.primary}bb)`,
                        boxShadow: "0 12px 22px rgba(0,0,0,0.2)",
                      }}
                    />
                    <motion.div
                      initial={{ y: 0, rotate: 0 }}
                      animate={{ y: 54, rotate: 16, opacity: 0.72 }}
                      transition={{ duration: 0.42, ease: [0.2, 0.9, 0.25, 1] }}
                      style={{
                        position: "absolute",
                        width: 144,
                        height: 72,
                        bottom: 0,
                        borderRadius: "8px 8px 72px 72px",
                        background: `linear-gradient(145deg, ${rewardColors.secondary}, ${rewardColors.secondary}bb)`,
                        boxShadow: "0 12px 22px rgba(0,0,0,0.2)",
                      }}
                    />

                    {[0, 1, 2, 3, 4, 5].map((sparkle) => (
                      <motion.span
                        key={sparkle}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 0.85], opacity: [0, 1, 0.6] }}
                        transition={{ duration: 0.9, delay: 0.12 + sparkle * 0.06, repeat: Infinity, repeatDelay: 0.6 }}
                        style={{
                          position: "absolute",
                          left: `${12 + (sparkle % 3) * 36}%`,
                          top: sparkle < 3 ? 18 : 108,
                          color: "#fff7a8",
                          fontSize: 21,
                          fontWeight: 1000,
                        }}
                      >
                        *
                      </motion.span>
                    ))}

                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.18, type: "spring", stiffness: 520, damping: 18 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCollectReward();
                      }}
                      style={{
                        width: 102,
                        height: 102,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 32% 25%, rgba(255,255,255,0.96), ${rewardColors.primary} 52%, ${rewardColors.secondary} 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 16px 34px rgba(0,0,0,0.32), 0 0 34px ${rewardColors.primary}aa`,
                        position: "relative",
                        zIndex: 2,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Noto Serif JP,serif",
                          fontSize: 58,
                          fontWeight: 800,
                          color: "#fff",
                          textShadow: "0 3px 12px rgba(0,0,0,0.28)",
                        }}
                      >
                        {capsuleChar}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
