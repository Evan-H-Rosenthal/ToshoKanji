import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronLeft, Lock, Pencil, Star, Volume2, X } from "lucide-react";
import { CAT_COLORS, KANJI, RAD_COLORS, RADICALS } from "../data/kanjiData";
import { ChatSection } from "../components/ChatSection";
import type { ChatMsg } from "../types";

export function RadicalEntryPage({ id, unlockedKanji, unlockedRadicals, favorites, customNames, notes, chatMsgs, onBack, onBackToGacha, onToggleFav, onSetName, onSetNote, onChat, onNavKanji, onNavRadical }: {
  id: string; unlockedKanji: Set<string>; unlockedRadicals: Set<string>;
  favorites: Set<string>; customNames: Record<string,string>; notes: Record<string,string>;
  chatMsgs: Record<string,ChatMsg[]>;
  onBack:()=>void; onBackToGacha?:()=>void; onToggleFav:(k:string)=>void; onSetName:(k:string,v:string)=>void;
  onSetNote:(k:string,v:string)=>void; onChat:(k:string,q:string,a:string)=>void;
  onNavKanji:(id:string)=>void; onNavRadical:(id:string)=>void;
}) {
  const r = RADICALS.find(x=>x.id===id)!;
  const ridx = RADICALS.indexOf(r);
  const key = `radical:${id}`;
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(customNames[key] || r.meanings[0]);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{ if(editingName) nameRef.current?.focus(); },[editingName]);
  const saveName = () => { onSetName(key, nameVal || r.meanings[0]); setEditingName(false); };
  const isFav = favorites.has(key);
  const c1 = RAD_COLORS[ridx % RAD_COLORS.length];
  const c2 = RAD_COLORS[(ridx + 4) % RAD_COLORS.length];

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
        <button onClick={()=>onToggleFav(key)}>
          <Star size={22} fill={isFav?"#ffd700":"none"} color={isFav?"#ffd700":"var(--muted-foreground)"} />
        </button>
      </div>

      <div className="flex flex-col items-center pb-4 pt-2 px-4 shrink-0">
        <div style={{
          width:140, height:140, borderRadius:28, display:"flex", alignItems:"center", justifyContent:"center",
          background:`linear-gradient(135deg, ${c1}, ${c2})`,
          boxShadow:`0 12px 40px ${c1}55, 0 0 0 6px ${c1}22`,
          marginBottom:12,
        }}>
          <span style={{ fontFamily:"var(--jp-font)", fontSize:80, fontWeight:700, color:"rgba(255,255,255,0.95)", lineHeight:1 }}>{r.char}</span>
        </div>
        <div className="flex items-center gap-2">
          {editingName ? (
            <input ref={nameRef} value={nameVal} onChange={e=>setNameVal(e.target.value)}
              onBlur={saveName} onKeyDown={e=>{if(e.key==="Enter")saveName();if(e.key==="Escape"){setEditingName(false);setNameVal(customNames[key]||r.meanings[0]);}}}
              style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:20, textAlign:"center", background:"var(--input-background)", borderRadius:8, border:"2px solid var(--primary)", padding:"2px 8px", color:"var(--foreground)", outline:"none", maxWidth:200 }} />
          ) : (
            <h1 style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:22 }} className="text-foreground">{customNames[key] || r.meanings[0]}</h1>
          )}
          <button onClick={()=>setEditingName(true)} className="text-muted-foreground"><Pencil size={15} /></button>
        </div>
        <p style={{ fontFamily:"var(--ui-font)", fontSize:12 }} className="text-muted-foreground">{r.strokes} strokes</p>
        {(r.names?.length || r.variants?.length) && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", marginTop:8 }}>
            {r.names?.slice(0, 3).map((name) => (
              <span key={name} style={{ padding:"3px 8px", borderRadius:999, background:`${c1}22`, color:c1, fontFamily:"var(--ui-font)", fontSize:10, fontWeight:900 }}>
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8">
        {/* Meanings */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Radical Meanings</p>
          <div className="flex flex-wrap gap-2">
            {r.meanings.map(m=>(
              <span key={m} style={{ padding:"4px 10px", borderRadius:20, background:`${c1}22`, color:c1, fontFamily:"var(--ui-font)", fontWeight:700, fontSize:13 }}>{m}</span>
            ))}
          </div>
          {r.kanjiMeanings && r.kanjiMeanings.length > 0 && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
              <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">As a kanji</p>
              <div className="flex flex-wrap gap-2">
                {r.kanjiMeanings.map(m=>(
                  <span key={m} style={{ padding:"4px 10px", borderRadius:20, background:"var(--muted)", color:"var(--muted-foreground)", fontFamily:"var(--ui-font)", fontWeight:700, fontSize:12 }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Variant forms */}
        {r.variants && r.variants.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Variant Forms</p>
            <div className="flex flex-wrap gap-2">
              {r.variants.map((variant) => (
                <span key={variant} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 11px", borderRadius:14, background:`${c2}20`, border:`1px solid ${c2}44` }}>
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:24, color:c2 }}>{variant}</span>
                  <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:800, color:c2 }}>same radical</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Kanji using this radical */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Kanji using this radical</p>
          {r.kanjiIds.length === 0 ? (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:13 }} className="text-muted-foreground">No kanji entries yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {r.kanjiIds.map(kid=>{
                const kj = KANJI.find(x=>x.id===kid);
                if(!kj) return null;
                const isUnlocked = unlockedKanji.has(kid);
                const [kc1, kc2] = CAT_COLORS[kj.category] ?? ["#6b7280","#4b5563"];
                return (
                  <button key={kid} onClick={()=>onNavKanji(kid)} style={{
                    display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:12,
                    background: isUnlocked ? `${kc1}22` : "var(--muted)",
                    border:`1px solid ${isUnlocked ? kc1+"44" : "var(--border)"}`,
                    cursor:"pointer",
                  }}>
                    {!isUnlocked && <Lock size={10} className="text-muted-foreground" />}
                    <span style={{ fontFamily:"var(--jp-font)", fontSize:22, color: isUnlocked ? kc1 : "var(--muted-foreground)" }}>{kj.char}</span>
                    <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:700, color: isUnlocked ? kc1 : "var(--muted-foreground)" }}>{kj.meanings[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">My Notes</p>
          <textarea value={notes[key]||""} onChange={e=>onSetNote(key,e.target.value)}
            placeholder="Notes on this radical..."
            rows={3}
            style={{ width:"100%", background:"var(--input-background)", borderRadius:10, border:"1px solid var(--border)", padding:"8px 10px", fontFamily:"var(--ui-font)", fontSize:13, color:"var(--foreground)", outline:"none", resize:"none", lineHeight:1.5 }} />
        </div>

        {/* Chat */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <ChatSection entryKey={key} msgs={chatMsgs[key]||[]} onSend={onChat} />
        </div>
      </div>
    </div>
  );
}

// ── Achievements Page ──────────────────────────────────────────────────────────
