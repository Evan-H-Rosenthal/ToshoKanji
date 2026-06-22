import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, animate, motion, useMotionValue, type PanInfo } from "motion/react";
import { Settings, Trophy } from "lucide-react";
import { KANJI, RADICALS } from "./data/kanjiData";
import { GachaPanel } from "./components/GachaPanel";
import { InstallPwaHint } from "./components/InstallPwaHint";
import { PageIndicator } from "./components/PageIndicator";
import { PhoneFrame } from "./components/PhoneFrame";
import { UnlockPrompt } from "./components/UnlockPrompt";
import { AchievementsPage } from "./screens/AchievementsPage";
import { CollectionScreen } from "./screens/CollectionScreen";
import { KanjiEntryPage } from "./screens/KanjiEntryPage";
import { PracticeScreen } from "./screens/PracticeScreen";
import { RadicalEntryPage } from "./screens/RadicalEntryPage";
import { SettingsPage } from "./screens/SettingsPage";
import { loadPersistedAppState, savePersistedAppState } from "./persistence";
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
  collection: 0,
  gacha: 1,
  practice: 2,
};
const TAB_SEQUENCE: Tab[] = ["collection", "gacha", "practice"];
const getInitialPageWidth = () => {
  if (typeof window === "undefined") return 0;
  return Math.min(window.innerWidth, 480);
};

