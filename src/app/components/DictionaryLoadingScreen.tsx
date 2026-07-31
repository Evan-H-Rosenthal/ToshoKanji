import { useEffect, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { KANJI_RARITIES } from "../data/kanjiRarity";
import type { WordDatabaseProgress } from "../data/wordStore";
import { RewardCapsuleShell } from "./GachaMachine";

const CAPSULE_PALETTES = KANJI_RARITIES.map((rarity) => ({
  primary: rarity.color,
  secondary: rarity.color2,
}));

// Loader motion tuning: adjust these values to refine the complete animation loop.
const LOADER_ANIMATION = {
  capsuleSize: 70,
  rotationDuration: 1.25,
  squashDuration: 0.18,
  squashScaleX: 1.18,
  squashScaleY: 0.68,
  vibrationDuration: 0.35,
  jumpHeight: 94,
  jumpDuration: 0.86,
  firstBounceHeight: 28,
  secondBounceHeight: 9,
  bounceDuration: 0.62,
} as const;

function nextColorIndex(current: number) {
  if (CAPSULE_PALETTES.length < 2) return current;
  const candidate = Math.floor(Math.random() * (CAPSULE_PALETTES.length - 1));
  return candidate >= current ? candidate + 1 : candidate;
}

export function DictionaryLoadingScreen({
  state,
  onRetry,
}: {
  state: WordDatabaseProgress;
  onRetry: () => void;
}) {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const [colorIndex, setColorIndex] = useState(() => Math.floor(Math.random() * CAPSULE_PALETTES.length));
  const visible = state.phase !== "checking";
  const percentage = Math.round(Math.max(0, Math.min(1, state.progress)) * 100);

  useEffect(() => {
    if (reduceMotion || !visible || state.phase === "error") return;

    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        controls.set({ x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 });

        await controls.start(
          { rotate: 360*3 },
          { duration: LOADER_ANIMATION.rotationDuration, ease: "easeInOut" },
        );
        if (cancelled) return;

        controls.set({ originY: 1 }); 

        await controls.start(
          { scaleX: LOADER_ANIMATION.squashScaleX, scaleY: LOADER_ANIMATION.squashScaleY },
          { duration: LOADER_ANIMATION.squashDuration, ease: "easeIn" },
        );
        if (cancelled) return;

        await controls.start(
          {
            x: [0, -3, 3, -2, 3, -3, 2, -2, 3, 0],
            rotate: [360, 357, 363, 358, 362, 357, 363, 359, 362, 360],
          },
          { duration: LOADER_ANIMATION.vibrationDuration, ease: "linear" },
        );
        if (cancelled) return;

        await controls.start(
          { x: 0, rotate: 360, scaleX: 1, scaleY: 1 },
          { duration: LOADER_ANIMATION.squashDuration, ease: "easeOut" },
        );
        if (cancelled) return;

        await controls.start(
          {
            y: [0, -LOADER_ANIMATION.jumpHeight, 0],
          },
          {
            duration: LOADER_ANIMATION.jumpDuration,
            times: [0, 0.4, 1],
            ease: ["easeOut", "easeIn"],
          },
        );
        if (cancelled) return;

        setColorIndex((current) => nextColorIndex(current));
        controls.set({ y: 0, scaleX: 1.12, scaleY: 0.86 });

        await controls.start(
          {
            y: [0, -LOADER_ANIMATION.firstBounceHeight, 0, -LOADER_ANIMATION.secondBounceHeight, 0],
            scaleX: [1.12, 0.98, 1.06, 1, 1],
            scaleY: [0.86, 1.02, 0.94, 1, 1],
          },
          {
            duration: LOADER_ANIMATION.bounceDuration,
            times: [0, 0.3, 0.58, 0.78, 1],
            ease: ["easeOut", "easeIn", "easeOut", "easeIn"],
          },
        );
        controls.set({ originY: 0.5 }); 
      }
    };

    void run();
    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [controls, reduceMotion, state.phase, visible]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 30px max(36px, env(safe-area-inset-bottom))",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        aria-live="polite"
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ height: 168, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative" }}>
          <motion.div
            animate={reduceMotion
              ? { scale: [1, 0.97, 1], opacity: [1, 0.82, 1] }
              : controls}
            transition={reduceMotion
              ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
              : undefined}
            style={{ width: LOADER_ANIMATION.capsuleSize, height: LOADER_ANIMATION.capsuleSize, transformOrigin: "50% 50%", position: "relative", zIndex: 2 }}
          >
            <RewardCapsuleShell
              primary={CAPSULE_PALETTES[colorIndex].primary}
              secondary={CAPSULE_PALETTES[colorIndex].secondary}
              size={LOADER_ANIMATION.capsuleSize}
            />
          </motion.div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -8,
              width: 84,
              height: 14,
              borderRadius: "50%",
              background: "rgba(15, 23, 42, 0.16)",
              filter: "blur(6px)",
            }}
          />
        </div>

        <h1
          style={{
            margin: "24px 0 8px",
            fontFamily: "var(--ui-font)",
            fontSize: 25,
            fontWeight: 900,
            color: "var(--foreground)",
          }}
        >
          {state.phase === "error" ? "Dictionary loading failed" : "Loading Dictionaries..."}
        </h1>

        {state.phase === "error" ? (
          <>
            <p style={{ margin: 0, fontFamily: "var(--ui-font)", fontSize: 13, lineHeight: 1.55, color: "var(--muted-foreground)" }}>
              {state.error || "ToshoKanji could not prepare its dictionaries."}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="app-reactive"
              style={{
                marginTop: 20,
                border: 0,
                borderRadius: 14,
                padding: "11px 22px",
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--ui-font)",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <p
              style={{
                margin: 0,
                minHeight: 44,
                fontFamily: "var(--ui-font)",
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--muted-foreground)",
              }}
            >
              <span lang="ja">少々お待ちください...</span>
              <br />
              ToshoKanji is loading dictionaries. This won't happen the next time you open the app.
            </p>

            <div style={{ width: "100%", marginTop: 22 }}>
              <div
                role="progressbar"
                aria-label="Loading word dictionaries"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
                style={{
                  width: "100%",
                  height: 12,
                  padding: 2,
                  borderRadius: 999,
                  background: "var(--muted)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ width: percentage + "%" }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    minWidth: percentage > 0 ? 6 : 0,
                    borderRadius: 999,
                    background: "linear-gradient(90deg, var(--primary), #a855f7)",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 7,
                  fontFamily: "var(--ui-font)",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--muted-foreground)",
                }}
              >
                <span>{state.totalParts > 0 ? state.loadedParts + " / " + state.totalParts + " dictionary packs" : "Preparing..."}</span>
                <span>{percentage}%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}