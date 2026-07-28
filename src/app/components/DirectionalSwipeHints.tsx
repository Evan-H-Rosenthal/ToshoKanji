import type { CSSProperties } from "react";

type HintDirection = "left" | "right" | "down";

const CHEVRON_COUNT = 3;

const CHEVRON_PATHS: Record<HintDirection, { path: string; viewBox: string }> = {
  left: { path: "M6.5 2 L1.5 20 L6.5 38", viewBox: "0 0 8 40" },
  right: { path: "M1.5 2 L6.5 20 L1.5 38", viewBox: "0 0 8 40" },
  down: { path: "M2 1 L56 11 L110 1", viewBox: "0 0 112 12" },
};

function ChevronGlyph({ direction, style }: { direction: HintDirection; style: CSSProperties }) {
  const geometry = CHEVRON_PATHS[direction];

  return (
    <svg
      aria-hidden="true"
      className="gacha-swipe-hint__chevron"
      fill="none"
      focusable="false"
      stroke="currentColor"
      style={style}
      viewBox={geometry.viewBox}
    >
      <path d={geometry.path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronSequence({ direction }: { direction: HintDirection }) {
  return (
    <span className={`gacha-swipe-hint__chevrons gacha-swipe-hint__chevrons--${direction}`}>
      {Array.from({ length: CHEVRON_COUNT }, (_, index) => {
        const pulseIndex = direction === "left" ? CHEVRON_COUNT - index - 1 : index;
        const style = { "--swipe-pulse-index": pulseIndex } as CSSProperties;

        return <ChevronGlyph key={index} direction={direction} style={style} />;
      })}
    </span>
  );
}

export function SideSwipeHints() {
  return (
    <div className="gacha-swipe-hints--sides" aria-hidden="true">
      <div className="gacha-swipe-hint gacha-swipe-hint--left">
        <span className="gacha-swipe-hint__label">Collection</span>
        <ChevronSequence direction="left" />
      </div>
      <div className="gacha-swipe-hint gacha-swipe-hint--right">
        <span className="gacha-swipe-hint__label">Practice</span>
        <ChevronSequence direction="right" />
      </div>
    </div>
  );
}

export function StatsSwipeHint() {
  return (
    <div className="gacha-swipe-hint gacha-swipe-hint--down" aria-hidden="true">
      <span className="gacha-swipe-hint__label">B1F: Stats</span>
      <ChevronSequence direction="down" />
    </div>
  );
}