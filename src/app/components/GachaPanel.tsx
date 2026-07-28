import { useEffect, useMemo, useRef, useState } from "react";
import { SideSwipeHints, StatsSwipeHint } from "./DirectionalSwipeHints";
import { GachaMachine } from "./GachaMachine";

const BASE_MACHINE_HEIGHT = 522;
const BASE_MACHINE_WIDTH = 270;
const SIDE_HINT_GUTTER_WIDTH = 44;
const BOTTOM_HINT_HEIGHT = 72;
const PANEL_GAP = 8;
const PANEL_VERTICAL_PADDING = 8;

// GACHA MACHINE TUNING
// scaleMultiplier: 0.9 is 10% smaller; 1.1 is 10% larger.
// offsetX: positive moves right; offsetY: positive moves down (values are pixels).
export const GACHA_MACHINE_TUNING = {
  scaleMultiplier: 1,
  offsetX: 0,
  offsetY: 0,
} as const;

export function GachaPanel({
  onUnlock,
  getItem,
  allUnlocked,
  onInteractionLockChange,
  onSpinStart,
}: {
  onUnlock: (type: "kanji" | "radical", id: string) => void;
  getItem: () => { type: "kanji" | "radical"; id: string } | null;
  allUnlocked: boolean;
  unlockedKanji: Set<string>;
  onInteractionLockChange?: (locked: boolean) => void;
  onSpinStart?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const updateBounds = () => {
      setBounds({
        width: panel.clientWidth,
        height: panel.clientHeight,
      });
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(panel);
    window.visualViewport?.addEventListener("resize", updateBounds);
    window.addEventListener("orientationchange", updateBounds);

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", updateBounds);
      window.removeEventListener("orientationchange", updateBounds);
    };
  }, []);

  const machineScale = useMemo(() => {
    const widthLimit = bounds.width
      ? (bounds.width - SIDE_HINT_GUTTER_WIDTH * 2) / BASE_MACHINE_WIDTH
      : 1;
    const heightBudget = bounds.height - BOTTOM_HINT_HEIGHT - PANEL_GAP - PANEL_VERTICAL_PADDING * 2;
    const heightLimit = heightBudget > 0 ? heightBudget / BASE_MACHINE_HEIGHT : 1;
    const fittedScale = Math.max(0.66, Math.min(1.08, widthLimit, heightLimit));

    return fittedScale * GACHA_MACHINE_TUNING.scaleMultiplier;
  }, [bounds.height, bounds.width]);

  const isMeasured = bounds.width > 0 && bounds.height > 0;
  const justifyContent = bounds.height > 675 ? "center" : "flex-start";

  return (
    <div
      ref={panelRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent,
        gap: PANEL_GAP,
        padding: `${PANEL_VERTICAL_PADDING}px 0`,
        position: "relative",
        opacity: isMeasured ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      <div className="gacha-stage">
        <SideSwipeHints />
        <div
          className="gacha-machine-positioner"
          style={{
            transform: `translate(${GACHA_MACHINE_TUNING.offsetX}px, ${GACHA_MACHINE_TUNING.offsetY}px)`,
          }}
        >
          <GachaMachine
            onUnlock={onUnlock}
            getItem={getItem}
            allUnlocked={allUnlocked}
            onInteractionLockChange={onInteractionLockChange}
            onSpinStart={onSpinStart}
            scale={machineScale}
          />
        </div>
      </div>
      <StatsSwipeHint />
    </div>
  );
}
