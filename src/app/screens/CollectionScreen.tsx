import { type ReactNode, useLayoutEffect, useRef } from "react";
import { Search, Star, X } from "lucide-react";
import { KANJI } from "../data/generated/kanji.generated";
import { CAT_COLORS } from "../data/ui/categoryColors";
import { getWordsForKanji } from "../data/wordData";
import { CollectionCard } from "../components/CollectionCard";

export function CollectionScreen({
  unlockedKanji,
  favorites,
  customNames,
  highlightedUnlock,
  query,
  favOnly,
  scrollTop,
  onQueryChange,
  onFavOnlyChange,
  onScrollTopChange,
  onSelectKanji,
  onToggleFav,
  onClearHighlight,
}: {
  unlockedKanji: Set<string>;
  favorites: Set<string>;
  customNames: Record<string, string>;
  highlightedUnlock?: { type: "kanji" | "radical"; id: string } | null;
  query: string;
  favOnly: boolean;
  scrollTop: number;
  onQueryChange: (query: string) => void;
  onFavOnlyChange: (favOnly: boolean) => void;
  onScrollTopChange: (scrollTop: number) => void;
  onSelectKanji: (id: string) => void;
  onToggleFav: (key: string) => void;
  onClearHighlight?: (type: "kanji" | "radical", id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    scrollElement.scrollTop = scrollTop;
  }, []);

  const q = query.toLowerCase();

  const kanjiItems = KANJI.filter((kanji) => {
    if (!unlockedKanji.has(kanji.id)) return false;
    const key = `kanji:${kanji.id}`;
    if (favOnly && !favorites.has(key)) return false;
    if (!query) return true;
    return kanji.char.includes(query) || kanji.meanings.some((meaning) => meaning.toLowerCase().includes(q))
      || kanji.onyomi.some((reading) => reading.includes(query))
      || kanji.kunyomi.some((reading) => reading.includes(query))
      || (customNames[key] || "").toLowerCase().includes(q)
      || getWordsForKanji(kanji.id).some((word) => word.meaning.toLowerCase().includes(q) || word.romaji.toLowerCase().includes(q));
  });

  const hasResults = kanjiItems.length > 0;
  const unlockedTotal = unlockedKanji.size;
  const fullTotal = KANJI.length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontFamily: "var(--ui-font)", fontWeight: 900, fontSize: 20 }} className="text-foreground">
            Collection
          </h2>
          <span style={{ fontFamily: "var(--ui-font)", fontSize: 12, fontWeight: 700 }} className="text-muted-foreground">
            {unlockedTotal}/{fullTotal}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--input-background)" }}>
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search collection..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              style={{ fontFamily: "var(--ui-font)" }}
            />
            {query && (
              <button type="button" onClick={() => onQueryChange("")}>
                <X size={12} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onFavOnlyChange(!favOnly)}
            className="rounded-xl px-3 py-2 flex items-center gap-1 transition-colors"
            style={{ background: favOnly ? "var(--primary)" : "var(--input-background)" }}
            aria-label="Show favorites only"
          >
            <Star size={14} fill={favOnly ? "#fff" : "none"} color={favOnly ? "#fff" : "var(--muted-foreground)"} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-4"
        onScroll={(event) => onScrollTopChange(event.currentTarget.scrollTop)}
        style={{ paddingTop: 18 }}
      >
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <span style={{ fontSize: 48 }}>{unlockedTotal === 0 ? "🎰" : "🔍"}</span>
            <p style={{ fontFamily: "var(--ui-font)", fontWeight: 700, fontSize: 14 }} className="text-muted-foreground text-center">
              {unlockedTotal === 0 ? "Head to Gacha to unlock your first entry!" : "No results found"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {kanjiItems.length > 0 && (
              <CollectionSection title="Kanji" count={`${unlockedKanji.size}/${KANJI.length}`}>
                {kanjiItems.map((kanji) => {
                  const key = `kanji:${kanji.id}`;
                  const [color1, color2] = CAT_COLORS[kanji.category] ?? ["#6b7280", "#4b5563"];
                  return (
                    <CollectionCard
                      key={kanji.id}
                      char={kanji.char}
                      label={customNames[key] || kanji.meanings[0]}
                      color1={color1}
                      color2={color2}
                      starred={favorites.has(key)}
                      highlighted={highlightedUnlock?.type === "kanji" && highlightedUnlock.id === kanji.id}
                      onStar={(event) => {
                        event.stopPropagation();
                        onToggleFav(key);
                      }}
                      onClick={() => {
                        onClearHighlight?.("kanji", kanji.id);
                        onSelectKanji(kanji.id);
                      }}
                    />
                  );
                })}
              </CollectionSection>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

function CollectionSection({ title, count, children }: { title: string; count: string; children: ReactNode }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontFamily: "var(--ui-font)", fontSize: 15, fontWeight: 1000 }} className="text-foreground">
          {title}
        </h3>
        <span style={{ fontFamily: "var(--ui-font)", fontSize: 11, fontWeight: 800 }} className="text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">{children}</div>
    </section>
  );
}
