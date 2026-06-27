import { ChevronLeft, HelpCircle, Lock, Star } from "lucide-react";
import { ChatSection } from "../components/ChatSection";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { getLearningCategoryColors, getLearningCategoryLabel, getReadableTextColor } from "../data/ui/categoryColors";
import { findWordEntry, getWordEntryColors } from "../data/wordData";
import type { ChatMsg, WordMetadataTag } from "../types";

const WORD_CLASSIFICATIONS: {
  tags: WordMetadataTag[];
  label: string;
  description: string;
}[] = [
  {
    tags: ["ateji"],
    label: "🔊 Ateji",
    description: "This word's Kanji may not necessarily be used for their meaning, but rather for their sound.",
  },
  {
    tags: ["gikun"],
    label: "📖 Special Reading",
    description: "This word has a reading that may not be able to be discerned from its Kanji. The true reading of the word can be found by reading its Furigana or Romaji.",
  },
  {
    tags: ["iK", "ik", "io"],
    label: "⚠️ Irregular Usage",
    description: "This word may use its Kanji or Kana in a way that is not consistent with how those Kanji are used in other words.",
  },
  {
    tags: ["oK", "ok", "rK", "rk"],
    label: "🕰️ Rare/Old Form",
    description: "This spelling is rare or historical, and may not be commonly used in modern Japanese anymore.",
  },
];

function getWordClassification(wordTags: WordMetadataTag[] = []) {
  return WORD_CLASSIFICATIONS.find((classification) => classification.tags.some((tag) => wordTags.includes(tag)));
}

