import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Funnel, Search, Star, X } from "lucide-react";
import { KANJI } from "../data/generated/kanji.generated";
import { RADICALS } from "../data/generated/radicals.generated";
import { KANJI_RARITIES, getKanjiRarity, type KanjiRarity } from "../data/kanjiRarity";
import { LEARNING_CATEGORIES, compareLearningCategories, getLearningCategoryColors } from "../data/ui/categoryColors";
import { getWordEntries, getWordEntryColors } from "../data/wordData";
import { buildKanjiSearchIndex, normalizeSearchText, searchKanjiIndex, type SearchMatchReason } from "../search/kanjiSearch";
import { CollectionCard } from "../components/CollectionCard";

const JLPT_LEVELS = Array.from(new Set(KANJI.map((kanji) => kanji.jlptOld).filter((level): level is number => typeof level === "number")))
  .sort((a, b) => a - b);

const JLPT_LABELS: Record<number, string> = {
  4: "N5 (Easiest)",
  3: "N4",
  2: "N3",
  1: "N2+ (Hardest)",
};

export function CollectionScreen({
  unlockedKanji,
  favorites,
  customNames,
  highlightedUnlock,
  query,
  includeWords,
  includeComponents,
  favOnly,
  scrollTop,
  onQueryChange,
  onIncludeWordsChange,
  onIncludeComponentsChange,
  onFavOnlyChange,
  onScrollTopChange,
  onSelectKanji,
  onSelectRadical,
  onSelectWord,
  onToggleFav,
  onClearHighlight,
}: {
  unlockedKanji: Set<string>;
  favorites: Set<string>;
  customNames: Record<string, string>;
  highlightedUnlock?: { type: "kanji" | "radical"; id: string } | null;
  query: string;
  includeWords: boolean;
  includeComponents: boolean;
  favOnly: boolean;
  scrollTop: number;
  onQueryChange: (query: string) => void;
  onIncludeWordsChange: (includeWords: boolean) => void;
  onIncludeComponentsChange: (includeComponents: boolean) => void;
  onFavOnlyChange: (favOnly: boolean) => void;
  onScrollTopChange: (scrollTop: number) => void;
  onSelectKanji: (id: string) => void;
  onSelectRadical: (id: string) => void;
  onSelectWord: (id: string) => void;
  onToggleFav: (key: string) => void;
  onClearHighlight?: (type: "kanji" | "radical", id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedRarities, setSelectedRarities] = useState<Set<KanjiRarity>>(new Set());
  const [selectedJlptLevels, setSelectedJlptLevels] = useState<Set<number>>(new Set());
  const [draftQuery, setDraftQuery] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(() => ({ kanjiResults: [], wordResults: [] } as ReturnType<typeof searchKanjiIndex>));

  useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    scrollElement.scrollTop = scrollTop;
  }, []);

  const normalizedQuery = normalizeSearchText(query);
  const hasQuery = normalizedQuery.length > 0;
  const searchIndex = useMemo(() => buildKanjiSearchIndex(KANJI, getWordEntries()), []);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => () => {
    if (searchTimerRef.current !== null) window.clearTimeout(searchTimerRef.current);
  }, []);

  const runSearch = useCallback((nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();
    if (searchTimerRef.current !== null) window.clearTimeout(searchTimerRef.current);

    if (!trimmedQuery) {
      setSearchResults({ kanjiResults: [], wordResults: [] });
      setIsSearching(false);
      onQueryChange("");
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = window.setTimeout(() => {
      const normalizedNextQuery = normalizeSearchText(trimmedQuery);
      const nextResults = searchKanjiIndex(searchIndex, trimmedQuery, {
        unlockedKanji,
        favorites,
        customNames,
        includeWords,
        includeComponents,
        maxKanjiResults: 120,
        maxWordResults: 60,
      });

      setSearchResults(nextResults);
      onQueryChange(normalizedNextQuery ? trimmedQuery : "");
      setIsSearching(false);
      searchTimerRef.current = null;
    }, 90);
  }, [customNames, favorites, includeComponents, includeWords, onQueryChange, searchIndex, unlockedKanji]);

  useEffect(() => {
    if (!query) return;
    runSearch(query);
  }, [includeComponents, includeWords]);

  useEffect(() => {
    if (!query) return;
    const nextResults = searchKanjiIndex(searchIndex, query, {
      unlockedKanji,
      favorites,
      customNames,
      includeWords,
      includeComponents,
      maxKanjiResults: 120,
      maxWordResults: 60,
    });
    setSearchResults(nextResults);
  }, []);

  const activeFilterCount = selectedCategories.size + selectedRarities.size + selectedJlptLevels.size;
  const hasActiveFilters = activeFilterCount > 0;
  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };
  const toggleJlptLevel = (level: number) => {
    setSelectedJlptLevels((current) => {
      const next = new Set(current);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };
  const toggleRarity = (rarity: KanjiRarity) => {
    setSelectedRarities((current) => {
      const next = new Set(current);
      if (next.has(rarity)) next.delete(rarity);
      else next.add(rarity);
      return next;
    });
  };
  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSelectedRarities(new Set());
    setSelectedJlptLevels(new Set());
  };

  const kanjiItems = (hasQuery
    ? searchResults.kanjiResults
    : KANJI.filter((kanji) => unlockedKanji.has(kanji.id)).map((kanji) => ({ kanji, score: 0, reason: undefined }))
  ).filter(({ kanji }) => {
    const key = `kanji:${kanji.id}`;
    if (favOnly && !favorites.has(key)) return false;
    if (selectedCategories.size > 0 && !selectedCategories.has(kanji.learningCategory)) return false;
    if (selectedRarities.size > 0 && !selectedRarities.has(getKanjiRarity(kanji))) return false;
    if (selectedJlptLevels.size > 0 && (kanji.jlptOld === undefined || !selectedJlptLevels.has(kanji.jlptOld))) return false;
    return true;
  }).sort((a, b) => {
    if (hasQuery) return 0;
    const kanjiA = a.kanji;
    const kanjiB = b.kanji;
    const categorySort = compareLearningCategories(kanjiA.learningCategory, kanjiB.learningCategory);
    if (categorySort !== 0) return categorySort;
    return (kanjiA.frequency ?? 99999) - (kanjiB.frequency ?? 99999) || kanjiA.char.localeCompare(kanjiB.char);
  });

  const wordItems = hasQuery
    ? searchResults.wordResults.filter((result) => !favOnly || favorites.has(`word:${result.entry.id}`))
    : favOnly
      ? getWordEntries().filter((entry) => {
      const key = `word:${entry.id}`;
      if (!favorites.has(key)) return false;
      return true;
    }).map((entry) => ({ entry, score: 0, reason: undefined }))
      : [];

  const radicalItems = favOnly
    ? RADICALS.filter((radical) => {
      const key = `radical:${radical.id}`;
      if (!favorites.has(key)) return false;
      if (!query) return true;
      return radical.char.includes(query)
        || radical.meanings.some((meaning) => normalizeSearchText(meaning).includes(normalizedQuery))
        || radical.names?.some((name) => name.includes(query) || normalizeSearchText(name).includes(normalizedQuery))
        || String(radical.radicalNumber ?? "").includes(query);
    })
    : [];

  const hasResults = kanjiItems.length > 0 || wordItems.length > 0 || radicalItems.length > 0;
  const unlockedTotal = unlockedKanji.size;
  const fullTotal = KANJI.length;
  const kanjiCountLabel = hasActiveFilters || query ? `${kanjiItems.length}/${unlockedTotal}` : `${unlockedTotal}/${fullTotal}`;

  return (
    <div className="flex flex-col h-full" style={{ position: "relative" }}>
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
            <button
              type="button"
              onClick={() => runSearch(draftQuery)}
              aria-label="Search collection"
              style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", flexShrink: 0 }}
            >
              <Search size={14} />
            </button>
            <input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runSearch(draftQuery);
                }
              }}
              placeholder="Search collection..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              style={{ fontFamily: "var(--ui-font)" }}
            />
            {(draftQuery || query) && (
              <button
                type="button"
                onClick={() => {
                  setDraftQuery("");
                  runSearch("");
                }}
                aria-label="Clear search"
              >
                <X size={12} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="rounded-xl px-3 py-2 flex items-center gap-1 transition-colors"
            style={{
              background: hasActiveFilters ? "var(--primary)" : "var(--input-background)",
              color: hasActiveFilters ? "#fff" : "var(--muted-foreground)",
              position: "relative",
            }}
            aria-label="Open collection filters"
          >
            <Funnel size={14} />
            {hasActiveFilters && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  minWidth: 17,
                  height: 17,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#ef4444",
                  color: "#fff",
                  border: "2px solid var(--background)",
                  fontFamily: "var(--ui-font)",
                  fontSize: 9,
                  fontWeight: 1000,
                  lineHeight: "13px",
                  textAlign: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
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
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <SearchPill
            label="Include words"
            active={includeWords}
            onClick={() => onIncludeWordsChange(!includeWords)}
          />
          <SearchPill
            label="Include components"
            active={includeComponents}
            onClick={() => onIncludeComponentsChange(!includeComponents)}
          />
        </div>
      </div>

      {filtersOpen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 40,
            background: "rgba(5,4,17,0.48)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
          onClick={() => setFiltersOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 300,
              maxHeight: "min(590px, calc(100% - 24px))",
              borderRadius: 22,
              background: "linear-gradient(180deg, var(--card), color-mix(in srgb, var(--card) 88%, var(--primary)))",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
              padding: 16,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--muted)",
                color: "var(--foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>

            <p style={{ fontFamily: "var(--ui-font)", fontSize: 19, fontWeight: 1000, marginBottom: 4 }} className="text-foreground">
              Filters
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
              <p style={{ fontFamily: "var(--ui-font)", fontSize: 11 }} className="text-muted-foreground">
                Narrow the Kanji collection
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    padding: "5px 8px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                    fontFamily: "var(--ui-font)",
                    fontSize: 10,
                    fontWeight: 900,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            <div style={{ maxHeight: 470, overflowY: "auto", paddingRight: 4 }}>
              <FilterSection title="Kanji Categories">
                {LEARNING_CATEGORIES.map((category) => {
                  const [color1, color2] = category.colors;
                  const checked = selectedCategories.has(category.id);
                  return (
                    <label
                      key={category.id}
                      style={{
                        minHeight: 38,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "7px 8px",
                        borderRadius: 12,
                        background: checked ? `${color1}24` : "var(--muted)",
                        border: `1px solid ${checked ? color1 + "66" : "var(--border)"}`,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(category.id)}
                        style={{ display: "none" }}
                      />
                      <span style={{ fontFamily: "var(--ui-font)", fontSize: 12, fontWeight: 900, textAlign: "center" }} className="text-foreground">
                        {category.label}
                      </span>
                    </label>
                  );
                })}
              </FilterSection>

              <FilterSection title="Rarity">
                {KANJI_RARITIES.map((rarity) => {
                  const checked = selectedRarities.has(rarity.id);
                  return (
                    <label
                      key={rarity.id}
                      style={{
                        minHeight: 38,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "7px 8px",
                        borderRadius: 12,
                        background: checked ? `${rarity.color}24` : "var(--muted)",
                        border: `1px solid ${checked ? rarity.color + "88" : "var(--border)"}`,
                        boxShadow: checked ? `0 0 16px ${rarity.color}33` : "none",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRarity(rarity.id)}
                        style={{ display: "none" }}
                      />
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minWidth: 0 }}>
                        <span
                          aria-hidden
                          style={{
                            width: 13,
                            height: 13,
                            borderRadius: 999,
                            background: `linear-gradient(135deg, ${rarity.color}, ${rarity.color2})`,
                            border: "1px solid rgba(255,255,255,0.58)",
                            boxShadow: `0 0 10px ${rarity.color}66`,
                            flex: "0 0 auto",
                          }}
                        />
                        <span style={{ fontFamily: "var(--ui-font)", fontSize: 12, fontWeight: 900, textAlign: "center" }} className="text-foreground">
                          {rarity.label}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </FilterSection>

              <FilterSection title="JLPT Level">
                {JLPT_LEVELS.map((level) => {
                  const checked = selectedJlptLevels.has(level);
                  return (
                    <label
                      key={level}
                      style={{
                        minHeight: 38,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "7px 8px",
                        borderRadius: 12,
                        background: checked ? "color-mix(in srgb, var(--primary) 18%, var(--muted))" : "var(--muted)",
                        border: `1px solid ${checked ? "var(--primary)" : "var(--border)"}`,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleJlptLevel(level)}
                        style={{ display: "none" }}
                      />
                      <span style={{ fontFamily: "var(--ui-font)", fontSize: 12, fontWeight: 900, textAlign: "center" }} className="text-foreground">
                        {JLPT_LABELS[level] ?? `JLPT ${level}`}
                      </span>
                    </label>
                  );
                })}
              </FilterSection>
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-4"
        onScroll={(event) => onScrollTopChange(event.currentTarget.scrollTop)}
        style={{ paddingTop: 18 }}
      >
        {isSearching ? (
          <SearchLoadingState />
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <span style={{ fontSize: 48 }}>{unlockedTotal === 0 ? "🎰" : "🔍"}</span>
            <p style={{ fontFamily: "var(--ui-font)", fontWeight: 700, fontSize: 14 }} className="text-muted-foreground text-center">
              {unlockedTotal === 0 ? "Head to Gacha to unlock your first entry!" : "No matches found."}
            </p>
            {unlockedTotal > 0 && (
              <p style={{ fontFamily: "var(--ui-font)", fontWeight: 700, fontSize: 12 }} className="text-muted-foreground text-center">
                Try searching by meaning, reading, word, or kanji.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {kanjiItems.length > 0 && (
              <CollectionSection title="Kanji" count={favOnly ? `${kanjiItems.length}` : kanjiCountLabel}>
                {kanjiItems.map(({ kanji, reason }) => {
                  const key = `kanji:${kanji.id}`;
                  const [color1, color2] = getLearningCategoryColors(kanji.learningCategory);
                  return (
                    <CollectionCard
                      key={kanji.id}
                      char={kanji.char}
                      label={customNames[key] || kanji.meanings[0]}
                      matchReason={hasQuery ? formatMatchReason(reason) : undefined}
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

            {radicalItems.length > 0 && (
              <CollectionSection title="Radicals" count={`${radicalItems.length}`}>
                {radicalItems.map((radical) => {
                  const key = `radical:${radical.id}`;
                  return (
                    <CollectionCard
                      key={radical.id}
                      char={radical.char}
                      label={radical.meanings[0] ?? "Radical"}
                      color1="#6b7280"
                      color2="#4b5563"
                      starred={favorites.has(key)}
                      highlighted={highlightedUnlock?.type === "radical" && highlightedUnlock.id === radical.id}
                      onStar={(event) => {
                        event.stopPropagation();
                        onToggleFav(key);
                      }}
                      onClick={() => {
                        onClearHighlight?.("radical", radical.id);
                        if (radical.componentId) onSelectRadical(radical.componentId);
                      }}
                    />
                  );
                })}
              </CollectionSection>
            )}

            {wordItems.length > 0 && (
              <CollectionSection title="Words" count={`${wordItems.length}`}>
                {wordItems.map(({ entry, reason }) => {
                  const key = `word:${entry.id}`;
                  const [color1, color2] = getWordEntryColors(entry);
                  return (
                    <CollectionCard
                      key={entry.id}
                      char={entry.word.japanese}
                      label={entry.word.meaning.split(";")[0]?.trim() || entry.word.romaji}
                      matchReason={hasQuery ? formatMatchReason(reason) : undefined}
                      wordCard
                      color1={color1}
                      color2={color2}
                      starred={favorites.has(key)}
                      onStar={(event) => {
                        event.stopPropagation();
                        onToggleFav(key);
                      }}
                      onClick={() => onSelectWord(entry.id)}
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

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <p style={{ fontFamily: "var(--ui-font)", fontSize: 11, fontWeight: 1000, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }} className="text-muted-foreground">
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{children}</div>
    </section>
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

function SearchPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
        background: active ? "color-mix(in srgb, var(--primary) 16%, var(--input-background))" : "var(--input-background)",
        color: active ? "var(--foreground)" : "var(--muted-foreground)",
        padding: "6px 10px",
        fontFamily: "var(--ui-font)",
        fontSize: 11,
        fontWeight: 900,
        cursor: "pointer",
      }}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function SearchLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
      <p style={{ fontFamily: "var(--ui-font)", fontWeight: 900, fontSize: 14 }} className="text-muted-foreground text-center">
        Searching
      </p>
    </div>
  );
}

function formatMatchReason(reason?: SearchMatchReason) {
  if (!reason?.value) return undefined;
  const labelByKind: Record<SearchMatchReason["kind"], string> = {
    kanji: "kanji",
    word: "word",
    reading: "reading",
    meaning: "meaning",
    category: "category",
    component: "component",
    name: "name",
  };

  return `matched ${labelByKind[reason.kind]}: ${reason.value}`;
}
