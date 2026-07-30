import { useState } from "react";
import { Check, ChevronLeft, Moon, RotateCcw, Sun, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CharacterFontChoice, UiFontChoice } from "../types";

const UI_FONT_OPTIONS: { value: UiFontChoice; label: string; sub: string; preview: string; fontFamily: string }[] = [
  { value: "nunito", label: "Nunito", sub: "Rounded and friendly", preview: "ToshoKanji", fontFamily: "var(--font-ui-nunito)" },
  { value: "system", label: "System fallback", sub: "Uses your device's native interface font", preview: "ToshoKanji", fontFamily: "var(--font-ui-system)" },
  { value: "new-rodin", label: "New Rodin", sub: "Bold Japanese arcade signage character", preview: "ToshoKanji", fontFamily: "var(--font-ui-new-rodin)" },
  { value: "two-weekend", label: "Two Weekend Go", sub: "A crisp Shin Go-inspired option", preview: "ToshoKanji", fontFamily: "var(--font-ui-two-weekend)" },
];

const CHARACTER_FONT_OPTIONS: { value: CharacterFontChoice; label: string; sub: string; preview: string; fontFamily: string }[] = [
  { value: "traditional", label: "Traditional Serif", sub: "Calligraphic Noto Serif JP", preview: "\u56F3\u66F8\u6F22\u5B57", fontFamily: "var(--font-jp-serif)" },
  { value: "modern", label: "Modern Mono/Sans", sub: "Native Japanese mono/sans stack", preview: "\u56F3\u66F8\u6F22\u5B57", fontFamily: "var(--font-jp-modern)" },
  { value: "noto-sans", label: "Noto Sans JP", sub: "Modern Google Japanese sans", preview: "\u56F3\u66F8\u6F22\u5B57", fontFamily: "var(--font-jp-sans)" },
];

const DATASET_ATTRIBUTIONS = [
  {
    name: "KANJIDIC2",
    detail:
      "Kanji data from the Electronic Dictionary Research and Development Group. Distributed under the EDRDG licence and CC BY-SA 4.0.",
  },
  {
    name: "JMdict_e",
    detail:
      "Vocabulary examples from the Electronic Dictionary Research and Development Group. Distributed under the EDRDG licence.",
  },
  {
    name: "RADKFILE/KRADFILE",
    detail:
      "Visual lookup-group and display-form data from Michael Raine, Jim Breen, and the Electronic Dictionary Research and Development Group. Distributed under the EDRDG licence.",
  },
];

