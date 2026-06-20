import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Settings, Trophy } from "lucide-react";
import { KANJI, RADICALS } from "./data/kanjiData";
import { GachaMachine } from "./components/GachaMachine";
import { PhoneFrame } from "./components/PhoneFrame";
import { TabBar } from "./components/TabBar";
import { UnlockPrompt } from "./components/UnlockPrompt";
import { AchievementsPage } from "./screens/AchievementsPage";
import { KanjiEntryPage } from "./screens/KanjiEntryPage";
import { KanjiScreen } from "./screens/KanjiScreen";
import { RadicalEntryPage } from "./screens/RadicalEntryPage";
import { RadicalsScreen } from "./screens/RadicalsScreen";
import { SettingsPage } from "./screens/SettingsPage";
import type { ChatMsg, ScreenState, Tab } from "./types";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [activeTab, setActiveTab] = useState<Tab>("gacha");
  const [screen, setScreen] = useState<ScreenState>({ type:"main" });
  const [screenStack, setScreenStack] = useState<ScreenState[]>([]);

  const [unlockedKanji, setUnlockedKanji] = useState<Set<string>>(new Set());
  const [unlockedRadicals, setUnlockedRadicals] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [customNames, setCustomNames] = useState<Record<string,string>>({});
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [chatMsgs, setChatMsgs] = useState<Record<string,ChatMsg[]>>({});
  const [unlockPrompt, setUnlockPrompt] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const msgIdRef = useRef(0);

  const allUnlocked = unlockedKanji.size >= KANJI.length && unlockedRadicals.size >= RADICALS.length;

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
  }, []);

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

  const handleNavKanji = (id:string) => {
    if (!unlockedKanji.has(id)) { setUnlockPrompt({type:"kanji",id}); return; }
    pushScreen({type:"kanji-entry",id});
  };
  const handleNavRadical = (id:string) => {
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
        <motion.div key={screen.type} initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
          transition={{ duration:0.22, ease:"easeOut" }} style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>

          {/* Sub-screens */}
          {screen.type === "kanji-entry" && screen.id && (
            <KanjiEntryPage id={screen.id} unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals}
              favorites={favorites} customNames={customNames} notes={notes} chatMsgs={chatMsgs}
              onBack={popScreen} onToggleFav={handleToggleFav} onSetName={handleSetName}
              onSetNote={handleSetNote} onChat={handleChat}
              onNavKanji={handleNavKanji} onNavRadical={handleNavRadical} />
          )}
          {screen.type === "radical-entry" && screen.id && (
            <RadicalEntryPage id={screen.id} unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals}
              favorites={favorites} customNames={customNames} notes={notes} chatMsgs={chatMsgs}
              onBack={popScreen} onToggleFav={handleToggleFav} onSetName={handleSetName}
              onSetNote={handleSetNote} onChat={handleChat}
              onNavKanji={handleNavKanji} onNavRadical={handleNavRadical} />
          )}
          {screen.type === "achievements" && (
            <AchievementsPage unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals}
              favorites={favorites} notes={notes} onBack={popScreen} />
          )}
          {screen.type === "settings" && (
            <SettingsPage darkMode={darkMode} volume={volume}
              onDark={setDarkMode} onVolume={setVolume}
              onResetProgress={resetProgress} onResetAll={resetAll} onBack={popScreen} />
          )}

          {/* Main tabs */}
          {screen.type === "main" && (
            <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
              {/* Gacha header */}
              {activeTab === "gacha" && (
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"10px 16px 6px",
                }}>
                  <button onClick={()=>pushScreen({type:"achievements"})}
                    style={{ width:38, height:38, borderRadius:12, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Trophy size={18} className="text-foreground" />
                  </button>
                  <div style={{ textAlign:"center" }}>
                    <p style={{ fontFamily:"Noto Serif JP,serif", fontWeight:700, fontSize:16 }} className="text-foreground">図書漢字</p>
                    <p style={{ fontFamily:"Nunito,sans-serif", fontSize:10, fontWeight:700 }} className="text-muted-foreground">ToshoKanji</p>
                  </div>
                  <button onClick={()=>pushScreen({type:"settings"})}
                    style={{ width:38, height:38, borderRadius:12, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Settings size={18} className="text-foreground" />
                  </button>
                </div>
              )}
              {/* Non-gacha headers show settings icon */}
              {activeTab !== "gacha" && (
                <div style={{ display:"flex", justifyContent:"flex-end", padding:"10px 16px 0" }}>
                  <button onClick={()=>pushScreen({type:"settings"})}
                    style={{ width:34, height:34, borderRadius:10, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Settings size={16} className="text-foreground" />
                  </button>
                </div>
              )}

              {/* Tab content */}
              <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                    transition={{ duration:0.18 }} style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

                    {activeTab === "gacha" && (
                      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 0 16px" }}>
                        <GachaMachine onUnlock={handleUnlock} getItem={getGachaItem} allUnlocked={allUnlocked} />
                      </div>
                    )}
                    {activeTab === "kanji" && (
                      <KanjiScreen unlockedKanji={unlockedKanji} favorites={favorites}
                        customNames={customNames} onSelect={id=>pushScreen({type:"kanji-entry",id})}
                        onToggleFav={handleToggleFav} />
                    )}
                    {activeTab === "radicals" && (
                      <RadicalsScreen unlockedRadicals={unlockedRadicals} favorites={favorites}
                        customNames={customNames} onSelect={id=>pushScreen({type:"radical-entry",id})}
                        onToggleFav={handleToggleFav} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tab bar (hidden on sub-screens) */}
      {screen.type === "main" && <TabBar active={activeTab} onChange={setActiveTab} />}

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
    <div className={darkMode ? "dark" : ""} style={{ fontFamily:"Nunito, sans-serif", minHeight:"100vh" }}>
      <style>{`
        body { background: ${darkMode ? "#050411" : "#e8e0f0"}; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <PhoneFrame darkMode={darkMode}>
        {mainContent}
      </PhoneFrame>
    </div>
  );
}
