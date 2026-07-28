import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Lock, Star } from "lucide-react";
import type { KanjiRarity } from "../data/kanjiRarity";
import { getReadableTextColor } from "../data/ui/categoryColors";

const CARD_SPARKLES = [
  { x: [15, 74, 42, 83], y: [12, 18, 76, 52], size: 12, delay: 0 },
  { x: [68, 22, 81, 34], y: [72, 44, 14, 84], size: 14, delay: 0.18 },
  { x: [38, 88, 18, 62], y: [18, 76, 62, 28], size: 11, delay: 0.36 },
  { x: [82, 48, 27, 72], y: [39, 86, 21, 77], size: 13, delay: 0.54 },
];

const CARD_SPARKLE_CHARACTERS = ["·", "+", "∗", "∘"];
const CARD_SPARKLE_TIMING: Record<KanjiRarity, { minPauseMs: number; maxPauseMs: number; stepMs: number }> = {
  common: { minPauseMs: 1350, maxPauseMs: 2500, stepMs: 115 },
  uncommon: { minPauseMs: 980, maxPauseMs: 1850, stepMs: 105 },
  rare: { minPauseMs: 700, maxPauseMs: 1350, stepMs: 96 },
  epic: { minPauseMs: 460, maxPauseMs: 920, stepMs: 88 },
  legendary: { minPauseMs: 250, maxPauseMs: 620, stepMs: 78 },
};
const CARD_SPARKLE_COUNTS: Record<KanjiRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 4,
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function CardSparkle({
  sparkle,
  timing,
}: {
  sparkle: { x: number[]; y: number[]; size: number; delay: number };
  timing: { minPauseMs: number; maxPauseMs: number; stepMs: number };
}) {
  const reduceMotion = useReducedMotion();
  const [locationIndex, setLocationIndex] = useState(0);
  const [characterIndex, setCharacterIndex] = useState(-1);

  useEffect(() => {
    if (reduceMotion) return;
    let timeoutId: number;
    const startDelay = sparkle.delay * 1000 + randomBetween(timing.minPauseMs * 0.25, timing.maxPauseMs * 0.5);

    const runStep = (nextCharacterIndex: number, nextLocationIndex: number) => {
      setLocationIndex(nextLocationIndex);
      setCharacterIndex(nextCharacterIndex);

      if (nextCharacterIndex < CARD_SPARKLE_CHARACTERS.length - 1) {
        timeoutId = window.setTimeout(() => runStep(nextCharacterIndex + 1, nextLocationIndex), timing.stepMs);
        return;
      }

      timeoutId = window.setTimeout(() => {
        setCharacterIndex(-1);
        const nextPause = randomBetween(timing.minPauseMs, timing.maxPauseMs);
        timeoutId = window.setTimeout(
          () => runStep(0, (nextLocationIndex + 1) % sparkle.x.length),
          nextPause
        );
      }, timing.stepMs);
    };

    timeoutId = window.setTimeout(() => runStep(0, 0), startDelay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [reduceMotion, sparkle.delay, sparkle.x.length, timing.maxPauseMs, timing.minPauseMs, timing.stepMs]);

  const character = characterIndex >= 0 ? CARD_SPARKLE_CHARACTERS[characterIndex] : "";

  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: `${sparkle.x[locationIndex]}%`,
        top: `${sparkle.y[locationIndex]}%`,
        color: "#fff7a8",
        fontSize: sparkle.size,
        fontWeight: 1000,
        lineHeight: 1,
        opacity: character ? 1 : 0,
        pointerEvents: "none",
        textShadow: "0 1px 5px rgba(120,74,20,0.38)",
        transform: "translate(-50%, -50%)",
        zIndex: 2,
      }}
    >
      {character}
    </span>
  );
}

export function CollectionCard({ char, label, matchReason, color1, color2, textColor = getReadableTextColor(color1, color2), starred, highlighted = false, sparkleRarity = "common", wordCard = false, onStar, onClick }: {
  char: string; label: string; color1: string; color2: string; textColor?: string;
  matchReason?: string; starred: boolean; highlighted?: boolean; sparkleRarity?: KanjiRarity; wordCard?: boolean; onStar: (e: React.MouseEvent) => void; onClick: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const charLength = Array.from(char).length;
  const wordCharSize = charLength > 16 ? 14 : charLength > 10 ? 16 : charLength > 6 ? 20 : 28;
  const labelSize = wordCard ? 12 : 20;
  const sparkleTiming = CARD_SPARKLE_TIMING[sparkleRarity];
  const sparkleCount = CARD_SPARKLE_COUNTS[sparkleRarity];

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
      animate={highlighted && !reduceMotion ? { scale: [1, 1.06, 1], y: [0, -3, 0] } : { scale: 1, y: 0 }}
      transition={highlighted && !reduceMotion ? { duration: 1.15, repeat: Infinity, ease: "easeInOut" } : { duration: reduceMotion ? 0 : 0.18 }}
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
          {CARD_SPARKLES.slice(0, sparkleCount).map((sparkle, index) => (
            <CardSparkle key={index} sparkle={sparkle} timing={sparkleTiming} />
          ))}
        </>
      )}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding: wordCard ? "20px 7px 7px" : "8px 4px 4px", minWidth:0 }}>
        <span
          title={char}
          style={{
            fontFamily:"var(--jp-font)",
            fontWeight:700,
            fontSize: wordCard ? wordCharSize : 36,
            color:textColor,
            lineHeight: wordCard ? 1.12 : 1,
            textShadow: textColor === "#111827" ? "none" : "0 2px 8px rgba(0,0,0,0.3)",
            maxWidth:"100%",
            textAlign:"center",
            overflow:"hidden",
            display: wordCard ? "-webkit-box" : "block",
            WebkitLineClamp: wordCard ? 3 : undefined,
            WebkitBoxOrient: wordCard ? "vertical" : undefined,
            overflowWrap:"anywhere",
            wordBreak:"break-word",
          }}
        >
          {char}
        </span>
        <span
          title={label}
          style={{
            fontFamily:"var(--ui-font)",
            fontSize:labelSize,
            fontWeight:700,
            color:textColor,
            marginTop:4,
            textAlign:"center",
            lineHeight:1.1,
            padding:"0 4px",
            maxWidth:"100%",
            overflow:"hidden",
            display:"-webkit-box",
            WebkitLineClamp: wordCard ? 2 : 1,
            WebkitBoxOrient:"vertical",
            overflowWrap:"anywhere",
          }}
        >
          {label}
        </span>
        {matchReason && (
          <span
            title={matchReason}
            style={{
              maxWidth: "92%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--ui-font)",
              fontSize: 9,
              fontWeight: 900,
              color: textColor,
              opacity: 0.86,
              marginTop: 3,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {matchReason}
          </span>
        )}
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
