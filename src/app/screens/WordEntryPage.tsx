import { useEffect, useState } from "react";
import { HelpCircle, Lock, Star } from "lucide-react";
import { ChatSection } from "../components/ChatSection";
import { EntryNavigationButtons } from "../components/EntryNavigationButtons";
import { getKanjiDisplayName } from "../data/displayNames";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { getLearningCategoryColors, getLearningCategoryLabel, getLearningCategoryTextColor, getReadableTextColor } from "../data/ui/categoryColors";
import { findWordEntry, getWordEntryColors, type WordEntry } from "../data/wordData";
import { getWordVariantLabel } from "../data/wordFamily";
import type { ChatMsg, WordMetadataTag } from "../types";

const WORD_CLASSIFICATIONS: {
  tags: WordMetadataTag[];
  label: string;
  description: string;
}[] = [
  {
    tags: ["ateji"],
    label: "Ateji",
    description: "JMdict marks this spelling as ateji: the Kanji are used primarily for their sound.",
  },
  {
    tags: ["gikun"],
    label: "Special reading",
    description: "JMdict marks this as gikun or jukujikun, where the word-level reading is not composed in the usual way from each Kanji.",
  },
  {
    tags: ["iK", "ik", "io"],
    label: "Irregular usage",
    description: "JMdict marks the Kanji, Kana, or okurigana usage as irregular.",
  },
  {
    tags: ["oK", "ok", "rK", "rk", "sk"],
    label: "Rare or old form",
    description: "JMdict marks this spelling or reading as outdated, rare, or search-only.",
  },
];

function getWordClassification(wordTags: WordMetadataTag[] = []) {
  return WORD_CLASSIFICATIONS.find((classification) => classification.tags.some((tag) => wordTags.includes(tag)));
}