export function WordEntryPage({ id, unlockedKanji, favorites, notes, chatMsgs, darkMode, onBack, backLabel, onBackToCollection, onToggleFav, onSetNote, onChat, onNavKanji }: {
  id: string;
  unlockedKanji: Set<string>;
  favorites: Set<string>;
  notes: Record<string, string>;
  chatMsgs: Record<string, ChatMsg[]>;
  darkMode: boolean;
  onBack: () => void;
  backLabel: string;
  onBackToCollection?: () => void;
  onToggleFav: (key: string) => void;
  onSetNote: (key: string, value: string) => void;
  onChat: (key: string, question: string, answer: string) => void;
  onNavKanji: (id: string) => void;
}) {
  const entry = findWordEntry(id);

  if (!entry) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }}>
            <ChevronLeft size={20} /> {backLabel}
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
  const categories = Array.from(new Set(entry.kanji.map((kanji) => kanji.learningCategory)));
  const wordClassification = getWordClassification(entry.word.wordTags);
  const background = c1 === c2
    ? c1
    : `linear-gradient(135deg, ${c1}, ${c2})`;
  const heroTextColor = getReadableTextColor(c1, c2);
  const meaningParts = entry.word.meaning
    .split(";")
    .map((meaning) => meaning.trim())
    .filter(Boolean);
  const meaningPillBackground = c1 === c2
    ? `${c1}24`
    : `linear-gradient(135deg, ${c1}26, ${c2}26)`;
  const meaningPillBorder = c1 === c2
    ? `${c1}55`
    : `color-mix(in srgb, ${c1} 50%, ${c2})`;
  const meaningPillColor = c1 === c2
    ? c1
    : `color-mix(in srgb, ${c1} 42%, ${c2})`;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div className="flex flex-col items-start gap-1">
          <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }}>
            <ChevronLeft size={20} /> {backLabel}
          </button>
          {onBackToCollection && (
            <button
              onClick={onBackToCollection}
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
              Back to Collection.
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
          <span style={{ fontFamily:"var(--jp-font)", fontSize:15, fontWeight:700, color:heroTextColor, marginBottom:6 }}>{entry.word.furigana}</span>
          <span style={{ fontFamily:"var(--jp-font)", fontSize:42, fontWeight:800, color:heroTextColor, lineHeight:1.1 }}>{entry.word.japanese}</span>
          <span style={{ fontFamily:"var(--ui-font)", fontSize:14, fontWeight:800, color:heroTextColor, marginTop:7 }}>{entry.word.romaji}</span>
        </div>

        <div style={{ display:"flex", gap:7, flexWrap:"wrap", justifyContent:"center" }}>
          {categories.map((category) => {
            const [cat1] = getLearningCategoryColors(category);
            return (
              <span key={category} style={{ padding:"4px 9px", borderRadius:999, background:`${cat1}22`, color: darkMode ? cat1 : "#111827", fontFamily:"var(--ui-font)", fontSize:11, fontWeight:900, textTransform:"uppercase" }}>
                {getLearningCategoryLabel(category)}
              </span>
            );
          })}
        </div>
        {wordClassification && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:9 }}>
            <span
              style={{
                padding:"5px 11px",
                borderRadius:999,
                background:"var(--muted)",
                border:"1px solid var(--border)",
                color:"var(--foreground)",
                fontFamily:"var(--ui-font)",
                fontSize:12,
                fontWeight:900,
                lineHeight:1.15,
              }}
            >
              {wordClassification.label}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label={`About ${wordClassification.label}`}
                  style={{
                    width:24,
                    height:24,
                    borderRadius:999,
                    display:"inline-flex",
                    alignItems:"center",
                    justifyContent:"center",
                    border:"1px solid var(--border)",
                    background:"var(--card)",
                    color:"var(--muted-foreground)",
                    boxShadow:"0 2px 8px rgba(15, 23, 42, 0.12)",
                    cursor:"pointer",
                  }}
                >
                  <HelpCircle size={15} strokeWidth={2.4} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" sideOffset={8} style={{ width:260, borderRadius:14, padding:12 }}>
                <p style={{ fontFamily:"var(--ui-font)", fontSize:13, fontWeight:900, color:"var(--foreground)", marginBottom:5 }}>
                  {wordClassification.label}
                </p>
                <p style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:650, color:"var(--muted-foreground)", lineHeight:1.45 }}>
                  {wordClassification.description}
                </p>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8">
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Meaning</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {meaningParts.map((meaning) => (
              <span
                key={meaning}
                style={{
                  maxWidth:"100%",
                  padding:"7px 11px",
                  borderRadius:999,
                  background:meaningPillBackground,
                  border:`1px solid ${meaningPillBorder}`,
                  color: darkMode ? meaningPillColor : "#111827",
                  fontFamily:"var(--ui-font)",
                  fontSize:14,
                  fontWeight:850,
                  lineHeight:1.25,
                }}
              >
                {meaning}
              </span>
            ))}
          </div>
          {entry.word.common && (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:800, marginTop:10, color:c1 }}>Common word</p>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Kanji in this word</p>
          <div className="flex flex-wrap gap-2">
            {entry.kanji.map((kanji) => {
              const [kc1] = getLearningCategoryColors(kanji.learningCategory);
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
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:23, color: darkMode ? (isUnlocked ? kc1 : "var(--muted-foreground)") : "#111827" }}>{kanji.char}</span>
                  <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, color: darkMode ? (isUnlocked ? kc1 : "var(--muted-foreground)") : "#111827" }}>{kanji.meanings[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">My Notes</p>
          <textarea
            value={notes[key] || ""}
            onChange={(event) => onSetNote(key, event.target.value)}
            placeholder="Add your personal notes, usage examples, or reminders..."
            rows={3}
            style={{
              width:"100%",
              background:"var(--input-background)",
              borderRadius:10,
              border:"1px solid var(--border)",
              padding:"8px 10px",
              fontFamily:"var(--ui-font)",
              fontSize:13,
              color:"var(--foreground)",
              outline:"none",
              resize:"none",
              lineHeight:1.5,
            }}
          />
        </div>

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <ChatSection entryKey={key} msgs={chatMsgs[key] || []} onSend={onChat} contextLabel="word" />
        </div>
      </div>
    </div>
  );
}
