import { ChevronLeft, Lock, Star } from "lucide-react";
import { CAT_COLORS } from "../data/ui/categoryColors";
import { findWordEntry, getWordEntryColors } from "../data/wordData";

export function WordEntryPage({ id, unlockedKanji, favorites, onBack, onBackToGacha, onToggleFav, onNavKanji }: {
  id: string;
  unlockedKanji: Set<string>;
  favorites: Set<string>;
  onBack: () => void;
  onBackToGacha?: () => void;
  onToggleFav: (key: string) => void;
  onNavKanji: (id: string) => void;
}) {
  const entry = findWordEntry(id);

  if (!entry) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }}>
            <ChevronLeft size={20} /> Back
          </button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:18 }} className="text-foreground">Word not found</p>
          <p style={{ fontFamily:"var(--ui-font)", fontSize:13, marginTop:6 }} className="text-muted-foreground">This vocabulary entry is not available in the current dataset.</p>
        </div>
      </div>
    );
  }

  const key = `word:${entry.id}`;
  const isFav = favorites.has(key);
  const [c1, c2] = getWordEntryColors(entry);
  const categories = Array.from(new Set(entry.kanji.map((kanji) => kanji.category)));
  const background = c1 === c2
    ? c1
    : `linear-gradient(135deg, ${c1}, ${c2})`;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div className="flex flex-col items-start gap-1">
          <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }}>
            <ChevronLeft size={20} /> Back
          </button>
          {onBackToGacha && (
            <button
              onClick={onBackToGacha}
              style={{
                marginLeft: 20,
                padding: "4px 9px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--muted)",
                color: "var(--muted-foreground)",
                fontFamily: "var(--ui-font)",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Back to gacha
            </button>
          )}
        </div>
        <button onClick={() => onToggleFav(key)}>
          <Star size={22} fill={isFav ? "#ffd700" : "none"} color={isFav ? "#ffd700" : "var(--muted-foreground)"} />
        </button>
      </div>

      <div className="flex flex-col items-center pb-5 pt-3 px-4 shrink-0">
        <div
          style={{
            minWidth: 190,
            minHeight: 132,
            borderRadius: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px 24px",
            background,
            boxShadow: `0 14px 42px ${c1}55, 0 0 0 6px ${c1}22`,
            marginBottom: 14,
          }}
        >
          <span style={{ fontFamily:"var(--jp-font)", fontSize:42, fontWeight:800, color:"rgba(255,255,255,0.96)", lineHeight:1.1 }}>{entry.word.japanese}</span>
          <span style={{ fontFamily:"var(--jp-font)", fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.76)", marginTop:6 }}>{entry.word.furigana}</span>
        </div>

        <div style={{ display:"flex", gap:7, flexWrap:"wrap", justifyContent:"center" }}>
          {categories.map((category) => {
            const [cat1] = CAT_COLORS[category] ?? ["#6b7280", "#4b5563"];
            return (
              <span key={category} style={{ padding:"4px 9px", borderRadius:999, background:`${cat1}22`, color:cat1, fontFamily:"var(--ui-font)", fontSize:11, fontWeight:900, textTransform:"uppercase" }}>
                {category.replace("-", " ")}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8">
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Meaning</p>
          <p style={{ fontFamily:"var(--ui-font)", fontSize:16, fontWeight:800, lineHeight:1.35 }} className="text-foreground">{entry.word.meaning}</p>
          {entry.word.common && (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:800, marginTop:10, color:c1 }}>Common word</p>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Kanji in this word</p>
          <div className="flex flex-wrap gap-2">
            {entry.kanji.map((kanji) => {
              const [kc1] = CAT_COLORS[kanji.category] ?? ["#6b7280", "#4b5563"];
              const isUnlocked = unlockedKanji.has(kanji.id);
              return (
                <button
                  key={kanji.id}
                  onClick={() => onNavKanji(kanji.id)}
                  style={{
                    display:"flex",
                    alignItems:"center",
                    gap:7,
                    padding:"7px 12px",
                    borderRadius:14,
                    background: isUnlocked ? `${kc1}22` : "var(--muted)",
                    border:`1px solid ${isUnlocked ? kc1+"44" : "var(--border)"}`,
                    cursor:"pointer",
                  }}
                >
                  {!isUnlocked && <Lock size={11} className="text-muted-foreground" />}
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:23, color: isUnlocked ? kc1 : "var(--muted-foreground)" }}>{kanji.char}</span>
                  <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, color: isUnlocked ? kc1 : "var(--muted-foreground)" }}>{kanji.meanings[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
