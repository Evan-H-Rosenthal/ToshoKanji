import { useState } from "react";
import { ChevronLeft, Moon, RotateCcw, Sun, Volume2, VolumeX } from "lucide-react";
import { motion } from "motion/react";

export function SettingsPage({ darkMode, volume, onDark, onVolume, onResetProgress, onResetAll, onBack }: {
  darkMode:boolean; volume:number;
  onDark:(v:boolean)=>void; onVolume:(v:number)=>void;
  onResetProgress:()=>void; onResetAll:()=>void; onBack:()=>void;
}) {
  const [confirmReset, setConfirmReset] = useState<"progress"|"all"|null>(null);
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-3 px-4 pt-3 pb-4 shrink-0">
        <button onClick={onBack} className="text-muted-foreground"><ChevronLeft size={22} /></button>
        <h2 style={{ fontFamily:"Nunito,sans-serif", fontWeight:900, fontSize:20 }} className="text-foreground">Settings</h2>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-8">
        {/* Appearance */}
        <div className="rounded-2xl overflow-hidden" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", padding:"12px 16px 4px" }} className="text-muted-foreground">Appearance</p>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
              <span style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:15 }} className="text-foreground">{darkMode ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <button onClick={()=>onDark(!darkMode)}
              style={{
                width:48, height:28, borderRadius:14,
                background: darkMode ? "var(--primary)" : "var(--muted)",
                position:"relative", transition:"background 0.3s", cursor:"pointer", border:"none",
              }}>
              <motion.div animate={{ x: darkMode ? 20 : 0 }} transition={{ type:"spring", stiffness:500, damping:30 }}
                style={{ position:"absolute", top:3, left:4, width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
        </div>

        {/* Sound */}
        <div className="rounded-2xl overflow-hidden" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", padding:"12px 16px 4px" }} className="text-muted-foreground">Sound</p>
          <div className="flex items-center gap-3 px-4 py-3">
            {volume === 0 ? <VolumeX size={18} className="text-muted-foreground" /> : <Volume2 size={18} className="text-primary" />}
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e=>onVolume(parseFloat(e.target.value))}
              style={{ flex:1, accentColor:"var(--primary)", cursor:"pointer" }} />
            <span style={{ fontFamily:"Nunito,sans-serif", fontSize:13, fontWeight:700, minWidth:32, textAlign:"right" }} className="text-muted-foreground">{Math.round(volume*100)}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl overflow-hidden" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", padding:"12px 16px 4px" }} className="text-muted-foreground">Data</p>
          {[
            { label:"Reset unlock progress", sub:"Keeps notes & custom names", action:"progress" as const, color:"#f97316" },
            { label:"Reset all progress", sub:"Erases everything including notes", action:"all" as const, color:"var(--destructive)" },
          ].map(item => (
            <div key={item.action} className="px-4 py-3 border-t border-border">
              {confirmReset === item.action ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily:"Nunito,sans-serif", fontSize:13, fontWeight:700, flex:1 }} className="text-foreground">Are you sure?</span>
                  <button onClick={()=>{ item.action==="all" ? onResetAll() : onResetProgress(); setConfirmReset(null); }}
                    style={{ padding:"5px 12px", borderRadius:8, background:item.color, color:"#fff", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, border:"none", cursor:"pointer" }}>Yes</button>
                  <button onClick={()=>setConfirmReset(null)}
                    style={{ padding:"5px 12px", borderRadius:8, background:"var(--muted)", color:"var(--foreground)", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, border:"none", cursor:"pointer" }}>Cancel</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:15, color:item.color }}>{item.label}</p>
                    <p style={{ fontFamily:"Nunito,sans-serif", fontSize:11 }} className="text-muted-foreground">{item.sub}</p>
                  </div>
                  <button onClick={()=>setConfirmReset(item.action)}
                    style={{ padding:"6px 14px", borderRadius:10, background:`${item.color}18`, color:item.color, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, border:`1px solid ${item.color}33`, cursor:"pointer" }}>
                    <RotateCcw size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* About */}
        <div className="rounded-2xl p-4 text-center" style={{ background:"var(--muted)" }}>
          <p style={{ fontFamily:"Noto Serif JP,serif", fontSize:22, fontWeight:700 }} className="text-foreground">図書漢字</p>
          <p style={{ fontFamily:"Nunito,sans-serif", fontSize:12, fontWeight:700 }} className="text-muted-foreground">ToshoKanji v1.0</p>
          <p style={{ fontFamily:"Nunito,sans-serif", fontSize:11 }} className="text-muted-foreground">Discover kanji one capsule at a time</p>
        </div>
      </div>
    </div>
  );
}

// ── Tab Bar ────────────────────────────────────────────────────────────────────
