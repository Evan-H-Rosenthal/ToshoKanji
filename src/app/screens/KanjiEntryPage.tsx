import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronLeft, Pencil, Star, Volume2, X } from "lucide-react";
import { KANJI } from "../data/generated/kanji.generated";
import { COMPONENTS } from "../data/generated/components.generated";
import { RADICALS } from "../data/generated/radicals.generated";
import { CAT_COLORS, RAD_COLORS } from "../data/ui/categoryColors";
import { getWordsForKanji } from "../data/wordData";
import { ChatSection } from "../components/ChatSection";
import type { ChatMsg } from "../types";

export function KanjiEntryPage({ id, unlockedKanji, favorites, customNames, notes, chatMsgs, onBack, onBackToGacha, onToggleFav, onSetName, onSetNote, onChat, onNavKanji, onNavComponent, onNavWord }: {
  id: string; unlockedKanji: Set<string>;
  favorites: Set<string>; customNames: Record<string,string>; notes: Record<string,string>;
  chatMsgs: Record<string,ChatMsg[]>;
  onBack: () => void; onBackToGacha?: () => void; onToggleFav: (k:string)=>void; onSetName:(k:string,v:string)=>void;
  onSetNote:(k:string,v:string)=>void; onChat:(k:string,q:string,a:string)=>void;
  onNavKanji:(id:string)=>void; onNavComponent:(id:string)=>void; onNavWord:(id:string)=>void;
}) {
  const k = KANJI.find(x=>x.id===id)!;
  const key = `kanji:${id}`;
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(customNames[key] || k.meanings[0]);
  const [showAllKunyomi, setShowAllKunyomi] = useState(false);
  const [showRawComponents, setShowRawComponents] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editingName) nameRef.current?.focus(); }, [editingName]);
  const saveName = () => { onSetName(key, nameVal || k.meanings[0]); setEditingName(false); };
  const isFav = favorites.has(key);
  const [cat1, cat2] = CAT_COLORS[k.category] ?? ["#6b7280","#4b5563"];
  const visibleKunyomi = showAllKunyomi ? k.kunyomi : k.kunyomi.slice(0, 3);
  const hiddenKunyomiCount = Math.max(0, k.kunyomi.length - visibleKunyomi.length);
  const words = getWordsForKanji(k.id);
  const learnerParts = k.learnerParts ?? [];
  const rawParts = k.rawDecomposition?.parts ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
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
        <button onClick={()=>onToggleFav(key)}>
          <Star size={22} fill={isFav?"#ffd700":"none"} color={isFav?"#ffd700":"var(--muted-foreground)"} />
        </button>
      </div>

      {/* Hero kanji */}
      <div className="flex flex-col items-center pb-4 pt-2 px-4 shrink-0">
        <div style={{
          width:140, height:140, borderRadius:28, display:"flex", alignItems:"center", justifyContent:"center",
          background:`linear-gradient(135deg, ${cat1}, ${cat2})`,
          boxShadow: `0 12px 40px ${cat1}55, 0 0 0 6px ${cat1}22`,
          marginBottom:12,
        }}>
          <span style={{ fontFamily:"var(--jp-font)", fontSize:80, fontWeight:700, color:"rgba(255,255,255,0.95)", lineHeight:1 }}>{k.char}</span>
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
      </div>

      {/* Content sections */}
      <div className="flex flex-col gap-4 px-4 pb-8">
        {/* Readings */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Readings</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <span style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:11, padding:"2px 8px", borderRadius:20, background:`${cat1}22`, color:cat1 }}>On</span>
              <span style={{ fontFamily:"var(--jp-font)", fontSize:16 }} className="text-foreground">{k.onyomi.join("、")}</span>
            </div>
            <div className="flex items-start gap-3">
              <span style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:11, padding:"2px 8px", borderRadius:20, background:`${cat2}22`, color:cat2 }}>Kun</span>
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
              <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground">Visible Components</p>
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
                      <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, color:c }}>
                        {rad?.meanings[0] ?? "component"}
                      </span>
                      <span style={{ fontFamily:"var(--ui-font)", fontSize:9, fontWeight:800, color:"var(--muted-foreground)" }}>
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
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Example Words</p>
          <div className="flex flex-col gap-2">
            {words.map((w,i) => (
              <button
                key={w.id || `${w.japanese}-${i}`}
                onClick={() => onNavWord(w.id || `w-${w.japanese}`)}
                style={{
                  width:"100%",
                  padding:"9px 11px",
                  borderRadius:12,
                  background:"var(--muted)",
                  border:"1px solid var(--border)",
                  textAlign:"left",
                  cursor:"pointer",
                  boxShadow:"0 4px 12px rgba(0,0,0,0.05)",
                }}>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:18, fontWeight:700 }} className="text-foreground">{w.japanese}</span>
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:12 }} className="text-muted-foreground">({w.furigana})</span>
                </div>
                <div style={{ fontFamily:"var(--ui-font)", fontSize:11, fontStyle:"italic" }} className="text-muted-foreground">{w.romaji}</div>
                <div style={{ fontFamily:"var(--ui-font)", fontSize:13, fontWeight:600, marginTop:2 }} className="text-foreground">{w.meaning}</div>
              </button>
            ))}
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
