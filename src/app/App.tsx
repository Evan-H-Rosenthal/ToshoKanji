import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Settings, Trophy } from "lucide-react";
import { KANJI, RADICALS } from "./data/kanjiData";
import { GachaMachine } from "./components/GachaMachine";
import { GachaStatsButton } from "./components/GachaStatsButton";
import { PhoneFrame } from "./components/PhoneFrame";
import { TabBar } from "./components/TabBar";
import { UnlockPrompt } from "./components/UnlockPrompt";
import { AchievementsPage } from "./screens/AchievementsPage";
import { KanjiEntryPage } from "./screens/KanjiEntryPage";
import { KanjiScreen } from "./screens/KanjiScreen";
import { RadicalEntryPage } from "./screens/RadicalEntryPage";
import { RadicalsScreen } from "./screens/RadicalsScreen";
import { SettingsPage } from "./screens/SettingsPage";
import type { CharacterFontChoice, ChatMsg, ScreenState, Tab, UiFontChoice } from "./types";

const UI_FONT_STACKS: Record<UiFontChoice, string> = {
  nunito: '"Nunito", sans-serif',
  system: '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Nunito", sans-serif',
};

const CHARACTER_FONT_STACKS: Record<CharacterFontChoice, string> = {
  traditional: '"Noto Serif JP", serif',
  modern: '"Noto Sans Mono CJK JP", "Yu Gothic", "Meiryo", "Hiragino Kaku Gothic ProN", ui-monospace, monospace',
};

