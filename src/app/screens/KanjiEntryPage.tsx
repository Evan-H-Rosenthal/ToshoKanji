import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Info, Pencil, Search, Star, Tags, X } from "lucide-react";
import { EntryNavigationButtons } from "../components/EntryNavigationButtons";
import { COMPONENT_BY_ID, KANJI_BY_ID, RADICAL_BY_ID } from "../data/entryIndexes";
import { getComponentDisplayName, getComponentMeanings } from "../data/displayNames";
import { LEARNING_CATEGORIES, getLearningCategoryColors, getLearningCategoryLabel, getLearningCategoryTextColor, getReadableTextColor } from "../data/ui/categoryColors";
import { getKanjiWordReadingType } from "../data/kanjiWordReading";
import { getKanjiRarityInfo } from "../data/kanjiRarity";
import { getWordsForKanji } from "../data/wordData";
import { ChatSection } from "../components/ChatSection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import type { ChatMsg, KanjiEntryViewState, Word, WordReadingType } from "../types";

const COMPONENT_ROLE_COLORS = {
  radical: "#3b82f6",
  character: "#16a36a",
  lookup: "#8b5cf6",
} as const;

const WORD_READING_TYPES: Array<{ type: WordReadingType; label: string; color: string }> = [
  { type: "on", label: "On", color: "var(--primary)" },
  { type: "kun", label: "Kun", color: "var(--success)" },
  { type: "unusual", label: "Unusual", color: "var(--warning)" },
];

const getWordReadingMeta = (type: WordReadingType) => WORD_READING_TYPES.find((option) => option.type === type)!;

