import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, Info, Pencil, Search, Star, Tags, X } from "lucide-react";
import { KANJI } from "../data/generated/kanji.generated";
import { COMPONENTS } from "../data/generated/components.generated";
import { RADICALS } from "../data/generated/radicals.generated";
import { LEARNING_CATEGORIES, getLearningCategoryColors, getLearningCategoryLabel, getReadableTextColor, RAD_COLORS } from "../data/ui/categoryColors";
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
import type { ChatMsg } from "../types";

export function KanjiEntryPage({ id, unlockedKanji, favorites, customNames, notes, chatMsgs, darkMode, onBack, backLabel, onBackToCollection, onToggleFav, onSetName, onSetNote, onChat, onNavKanji, onNavComponent, onNavWord }: {
  id: string; unlockedKanji: Set<string>;
  favorites: Set<string>; customNames: Record<string,string>; notes: Record<string,string>;
  chatMsgs: Record<string,ChatMsg[]>;
  darkMode: boolean;
  onBack: () => void; backLabel: string; onBackToCollection?: () => void; onToggleFav: (k:string)=>void; onSetName:(k:string,v:string)=>void;
  onSetNote:(k:string,v:string)=>void; onChat:(k:string,q:string,a:string)=>void;
  onNavKanji:(id:string)=>void; onNavComponent:(id:string)=>void; onNavWord:(id:string)=>void;
}) {
  const k = KANJI.find(x=>x.id===id)!;
  const key = `kanji:${id}`;
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(customNames[key] || k.meanings[0]);
  const [showAllKunyomi, setShowAllKunyomi] = useState(false);
  const [showRawComponents, setShowRawComponents] = useState(false);
  const [wordQuery, setWordQuery] = useState("");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [currentLearningCategory, setCurrentLearningCategory] = useState(k.learningCategory);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [categorySaveError, setCategorySaveError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editingName) nameRef.current?.focus(); }, [editingName]);
  useEffect(() => {
    setCurrentLearningCategory(k.learningCategory);
    setCategoryPickerOpen(false);
    setSavingCategory(null);
    setCategorySaveError("");
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
  const heroTextColor = getReadableTextColor(cat1, cat2);
  const visibleKunyomi = showAllKunyomi ? k.kunyomi : k.kunyomi.slice(0, 3);
  const hiddenKunyomiCount = Math.max(0, k.kunyomi.length - visibleKunyomi.length);
  const words = getWordsForKanji(k.id);
  const normalizedWordQuery = wordQuery.trim().toLowerCase();
  const filteredWords = normalizedWordQuery
    ? words.filter((word) => (
      word.japanese.includes(normalizedWordQuery)
      || word.furigana.includes(normalizedWordQuery)
      || word.romaji.toLowerCase().includes(normalizedWordQuery)
      || word.meaning.toLowerCase().includes(normalizedWordQuery)
    ))
    : words;
  const learnerParts = k.learnerParts ?? [];
  const rawParts = k.rawDecomposition?.parts ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ position:"relative" }}>
      {/* Header */}
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
        {customNames[key] && customNames[key] !== k.meanings[0] && (
          <p style={{ fontFamily:"var(--ui-font)", fontSize:12 }} className="text-muted-foreground">{k.meanings.join(", ")}</p>
        )}
        <span
          style={{
            marginTop:8,
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
                  const textColor = getReadableTextColor(color1, color2);
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
      <div className="flex flex-col gap-4 px-4 pb-8">
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
        {learnerParts.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground">Visible Components</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      aria-label="About component decompositions"
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
                      <DialogTitle>About component decompositions</DialogTitle>
                      <DialogDescription style={{ fontFamily:"var(--ui-font)", lineHeight:1.55 }}>
                        The components shown here come from a verified dataset (KRADFILE). However, these components might not be the ones that are the most useful for learning. I encourage you to use the notes section, as well as other methods such as speaking with a teacher, native speaker, or an AI to build your own understanding of this Kanji.
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
            <div className="flex flex-wrap gap-2">
              {learnerParts.map((part,i) => {
                const rad = part.radicalId ? RADICALS.find(r=>r.id===part.radicalId) : undefined;
                const component = part.componentId ? COMPONENTS.find(c=>c.id===part.componentId) : undefined;
                const c = RAD_COLORS[i % RAD_COLORS.length];
                return (
                  <button
                    key={`${part.char}-${i}`}
                    onClick={() => part.componentId && onNavComponent(part.componentId)}
                    disabled={!part.componentId}
                    style={{
                      display:"flex",
                      alignItems:"center",
                      gap:7,
                      padding:"6px 12px",
                      borderRadius:12,
                      background: `${c}22`,
                      border:`1px solid ${c}44`,
                      cursor: part.componentId ? "pointer" : "default",
                      opacity: part.componentId ? 1 : 0.82,
                    }}
                  >
                    <span style={{ fontFamily:"var(--jp-font)", fontSize:22, color:c }}>{part.char}</span>
                    <span style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", lineHeight:1.1 }}>
                      <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, color: darkMode ? c : "#111827" }}>
                        {rad?.meanings[0] ?? "component"}
                      </span>
                      <span style={{ fontFamily:"var(--ui-font)", fontSize:9, fontWeight:800, color: darkMode ? "var(--muted-foreground)" : "#111827" }}>
                        {component?.kind.replace("-", " ") ?? part.role}
                      </span>
                    </span>
                  </button>
                );
              })}
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
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Words using this Kanji</p>
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
              onChange={(event) => setWordQuery(event.target.value)}
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
            className="flex flex-col gap-2"
            style={{
              maxHeight:282,
              overflowY:"auto",
              paddingRight:4,
            }}
          >
            {filteredWords.map((w,i) => (
              <button
                key={w.id || `${w.japanese}-${i}`}
                onClick={() => onNavWord(w.id || `w-${w.japanese}`)}
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
                <div className="flex items-baseline gap-2" style={{ minWidth:0 }}>
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
            ))}
            {filteredWords.length === 0 && (
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
