import { useEffect, useMemo, useRef, useState } from "react";
import { GachaMachine } from "./GachaMachine";
import { GachaStatsButton } from "./GachaStatsButton";

const BASE_MACHINE_HEIGHT = 522;
const BASE_MACHINE_WIDTH = 270;
const STATS_HEIGHT = 64;
const PANEL_GAP = 10;
const PANEL_VERTICAL_PADDING = 8;

export function GachaPanel({
  onUnlock,
  getItem,
  allUnlocked,
  unlockedKanji,
  unlockedRadicals,
  reduceEffects = false,
}: {
  onUnlock: (type: "kanji" | "radical", id: string) => void;
  getItem: () => { type: "kanji" | "radical"; id: string } | null;
  allUnlocked: boolean;
  unlockedKanji: Set<string>;
  unlockedRadicals: Set<string>;
  reduceEffects?: boolean;
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
    const widthLimit = bounds.width ? (bounds.width - 28) / BASE_MACHINE_WIDTH : 1;
    const heightBudget = bounds.height - STATS_HEIGHT - PANEL_GAP - PANEL_VERTICAL_PADDING * 2;
    const heightLimit = heightBudget > 0 ? heightBudget / BASE_MACHINE_HEIGHT : 1;

    return Math.max(0.72, Math.min(1.08, widthLimit, heightLimit));
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
      <GachaMachine onUnlock={onUnlock} getItem={getItem} allUnlocked={allUnlocked} scale={machineScale} reduceEffects={reduceEffects} />
      <GachaStatsButton unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals} />
    </div>
  );
}
