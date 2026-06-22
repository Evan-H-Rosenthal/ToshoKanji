import type { Tab } from "../types";

const PAGES: { id: Tab; label: string }[] = [
  { id: "collection", label: "Collection" },
  { id: "gacha", label: "Gacha" },
  { id: "practice", label: "Practice" },
];

export function PageIndicator({ active }: { active: Tab }) {
  return (
    <div
      style={{
        height: "calc(24px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flexShrink: 0,
        background: "linear-gradient(180deg, transparent, rgba(20,16,44,0.34))",
      }}
      aria-label="Page position"
    >
      {PAGES.map((page) => {
        const isActive = page.id === active;

        return (
          <div
            key={page.id}
            style={{
              width: isActive ? 26 : 7,
              height: 7,
              borderRadius: 999,
              background: isActive ? "var(--primary)" : "var(--muted-foreground)",
              opacity: isActive ? 1 : 0.36,
              boxShadow: isActive ? "0 0 14px color-mix(in srgb, var(--primary) 64%, transparent)" : "none",
              transition: "width 0.22s ease, opacity 0.22s ease, background 0.22s ease",
            }}
            title={page.label}
          />
        );
      })}
    </div>
  );
}
