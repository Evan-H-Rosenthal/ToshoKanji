import { motion } from "motion/react";
import { KANJI, RADICALS } from "../data/kanjiData";

export function UnlockPrompt({ entryType, id, onConfirm, onCancel }: {
  entryType:"kanji"|"radical"; id:string; onConfirm:()=>void; onCancel:()=>void;
}) {
  const entry = entryType === "kanji" ? KANJI.find(k=>k.id===id) : RADICALS.find(r=>r.id===id);
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100 }}
      onClick={onCancel}>
      <motion.div initial={{ y:100 }} animate={{ y:0 }} exit={{ y:100 }} transition={{ type:"spring", stiffness:400, damping:28 }}
        onClick={e=>e.stopPropagation()}
        style={{
          width:"100%", background:"var(--card)", borderRadius:"24px 24px 0 0",
          padding:"24px 20px 32px", border:"1px solid var(--border)", borderBottom:"none",
        }}>
        <div className="flex flex-col items-center gap-4">
          <span style={{ fontFamily:"var(--jp-font)", fontSize:64, fontWeight:700, lineHeight:1, color:"var(--primary)" }}>{entry?.char}</span>
          <div className="text-center">
            <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:16 }} className="text-foreground">Unlock {entryType === "kanji" ? "Kanji" : "Radical"}?</p>
            <p style={{ fontFamily:"var(--ui-font)", fontSize:13 }} className="text-muted-foreground">Add <strong>{entry?.char} ({entry && ("meanings" in entry ? entry.meanings[0] : entry.meanings[0])})</strong> to your collection</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} style={{ flex:1, padding:"12px", borderRadius:14, background:"var(--muted)", border:"none", fontFamily:"var(--ui-font)", fontWeight:800, fontSize:15, color:"var(--muted-foreground)", cursor:"pointer" }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex:1, padding:"12px", borderRadius:14, background:"var(--primary)", border:"none", fontFamily:"var(--ui-font)", fontWeight:800, fontSize:15, color:"#fff", cursor:"pointer" }}>Unlock ✨</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Phone Frame ────────────────────────────────────────────────────────────────
