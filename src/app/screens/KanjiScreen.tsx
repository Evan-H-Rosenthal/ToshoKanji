import { useState } from "react";
import { Search, Star, X } from "lucide-react";
import { KANJI } from "../data/generated/kanji.generated";
import { compareLearningCategories, getLearningCategoryColors, getLearningCategoryTextColor } from "../data/ui/categoryColors";
import { getWordsForKanji } from "../data/wordData";
import { CollectionCard } from "../components/CollectionCard";

export function KanjiScreen({ unlockedKanji, favorites, customNames, highlightedId, onSelect, onToggleFav, onClearHighlight }: {
  unlockedKanji: Set<string>; favorites: Set<string>;
  customNames: Record<string,string>;
  highlightedId?: string | null;
  onSelect: (id:string) => void;
  onToggleFav: (key:string) => void;
  onClearHighlight?: (id:string) => void;
}) {
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  const items = KANJI.filter(k => {
    if (!unlockedKanji.has(k.id)) return false;
    const key = `kanji:${k.id}`;
    if (favOnly && !favorites.has(key)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return k.char.includes(query) || k.meanings.some(m=>m.toLowerCase().includes(q))
      || k.onyomi.some(o=>o.includes(query)) || k.kunyomi.some(ku=>ku.includes(query))
      || (customNames[key]||"").toLowerCase().includes(q)
      || getWordsForKanji(k.id).some(w=>w.meaning.toLowerCase().includes(q)||w.romaji.toLowerCase().includes(q));
  }).sort((a, b) => {
    const categorySort = compareLearningCategories(a.learningCategory, b.learningCategory);
    if (categorySort !== 0) return categorySort;
    return (a.frequency ?? 99999) - (b.frequency ?? 99999) || a.char.localeCompare(b.char);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontFamily:"var(--ui-font)", fontWeight:900, fontSize:20 }} className="text-foreground">漢字 Collection</h2>
          <span style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:700 }} className="text-muted-foreground">{unlockedKanji.size}/{KANJI.length}</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background:"var(--input-background)" }}>
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search kanji, meaning, reading..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              style={{ fontFamily:"var(--ui-font)" }} />
            {query && <button onClick={()=>setQuery("")}><X size={12} className="text-muted-foreground" /></button>}
          </div>
          <button onClick={()=>setFavOnly(f=>!f)}
            className="rounded-xl px-3 py-2 flex items-center gap-1 transition-colors"
            style={{ background: favOnly ? "var(--primary)" : "var(--input-background)" }}>
            <Star size={14} fill={favOnly?"#fff":"none"} color={favOnly?"#fff":"var(--muted-foreground)"} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingTop: 34 }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <span style={{ fontSize:48 }}>{unlockedKanji.size === 0 ? "🎰" : "🔍"}</span>
            <p style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }} className="text-muted-foreground text-center">
              {unlockedKanji.size === 0 ? "Head to Gacha to unlock your first kanji!" : "No results found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map(k => {
              const key = `kanji:${k.id}`;
              const [c1, c2] = getLearningCategoryColors(k.learningCategory);
              return (
                <CollectionCard key={k.id} char={k.char}
                  label={customNames[key] || k.meanings[0]}
                  color1={c1} color2={c2}
                  textColor={getLearningCategoryTextColor(k.learningCategory)}
                  starred={favorites.has(key)}
                  highlighted={highlightedId === k.id}
                  onStar={e=>{ e.stopPropagation(); onToggleFav(key); }}
                  onClick={()=>{
                    onClearHighlight?.(k.id);
                    onSelect(k.id);
                  }} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Radicals Screen ────────────────────────────────────────────────────────────