const TAB_ORDER: Record<Tab, number> = {
  kanji: 0,
  gacha: 1,
  radicals: 2,
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [disableAutoJump, setDisableAutoJump] = useState(false);
  const [uiFontChoice, setUiFontChoice] = useState<UiFontChoice>("nunito");
  const [characterFontChoice, setCharacterFontChoice] = useState<CharacterFontChoice>("traditional");
  const [activeTab, setActiveTab] = useState<Tab>("gacha");
  const [hasChangedTabs, setHasChangedTabs] = useState(false);
  const [screen, setScreen] = useState<ScreenState>({ type:"main" });
  const [screenStack, setScreenStack] = useState<ScreenState[]>([]);

  const [unlockedKanji, setUnlockedKanji] = useState<Set<string>>(new Set());
  const [unlockedRadicals, setUnlockedRadicals] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [customNames, setCustomNames] = useState<Record<string,string>>({});
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [chatMsgs, setChatMsgs] = useState<Record<string,ChatMsg[]>>({});
  const [unlockPrompt, setUnlockPrompt] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const [highlightedUnlock, setHighlightedUnlock] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const msgIdRef = useRef(0);

  const allUnlocked = unlockedKanji.size >= KANJI.length && unlockedRadicals.size >= RADICALS.length;

  const changeActiveTab = useCallback((nextTab: Tab) => {
    setActiveTab((currentTab) => {
      if (currentTab !== nextTab) setHasChangedTabs(true);
      return nextTab;
    });
  }, []);

  const getGachaItem = useCallback((): {type:"kanji"|"radical";id:string}|null => {
    const pool = [
      ...KANJI.filter(k=>!unlockedKanji.has(k.id)).map(k=>({type:"kanji" as const, id:k.id})),
      ...RADICALS.filter(r=>!unlockedRadicals.has(r.id)).map(r=>({type:"radical" as const, id:r.id})),
    ];
    if (!pool.length) return null;
    return pool[Math.floor(Math.random()*pool.length)];
  }, [unlockedKanji, unlockedRadicals]);

  const handleUnlock = useCallback((type:"kanji"|"radical", id:string) => {
    if (type==="kanji") setUnlockedKanji(s=>new Set([...s, id]));
    else setUnlockedRadicals(s=>new Set([...s, id]));
    setHighlightedUnlock({ type, id });
    if (!disableAutoJump) changeActiveTab(type === "kanji" ? "kanji" : "radicals");
  }, [changeActiveTab, disableAutoJump]);

  const handleToggleFav = useCallback((key:string) => {
    setFavorites(s=>{ const n=new Set(s); n.has(key)?n.delete(key):n.add(key); return n; });
  }, []);

  const handleSetName = useCallback((key:string, val:string) => {
    setCustomNames(p=>({...p,[key]:val}));
  }, []);

  const handleSetNote = useCallback((key:string, val:string) => {
    setNotes(p=>({...p,[key]:val}));
  }, []);

  const handleChat = useCallback((key:string, q:string, a:string) => {
    const userMsg: ChatMsg = { role:"user", text:q, id:++msgIdRef.current };
    const aiMsg: ChatMsg = { role:"ai", text:a, id:++msgIdRef.current };
    setChatMsgs(p=>({...p,[key]:[...(p[key]||[]), userMsg, aiMsg]}));
  }, []);

  const pushScreen = (s: ScreenState) => { setScreenStack(p=>[...p, screen]); setScreen(s); };
  const popScreen = () => { const s=[...screenStack]; const prev=s.pop(); setScreenStack(s); setScreen(prev||{type:"main"}); };
  const handleBackToGacha = () => {
    setScreenStack([]);
    setScreen({ type:"main" });
    changeActiveTab("gacha");
  };

  const handleNavKanji = (id:string) => {
    if (highlightedUnlock?.type === "kanji" && highlightedUnlock.id === id) setHighlightedUnlock(null);
    if (!unlockedKanji.has(id)) { setUnlockPrompt({type:"kanji",id}); return; }
    pushScreen({type:"kanji-entry",id});
  };
  const handleNavRadical = (id:string) => {
    if (highlightedUnlock?.type === "radical" && highlightedUnlock.id === id) setHighlightedUnlock(null);
    if (!unlockedRadicals.has(id)) { setUnlockPrompt({type:"radical",id}); return; }
    pushScreen({type:"radical-entry",id});
  };

  const resetProgress = () => { setUnlockedKanji(new Set()); setUnlockedRadicals(new Set()); };
  const resetAll = () => { setUnlockedKanji(new Set()); setUnlockedRadicals(new Set()); setFavorites(new Set()); setCustomNames({}); setNotes({}); setChatMsgs({}); };

  const isSubScreen = screen.type !== "main";

  const mainContent = (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Top chrome */}
      <AnimatePresence mode="popLayout">
        <motion.div key={screen.type} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.16, ease:"easeOut" }} style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>

          {/* Sub-screens */}
          {screen.type === "kanji-entry" && screen.id && (
            <KanjiEntryPage id={screen.id} unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals}
              favorites={favorites} customNames={customNames} notes={notes} chatMsgs={chatMsgs}
              onBack={popScreen} onToggleFav={handleToggleFav} onSetName={handleSetName}
              onSetNote={handleSetNote} onChat={handleChat}
              onBackToGacha={screenStack.length >= 2 ? handleBackToGacha : undefined}
              onNavKanji={handleNavKanji} onNavRadical={handleNavRadical} />
          )}
          {screen.type === "radical-entry" && screen.id && (
            <RadicalEntryPage id={screen.id} unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals}
              favorites={favorites} customNames={customNames} notes={notes} chatMsgs={chatMsgs}
              onBack={popScreen} onToggleFav={handleToggleFav} onSetName={handleSetName}
              onSetNote={handleSetNote} onChat={handleChat}
              onBackToGacha={screenStack.length >= 2 ? handleBackToGacha : undefined}
              onNavKanji={handleNavKanji} onNavRadical={handleNavRadical} />
          )}
          {screen.type === "achievements" && (
            <AchievementsPage unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals}
              favorites={favorites} notes={notes} onBack={popScreen} />
          )}
          {screen.type === "settings" && (
            <SettingsPage darkMode={darkMode} volume={volume} disableAutoJump={disableAutoJump} uiFontChoice={uiFontChoice} characterFontChoice={characterFontChoice}
              onDark={setDarkMode} onVolume={setVolume} onDisableAutoJump={setDisableAutoJump} onUiFontChoice={setUiFontChoice} onCharacterFontChoice={setCharacterFontChoice}
              onResetProgress={resetProgress} onResetAll={resetAll} onBack={popScreen} />
          )}

          {/* Main tabs */}
          {screen.type === "main" && (
            <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
              {/* Gacha header */}
              {activeTab === "gacha" && (
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"14px 18px 8px",
                }}>
                  <button onClick={()=>pushScreen({type:"achievements"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Trophy size={23} className="text-foreground" />
                  </button>
                  <div style={{ textAlign:"center", transform:"scale(1.22)" }}>
                    <p style={{ fontFamily:"var(--jp-font)", fontWeight:700, fontSize:16 }} className="text-foreground">図書漢字</p>
                    <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:700 }} className="text-muted-foreground">ToshoKanji</p>
                  </div>
                  <button onClick={()=>pushScreen({type:"settings"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Settings size={23} className="text-foreground" />
                  </button>
                </div>
              )}
              {/* Non-gacha headers show settings icon */}
              {activeTab !== "gacha" && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 8px" }}>
                  <button onClick={()=>pushScreen({type:"achievements"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Trophy size={23} className="text-foreground" />
                  </button>
                  <div style={{ textAlign:"center", transform:"scale(1.22)" }}>
                    <p style={{ fontFamily:"var(--jp-font)", fontWeight:700, fontSize:16 }} className="text-foreground">図書漢字</p>
                    <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:700 }} className="text-muted-foreground">ToshoKanji</p>
                  </div>
                  <button onClick={()=>pushScreen({type:"settings"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Settings size={23} className="text-foreground" />
                  </button>
                </div>
              )}

              {/* Tab content */}
              <div style={{ flex:1, minHeight:0, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>
                <motion.div
                  initial={false}
                  animate={{ x: `${TAB_ORDER[activeTab] * -33.333333}%` }}
                  transition={hasChangedTabs ? { duration:0.38, ease:[0.22, 1, 0.36, 1] } : { duration:0 }}
                  style={{ width:"300%", height:"100%", display:"flex", willChange:"transform", transform:"translateZ(0)", backfaceVisibility:"hidden" }}>
                  <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "kanji" ? "auto" : "none" }}>
                      <KanjiScreen unlockedKanji={unlockedKanji} favorites={favorites}
                        customNames={customNames} onSelect={id=>pushScreen({type:"kanji-entry",id})}
                        onToggleFav={handleToggleFav}
                        highlightedId={highlightedUnlock?.type === "kanji" ? highlightedUnlock.id : null}
                        onClearHighlight={id => {
                          if (highlightedUnlock?.type === "kanji" && highlightedUnlock.id === id) setHighlightedUnlock(null);
                        }} />
                  </div>
                  <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "gacha" ? "auto" : "none" }}>
                    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:"0 0 8px", position:"relative", transform:"translateY(-8px)" }}>
                      <GachaMachine onUnlock={handleUnlock} getItem={getGachaItem} allUnlocked={allUnlocked} />
                      <GachaStatsButton unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals} />
                    </div>
                  </div>
                  <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "radicals" ? "auto" : "none" }}>
                      <RadicalsScreen unlockedRadicals={unlockedRadicals} favorites={favorites}
                        customNames={customNames} onSelect={id=>pushScreen({type:"radical-entry",id})}
                        onToggleFav={handleToggleFav}
                        highlightedId={highlightedUnlock?.type === "radical" ? highlightedUnlock.id : null}
                        onClearHighlight={id => {
                          if (highlightedUnlock?.type === "radical" && highlightedUnlock.id === id) setHighlightedUnlock(null);
                        }} />
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tab bar (hidden on sub-screens) */}
      {screen.type === "main" && <TabBar active={activeTab} onChange={changeActiveTab} />}

      {/* Unlock prompt overlay */}
      <AnimatePresence>
        {unlockPrompt && (
          <UnlockPrompt
            entryType={unlockPrompt.type}
            id={unlockPrompt.id}
            onConfirm={()=>{ handleUnlock(unlockPrompt.type, unlockPrompt.id); setUnlockPrompt(null); }}
            onCancel={()=>setUnlockPrompt(null)} />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className={darkMode ? "dark" : ""} style={{ fontFamily:"var(--ui-font)", minHeight:"100dvh" }}>
      <style>{`
        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        body {
          background: ${darkMode ? "#050411" : "#e8e0f0"};
          overscroll-behavior: none;
        }
        :root {
          --ui-font: ${UI_FONT_STACKS[uiFontChoice]};
          --jp-font: ${CHARACTER_FONT_STACKS[characterFontChoice]};
        }
        ::-webkit-scrollbar { width: 0; height: 0; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <PhoneFrame darkMode={darkMode}>
        {mainContent}
      </PhoneFrame>
    </div>
  );
}