export function WordEntryPage({ id, unlockedKanji, favorites, customNames, notes, chatMsgs, darkMode, onBack, backLabel, onBackToCollection, onToggleFav, onSetNote, onChat, onNavKanji }: {
  id: string;
  unlockedKanji: Set<string>;
  favorites: Set<string>;
  customNames: Record<string, string>;
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
  const [entry, setEntry] = useState<WordEntry | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setEntry(undefined);
    findWordEntry(id)
      .then((nextEntry) => {
        if (!cancelled) setEntry(nextEntry);
      })
      .catch(() => {
        if (!cancelled) setEntry(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !entry) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <EntryNavigationButtons backLabel={backLabel} onBack={onBack} onBackToCollection={onBackToCollection} />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:18 }} className="text-foreground">{loading ? "Loading word..." : "Word not found"}</p>
          <p style={{ fontFamily:"var(--ui-font)", fontSize:13, marginTop:6 }} className="text-muted-foreground">
            {loading ? "Preparing this vocabulary entry." : "This vocabulary entry is not available in the current dataset."}
          </p>
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
  const heroTextColor = categories.length === 1 ? getLearningCategoryTextColor(categories[0]) : getReadableTextColor(c1, c2);
  const wordSenses = entry.word.senses?.length
    ? entry.word.senses
    : [{ index: 1, glosses: entry.word.meaning.split(";").map((meaning) => meaning.trim()).filter(Boolean) }];
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
        <EntryNavigationButtons backLabel={backLabel} onBack={onBack} onBackToCollection={onBackToCollection} />
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
          {entry.word.romaji ? (
            <span style={{ fontFamily:"var(--ui-font)", fontSize:14, fontWeight:800, color:heroTextColor, marginTop:7 }}>{entry.word.romaji}</span>
          ) : (
            <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, color:heroTextColor, marginTop:7 }}>Romanization unavailable</span>
          )}
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

      <div className="entry-section-stack flex flex-col px-4 pb-8">
        {entry.variants.length > 1 && (
          <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Forms and readings</p>
            <div style={{ display:"grid", gap:8 }}>
              {entry.variants.map((variant, index) => {
                const label = index === 0 ? "Preferred form" : getWordVariantLabel(variant.word, entry.word);
                const sensesDiffer = JSON.stringify(variant.word.senses ?? []) !== JSON.stringify(entry.word.senses ?? []);
                const selected = variant.id === entry.selectedVariantId;
                return (
                  <div key={variant.id} style={{ padding:"9px 10px", borderRadius:12, background:selected ? "color-mix(in srgb, var(--primary) 10%, var(--muted))" : "var(--muted)", border:`1px solid ${selected ? "color-mix(in srgb, var(--primary) 42%, var(--border))" : "var(--border)"}` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                      <div style={{ minWidth:0 }}>
                        <span style={{ fontFamily:"var(--jp-font)", fontSize:18, fontWeight:800 }} className="text-foreground">{variant.word.japanese}</span>
                        <span style={{ fontFamily:"var(--jp-font)", fontSize:12, marginLeft:7 }} className="text-muted-foreground">({variant.word.furigana})</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
                        {selected && <span style={{ fontFamily:"var(--ui-font)", fontSize:9, fontWeight:900, color:"var(--primary)" }}>OPENED FORM</span>}
                        <span style={{ padding:"3px 7px", borderRadius:999, background:"var(--card)", border:"1px solid var(--border)", fontFamily:"var(--ui-font)", fontSize:9, fontWeight:900, whiteSpace:"nowrap" }}>{label}</span>
                      </div>
                    </div>
                    {sensesDiffer && <p style={{ fontFamily:"var(--ui-font)", fontSize:11, lineHeight:1.4, marginTop:5 }} className="text-muted-foreground">Meaning for this form: {variant.word.meaning}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Dictionary Senses</p>
          <div style={{ display:"grid", gap:12 }}>
            {wordSenses.map((sense) => {
              const detailTags = [
                ...(sense.partsOfSpeech ?? []),
                ...(sense.fields ?? []),
                ...(sense.usageLabels ?? []),
                ...(sense.dialects ?? []),
              ];
              return (
                <div key={sense.index} style={{ paddingTop:sense.index === wordSenses[0]?.index ? 0 : 12, borderTop:sense.index === wordSenses[0]?.index ? "none" : "1px solid var(--border)" }}>
                  {wordSenses.length > 1 && <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:900, marginBottom:6 }} className="text-muted-foreground">SENSE {sense.index}</p>}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {sense.glosses.map((meaning) => (
                      <span key={meaning} style={{ maxWidth:"100%", padding:"7px 11px", borderRadius:999, background:meaningPillBackground, border:`1px solid ${meaningPillBorder}`, color: darkMode ? meaningPillColor : "#111827", fontFamily:"var(--ui-font)", fontSize:14, fontWeight:850, lineHeight:1.25 }}>
                        {meaning}
                      </span>
                    ))}
                  </div>
                  {detailTags.length > 0 && <p style={{ fontFamily:"var(--ui-font)", fontSize:11, marginTop:7, lineHeight:1.45 }} className="text-muted-foreground">{detailTags.join(" / ")}</p>}
                  {sense.notes?.length ? <p style={{ fontFamily:"var(--ui-font)", fontSize:11, marginTop:5, lineHeight:1.45 }} className="text-muted-foreground">{sense.notes.join("; ")}</p> : null}
                </div>
              );
            })}
          </div>
          {entry.word.common && (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:800, marginTop:10, color:c1 }}>Priority-listed in JMdict</p>
          )}
          {entry.word.source && (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:11, marginTop:8 }} className="text-muted-foreground">
              Source: JMdict entry {entry.word.source.entryId}, spelling {entry.word.source.spellingIndex}, reading {entry.word.source.readingIndex}
            </p>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">{entry.variants.length > 1 ? "Kanji in these forms" : "Kanji in this word"}</p>
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
                  <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, color: darkMode ? (isUnlocked ? kc1 : "var(--muted-foreground)") : "#111827" }}>{getKanjiDisplayName(kanji, customNames)}</span>
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
