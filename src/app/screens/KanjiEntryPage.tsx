import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronLeft, Lock, Pencil, Star, Volume2, X } from "lucide-react";
import { CAT_COLORS, KANJI, RAD_COLORS, RADICALS } from "../data/kanjiData";
import { ChatSection } from "../components/ChatSection";
import type { ChatMsg } from "../types";

export function KanjiEntryPage({ id, unlockedKanji, unlockedRadicals, favorites, customNames, notes, chatMsgs, onBack, onBackToGacha, onToggleFav, onSetName, onSetNote, onChat, onNavKanji, onNavRadical }: {
  id: string; unlockedKanji: Set<string>; unlockedRadicals: Set<string>;
  favorites: Set<string>; customNames: Record<string,string>; notes: Record<string,string>;
  chatMsgs: Record<string,ChatMsg[]>;
  onBack: () => void; onBackToGacha?: () => void; onToggleFav: (k:string)=>void; onSetName:(k:string,v:string)=>void;
  onSetNote:(k:string,v:string)=>void; onChat:(k:string,q:string,a:string)=>void;
  onNavKanji:(id:string)=>void; onNavRadical:(id:string)=>void;
}) {
  const k = KANJI.find(x=>x.id===id)!;
  const key = `kanji:${id}`;
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(customNames[key] || k.meanings[0]);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editingName) nameRef.current?.focus(); }, [editingName]);
  const saveName = () => { onSetName(key, nameVal || k.meanings[0]); setEditingName(false); };
  const isFav = favorites.has(key);
  const [cat1, cat2] = CAT_COLORS[k.category] ?? ["#6b7280","#4b5563"];

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
              <span style={{ fontFamily:"var(--jp-font)", fontSize:16 }} className="text-foreground">{k.kunyomi.join("、")}</span>
            </div>
          </div>
        </div>

        {/* Radicals */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Radicals in this kanji</p>
          <div className="flex flex-wrap gap-2">
            {k.radicalIds.map((rid,i) => {
              const rad = RADICALS.find(r=>r.id===rid);
              if (!rad) return null;
              const isUnlocked = unlockedRadicals.has(rid);
              const c = RAD_COLORS[i % RAD_COLORS.length];
              return (
                <button key={rid} onClick={()=>onNavRadical(rid)} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:12,
                  background: isUnlocked ? `${c}22` : "var(--muted)",
                  border: `1px solid ${isUnlocked ? c+"44" : "var(--border)"}`,
                  cursor:"pointer",
                }}>
                  {!isUnlocked && <Lock size={10} className="text-muted-foreground" />}
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:20, color: isUnlocked ? c : "var(--muted-foreground)" }}>{rad.char}</span>
                  <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:700, color: isUnlocked ? c : "var(--muted-foreground)" }}>{rad.meanings[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Words */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Example Words</p>
          <div className="flex flex-col gap-2">
            {k.words.map((w,i) => (
              <div key={i} style={{ padding:"8px 10px", borderRadius:10, background:"var(--muted)" }}>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:18, fontWeight:700 }} className="text-foreground">{w.japanese}</span>
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:12 }} className="text-muted-foreground">({w.furigana})</span>
                </div>
                <div style={{ fontFamily:"var(--ui-font)", fontSize:11, fontStyle:"italic" }} className="text-muted-foreground">{w.romaji}</div>
                <div style={{ fontFamily:"var(--ui-font)", fontSize:13, fontWeight:600, marginTop:2 }} className="text-foreground">{w.meaning}</div>
              </div>
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
