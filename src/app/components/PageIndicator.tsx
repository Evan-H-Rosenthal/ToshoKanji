import type { Tab } from "../types";

const PAGES: { id: Tab; label: string }[] = [
  { id: "collection", label: "景品 · Prizes" },
  { id: "gacha", label: "抽選 · Gacha" },
  { id: "practice", label: "練習 · Practice" },
];

export function PageIndicator({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav
      className="app-tab-switcher"
      style={{
        minHeight: "calc(48px + var(--app-bottom-safe, 0px))",
        padding: "6px 10px var(--app-bottom-safe, 0px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        flexShrink: 0,
        background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--background) 76%, transparent))",
      }}
      aria-label="Main sections"
    >
      {PAGES.map((page) => {
        const isActive = page.id === active;
        return (
          <button
            key={page.id}
            type="button"
            onClick={() => onSelect(page.id)}
            aria-current={isActive ? "page" : undefined}
            className="app-reactive"
            style={{
              minWidth: 0,
              flex: "1 1 0",
              maxWidth: 132,
              height: 32,
              padding: "0 7px",
              borderRadius: 11,
              border: `1px solid ${isActive ? "color-mix(in srgb, var(--primary) 65%, transparent)" : "var(--border)"}`,
              background: isActive ? "color-mix(in srgb, var(--primary) 18%, var(--card))" : "var(--card)",
              color: isActive ? "var(--primary)" : "var(--muted-foreground)",
              boxShadow: isActive ? "0 0 14px color-mix(in srgb, var(--primary) 22%, transparent)" : "none",
              fontFamily: "var(--ui-font)",
              fontSize: 10,
              fontWeight: 900,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {page.label}
          </button>
        );
      })}
    </nav>
  );
}