export function KanjiEntryPage({ id, unlockedKanji, favorites, customNames, notes, chatMsgs, darkMode, onBack, backLabel, initialViewState, onViewStateChange, onBackToCollection, onToggleFav, onSetName, onSetNote, onChat, onNavKanji, onNavComponent, onNavWord }: {
  id: string; unlockedKanji: Set<string>;
  favorites: Set<string>; customNames: Record<string,string>; notes: Record<string,string>;
  chatMsgs: Record<string,ChatMsg[]>;
  darkMode: boolean;
  onBack: () => void; backLabel: string; onBackToCollection?: () => void; onToggleFav: (k:string)=>void; onSetName:(k:string,v:string)=>void;
  initialViewState?: KanjiEntryViewState;
  onViewStateChange?: (id: string, viewState: KanjiEntryViewState) => void;
  onSetNote:(k:string,v:string)=>void; onChat:(k:string,q:string,a:string)=>void;
  onNavKanji:(id:string)=>void; onNavComponent:(id:string)=>void; onNavWord:(id:string)=>void;
}) {
  const k = KANJI_BY_ID.get(id)!;
  const key = `kanji:${id}`;
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(customNames[key] || k.meanings[0]);
  const [showAllKunyomi, setShowAllKunyomi] = useState(false);
  const [showRawComponents, setShowRawComponents] = useState(false);
  const [wordQuery, setWordQuery] = useState(initialViewState?.wordQuery ?? "");
  const [wordReadingFilters, setWordReadingFilters] = useState<Set<WordReadingType>>(
    () => new Set(initialViewState?.wordReadingFilters ?? []),
  );
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [currentLearningCategory, setCurrentLearningCategory] = useState(k.learningCategory);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [categorySaveError, setCategorySaveError] = useState("");
  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [visibleWordLimit, setVisibleWordLimit] = useState(80);
  const nameRef = useRef<HTMLInputElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const wordBrowserScrollRef = useRef<HTMLDivElement>(null);
  const restoredWordBrowserScrollRef = useRef(false);
  const latestViewStateRef = useRef<KanjiEntryViewState>({
    scrollTop: initialViewState?.scrollTop ?? 0,
    wordBrowserScrollTop: initialViewState?.wordBrowserScrollTop ?? 0,
    wordQuery: initialViewState?.wordQuery ?? "",
    wordReadingFilters: initialViewState?.wordReadingFilters ?? [],
  });
  const wordQueryRef = useRef(wordQuery);
  useEffect(() => { if (editingName) nameRef.current?.focus(); }, [editingName]);
  const wordReadingFiltersRef = useRef(wordReadingFilters);
  const emitViewState = useCallback((overrides: Partial<KanjiEntryViewState> = {}) => {
    const previous = latestViewStateRef.current;
    const next = {
      scrollTop: pageScrollRef.current?.scrollTop ?? previous.scrollTop,
      wordBrowserScrollTop: restoredWordBrowserScrollRef.current
        ? wordBrowserScrollRef.current?.scrollTop ?? previous.wordBrowserScrollTop
        : previous.wordBrowserScrollTop,
      wordQuery: wordQueryRef.current,
      wordReadingFilters: Array.from(wordReadingFiltersRef.current),
      ...overrides,
    };
    latestViewStateRef.current = next;
    onViewStateChange?.(id, next);
  }, [id, onViewStateChange]);

  useLayoutEffect(() => {
    latestViewStateRef.current = {
      scrollTop: initialViewState?.scrollTop ?? 0,
      wordBrowserScrollTop: initialViewState?.wordBrowserScrollTop ?? 0,
      wordQuery: initialViewState?.wordQuery ?? "",
      wordReadingFilters: initialViewState?.wordReadingFilters ?? [],
    };
    const pageScroll = pageScrollRef.current;
    if (!pageScroll) return;
    pageScroll.scrollTop = initialViewState?.scrollTop ?? 0;
  }, [id, initialViewState]);

  useEffect(() => {
    const nextWordQuery = initialViewState?.wordQuery ?? "";
    wordQueryRef.current = nextWordQuery;
    setWordQuery(nextWordQuery);
    const nextWordReadingFilters = new Set(initialViewState?.wordReadingFilters ?? []);
    wordReadingFiltersRef.current = nextWordReadingFilters;
    setWordReadingFilters(nextWordReadingFilters);
  }, [id, initialViewState]);

  useEffect(() => {
    wordQueryRef.current = wordQuery;
    emitViewState({ wordQuery });
  }, [emitViewState, wordQuery]);

  useEffect(() => {
    return () => {
      emitViewState();
    };
  }, [emitViewState]);

  useEffect(() => {
    let cancelled = false;
    setLoadingWords(true);
    getWordsForKanji(k.id)
      .then((nextWords) => {
        if (!cancelled) setWords(nextWords);
      })
      .catch(() => {
        if (!cancelled) setWords([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingWords(false);
      });

    return () => {
      cancelled = true;
    };
  }, [k.id]);
  useEffect(() => {
    setVisibleWordLimit(80);
    setCurrentLearningCategory(k.learningCategory);
    setCategoryPickerOpen(false);
    setSavingCategory(null);
    setCategorySaveError("");
    restoredWordBrowserScrollRef.current = false;
  }, [k.id, k.learningCategory]);
  const saveName = () => { onSetName(key, nameVal || k.meanings[0]); setEditingName(false); };
  const canCategorize = import.meta.env.DEV;
  const saveLearningCategory = async (learningCategory: string) => {
    if (learningCategory === currentLearningCategory || savingCategory) return;
    setSavingCategory(learningCategory);
    setCategorySaveError("");
    try {
      const response = await fetch("/__tosho-kanji/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kanjiId: k.id, learningCategory }),
      });
      if (!response.ok) throw new Error(`Save failed (${response.status})`);
      setCurrentLearningCategory(learningCategory);
      setCategoryPickerOpen(false);
    } catch (error) {
      setCategorySaveError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingCategory(null);
    }
  };
  const isFav = favorites.has(key);
  const [cat1, cat2] = getLearningCategoryColors(currentLearningCategory);
  const learningCategoryLabel = getLearningCategoryLabel(currentLearningCategory);
  const rarityInfo = getKanjiRarityInfo(k);
  const heroTextColor = getLearningCategoryTextColor(currentLearningCategory);
  const visibleKunyomi = showAllKunyomi ? k.kunyomi : k.kunyomi.slice(0, 3);
  const hiddenKunyomiCount = Math.max(0, k.kunyomi.length - visibleKunyomi.length);
  const alternateMeanings = k.meanings.slice(1);
  const normalizedWordQuery = wordQuery.trim().toLowerCase();
  const classifiedWords = useMemo(() => words.map((word) => ({
    word,
    readingType: getKanjiWordReadingType(k, word),
  })), [k, words]);
  const filteredWords = classifiedWords.filter(({ word, readingType }) => (
    (wordReadingFilters.size === 0 || wordReadingFilters.has(readingType))
    && (!normalizedWordQuery
      || word.japanese.includes(normalizedWordQuery)
      || word.furigana.includes(normalizedWordQuery)
      || word.romaji.toLowerCase().includes(normalizedWordQuery)
      || word.meaning.toLowerCase().includes(normalizedWordQuery)
      || word.senses?.some((sense) => sense.glosses.some((gloss) => gloss.toLowerCase().includes(normalizedWordQuery))))
  ));
  const toggleWordReadingFilter = (readingType: WordReadingType) => {
    const next = new Set(wordReadingFilters);
    if (next.has(readingType)) next.delete(readingType);
    else next.add(readingType);
    wordReadingFiltersRef.current = next;
    setWordReadingFilters(next);
    setVisibleWordLimit(80);
    if (wordBrowserScrollRef.current) wordBrowserScrollRef.current.scrollTop = 0;
    emitViewState({
      wordBrowserScrollTop: 0,
      wordReadingFilters: Array.from(next),
    });
  };
  useLayoutEffect(() => {
    const wordBrowser = wordBrowserScrollRef.current;
    if (!wordBrowser || restoredWordBrowserScrollRef.current || loadingWords) return;
    wordBrowser.scrollTop = initialViewState?.wordBrowserScrollTop ?? 0;
    restoredWordBrowserScrollRef.current = true;
    emitViewState({ wordBrowserScrollTop: wordBrowser.scrollTop });
  }, [filteredWords.length, id, initialViewState, loadingWords]);
  const learnerParts = k.learnerParts ?? [];
  const rawParts = k.rawDecomposition?.parts ?? [];
  const officialRadical = k.officialRadical;
  const officialRadicalEntry = officialRadical ? RADICAL_BY_ID.get(officialRadical.id) : undefined;
  const officialRadicalComponent = officialRadicalEntry?.componentId
    ? COMPONENT_BY_ID.get(officialRadicalEntry.componentId)
    : undefined;
  const officialRadicalName = officialRadical
    ? getComponentDisplayName(
      officialRadicalComponent,
      officialRadical.id,
      officialRadicalEntry?.radicalNumber ? `Radical ${officialRadicalEntry.radicalNumber}` : "Official radical",
      customNames,
    )
    : "";

  return (
    <div
      ref={pageScrollRef}
      className="flex flex-col h-full overflow-y-auto"
      onScroll={() => emitViewState()}
      style={{ position:"relative" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <EntryNavigationButtons backLabel={backLabel} onBack={onBack} onBackToCollection={onBackToCollection} />
        <button onClick={()=>onToggleFav(key)}>
          <Star size={22} fill={isFav?"#ffd700":"none"} color={isFav?"#ffd700":"var(--muted-foreground)"} />
        </button>
      </div>

      {/* Hero kanji */}
      <div className="flex flex-col items-center pb-4 pt-2 px-4 shrink-0">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, width:"100%" }}>
        <div style={{
          width:140, height:140, borderRadius:28, display:"flex", alignItems:"center", justifyContent:"center",
          background:`linear-gradient(135deg, ${cat1}, ${cat2})`,
          boxShadow: `0 12px 40px ${cat1}55, 0 0 0 6px ${cat1}22`,
          marginBottom:12,
        }}>
          <span style={{ fontFamily:"var(--jp-font)", fontSize:80, fontWeight:700, color:heroTextColor, lineHeight:1 }}>{k.char}</span>
        </div>
        {canCategorize && (
          <button
            type="button"
            onClick={() => setCategoryPickerOpen(true)}
            aria-label="Categorize kanji"
            style={{
              width:44,
              height:44,
              marginBottom:12,
              borderRadius:14,
              border:"1px solid var(--border)",
              background:"var(--card)",
              color:"var(--foreground)",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              boxShadow:"0 8px 20px rgba(0,0,0,0.12)",
              cursor:"pointer",
            }}
          >
            <Tags size={19} />
          </button>
        )}
        </div>

        {/* Name / edit */}
        <div className="flex items-center gap-2">
          {editingName ? (
            <input ref={nameRef} value={nameVal} onChange={e=>setNameVal(e.target.value)}
              onBlur={saveName} onKeyDown={e=>{ if(e.key==="Enter") saveName(); if(e.key==="Escape"){ setEditingName(false); setNameVal(customNames[key]||k.meanings[0]); }}}
              style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:20, textAlign:"center", background:"var(--input-background)", borderRadius:8, border:"2px solid var(--primary)", padding:"2px 8px", color:"var(--foreground)", outline:"none", maxWidth:200 }} />
          ) : (
            <h1 style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:22 }} className="text-foreground">{customNames[key] || k.meanings[0]}</h1>
          )}
          <button onClick={()=>setEditingName(true)} className="text-muted-foreground"><Pencil size={15} /></button>
        </div>
        {alternateMeanings.length > 0 && (
          <p style={{ fontFamily:"var(--ui-font)", fontSize:12 }} className="text-muted-foreground">{alternateMeanings.join(", ")}</p>
        )}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, flexWrap:"wrap", marginTop:8 }}>
          <span
            style={{
              padding:"5px 11px",
              borderRadius:999,
              background:`${cat1}22`,
              border:`1px solid ${cat1}44`,
              color: darkMode ? cat1 : "#111827",
              fontFamily:"var(--ui-font)",
              fontSize:11,
              fontWeight:900,
              textTransform:"uppercase",
            }}
          >
            {learningCategoryLabel}
          </span>
          <span
            style={{
              padding:"5px 11px",
              borderRadius:999,
              background:`linear-gradient(135deg, ${rarityInfo.color}, ${rarityInfo.color2})`,
              border:`1px solid ${rarityInfo.color}`,
              color:rarityInfo.textColor,
              boxShadow:`0 0 18px ${rarityInfo.color}55`,
              fontFamily:"var(--ui-font)",
              fontSize:11,
              fontWeight:1000,
              textTransform:"uppercase",
            }}
          >
            {rarityInfo.label}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {categoryPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position:"absolute",
              inset:0,
              zIndex:50,
              background:"rgba(5,4,17,0.48)",
              backdropFilter:"blur(5px)",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              padding:18,
            }}
            onClick={() => setCategoryPickerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ type:"spring", stiffness:430, damping:28 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                width:"100%",
                maxWidth:300,
                maxHeight:"min(560px, calc(100% - 24px))",
                borderRadius:22,
                background:"linear-gradient(180deg, var(--card), color-mix(in srgb, var(--card) 88%, var(--primary)))",
                border:"1px solid var(--border)",
                boxShadow:"0 24px 60px rgba(0,0,0,0.42)",
                padding:16,
                position:"relative",
                overflow:"hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setCategoryPickerOpen(false)}
                aria-label="Close categorizer"
                style={{
                  position:"absolute",
                  top:12,
                  right:12,
                  width:28,
                  height:28,
                  borderRadius:10,
                  border:"1px solid var(--border)",
                  background:"var(--muted)",
                  color:"var(--foreground)",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  cursor:"pointer",
                }}
              >
                <X size={16} />
              </button>

              <p style={{ fontFamily:"var(--ui-font)", fontSize:19, fontWeight:1000, marginBottom:4 }} className="text-foreground">
                Categorize
              </p>
              <p style={{ fontFamily:"var(--jp-font)", fontSize:30, fontWeight:900, marginBottom:12, lineHeight:1 }} className="text-foreground">
                {k.char}
              </p>

              <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:420, overflowY:"auto", paddingRight:4 }}>
                {LEARNING_CATEGORIES.map((category) => {
                  const [color1, color2] = category.colors;
                  const selected = currentLearningCategory === category.id;
                  const saving = savingCategory === category.id;
                  const textColor = getLearningCategoryTextColor(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => saveLearningCategory(category.id)}
                      disabled={Boolean(savingCategory)}
                      style={{
                        minHeight:42,
                        borderRadius:14,
                        border:selected ? `2px solid ${color1}` : "1px solid var(--border)",
                        background:selected ? `linear-gradient(135deg, ${color1}, ${color2})` : "var(--muted)",
                        color:selected ? textColor : "var(--foreground)",
                        display:"flex",
                        alignItems:"center",
                        justifyContent:"space-between",
                        gap:10,
                        padding:"8px 10px",
                        cursor:savingCategory ? "default" : "pointer",
                        opacity:savingCategory && !saving ? 0.62 : 1,
                      }}
                    >
                      <span style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                        <span
                          aria-hidden
                          style={{
                            width:16,
                            height:16,
                            borderRadius:999,
                            background:`linear-gradient(135deg, ${color1}, ${color2})`,
                            border:"1px solid rgba(255,255,255,0.48)",
                            flex:"0 0 auto",
                          }}
                        />
                        <span style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:900, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {category.label}
                        </span>
                      </span>
                      {(selected || saving) && <Check size={15} />}
                    </button>
                  );
                })}
              </div>

              {categorySaveError && (
                <p style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, marginTop:10, color:"#ef4444" }}>
                  {categorySaveError}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content sections */}
      <div className="entry-section-stack flex flex-col px-4 pb-8">
        {/* Readings */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Readings</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <span style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:11, padding:"2px 8px", borderRadius:20, background:`${cat1}22`, color: darkMode ? cat1 : "#111827" }}>On</span>
              <span style={{ fontFamily:"var(--jp-font)", fontSize:16 }} className="text-foreground">{k.onyomi.join("、")}</span>
            </div>
            <div className="flex items-start gap-3">
              <span style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:11, padding:"2px 8px", borderRadius:20, background:`${cat2}22`, color: darkMode ? cat2 : "#111827" }}>Kun</span>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flex:1 }}>
                <span style={{ fontFamily:"var(--jp-font)", fontSize:16 }} className="text-foreground">{visibleKunyomi.join("、")}</span>
                {k.kunyomi.length > 3 && (
                  <button
                    onClick={() => setShowAllKunyomi((value) => !value)}
                    style={{
                      padding:"3px 8px",
                      borderRadius:999,
                      border:`1px solid ${cat2}44`,
                      background:`${cat2}18`,
                      color:cat2,
                      fontFamily:"var(--ui-font)",
                      fontSize:10,
                      fontWeight:900,
                      cursor:"pointer",
                    }}
                  >
                    {showAllKunyomi ? "Show fewer" : `Show ${hiddenKunyomiCount} more`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Components */}
        {(officialRadical || learnerParts.length > 0) && (
          <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground">Radical &amp; Components</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      aria-label="About radicals and component colors"
                      className="text-muted-foreground"
                      style={{
                        width:24,
                        height:24,
                        display:"inline-flex",
                        alignItems:"center",
                        justifyContent:"center",
                        borderRadius:999,
                        border:"1px solid transparent",
                        background:"transparent",
                        cursor:"pointer",
                      }}
                    >
                      <Info size={15} />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>About radicals and components</DialogTitle>
                      <DialogDescription style={{ fontFamily:"var(--ui-font)", lineHeight:1.55 }}>
                        Blue identifies the official dictionary radical. Green identifies a visible shape that is also a KANJIDIC2 character with its own meaning. Purple identifies a visual lookup shape. A green component is explorable as a character, but its standalone meaning is not automatically its meaning or function inside this Kanji. KRADFILE and RADKFILE do not identify semantic, phonetic, or pictorial roles.
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
              {rawParts.length > learnerParts.length && (
                <button
                  onClick={() => setShowRawComponents((value) => !value)}
                  style={{
                    padding:"4px 9px",
                    borderRadius:999,
                    border:"1px solid var(--border)",
                    background:"var(--muted)",
                    color:"var(--muted-foreground)",
                    fontFamily:"var(--ui-font)",
                    fontSize:10,
                    fontWeight:900,
                    cursor:"pointer",
                    whiteSpace:"nowrap",
                  }}
                >
                  {showRawComponents ? "Hide raw" : "Show raw"}
                </button>
              )}
            </div>

            {officialRadical && (
              <div>
                <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:7 }} className="text-muted-foreground">
                  Radical classification
                </p>
                <button
                  type="button"
                  disabled={!officialRadicalComponent}
                  onClick={() => officialRadicalComponent && onNavComponent(officialRadicalComponent.id)}
                  aria-label={`${officialRadical.char}, canonical radical${officialRadicalEntry?.radicalNumber ? ` ${officialRadicalEntry.radicalNumber}` : ""}`}
                  style={{
                    display:"inline-flex",
                    alignItems:"center",
                    gap:8,
                    padding:"7px 12px",
                    borderRadius:12,
                    background:`${COMPONENT_ROLE_COLORS.radical}22`,
                    border:`1px solid ${COMPONENT_ROLE_COLORS.radical}55`,
                    cursor:officialRadicalComponent ? "pointer" : "default",
                    textAlign:"left",
                  }}
                >
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:24, color:COMPONENT_ROLE_COLORS.radical }}>{officialRadical.char}</span>
                  <span style={{ display:"flex", flexDirection:"column", lineHeight:1.1 }}>
                    <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:900, color:darkMode ? COMPONENT_ROLE_COLORS.radical : "#111827" }}>
                      {officialRadicalName}
                    </span>
                    <span style={{ fontFamily:"var(--ui-font)", fontSize:9, fontWeight:800, color:"var(--muted-foreground)" }}>
                      {officialRadicalEntry?.radicalNumber ? `Radical ${officialRadicalEntry.radicalNumber} · canonical form` : "Canonical form"}
                    </span>
                  </span>
                </button>
                <p style={{ marginTop:7, fontFamily:"var(--ui-font)", fontSize:10, lineHeight:1.4 }} className="text-muted-foreground">
                  {officialRadical.positionedFormKnown && officialRadical.form
                    ? <>Source-established visible form: <span style={{ fontFamily:"var(--jp-font)", fontWeight:900 }}>{officialRadical.form}</span></>
                    : "The current decomposition sources do not establish this canonical form as a visible shape in the Kanji."}
                </p>
              </div>
            )}

            <div className={officialRadical ? "mt-4 pt-3" : ""} style={officialRadical ? { borderTop:"1px solid var(--border)" } : undefined}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em" }} className="text-muted-foreground">
                  Visible source shapes
                </p>
                <div aria-label="Component color legend" style={{ display:"flex", gap:9, flexWrap:"wrap", fontFamily:"var(--ui-font)", fontSize:9, fontWeight:800, color:"var(--muted-foreground)" }}>
                  {[
                    [COMPONENT_ROLE_COLORS.radical, "Radical"],
                    [COMPONENT_ROLE_COLORS.character, "Character with meaning"],
                    [COMPONENT_ROLE_COLORS.lookup, "Lookup shape"],
                  ].map(([color, label]) => (
                    <span key={label} style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                      <span aria-hidden="true" style={{ width:7, height:7, borderRadius:999, background:color }} />{label}
                    </span>
                  ))}
                </div>
              </div>
              {learnerParts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {learnerParts.map((part,i) => {
                    const rad = part.radicalId ? RADICAL_BY_ID.get(part.radicalId) : undefined;
                    const component = part.componentId ? COMPONENT_BY_ID.get(part.componentId) : undefined;
                    const isOfficialForm = part.role === "official-radical";
                    const componentMeanings = getComponentMeanings(component);
                    const hasStandaloneMeaning = !isOfficialForm && componentMeanings.length > 0;
                    const presentation = isOfficialForm
                      ? { color:COMPONENT_ROLE_COLORS.radical, label:"Visible radical form" }
                      : hasStandaloneMeaning
                        ? { color:COMPONENT_ROLE_COLORS.character, label:"Character with meaning" }
                        : { color:COMPONENT_ROLE_COLORS.lookup, label:"Lookup shape" };
                    const componentLabel = componentMeanings[0]
                      ?? (isOfficialForm && rad?.radicalNumber
                        ? `Radical ${rad.radicalNumber}`
                        : component?.sourceChar && component.sourceChar !== part.char
                          ? `RADK label ${component.sourceChar}`
                          : "Lookup shape");
                    const content = (
                      <>
                        <span style={{ fontFamily:"var(--jp-font)", fontSize:22, color:presentation.color }}>{part.char}</span>
                        <span style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", lineHeight:1.1 }}>
                          <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, color:darkMode ? presentation.color : "#111827" }}>
                            {getComponentDisplayName(component, part.radicalId, componentLabel, customNames)}
                          </span>
                          <span style={{ fontFamily:"var(--ui-font)", fontSize:9, fontWeight:800, color:"var(--muted-foreground)" }}>
                            {presentation.label}
                          </span>
                        </span>
                      </>
                    );
                    const chipStyle = {
                      display:"flex",
                      alignItems:"center",
                      gap:7,
                      padding:"6px 12px",
                      borderRadius:12,
                      background:`${presentation.color}22`,
                      border:`1px solid ${presentation.color}55`,
                    } as const;
                    return component ? (
                      <button
                        key={`${part.char}-${i}`}
                        type="button"
                        aria-label={`${part.char}, ${presentation.label}`}
                        onClick={() => onNavComponent(component.id)}
                        style={{ ...chipStyle, cursor:"pointer" }}
                      >
                        {content}
                      </button>
                    ) : (
                      <span key={`${part.char}-${i}`} aria-label={`${part.char}, unavailable visual component`} style={chipStyle}>
                        {content}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontFamily:"var(--ui-font)", fontSize:11, lineHeight:1.45 }} className="text-muted-foreground">
                  No additional visible lookup shapes are established by the current sources.
                </p>
              )}
            </div>

            {showRawComponents && rawParts.length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop:"1px solid var(--border)" }}>
                <div className="flex flex-wrap gap-2">
                  {rawParts.map((part, i) => (
                    <span
                      key={`raw-${part.char}-${i}`}
                      style={{
                        display:"inline-flex",
                        alignItems:"center",
                        gap:6,
                        padding:"4px 8px",
                        borderRadius:10,
                        background:"var(--muted)",
                        border:"1px solid var(--border)",
                        color:"var(--muted-foreground)",
                        fontFamily:"var(--ui-font)",
                        fontSize:11,
                        fontWeight:800,
                      }}
                    >
                      <span style={{ fontFamily:"var(--jp-font)", fontSize:16 }}>{part.char}</span>
                      {part.role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Words */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap", marginBottom:12 }}>
            <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground">Words using this Kanji</p>
            <div role="group" aria-label="Filter words by this Kanji's reading type" style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {WORD_READING_TYPES.map((option) => {
                const active = wordReadingFilters.has(option.type);
                return (
                  <button
                    key={option.type}
                    type="button"
                    aria-label={`Show ${option.label} reading words`}
                    aria-pressed={active}
                    onClick={() => toggleWordReadingFilter(option.type)}
                    className="app-reactive"
                    style={{
                      height:27,
                      padding:"0 9px",
                      borderRadius:999,
                      border:`1px solid ${active ? option.color : "var(--border)"}`,
                      background: active ? `color-mix(in srgb, ${option.color} 16%, var(--card))` : "var(--muted)",
                      color: active ? option.color : "var(--muted-foreground)",
                      fontFamily:"var(--ui-font)",
                      fontSize:10,
                      fontWeight:900,
                      cursor:"pointer",
                      whiteSpace:"nowrap",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div
            style={{
              position:"relative",
              marginBottom:10,
            }}
          >
            <Search
              size={15}
              className="text-muted-foreground"
              style={{
                position:"absolute",
                left:10,
                top:"50%",
                transform:"translateY(-50%)",
                pointerEvents:"none",
              }}
            />
            <input
              value={wordQuery}
              onChange={(event) => {
                const nextWordQuery = event.target.value;
                wordQueryRef.current = nextWordQuery;
                setWordQuery(nextWordQuery);
                setVisibleWordLimit(80);
                emitViewState({ wordQuery: nextWordQuery });
              }}
              placeholder="Search words"
              aria-label="Search words using this Kanji"
              style={{
                width:"100%",
                height:34,
                padding:"7px 10px 7px 32px",
                borderRadius:10,
                background:"var(--input-background)",
                border:"1px solid var(--border)",
                color:"var(--foreground)",
                fontFamily:"var(--ui-font)",
                fontSize:13,
                fontWeight:700,
                outline:"none",
              }}
            />
          </div>
          <div
            ref={wordBrowserScrollRef}
            className="flex flex-col gap-2"
            onScroll={() => emitViewState()}
            style={{
              maxHeight:282,
              overflowY:"auto",
              paddingRight:4,
            }}
          >
            {loadingWords ? (
              <div
                style={{
                  width:"100%",
                  minHeight:86,
                  padding:"9px 11px",
                  borderRadius:12,
                  background:"var(--muted)",
                  border:"1px solid var(--border)",
                  display:"flex",
                  alignItems:"center",
                  color:"var(--muted-foreground)",
                  fontFamily:"var(--ui-font)",
                  fontSize:13,
                  fontWeight:800,
                }}
              >
                Loading words...
              </div>
            ) : filteredWords.slice(0, visibleWordLimit).map(({ word: w, readingType }, i) => {
              const readingMeta = getWordReadingMeta(readingType);
              return (
              <button
                key={w.id || `${w.japanese}-${i}`}
                onClick={() => {
                  emitViewState();
                  onNavWord(w.id || `w-${w.japanese}`);
                }}
                style={{
                  width:"100%",
                  minHeight:86,
                  padding:"9px 11px",
                  borderRadius:12,
                  background:"var(--muted)",
                  border:"1px solid var(--border)",
                  textAlign:"left",
                  cursor:"pointer",
                  boxShadow:"0 4px 12px rgba(0,0,0,0.05)",
                  overflow:"hidden",
                }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, minWidth:0 }}>
                  <div className="flex items-baseline gap-2" style={{ minWidth:0, flex:1 }}>
                  <span
                    title={w.japanese}
                    style={{
                      fontFamily:"var(--jp-font)",
                      fontSize:Array.from(w.japanese).length > 18 ? 14 : 18,
                      fontWeight:700,
                      lineHeight:1.18,
                      minWidth:0,
                      maxWidth:"100%",
                      overflow:"hidden",
                      display:"-webkit-box",
                      WebkitLineClamp:2,
                      WebkitBoxOrient:"vertical",
                      overflowWrap:"anywhere",
                      wordBreak:"break-word",
                    }}
                    className="text-foreground"
                  >
                    {w.japanese}
                  </span>
                  <span
                    title={w.furigana}
                    style={{
                      fontFamily:"var(--jp-font)",
                      fontSize:12,
                      minWidth:0,
                      maxWidth:"42%",
                      overflow:"hidden",
                      textOverflow:"ellipsis",
                      whiteSpace:"nowrap",
                      flex:"0 1 auto",
                    }}
                    className="text-muted-foreground"
                  >
                    ({w.furigana})
                  </span>
                </div>
                  <span
                    title={`${readingMeta.label} reading for ${k.char}`}
                    style={{
                      flex:"0 0 auto",
                      padding:"3px 7px",
                      borderRadius:999,
                      border:`1px solid color-mix(in srgb, ${readingMeta.color} 42%, transparent)`,
                      background:`color-mix(in srgb, ${readingMeta.color} 14%, var(--card))`,
                      color:readingMeta.color,
                      fontFamily:"var(--ui-font)",
                      fontSize:9,
                      fontWeight:900,
                      lineHeight:1.2,
                      whiteSpace:"nowrap",
                    }}
                  >
                    {readingMeta.label}
                  </span>
                </div>
                <div
                  title={w.romaji}
                  style={{ fontFamily:"var(--ui-font)", fontSize:11, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                  className="text-muted-foreground"
                >
                  {w.romaji}
                </div>
                <div
                  title={w.meaning}
                  style={{
                    fontFamily:"var(--ui-font)",
                    fontSize:13,
                    fontWeight:600,
                    marginTop:2,
                    lineHeight:1.22,
                    overflow:"hidden",
                    display:"-webkit-box",
                    WebkitLineClamp:2,
                    WebkitBoxOrient:"vertical",
                    overflowWrap:"anywhere",
                  }}
                  className="text-foreground"
                >
                  {w.meaning}
                </div>
              </button>
              );
            })}
            {!loadingWords && filteredWords.length > visibleWordLimit && (
              <button type="button" onClick={() => setVisibleWordLimit((limit) => limit + 80)}
                style={{ minHeight:44, borderRadius:12, background:"var(--muted)", border:"1px solid var(--border)", color:"var(--foreground)", fontFamily:"var(--ui-font)", fontSize:12, fontWeight:900 }}>
                Show 80 more words
              </button>
            )}
            {!loadingWords && filteredWords.length === 0 && (
              <div
                style={{
                  minHeight:86,
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  borderRadius:12,
                  background:"var(--muted)",
                  border:"1px solid var(--border)",
                  color:"var(--muted-foreground)",
                  fontFamily:"var(--ui-font)",
                  fontSize:13,
                  fontWeight:800,
                }}
              >
                No matching words
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">My Notes</p>
          <textarea value={notes[key]||""} onChange={e=>onSetNote(key,e.target.value)}
            placeholder="Add your personal notes, mnemonics, or reminders..."
            rows={3}
            style={{
              width:"100%", background:"var(--input-background)", borderRadius:10, border:"1px solid var(--border)",
              padding:"8px 10px", fontFamily:"var(--ui-font)", fontSize:13, color:"var(--foreground)",
              outline:"none", resize:"none", lineHeight:1.5,
            }} />
        </div>

        {/* Chat */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <ChatSection entryKey={key} msgs={chatMsgs[key]||[]} onSend={onChat} />
        </div>
      </div>
    </div>
  );
}

// ── Radical Entry Page ─────────────────────────────────────────────────────────