export function SettingsPage({ darkMode, volume, disableAutoJump, improvePerformance, uiFontChoice, characterFontChoice, onDark, onVolume, onDisableAutoJump, onImprovePerformance, onUiFontChoice, onCharacterFontChoice, onResetProgress, onResetAll, onUnlockAll, onBack }: {
  darkMode:boolean; volume:number; disableAutoJump:boolean; improvePerformance:boolean; uiFontChoice:UiFontChoice; characterFontChoice:CharacterFontChoice;
  onDark:(v:boolean)=>void; onVolume:(v:number)=>void; onDisableAutoJump:(v:boolean)=>void; onImprovePerformance:(v:boolean)=>void; onUiFontChoice:(v:UiFontChoice)=>void; onCharacterFontChoice:(v:CharacterFontChoice)=>void;
  onResetProgress:()=>void; onResetAll:()=>void; onUnlockAll:()=>void; onBack:()=>void;
}) {
  const reduceMotion = useReducedMotion();
  const [confirmReset, setConfirmReset] = useState<"progress"|"all"|null>(null);
  const [fontPicker, setFontPicker] = useState<"ui"|"character"|null>(null);
  const uiFontLabel = UI_FONT_OPTIONS.find(option => option.value === uiFontChoice)?.label ?? "Nunito";
  const characterFontLabel = CHARACTER_FONT_OPTIONS.find(option => option.value === characterFontChoice)?.label ?? "Traditional Serif";
  return (
    <div className="settings-page flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-3 px-4 pt-3 pb-4 shrink-0">
        <button type="button" onClick={onBack} aria-label="Back" className="text-muted-foreground app-reactive"><ChevronLeft size={22} /></button>
        <h2 style={{ fontFamily:"var(--ui-font)", fontWeight:900, fontSize:20 }} className="text-foreground">Settings</h2>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-8">
        {/* Appearance */}
        <div className="rounded-2xl overflow-hidden" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:11, padding:"12px 16px 4px" }} className="text-muted-foreground">Appearance</p>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
              <span style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:15 }} className="text-foreground">{darkMode ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <button type="button" onClick={()=>onDark(!darkMode)} aria-label="Toggle dark mode" aria-pressed={darkMode}
              style={{
                width:48, height:28, borderRadius:14,
                background: darkMode ? "var(--primary)" : "var(--muted)",
                position:"relative", transition:"background 0.3s", cursor:"pointer", border:"none",
              }}>
              <motion.div animate={{ x: darkMode ? 20 : 0 }} transition={reduceMotion ? { duration:0 } : { type:"spring", stiffness:500, damping:30 }}
                style={{ position:"absolute", top:3, left:4, width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <FontSettingRow
              label="System font"
              sub="Choose the app UI typeface"
              value={uiFontLabel}
              onClick={()=>setFontPicker("ui")}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <FontSettingRow
              label="Character font"
              sub="Choose kanji, kana, and reward glyphs"
              value={characterFontLabel}
              onClick={()=>setFontPicker("character")}
            />
          </div>
        </div>

        {/* Sound */}
        <div className="rounded-2xl overflow-hidden" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:11, padding:"12px 16px 4px" }} className="text-muted-foreground">Sound</p>
          <div className="flex items-center gap-3 px-4 py-3">
            {volume === 0 ? <VolumeX size={18} className="text-muted-foreground" /> : <Volume2 size={18} className="text-primary" />}
            <input aria-label="Sound volume" type="range" min={0} max={1} step={0.05} value={volume} onChange={e=>onVolume(parseFloat(e.target.value))}
              style={{ flex:1, accentColor:"var(--primary)", cursor:"pointer" }} />
            <span style={{ fontFamily:"var(--ui-font)", fontSize:13, fontWeight:700, minWidth:32, textAlign:"right" }} className="text-muted-foreground">{Math.round(volume*100)}%</span>
          </div>
        </div>

        {/* Gameplay */}
        <div className="rounded-2xl overflow-hidden" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:11, padding:"12px 16px 4px" }} className="text-muted-foreground">Gameplay</p>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:15 }} className="text-foreground">Disable auto-jump</p>
              <p style={{ fontFamily:"var(--ui-font)", fontSize:11 }} className="text-muted-foreground">Stay on gacha after collecting a capsule</p>
            </div>
            <button type="button" onClick={()=>onDisableAutoJump(!disableAutoJump)} aria-label="Disable auto-jump"
              aria-pressed={disableAutoJump}
              style={{
                width:48, height:28, borderRadius:14,
                background: disableAutoJump ? "var(--primary)" : "var(--muted)",
                position:"relative", transition:"background 0.3s", cursor:"pointer", border:"none", flexShrink:0,
              }}>
              <motion.div animate={{ x: disableAutoJump ? 20 : 0 }} transition={reduceMotion ? { duration:0 } : { type:"spring", stiffness:500, damping:30 }}
                style={{ position:"absolute", top:3, left:4, width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div>
              <p style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:15 }} className="text-foreground">Improve Performance</p>
              <p style={{ fontFamily:"var(--ui-font)", fontSize:11 }} className="text-muted-foreground">Use lighter fade transitions between tabs</p>
            </div>
            <button type="button" onClick={()=>onImprovePerformance(!improvePerformance)} aria-label="Improve performance"
              aria-pressed={improvePerformance}
              style={{
                width:48, height:28, borderRadius:14,
                background: improvePerformance ? "var(--primary)" : "var(--muted)",
                position:"relative", transition:"background 0.3s", cursor:"pointer", border:"none", flexShrink:0,
              }}>
              <motion.div animate={{ x: improvePerformance ? 20 : 0 }} transition={reduceMotion ? { duration:0 } : { type:"spring", stiffness:500, damping:30 }}
                style={{ position:"absolute", top:3, left:4, width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl overflow-hidden" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:11, padding:"12px 16px 4px" }} className="text-muted-foreground">Data</p>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div>
              <p style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:15, color:"var(--success)" }}>Debug: unlock everything</p>
              <p style={{ fontFamily:"var(--ui-font)", fontSize:11 }} className="text-muted-foreground">Temporarily reveal every kanji and radical for review</p>
            </div>
            <button type="button" aria-label="Unlock all entries" onClick={onUnlockAll}
              style={{ padding:"7px 12px", borderRadius:10, background:"color-mix(in srgb, var(--success) 14%, transparent)", color:"var(--success)", fontFamily:"var(--ui-font)", fontWeight:900, fontSize:11, border:"1px solid color-mix(in srgb, var(--success) 32%, transparent)", cursor:"pointer" }}>
              Unlock
            </button>
          </div>
          {[
            { label:"Reset unlock progress", sub:"Keeps notes & custom names", action:"progress" as const, color:"var(--warning)" },
            { label:"Reset all progress", sub:"Erases everything including notes", action:"all" as const, color:"var(--destructive)" },
          ].map(item => (
            <div key={item.action} className="px-4 py-3 border-t border-border">
              {confirmReset === item.action ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily:"var(--ui-font)", fontSize:13, fontWeight:700, flex:1 }} className="text-foreground">Are you sure?</span>
                  <button onClick={()=>{ item.action==="all" ? onResetAll() : onResetProgress(); setConfirmReset(null); }}
                    style={{ padding:"5px 12px", borderRadius:8, background:item.color, color:"#fff", fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, border:"none", cursor:"pointer" }}>Yes</button>
                  <button onClick={()=>setConfirmReset(null)}
                    style={{ padding:"5px 12px", borderRadius:8, background:"var(--muted)", color:"var(--foreground)", fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, border:"none", cursor:"pointer" }}>Cancel</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:15, color:item.color }}>{item.label}</p>
                    <p style={{ fontFamily:"var(--ui-font)", fontSize:11 }} className="text-muted-foreground">{item.sub}</p>
                  </div>
                  <button type="button" aria-label={item.label} onClick={()=>setConfirmReset(item.action)}
                    style={{ padding:"6px 14px", borderRadius:10, background:`${item.color}18`, color:item.color, fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, border:`1px solid ${item.color}33`, cursor:"pointer" }}>
                    <RotateCcw size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:11, padding:"12px 16px 6px" }} className="text-muted-foreground">Dataset attributions</p>
          <div className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-2.5">
              {DATASET_ATTRIBUTIONS.map(source => (
                <div key={source.name}>
                  <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, lineHeight:1.25 }} className="text-foreground">{source.name}</p>
                  <p style={{ fontFamily:"var(--ui-font)", fontSize:10, lineHeight:1.35 }} className="text-muted-foreground">{source.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* About */}
        <div className="rounded-2xl p-4 text-center" style={{ background:"var(--muted)" }}>
          <p style={{ fontFamily:"var(--jp-font)", fontSize:22, fontWeight:700 }} className="text-foreground">図書漢字</p>
          <p style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:700 }} className="text-muted-foreground">ToshoKanji v0.15</p>
          <p style={{ fontFamily:"var(--ui-font)", fontSize:11 }} className="text-muted-foreground">Discover kanji one capsule at a time</p>
        </div>
      </div>

      <AnimatePresence>
        {fontPicker === "ui" && (
          <FontPickerOverlay
            title="System Font"
            options={UI_FONT_OPTIONS}
            selected={uiFontChoice}
            onSelect={(value) => {
              onUiFontChoice(value as UiFontChoice);
              setFontPicker(null);
            }}
            onClose={() => setFontPicker(null)}
          />
        )}
        {fontPicker === "character" && (
          <FontPickerOverlay
            title="Character Font"
            options={CHARACTER_FONT_OPTIONS}
            selected={characterFontChoice}
            onSelect={(value) => {
              onCharacterFontChoice(value as CharacterFontChoice);
              setFontPicker(null);
            }}
            onClose={() => setFontPicker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FontSettingRow({ label, sub, value, onClick }: { label: string; sub: string; value: string; onClick: () => void }) {
  return (
    <>
      <div>
        <p style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:15 }} className="text-foreground">{label}</p>
        <p style={{ fontFamily:"var(--ui-font)", fontSize:11 }} className="text-muted-foreground">{sub}</p>
      </div>
      <button
        onClick={onClick}
        style={{
          minWidth: 112,
          maxWidth: 132,
          padding: "7px 10px",
          borderRadius: 12,
          background: "var(--muted)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          fontFamily: "var(--ui-font)",
          fontWeight: 800,
          fontSize: 11,
          cursor: "pointer",
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </button>
    </>
  );
}

function FontPickerOverlay({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: { value: string; label: string; sub: string; preview: string; fontFamily: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(5,4,17,0.52)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 430, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 290,
          maxHeight: "calc(100% - 12px)",
          overflowY: "auto",
          borderRadius: 22,
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
          padding: 14,
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close font picker"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--muted)",
            color: "var(--foreground)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>
        <p style={{ fontFamily:"var(--ui-font)", fontSize:19, fontWeight:1000, marginBottom:4 }} className="text-foreground">{title}</p>
        <p style={{ fontFamily:"var(--ui-font)", fontSize:11, marginBottom:12 }} className="text-muted-foreground">Choose a bundled or fallback font style</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 11px",
                  borderRadius: 14,
                  background: isSelected ? "color-mix(in srgb, var(--primary) 16%, var(--card))" : "var(--muted)",
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                  color: "var(--foreground)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: option.fontFamily, fontSize: 18, fontWeight: 800, lineHeight: 1.05 }} className="text-foreground">{option.preview}</p>
                  <p style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:800, marginTop:4 }} className="text-foreground">{option.label}</p>
                  <p style={{ fontFamily:"var(--ui-font)", fontSize:10 }} className="text-muted-foreground">{option.sub}</p>
                </div>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: isSelected ? "var(--primary)" : "transparent",
                    border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <Check size={15} />}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tab Bar ────────────────────────────────────────────────────────────────────
