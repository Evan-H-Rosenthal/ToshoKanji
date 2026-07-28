import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, MotionConfig, animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { Settings, Trophy } from "lucide-react";
import { KANJI_BY_RARITY, KANJI_IDS, RADICAL_IDS } from "./data/entryIndexes";
import { GachaPanel } from "./components/GachaPanel";
import { InstallPwaHint } from "./components/InstallPwaHint";
import { PageIndicator } from "./components/PageIndicator";
import { PhoneFrame } from "./components/PhoneFrame";
import { UnlockPrompt } from "./components/UnlockPrompt";
import { AchievementsPage } from "./screens/AchievementsPage";
import { ComponentEntryPage } from "./screens/ComponentEntryPage";
import { CollectionScreen } from "./screens/CollectionScreen";
import { KanjiEntryPage } from "./screens/KanjiEntryPage";
import { PracticeScreen } from "./screens/PracticeScreen";
import { SettingsPage } from "./screens/SettingsPage";
import { WordEntryPage } from "./screens/WordEntryPage";
import { KANJI_RARITIES } from "./data/kanjiRarity";
import { flushPersistedAppStateSave, loadPersistedAppState, schedulePersistedAppStateSave } from "./persistence";
import type { CharacterFontChoice, ChatMsg, KanjiEntryViewState, ScreenState, Tab, UiFontChoice } from "./types";

const UI_FONT_STACKS: Record<UiFontChoice, string> = {
  nunito: "var(--font-ui-nunito)",
  system: "var(--font-ui-system)",
  "new-rodin": "var(--font-ui-new-rodin)",
  "two-weekend": "var(--font-ui-two-weekend)",
};