export default function App() {
  const initialPersistedState = useMemo(() => loadPersistedAppState(), []);
  const [darkMode, setDarkMode] = useState(initialPersistedState.settings.darkMode);
  const [volume, setVolume] = useState(initialPersistedState.settings.volume);
  const [disableAutoJump, setDisableAutoJump] = useState(initialPersistedState.settings.disableAutoJump);
  const [improvePerformance, setImprovePerformance] = useState(initialPersistedState.settings.improvePerformance);
  const [uiFontChoice, setUiFontChoice] = useState<UiFontChoice>(initialPersistedState.settings.uiFontChoice);
  const [characterFontChoice, setCharacterFontChoice] = useState<CharacterFontChoice>(initialPersistedState.settings.characterFontChoice);
  const [activeTab, setActiveTab] = useState<Tab>("gacha");
  const [hasChangedTabs, setHasChangedTabs] = useState(false);
  const [pageWidth, setPageWidth] = useState(getInitialPageWidth);
  const [screen, setScreen] = useState<ScreenState>({ type:"main" });
  const [screenStack, setScreenStack] = useState<ScreenState[]>([]);

  const [unlockedKanji, setUnlockedKanji] = useState<Set<string>>(initialPersistedState.unlockedKanji);
  const [unlockedRadicals, setUnlockedRadicals] = useState<Set<string>>(initialPersistedState.unlockedRadicals);
  const [favorites, setFavorites] = useState<Set<string>>(initialPersistedState.favorites);
  const [customNames, setCustomNames] = useState<Record<string,string>>(initialPersistedState.customNames);
  const [notes, setNotes] = useState<Record<string,string>>(initialPersistedState.notes);
  const [chatMsgs, setChatMsgs] = useState<Record<string,ChatMsg[]>>({});
  const [unlockPrompt, setUnlockPrompt] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const [highlightedUnlock, setHighlightedUnlock] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const msgIdRef = useRef(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const pageViewportRef = useRef<HTMLDivElement>(null);
  const pageX = useMotionValue(-TAB_ORDER.gacha * getInitialPageWidth());

  const allUnlocked = unlockedKanji.size >= KANJI.length && unlockedRadicals.size >= RADICALS.length;

  useEffect(() => {
    const updateViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${viewportHeight}px`);
    };

    updateViewportHeight();
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const viewport = pageViewportRef.current;
    if (!viewport) return;

    const updatePageWidth = () => setPageWidth(viewport.clientWidth);
    updatePageWidth();

    const observer = new ResizeObserver(updatePageWidth);
    observer.observe(viewport);
    window.visualViewport?.addEventListener("resize", updatePageWidth);
    window.addEventListener("orientationchange", updatePageWidth);

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", updatePageWidth);
      window.removeEventListener("orientationchange", updatePageWidth);
    };
  }, [screen.type]);

  useLayoutEffect(() => {
    if (!pageWidth || improvePerformance || screen.type !== "main") return;
    pageX.set(-TAB_ORDER[activeTab] * pageWidth);
  }, [improvePerformance, pageWidth, pageX, screen.type]);

  useEffect(() => {
    if (!pageWidth || improvePerformance || screen.type !== "main") return;

    const controls = animate(pageX, -TAB_ORDER[activeTab] * pageWidth, hasChangedTabs
      ? { type: "spring", stiffness: 380, damping: 38, mass: 0.78 }
      : { duration: 0 });

    return () => controls.stop();
  }, [activeTab, hasChangedTabs, improvePerformance, pageWidth, pageX, screen.type]);

  useEffect(() => {
    savePersistedAppState({
      unlockedKanji,
      unlockedRadicals,
      favorites,
      customNames,
      notes,
      settings: {
        darkMode,
        volume,
        disableAutoJump,
        improvePerformance,
        uiFontChoice,
        characterFontChoice,
      },
    });
  }, [
    characterFontChoice,
    customNames,
    darkMode,
    disableAutoJump,
    favorites,
    improvePerformance,
    notes,
    uiFontChoice,
    unlockedKanji,
    unlockedRadicals,
    volume,
  ]);

  const changeActiveTab = useCallback((nextTab: Tab) => {
    setActiveTab((currentTab) => {
      if (currentTab !== nextTab) setHasChangedTabs(true);
      return nextTab;
    });
  }, []);

  const stepActiveTab = useCallback((direction: -1 | 1) => {
    const currentIndex = TAB_SEQUENCE.indexOf(activeTab);
    const nextTab = TAB_SEQUENCE[currentIndex + direction];
    if (nextTab) changeActiveTab(nextTab);
  }, [activeTab, changeActiveTab]);

  const handleSwipeStart = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (screen.type !== "main" || !improvePerformance) return;
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  }, [improvePerformance, screen.type]);

  const handleSwipeEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || screen.type !== "main" || !improvePerformance) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const isHorizontalSwipe = Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.18;
    if (!isHorizontalSwipe) return;

    stepActiveTab(dx < 0 ? 1 : -1);
  }, [improvePerformance, screen.type, stepActiveTab]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | globalThis.PointerEvent, info: PanInfo) => {
    if (screen.type !== "main" || improvePerformance) return;

    const currentIndex = TAB_SEQUENCE.indexOf(activeTab);
    const currentX = -currentIndex * pageWidth;
    const distanceThreshold = Math.max(54, pageWidth * 0.18);
    const velocityThreshold = 420;
    const shouldMoveForward = info.offset.x < -distanceThreshold || info.velocity.x < -velocityThreshold;
    const shouldMoveBackward = info.offset.x > distanceThreshold || info.velocity.x > velocityThreshold;

    if (shouldMoveForward && TAB_SEQUENCE[currentIndex + 1]) {
      stepActiveTab(1);
      return;
    }

    if (shouldMoveBackward && TAB_SEQUENCE[currentIndex - 1]) {
      stepActiveTab(-1);
      return;
    }

    animate(pageX, currentX, { type: "spring", stiffness: 420, damping: 34, mass: 0.74 });
  }, [activeTab, improvePerformance, pageWidth, pageX, screen.type, stepActiveTab]);

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
    if (!disableAutoJump) changeActiveTab("collection");
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

  const pushScreen = useCallback((nextScreen: ScreenState) => {
    setScreenStack((stack) => [...stack, screen]);
    setScreen(nextScreen);
  }, [screen]);

  const popScreen = useCallback(() => {
    setScreenStack((stack) => {
      const nextStack = [...stack];
      const previousScreen = nextStack.pop() || { type: "main" };
      setScreen(previousScreen);
      return nextStack;
    });
  }, []);
  const handleBackToGacha = () => {
    setScreenStack([]);
    setScreen({ type:"main" });
    changeActiveTab("gacha");
  };
  const openUtilityScreen = useCallback((nextScreen: ScreenState) => {
    setScreen(nextScreen);
  }, []);
  const closeUtilityScreen = useCallback(() => {
    setScreen({ type: "main" });
  }, []);

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
  const renderTabPanel = (tab: Tab) => {
    if (tab === "collection") {
      return (
        <CollectionScreen
          unlockedKanji={unlockedKanji}
          unlockedRadicals={unlockedRadicals}
          favorites={favorites}
          customNames={customNames}
          highlightedUnlock={highlightedUnlock}
          onSelectKanji={id=>pushScreen({type:"kanji-entry",id})}
          onSelectRadical={id=>pushScreen({type:"radical-entry",id})}
          onToggleFav={handleToggleFav}
          onClearHighlight={(type, id) => {
            if (highlightedUnlock?.type === type && highlightedUnlock.id === id) setHighlightedUnlock(null);
          }}
        />
      );
    }

    if (tab === "practice") return <PracticeScreen />;

    return (
      <GachaPanel
        onUnlock={handleUnlock}
        getItem={getGachaItem}
        allUnlocked={allUnlocked}
        unlockedKanji={unlockedKanji}
        unlockedRadicals={unlockedRadicals}
      />
    );
  };

  const mainContent = (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", position:"relative" }}>
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
              favorites={favorites} notes={notes} onBack={closeUtilityScreen} />
          )}
          {screen.type === "settings" && (
            <SettingsPage darkMode={darkMode} volume={volume} disableAutoJump={disableAutoJump} improvePerformance={improvePerformance} uiFontChoice={uiFontChoice} characterFontChoice={characterFontChoice}
              onDark={setDarkMode} onVolume={setVolume} onDisableAutoJump={setDisableAutoJump} onImprovePerformance={setImprovePerformance} onUiFontChoice={setUiFontChoice} onCharacterFontChoice={setCharacterFontChoice}
              onResetProgress={resetProgress} onResetAll={resetAll} onBack={closeUtilityScreen} />
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
                  <button onClick={()=>openUtilityScreen({type:"achievements"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Trophy size={23} className="text-foreground" />
                  </button>
                  <div style={{ textAlign:"center", transform:"scale(1.22)" }}>
                    <p style={{ fontFamily:"var(--jp-font)", fontWeight:700, fontSize:16 }} className="text-foreground">図書漢字</p>
                    <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:700 }} className="text-muted-foreground">ToshoKanji</p>
                  </div>
                  <button onClick={()=>openUtilityScreen({type:"settings"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Settings size={23} className="text-foreground" />
                  </button>
                </div>
              )}
              {/* Non-gacha headers show settings icon */}
              {activeTab !== "gacha" && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 8px" }}>
                  <button onClick={()=>openUtilityScreen({type:"achievements"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Trophy size={23} className="text-foreground" />
                  </button>
                  <div style={{ textAlign:"center", transform:"scale(1.22)" }}>
                    <p style={{ fontFamily:"var(--jp-font)", fontWeight:700, fontSize:16 }} className="text-foreground">図書漢字</p>
                    <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:700 }} className="text-muted-foreground">ToshoKanji</p>
                  </div>
                  <button onClick={()=>openUtilityScreen({type:"settings"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Settings size={23} className="text-foreground" />
                  </button>
                </div>
              )}

              {/* Tab content */}
              <div
                ref={pageViewportRef}
                onPointerDown={handleSwipeStart}
                onPointerUp={handleSwipeEnd}
                onPointerCancel={() => { swipeStartRef.current = null; }}
                style={{ flex:1, minHeight:0, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative", touchAction:"pan-y" }}>
                {improvePerformance ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`fade-${activeTab}`}
                      initial={{ opacity:0, y:8 }}
                      animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-8 }}
                      transition={{ duration:0.24, ease:"easeOut" }}
                      style={{ position:"absolute", inset:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                      {renderTabPanel(activeTab)}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={false}
                    drag="x"
                    dragDirectionLock
                    dragElastic={0.08}
                    dragMomentum={false}
                    dragConstraints={{ left: pageWidth ? -pageWidth * 2 : 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    style={{ x: pageX, width:"300%", height:"100%", display:"flex", willChange:"transform", touchAction:"pan-y", backfaceVisibility:"hidden" }}>
                    <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "collection" ? "auto" : "none" }}>
                      {renderTabPanel("collection")}
                    </div>
                    <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "gacha" ? "auto" : "none" }}>
                      {renderTabPanel("gacha")}
                    </div>
                    <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "practice" ? "auto" : "none" }}>
                      {renderTabPanel("practice")}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Page indicator (hidden on sub-screens) */}
      {screen.type === "main" && <PageIndicator active={activeTab} />}

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
      <InstallPwaHint />
    </div>
  );

  return (
    <div className={darkMode ? "dark" : ""} style={{ fontFamily:"var(--ui-font)", minHeight:"var(--app-height, 100dvh)" }}>
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
