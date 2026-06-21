import { useState } from "react";
import { Search, Star, X } from "lucide-react";
import { RAD_COLORS, RADICALS } from "../data/kanjiData";
import { CollectionCard } from "../components/CollectionCard";

export function RadicalsScreen({ unlockedRadicals, favorites, customNames, highlightedId, onSelect, onToggleFav, onClearHighlight }: {
  unlockedRadicals: Set<string>; favorites: Set<string>;
  customNames: Record<string,string>;
  highlightedId?: string | null;
  onSelect: (id:string) => void;
  onToggleFav: (key:string) => void;
  onClearHighlight?: (id:string) => void;
}) {
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  const items = RADICALS.filter((r,i) => {
    if (!unlockedRadicals.has(r.id)) return false;
    const key = `radical:${r.id}`;
    if (favOnly && !favorites.has(key)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return r.char.includes(query) || r.meanings.some(m=>m.toLowerCase().includes(q))
      || (customNames[key]||"").toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontFamily:"var(--ui-font)", fontWeight:900, fontSize:20 }} className="text-foreground">部首 Radicals</h2>
          <span style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:700 }} className="text-muted-foreground">{unlockedRadicals.size}/{RADICALS.length}</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background:"var(--input-background)" }}>
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search radicals..."
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
            <span style={{ fontSize:48 }}>{unlockedRadicals.size === 0 ? "🎰" : "🔍"}</span>
            <p style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }} className="text-muted-foreground text-center">
              {unlockedRadicals.size === 0 ? "Spin the Gacha to discover radicals!" : "No results found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((r) => {
              const key = `radical:${r.id}`;
              const colorIndex = Math.max(0, RADICALS.findIndex((radical) => radical.id === r.id));
              const c = RAD_COLORS[colorIndex % RAD_COLORS.length];
              const c2 = RAD_COLORS[(colorIndex + 4) % RAD_COLORS.length];
              return (
                <CollectionCard key={r.id} char={r.char}
                  label={customNames[key] || r.meanings[0]}
                  color1={c} color2={c2}
                  starred={favorites.has(key)}
                  highlighted={highlightedId === r.id}
                  onStar={e=>{ e.stopPropagation(); onToggleFav(key); }}
                  onClick={()=>{
                    onClearHighlight?.(r.id);
                    onSelect(r.id);
                  }} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chat Section ───────────────────────────────────────────────────────────────