const CHARACTER_FONT_STACKS: Record<CharacterFontChoice, string> = {
  traditional: "var(--font-jp-serif)",
  modern: "var(--font-jp-modern)",
  "noto-sans": "var(--font-jp-sans)",
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
const isStandalonePwa = () => {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
};

export default function App() {
  const initialPersistedState = useMemo(() => loadPersistedAppState(), []);
  const prefersReducedMotion = useReducedMotion();
  const [darkMode, setDarkMode] = useState(initialPersistedState.settings.darkMode);
  const [volume, setVolume] = useState(initialPersistedState.settings.volume);
  const [disableAutoJump, setDisableAutoJump] = useState(initialPersistedState.settings.disableAutoJump);
  const [improvePerformance, setImprovePerformance] = useState(initialPersistedState.settings.improvePerformance);
  const useSimpleTransitions = improvePerformance || prefersReducedMotion;
  const [uiFontChoice, setUiFontChoice] = useState<UiFontChoice>(initialPersistedState.settings.uiFontChoice);
  const [characterFontChoice, setCharacterFontChoice] = useState<CharacterFontChoice>(initialPersistedState.settings.characterFontChoice);
  const [activeTab, setActiveTab] = useState<Tab>("gacha");
  const [hasChangedTabs, setHasChangedTabs] = useState(false);
  const [gachaInteractionLocked, setGachaInteractionLocked] = useState(false);
  const [pageWidth, setPageWidth] = useState(getInitialPageWidth);
  const [screen, setScreen] = useState<ScreenState>({ type:"main" });
  const [screenStack, setScreenStack] = useState<ScreenState[]>([]);
  const [collectionQuery, setCollectionQuery] = useState("");
  const [collectionIncludeWords, setCollectionIncludeWords] = useState(false);
  const [collectionIncludeComponents, setCollectionIncludeComponents] = useState(false);
  const [collectionFavOnly, setCollectionFavOnly] = useState(false);
  const collectionScrollTopRef = useRef(0);
  const kanjiEntryViewStateRef = useRef<Record<string, KanjiEntryViewState>>({});
  const ignoredKanjiEntryViewStateIdsRef = useRef<Set<string>>(new Set());

  const [unlockedKanji, setUnlockedKanji] = useState<Set<string>>(initialPersistedState.unlockedKanji);
  const [unlockedRadicals, setUnlockedRadicals] = useState<Set<string>>(initialPersistedState.unlockedRadicals);
  const [favorites, setFavorites] = useState<Set<string>>(initialPersistedState.favorites);
  const [customNames, setCustomNames] = useState<Record<string,string>>(initialPersistedState.customNames);
  const [notes, setNotes] = useState<Record<string,string>>(initialPersistedState.notes);
  const [chatMsgs, setChatMsgs] = useState<Record<string,ChatMsg[]>>({});
  const [chatInteractionCount, setChatInteractionCount] = useState(initialPersistedState.chatInteractionCount);
  const [unlockPrompt, setUnlockPrompt] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const [highlightedUnlock, setHighlightedUnlock] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const msgIdRef = useRef(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const pageViewportRef = useRef<HTMLDivElement>(null);
  const pageX = useMotionValue(-TAB_ORDER.gacha * getInitialPageWidth());

  const allUnlocked = unlockedKanji.size >= KANJI_IDS.length;

  useEffect(() => {
    const updateViewportHeight = () => {
      if (isStandalonePwa()) {
        document.documentElement.style.setProperty("--app-height", "100vh");
        return;
      }

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
    if (!pageWidth || useSimpleTransitions || screen.type !== "main") return;
    pageX.set(-TAB_ORDER[activeTab] * pageWidth);
  }, [pageWidth, pageX, screen.type, useSimpleTransitions]);

  useEffect(() => {
    if (!pageWidth || useSimpleTransitions || screen.type !== "main") return;

    const controls = animate(pageX, -TAB_ORDER[activeTab] * pageWidth, hasChangedTabs
      ? { type: "spring", stiffness: 380, damping: 38, mass: 0.78 }
      : { duration: 0 });

    return () => controls.stop();
  }, [activeTab, hasChangedTabs, pageWidth, pageX, screen.type, useSimpleTransitions]);

  useEffect(() => {
    schedulePersistedAppStateSave({
      unlockedKanji,
      unlockedRadicals,
      favorites,
      customNames,
      notes,
      chatInteractionCount,
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
    chatInteractionCount,
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

  useEffect(() => {
    window.addEventListener("pagehide", flushPersistedAppStateSave);
    return () => {
      window.removeEventListener("pagehide", flushPersistedAppStateSave);
      flushPersistedAppStateSave();
    };
  }, []);

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
    if (screen.type !== "main" || !useSimpleTransitions || gachaInteractionLocked) return;
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  }, [gachaInteractionLocked, screen.type, useSimpleTransitions]);

  const handleSwipeEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || screen.type !== "main" || !useSimpleTransitions || gachaInteractionLocked) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const isHorizontalSwipe = Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.18;
    if (!isHorizontalSwipe) return;

    stepActiveTab(dx < 0 ? 1 : -1);
  }, [gachaInteractionLocked, screen.type, stepActiveTab, useSimpleTransitions]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | globalThis.PointerEvent, info: PanInfo) => {
    if (screen.type !== "main" || useSimpleTransitions || gachaInteractionLocked) return;

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
  }, [activeTab, gachaInteractionLocked, pageWidth, pageX, screen.type, stepActiveTab, useSimpleTransitions]);

  const availableKanjiByRarity = useMemo(() => {
    const next = new Map(KANJI_RARITIES.map((rarity) => [rarity.id, [] as string[]]));
    let total = 0;
    for (const rarity of KANJI_RARITIES) {
      const entries = KANJI_BY_RARITY.get(rarity.id) ?? [];
      const availableIds = next.get(rarity.id)!;
      for (const entry of entries) {
        if (!unlockedKanji.has(entry.id)) {
          availableIds.push(entry.id);
          total += 1;
        }
      }
    }
    return { byRarity: next, total };
  }, [unlockedKanji]);

  const getGachaItem = useCallback((): {type:"kanji"|"radical";id:string}|null => {
    if (!availableKanjiByRarity.total) return null;

    const totalWeight = KANJI_RARITIES.reduce((sum, rarity) => sum + rarity.pullWeight, 0);
    let roll = Math.random() * totalWeight;
    let rolledRarity = KANJI_RARITIES[0].id;
    for (const rarity of KANJI_RARITIES) {
      roll -= rarity.pullWeight;
      if (roll <= 0) {
        rolledRarity = rarity.id;
        break;
      }
    }

    const selectedPool = availableKanjiByRarity.byRarity.get(rolledRarity)?.length
      ? availableKanjiByRarity.byRarity.get(rolledRarity)!
      : KANJI_RARITIES.map((rarity) => availableKanjiByRarity.byRarity.get(rarity.id) ?? []).find((items) => items.length > 0);
    if (!selectedPool?.length) return null;

    const selectedId = selectedPool[Math.floor(Math.random() * selectedPool.length)];
    return { type:"kanji", id:selectedId };
  }, [availableKanjiByRarity]);

  const handleUnlock = useCallback((type:"kanji"|"radical", id:string) => {
    if (type==="kanji") setUnlockedKanji(s=>new Set([...s, id]));
    else setUnlockedRadicals(s=>new Set([...s, id]));
    setHighlightedUnlock({ type, id });
    if (!disableAutoJump) changeActiveTab("collection");
  }, [changeActiveTab, disableAutoJump]);

  const handleGachaSpinStart = useCallback(() => {
    swipeStartRef.current = null;
    setGachaInteractionLocked(true);
    changeActiveTab("gacha");
    if (pageWidth) pageX.set(-TAB_ORDER.gacha * pageWidth);
  }, [changeActiveTab, pageWidth, pageX]);

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
    setChatInteractionCount((count) => count + 1);
  }, []);

  const handleKanjiEntryViewStateChange = useCallback((id: string, viewState: KanjiEntryViewState) => {
    if (ignoredKanjiEntryViewStateIdsRef.current.has(id)) return;
    kanjiEntryViewStateRef.current[id] = viewState;
  }, []);

  const pushScreen = useCallback((nextScreen: ScreenState) => {
    if (nextScreen.type === "kanji-entry" && nextScreen.id) {
      ignoredKanjiEntryViewStateIdsRef.current.delete(nextScreen.id);
    }
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
  const handleBackToCollection = () => {
    const ignoredIds = new Set(Object.keys(kanjiEntryViewStateRef.current));
    if (screen.type === "kanji-entry" && screen.id) ignoredIds.add(screen.id);
    ignoredKanjiEntryViewStateIdsRef.current = ignoredIds;
    kanjiEntryViewStateRef.current = {};
    setScreenStack([]);
    setScreen({ type:"main" });
    changeActiveTab("collection");
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
  const handleNavComponent = (id:string) => {
    pushScreen({type:"component-entry",id});
  };
  const handleNavWord = (id:string) => {
    pushScreen({type:"word-entry",id});
  };

  const resetProgress = () => { setUnlockedKanji(new Set()); setUnlockedRadicals(new Set()); };
  const resetAll = () => { setUnlockedKanji(new Set()); setUnlockedRadicals(new Set()); setFavorites(new Set()); setCustomNames({}); setNotes({}); setChatMsgs({}); setChatInteractionCount(0); };
  const unlockAll = () => {
    setUnlockedKanji(new Set(KANJI_IDS));
    setUnlockedRadicals(new Set(RADICAL_IDS));
  };

  const previousScreen = screenStack[screenStack.length - 1];
  const entryBackLabel = previousScreen?.type === "main" ? "Back to Collection" : "Back one step";
  const showBackToCollection = screenStack.length >= 2;
  const renderTabPanel = (tab: Tab) => {
    if (tab === "collection") {
      return (
        <CollectionScreen
          unlockedKanji={unlockedKanji}
          favorites={favorites}
          customNames={customNames}
          highlightedUnlock={highlightedUnlock}
          query={collectionQuery}
          includeWords={collectionIncludeWords}
          includeComponents={collectionIncludeComponents}
          favOnly={collectionFavOnly}
          scrollTop={collectionScrollTopRef.current}
          onQueryChange={setCollectionQuery}
          onIncludeWordsChange={setCollectionIncludeWords}
          onIncludeComponentsChange={setCollectionIncludeComponents}
          onFavOnlyChange={setCollectionFavOnly}
          onScrollTopChange={(scrollTop) => {
            collectionScrollTopRef.current = scrollTop;
          }}
          onSelectKanji={id=>pushScreen({type:"kanji-entry",id})}
          onSelectRadical={id=>pushScreen({type:"component-entry",id})}
          onSelectWord={id=>pushScreen({type:"word-entry",id})}
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
        onInteractionLockChange={setGachaInteractionLocked}
        onSpinStart={handleGachaSpinStart}
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
            <KanjiEntryPage id={screen.id} unlockedKanji={unlockedKanji}
              favorites={favorites} customNames={customNames} notes={notes} chatMsgs={chatMsgs} darkMode={darkMode}
              onBack={popScreen} backLabel={entryBackLabel} onToggleFav={handleToggleFav} onSetName={handleSetName}
              onSetNote={handleSetNote} onChat={handleChat}
              initialViewState={kanjiEntryViewStateRef.current[screen.id]}
              onViewStateChange={handleKanjiEntryViewStateChange}
              onBackToCollection={showBackToCollection ? handleBackToCollection : undefined}
              onNavKanji={handleNavKanji} onNavComponent={handleNavComponent} onNavWord={handleNavWord} />
          )}
          {screen.type === "component-entry" && screen.id && (
            <ComponentEntryPage id={screen.id} unlockedKanji={unlockedKanji}
              favorites={favorites} customNames={customNames} notes={notes} chatMsgs={chatMsgs}
              onBack={popScreen} backLabel={entryBackLabel}
              onToggleFav={handleToggleFav}
              onSetNote={handleSetNote} onChat={handleChat}
              onBackToCollection={showBackToCollection ? handleBackToCollection : undefined}
              onNavKanji={handleNavKanji} onNavComponent={handleNavComponent} />
          )}
          {screen.type === "word-entry" && screen.id && (
            <WordEntryPage id={screen.id} unlockedKanji={unlockedKanji}
              favorites={favorites} customNames={customNames} notes={notes} chatMsgs={chatMsgs} darkMode={darkMode}
              onBack={popScreen} backLabel={entryBackLabel} onToggleFav={handleToggleFav}
              onSetNote={handleSetNote} onChat={handleChat}
              onBackToCollection={showBackToCollection ? handleBackToCollection : undefined}
              onNavKanji={handleNavKanji} />
          )}
          {screen.type === "achievements" && (
            <AchievementsPage unlockedKanji={unlockedKanji} unlockedRadicals={unlockedRadicals}
              favorites={favorites} notes={notes} chatInteractionCount={chatInteractionCount} onBack={closeUtilityScreen} />
          )}
          {screen.type === "settings" && (
            <SettingsPage darkMode={darkMode} volume={volume} disableAutoJump={disableAutoJump} improvePerformance={improvePerformance} uiFontChoice={uiFontChoice} characterFontChoice={characterFontChoice}
              onDark={setDarkMode} onVolume={setVolume} onDisableAutoJump={setDisableAutoJump} onImprovePerformance={setImprovePerformance} onUiFontChoice={setUiFontChoice} onCharacterFontChoice={setCharacterFontChoice}
              onResetProgress={resetProgress} onResetAll={resetAll} onUnlockAll={unlockAll} onBack={closeUtilityScreen} />
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
                  <button aria-label="Achievements" className="app-reactive" onClick={()=>openUtilityScreen({type:"achievements"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Trophy size={23} className="text-foreground" />
                  </button>
                  <div style={{ textAlign:"center", transform:"scale(1.22)" }}>
                    <p style={{ fontFamily:"var(--jp-font)", fontWeight:700, fontSize:16 }} className="text-foreground">図書漢字</p>
                    <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:700 }} className="text-muted-foreground">ToshoKanji</p>
                  </div>
                  <button aria-label="Settings" className="app-reactive" onClick={()=>openUtilityScreen({type:"settings"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Settings size={23} className="text-foreground" />
                  </button>
                </div>
              )}
              {/* Non-gacha headers show settings icon */}
              {activeTab !== "gacha" && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 8px" }}>
                  <button aria-label="Achievements" className="app-reactive" onClick={()=>openUtilityScreen({type:"achievements"})}
                    style={{ width:48, height:48, borderRadius:14, background:"var(--card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Trophy size={23} className="text-foreground" />
                  </button>
                  <div style={{ textAlign:"center", transform:"scale(1.22)" }}>
                    <p style={{ fontFamily:"var(--jp-font)", fontWeight:700, fontSize:16 }} className="text-foreground">図書漢字</p>
                    <p style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:700 }} className="text-muted-foreground">ToshoKanji</p>
                  </div>
                  <button aria-label="Settings" className="app-reactive" onClick={()=>openUtilityScreen({type:"settings"})}
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
                style={{ flex:1, minHeight:0, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative", touchAction:gachaInteractionLocked ? "none" : "pan-y" }}>
                {useSimpleTransitions ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`fade-${activeTab}`}
                      initial={prefersReducedMotion ? { opacity:0 } : { opacity:0, y:8 }}
                      animate={prefersReducedMotion ? { opacity:1 } : { opacity:1, y:0 }}
                      exit={prefersReducedMotion ? { opacity:0 } : { opacity:0, y:-8 }}
                      transition={{ duration:prefersReducedMotion ? 0.12 : 0.24, ease:"easeOut" }}
                      style={{ position:"absolute", inset:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                      {renderTabPanel(activeTab)}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={false}
                    drag={gachaInteractionLocked ? false : "x"}
                    dragDirectionLock
                    dragElastic={0.08}
                    dragMomentum={false}
                    dragConstraints={{ left: pageWidth ? -pageWidth * 2 : 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    style={{ x: pageX, width:"300%", height:"100%", display:"flex", willChange:"transform", touchAction:gachaInteractionLocked ? "none" : "pan-y", backfaceVisibility:"hidden" }}>
                    <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "collection" ? "auto" : "none", contain:"layout paint" }}>
                      {renderTabPanel("collection")}
                    </div>
                    <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "gacha" ? "auto" : "none", contain:"layout paint" }}>
                      {renderTabPanel("gacha")}
                    </div>
                    <div style={{ width:"33.333333%", height:"100%", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents: activeTab === "practice" ? "auto" : "none", contain:"layout paint" }}>
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
      {screen.type === "main" && <PageIndicator active={activeTab} onSelect={changeActiveTab} />}

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
    <MotionConfig reducedMotion="user">
      <div className={darkMode ? "dark" : ""} style={{ fontFamily:"var(--ui-font)", minHeight:"var(--app-height, 100dvh)", background:"var(--app-shell-background)" }}>
      <style>{`
        :root {
          --app-height: 100dvh;
          --app-bottom-safe: 0px;
          --ui-font: ${UI_FONT_STACKS[uiFontChoice]};
          --jp-font: ${CHARACTER_FONT_STACKS[characterFontChoice]};
        }
        html, body, #root {
          width: 100%;
          height: 100%;
          min-height: var(--app-height, 100dvh);
          overflow-x: clip;
          overflow-y: hidden;
          background: var(--app-shell-background);
        }
        body {
          background: var(--app-shell-background);
          overscroll-behavior: none;
        }
        @media (display-mode: standalone) {
          :root {
            --app-height: 100vh;
            --app-bottom-safe: max(env(safe-area-inset-bottom), 20px);
          }
          html, body, #root {
            height: 100vh;
            min-height: 100vh;
            max-height: 100vh;
          }
          body {
            position: fixed;
            inset: 0;
            width: 100%;
          }
          .app-shell-frame::after {
            content: "";
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            height: var(--app-bottom-safe);
            background: var(--app-shell-background);
            pointer-events: none;
            z-index: 0;
          }
        }
        ::-webkit-scrollbar { width: 0; height: 0; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <PhoneFrame darkMode={darkMode}>
        {mainContent}
      </PhoneFrame>
      </div>
    </MotionConfig>
  );
}
