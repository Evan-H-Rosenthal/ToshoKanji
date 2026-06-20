import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Settings, Search, Star, ChevronLeft, Pencil, Send,
  Check, X, Volume2, Moon, Sun, Layers, Sparkles, BookOpen,
  MessageCircle, Lock, RotateCcw, VolumeX
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "kanji" | "gacha" | "radicals";
interface ScreenState { type: "main" | "kanji-entry" | "radical-entry" | "achievements" | "settings"; id?: string; }
interface Word { japanese: string; furigana: string; romaji: string; meaning: string; }
interface KanjiEntry { id: string; char: string; meanings: string[]; onyomi: string[]; kunyomi: string[]; radicalIds: string[]; words: Word[]; category: string; }
interface RadicalEntry { id: string; char: string; meanings: string[]; strokes: number; kanjiIds: string[]; }
interface ChatMsg { role: "user" | "ai"; text: string; id: number; }
interface Achievement { id: string; name: string; desc: string; icon: string; check: (uk: Set<string>, ur: Set<string>, fav: Set<string>, notes: Record<string, string>) => boolean; }

// ── Data ──────────────────────────────────────────────────────────────────────

const RADICALS: RadicalEntry[] = [
  { id: "r-sun",    char: "日", meanings: ["sun","day"],       strokes: 4, kanjiIds: ["k-day","k-eye"] },
  { id: "r-moon",   char: "月", meanings: ["moon","month"],    strokes: 4, kanjiIds: ["k-moon"] },
  { id: "r-mtn",    char: "山", meanings: ["mountain"],        strokes: 3, kanjiIds: ["k-mountain"] },
  { id: "r-river",  char: "川", meanings: ["river"],           strokes: 3, kanjiIds: ["k-river"] },
  { id: "r-tree",   char: "木", meanings: ["tree","wood"],     strokes: 4, kanjiIds: ["k-tree","k-flower"] },
  { id: "r-fire",   char: "火", meanings: ["fire"],            strokes: 4, kanjiIds: ["k-fire"] },
  { id: "r-water",  char: "水", meanings: ["water"],           strokes: 4, kanjiIds: ["k-water"] },
  { id: "r-earth",  char: "土", meanings: ["earth","soil"],    strokes: 3, kanjiIds: ["k-earth","k-country","k-sky"] },
  { id: "r-person", char: "人", meanings: ["person"],          strokes: 2, kanjiIds: ["k-person","k-love"] },
  { id: "r-mouth",  char: "口", meanings: ["mouth"],           strokes: 3, kanjiIds: ["k-mouth","k-country"] },
  { id: "r-hand",   char: "手", meanings: ["hand"],            strokes: 4, kanjiIds: ["k-hand"] },
  { id: "r-eye",    char: "目", meanings: ["eye"],             strokes: 5, kanjiIds: ["k-eye"] },
  { id: "r-heart",  char: "心", meanings: ["heart","mind"],   strokes: 4, kanjiIds: ["k-heart","k-love"] },
  { id: "r-speech", char: "言", meanings: ["speech","word"],  strokes: 7, kanjiIds: ["k-word"] },
  { id: "r-child",  char: "子", meanings: ["child"],           strokes: 3, kanjiIds: ["k-study","k-word"] },
  { id: "r-food",   char: "食", meanings: ["eat","food"],     strokes: 9, kanjiIds: ["k-eat"] },
];

const KANJI: KanjiEntry[] = [
  { id:"k-day",      char:"日", meanings:["sun","day","Japan"],    onyomi:["にち","じつ"],   kunyomi:["ひ","か"],         radicalIds:["r-sun"],            category:"nature",    words:[{japanese:"日本",furigana:"にほん",romaji:"Nihon",meaning:"Japan"},{japanese:"毎日",furigana:"まいにち",romaji:"mainichi",meaning:"every day"}] },
  { id:"k-moon",     char:"月", meanings:["moon","month"],         onyomi:["げつ","がつ"],   kunyomi:["つき"],            radicalIds:["r-moon"],           category:"nature",    words:[{japanese:"月曜日",furigana:"げつようび",romaji:"getsuyōbi",meaning:"Monday"},{japanese:"今月",furigana:"こんげつ",romaji:"kongetsu",meaning:"this month"}] },
  { id:"k-mountain", char:"山", meanings:["mountain"],             onyomi:["さん","ざん"],   kunyomi:["やま"],            radicalIds:["r-mtn"],            category:"nature",    words:[{japanese:"富士山",furigana:"ふじさん",romaji:"Fujisan",meaning:"Mt. Fuji"},{japanese:"山道",furigana:"やまみち",romaji:"yamamichi",meaning:"mountain path"}] },
  { id:"k-river",    char:"川", meanings:["river","stream"],       onyomi:["せん"],          kunyomi:["かわ"],            radicalIds:["r-river"],          category:"nature",    words:[{japanese:"川岸",furigana:"かわぎし",romaji:"kawagishi",meaning:"riverbank"},{japanese:"小川",furigana:"おがわ",romaji:"ogawa",meaning:"brook"}] },
  { id:"k-tree",     char:"木", meanings:["tree","wood"],          onyomi:["もく","ぼく"],   kunyomi:["き","こ"],         radicalIds:["r-tree"],           category:"nature",    words:[{japanese:"木曜日",furigana:"もくようび",romaji:"mokuyōbi",meaning:"Thursday"},{japanese:"木材",furigana:"もくざい",romaji:"mokuzai",meaning:"lumber"}] },
  { id:"k-fire",     char:"火", meanings:["fire","flame"],         onyomi:["か","こ"],       kunyomi:["ひ","ほ"],         radicalIds:["r-fire"],           category:"nature",    words:[{japanese:"火曜日",furigana:"かようび",romaji:"kayōbi",meaning:"Tuesday"},{japanese:"火山",furigana:"かざん",romaji:"kazan",meaning:"volcano"}] },
  { id:"k-water",    char:"水", meanings:["water"],                onyomi:["すい"],          kunyomi:["みず"],            radicalIds:["r-water"],          category:"nature",    words:[{japanese:"水曜日",furigana:"すいようび",romaji:"suiyōbi",meaning:"Wednesday"},{japanese:"お水",furigana:"おみず",romaji:"omizu",meaning:"water"}] },
  { id:"k-earth",    char:"土", meanings:["earth","soil"],         onyomi:["ど","と"],       kunyomi:["つち"],            radicalIds:["r-earth"],          category:"nature",    words:[{japanese:"土曜日",furigana:"どようび",romaji:"doyōbi",meaning:"Saturday"},{japanese:"土地",furigana:"とち",romaji:"tochi",meaning:"land"}] },
  { id:"k-person",   char:"人", meanings:["person","human"],       onyomi:["じん","にん"],   kunyomi:["ひと"],            radicalIds:["r-person"],         category:"people",    words:[{japanese:"日本人",furigana:"にほんじん",romaji:"Nihonjin",meaning:"Japanese person"},{japanese:"一人",furigana:"ひとり",romaji:"hitori",meaning:"alone"}] },
  { id:"k-mouth",    char:"口", meanings:["mouth","opening"],      onyomi:["こう","く"],     kunyomi:["くち"],            radicalIds:["r-mouth"],          category:"body",      words:[{japanese:"入口",furigana:"いりぐち",romaji:"iriguchi",meaning:"entrance"},{japanese:"出口",furigana:"でぐち",romaji:"deguchi",meaning:"exit"}] },
  { id:"k-hand",     char:"手", meanings:["hand"],                 onyomi:["しゅ"],          kunyomi:["て","た"],         radicalIds:["r-hand"],           category:"body",      words:[{japanese:"手紙",furigana:"てがみ",romaji:"tegami",meaning:"letter"},{japanese:"上手",furigana:"じょうず",romaji:"jōzu",meaning:"skilled"}] },
  { id:"k-eye",      char:"目", meanings:["eye","look"],           onyomi:["もく","ぼく"],   kunyomi:["め","ま"],         radicalIds:["r-sun","r-eye"],    category:"body",      words:[{japanese:"目標",furigana:"もくひょう",romaji:"mokuhyō",meaning:"goal"},{japanese:"目的",furigana:"もくてき",romaji:"mokuteki",meaning:"purpose"}] },
  { id:"k-heart",    char:"心", meanings:["heart","mind"],         onyomi:["しん"],          kunyomi:["こころ"],          radicalIds:["r-heart"],          category:"feelings",  words:[{japanese:"心配",furigana:"しんぱい",romaji:"shinpai",meaning:"worry"},{japanese:"安心",furigana:"あんしん",romaji:"anshin",meaning:"peace of mind"}] },
  { id:"k-eat",      char:"食", meanings:["eat","food"],           onyomi:["しょく","じき"], kunyomi:["た","く"],         radicalIds:["r-food"],           category:"food",      words:[{japanese:"食べ物",furigana:"たべもの",romaji:"tabemono",meaning:"food"},{japanese:"食事",furigana:"しょくじ",romaji:"shokuji",meaning:"meal"}] },
  { id:"k-study",    char:"学", meanings:["study","learn"],        onyomi:["がく"],          kunyomi:["まな"],            radicalIds:["r-child"],          category:"education", words:[{japanese:"学校",furigana:"がっこう",romaji:"gakkō",meaning:"school"},{japanese:"大学",furigana:"だいがく",romaji:"daigaku",meaning:"university"}] },
  { id:"k-word",     char:"語", meanings:["word","language"],      onyomi:["ご"],            kunyomi:["かた"],            radicalIds:["r-speech","r-child"],category:"language",  words:[{japanese:"日本語",furigana:"にほんご",romaji:"Nihongo",meaning:"Japanese"},{japanese:"英語",furigana:"えいご",romaji:"eigo",meaning:"English"}] },
  { id:"k-love",     char:"愛", meanings:["love","affection"],     onyomi:["あい"],          kunyomi:["いと","め"],       radicalIds:["r-heart","r-person"],category:"feelings",  words:[{japanese:"愛情",furigana:"あいじょう",romaji:"aijō",meaning:"love"},{japanese:"愛犬",furigana:"あいけん",romaji:"aiken",meaning:"beloved dog"}] },
  { id:"k-country",  char:"国", meanings:["country","nation"],     onyomi:["こく"],          kunyomi:["くに"],            radicalIds:["r-earth","r-mouth"],category:"places",    words:[{japanese:"外国",furigana:"がいこく",romaji:"gaikoku",meaning:"foreign country"},{japanese:"国語",furigana:"こくご",romaji:"kokugo",meaning:"national language"}] },
  { id:"k-flower",   char:"花", meanings:["flower","blossom"],     onyomi:["か"],            kunyomi:["はな"],            radicalIds:["r-tree"],           category:"nature",    words:[{japanese:"花火",furigana:"はなび",romaji:"hanabi",meaning:"fireworks"},{japanese:"花見",furigana:"はなみ",romaji:"hanami",meaning:"flower viewing"}] },
  { id:"k-sky",      char:"空", meanings:["sky","empty"],          onyomi:["くう"],          kunyomi:["そら","あ","から"],radicalIds:["r-earth"],          category:"nature",    words:[{japanese:"空港",furigana:"くうこう",romaji:"kūkō",meaning:"airport"},{japanese:"青空",furigana:"あおぞら",romaji:"aozora",meaning:"blue sky"}] },
];

const ACHIEVEMENTS: Achievement[] = [
  { id:"first-k", name:"First Steps",     desc:"Unlock your first kanji",           icon:"⭐", check:(uk)=>uk.size>=1 },
  { id:"first-r", name:"Radical Starter", desc:"Unlock your first radical",         icon:"🌱", check:(_,ur)=>ur.size>=1 },
  { id:"food",    name:"Food Enthusiast", desc:"Unlock all food kanji",             icon:"🍜", check:(uk)=>["k-eat"].every(id=>uk.has(id)) },
  { id:"half",    name:"Halfway There",   desc:`Unlock ${Math.ceil(KANJI.length/2)} kanji`, icon:"🎯", check:(uk)=>uk.size>=Math.ceil(KANJI.length/2) },
  { id:"all-k",   name:"Kanji Master",   desc:"Unlock every kanji",                icon:"🏆", check:(uk)=>uk.size>=KANJI.length },
  { id:"all-r",   name:"Radical Expert", desc:"Unlock every radical",              icon:"💎", check:(_,ur)=>ur.size>=RADICALS.length },
  { id:"stars",   name:"Stargazer",      desc:"Favorite 10 items",                 icon:"✨", check:(_,__,fav)=>fav.size>=10 },
  { id:"scholar", name:"Scholar",        desc:"Write notes on 5 entries",          icon:"📚", check:(_,__,___,notes)=>Object.values(notes).filter(n=>n.trim().length>0).length>=5 },
  { id:"nature",  name:"Nature Lover",   desc:"Unlock all nature kanji",           icon:"🌿", check:(uk)=>KANJI.filter(k=>k.category==="nature").every(k=>uk.has(k.id)) },
  { id:"emotion", name:"Emotional",      desc:"Unlock all feelings kanji",         icon:"💖", check:(uk)=>KANJI.filter(k=>k.category==="feelings").every(k=>uk.has(k.id)) },
];

const CAT_COLORS: Record<string,[string,string]> = {
  nature:    ["#059669","#0d9488"],
  people:    ["#3b82f6","#4f46e5"],
  body:      ["#8b5cf6","#7c3aed"],
  feelings:  ["#ec4899","#be185d"],
  food:      ["#f97316","#ea580c"],
  education: ["#eab308","#d97706"],
  language:  ["#06b6d4","#0891b2"],
  places:    ["#10b981","#059669"],
};
const RAD_COLORS = ["#6366f1","#8b5cf6","#3b82f6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#14b8a6","#f43f5e","#22c55e","#a855f7","#0ea5e9","#fb923c","#84cc16","#e879f9"];

const QUICK_PROMPTS = ["What does this mean?","Why these radicals?","How can I remember it?","Why does pronunciation change?"];
const AI_REPLIES = [
  "This kanji evolved from an ancient pictograph — its meaning runs deep in Japanese culture, a visual metaphor refined over centuries of calligraphic tradition.",
  "The radical composition is intentional: each component contributes semantic meaning. Together they hint at both the pronunciation and the core concept.",
  "Try creating a vivid story where the radicals act out the meaning. Visual mnemonics stick far better than rote repetition.",
  "Japanese kanji often have two reading types: on'yomi (borrowed from Chinese) used in compounds, and kun'yomi (native Japanese) when standalone. Context determines which to use.",
  "This is a fundamental building block — master it and you'll spot it everywhere in compound words and related kanji!",
  "The current form is a simplified evolution of the original pictographic script. Tracing its history makes the visual logic clear.",
];
function getAIReply(p: string) {
  if (p.includes("mean")) return AI_REPLIES[0];
  if (p.includes("radical")) return AI_REPLIES[1];
  if (p.includes("remember")) return AI_REPLIES[2];
  if (p.includes("pronoun") || p.includes("chang")) return AI_REPLIES[3];
  return AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
}

// ── Gacha Machine ─────────────────────────────────────────────────────────────

const DOME_BALLS = [
  {color:"#ff3d71",x:18,y:28},{color:"#00d2ff",x:52,y:50},{color:"#ffd700",x:88,y:20},
  {color:"#7fff00",x:125,y:48},{color:"#a855f7",x:158,y:25},{color:"#ff8c00",x:34,y:68},
  {color:"#00d2ff",x:105,y:72},{color:"#ff3d71",x:142,y:65},{color:"#ffd700",x:72,y:16},
];

function GachaMachine({ onUnlock, getItem, allUnlocked }: {
  onUnlock: (type: "kanji"|"radical", id: string) => void;
  getItem: () => { type:"kanji"|"radical"; id:string } | null;
  allUnlocked: boolean;
}) {
  const [knobDeg, setKnobDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [capsule, setCapsule] = useState<{type:"kanji"|"radical";id:string}|null>(null);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [capsuleChar, setCapsuleChar] = useState("");

  const handleSpin = useCallback(() => {
    if (spinning || capsule || allUnlocked) return;
    setSpinning(true);
    setKnobDeg(d => d + 900);
    setTimeout(() => {
      const item = getItem();
      if (item) {
        const entry = item.type === "kanji"
          ? KANJI.find(k => k.id === item.id)
          : RADICALS.find(r => r.id === item.id);
        setCapsuleChar(entry?.char ?? "?");
        setCapsule(item);
      }
      setSpinning(false);
    }, 1300);
  }, [spinning, capsule, allUnlocked, getItem]);

  const handleCapsuleTap = () => {
    if (!capsule || capsuleOpen) return;
    setCapsuleOpen(true);
    setTimeout(() => {
      onUnlock(capsule.type, capsule.id);
      setCapsule(null);
      setCapsuleOpen(false);
      setCapsuleChar("");
    }, 1800);
  };

  const capsuleColor = capsule?.type === "kanji" ? "#ff3d71" : "#00d2ff";

  return (
    <div className="flex flex-col items-center select-none">
      {/* Glass dome */}
      <div className="relative" style={{ width: 224, height: 130 }}>
        <div className="absolute inset-0 overflow-hidden" style={{
          borderRadius: "112px 112px 0 0",
          background: "linear-gradient(160deg, rgba(180,230,255,0.22) 0%, rgba(100,160,255,0.08) 100%)",
          border: "2px solid rgba(130,200,255,0.35)",
          borderBottom: "none",
        }}>
          {DOME_BALLS.map((b, i) => (
            <motion.div key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              style={{ position:"absolute", left: b.x, top: b.y, width: 16, height: 20, borderRadius: "50%", background: b.color, boxShadow: `0 2px 8px ${b.color}88` }}
            />
          ))}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 60%)", borderRadius:"inherit", pointerEvents:"none" }} />
        </div>
        {/* dome base rim */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:8, background:"linear-gradient(90deg,#cc2255,#ff6b35,#cc2255)", borderRadius:"0 0 4px 4px" }} />
      </div>

      {/* Machine body */}
      <div className="relative" style={{
        width: 224, minHeight: 180,
        background: "linear-gradient(135deg, #ff4567 0%, #cc2255 50%, #e8362e 100%)",
        borderRadius: "0 0 20px 20px",
        boxShadow: "0 12px 40px rgba(255,61,113,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
        padding: "16px 16px 20px",
      }}>
        {/* decorative stripes */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"linear-gradient(90deg,#ffd700,#ff8c00,#ffd700)", opacity:0.9 }} />

        <div className="text-center mb-3">
          <div style={{ fontFamily:"Nunito, sans-serif", fontWeight:900, fontSize:20, color:"#fff", letterSpacing:"0.1em", textShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>TOSHO KANJI</div>
          <div style={{ fontFamily:"Noto Serif JP, serif", fontWeight:700, fontSize:13, color:"#ffd700", letterSpacing:"0.15em" }}>ガチャ　¥100</div>
        </div>

        {/* Display window showing ball count */}
        <div style={{ background:"rgba(0,0,0,0.35)", borderRadius:8, padding:"6px 10px", marginBottom:12, textAlign:"center", border:"1px solid rgba(255,255,255,0.15)" }}>
          <span style={{ fontFamily:"Nunito, sans-serif", fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:700 }}>
            {allUnlocked ? "✓ ALL UNLOCKED" : `${KANJI.length + RADICALS.length} entries to discover`}
          </span>
        </div>

        {/* Stars decoration */}
        <div className="flex justify-center gap-1 mb-3">
          {["★","★","★","★","★"].map((s, i) => (
            <span key={i} style={{ fontSize:14, color:"#ffd700", opacity: spinning ? 1 : 0.7, textShadow: spinning ? "0 0 12px #ffd700" : "none", transition:"all 0.3s" }}>{s}</span>
          ))}
        </div>

        {/* Knob section */}
        <div className="flex items-center justify-between">
          {/* Coin slot */}
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ width:8, height:28, background:"rgba(0,0,0,0.5)", borderRadius:4, border:"1px solid rgba(255,255,255,0.1)" }} />
            <div style={{ width:24, height:5, background:"rgba(0,0,0,0.6)", borderRadius:3, border:"1px solid rgba(255,255,255,0.1)" }} />
          </div>

          {/* Knob */}
          <div className="relative flex items-center justify-center" style={{ width:72, height:72 }}>
            <div style={{ position:"absolute", width:72, height:72, borderRadius:"50%", background:"rgba(0,0,0,0.3)", boxShadow:"0 4px 12px rgba(0,0,0,0.4)" }} />
            <motion.button
              onClick={handleSpin}
              disabled={spinning || !!capsule || allUnlocked}
              animate={{ rotate: knobDeg }}
              transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                width: 58, height: 58, borderRadius: "50%",
                background: "linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)",
                boxShadow: spinning ? "0 0 24px rgba(255,215,0,0.8)" : "0 4px 16px rgba(255,140,0,0.4)",
                cursor: (spinning || !!capsule || allUnlocked) ? "default" : "pointer",
                border: "3px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 3,
                position: "relative", zIndex: 1,
                transition: "box-shadow 0.3s",
              }}
              whileHover={(!spinning && !capsule && !allUnlocked) ? { scale: 1.05 } : {}}
              whileTap={(!spinning && !capsule && !allUnlocked) ? { scale: 0.95 } : {}}
            >
              {[0,60,120].map(deg => (
                <div key={deg} style={{ position:"absolute", width:4, height:18, background:"rgba(180,100,0,0.5)", borderRadius:2, transform:`rotate(${deg}deg)`, top:"50%", left:"50%", marginLeft:-2, marginTop:-9 }} />
              ))}
              <div style={{ width:12, height:12, borderRadius:"50%", background:"rgba(0,0,0,0.3)", border:"2px solid rgba(255,255,255,0.4)", position:"relative", zIndex:2 }} />
            </motion.button>
          </div>

          {/* Label */}
          <div style={{ width:36, textAlign:"center" }}>
            <div style={{ fontFamily:"Nunito, sans-serif", fontSize:9, fontWeight:800, color:"rgba(255,255,255,0.8)", lineHeight:1.2, letterSpacing:"0.05em" }}>
              {spinning ? "..." : (capsule ? "TAP!" : "TURN")}
            </div>
          </div>
        </div>

        {/* Bottom rim */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:6, background:"rgba(0,0,0,0.3)", borderRadius:"0 0 20px 20px" }} />
      </div>

      {/* Capsule chute & tray */}
      <div className="relative flex flex-col items-center" style={{ width:224 }}>
        <div style={{ width:80, height:36, background:"linear-gradient(to bottom, #1a1040, #120c30)", borderRadius:"0 0 16px 16px", border:"2px solid rgba(100,80,160,0.4)", borderTop:"none", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:4, left:"50%", transform:"translateX(-50%)", width:40, height:28, background:"rgba(0,0,0,0.4)", borderRadius:10 }} />
        </div>

        {/* Capsule */}
        <AnimatePresence>
          {capsule && (
            <motion.div
              key="capsule"
              initial={{ y: -80, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              style={{ position:"absolute", top: 4 }}
              onClick={handleCapsuleTap}
            >
              <motion.div
                animate={!capsuleOpen ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ position:"relative", width:60, height:64, cursor:"pointer" }}
              >
                {/* Top half */}
                <motion.div
                  animate={capsuleOpen ? { y: -30, opacity: 0 } : { y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    position:"absolute", top:0, left:0, right:0, height:"52%",
                    borderRadius:"30px 30px 0 0",
                    background: `linear-gradient(135deg, ${capsuleColor}dd, ${capsuleColor}99)`,
                    boxShadow: capsuleOpen ? "none" : `0 0 20px ${capsuleColor}66`,
                  }}
                >
                  <div style={{ position:"absolute", top:6, left:8, width:18, height:10, background:"rgba(255,255,255,0.35)", borderRadius:"50%", transform:"rotate(-20deg)" }} />
                </motion.div>
                {/* Bottom half */}
                <motion.div
                  animate={capsuleOpen ? { y: 30, opacity: 0 } : { y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    position:"absolute", bottom:0, left:0, right:0, height:"52%",
                    borderRadius:"0 0 30px 30px",
                    background: "linear-gradient(135deg, #f0f0f0, #d0d0d0)",
                  }}
                />
                {/* Center seam */}
                <div style={{ position:"absolute", top:"48%", left:0, right:0, height:3, background:"rgba(0,0,0,0.15)", zIndex:2 }} />
                {/* Revealed char */}
                <AnimatePresence>
                  {capsuleOpen && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.25, type:"spring", stiffness:500, damping:15 }}
                      style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}
                    >
                      <span style={{ fontFamily:"Noto Serif JP, serif", fontSize:32, fontWeight:700, color: capsuleColor, filter:"drop-shadow(0 0 12px " + capsuleColor + ")" }}>
                        {capsuleChar}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Glow ring */}
                {!capsuleOpen && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`2px solid ${capsuleColor}`, pointerEvents:"none" }}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint text */}
      <div className="mt-6 text-center" style={{ minHeight:32 }}>
        {allUnlocked ? (
          <p style={{ fontFamily:"Nunito", fontWeight:700, fontSize:13, color:"#ffd700" }}>You have unlocked everything! 🎉</p>
        ) : spinning ? (
          <motion.p animate={{ opacity:[1,0.4,1] }} transition={{ duration:0.6, repeat:Infinity }} style={{ fontFamily:"Nunito", fontWeight:700, fontSize:13 }} className="text-muted-foreground">Spinning...</motion.p>
        ) : capsule ? (
          <p style={{ fontFamily:"Nunito", fontWeight:800, fontSize:13, color:"#ffd700" }}>Tap the capsule to reveal! ✨</p>
        ) : (
          <p style={{ fontFamily:"Nunito", fontWeight:700, fontSize:12 }} className="text-muted-foreground">Turn the knob to get a new kanji or radical</p>
        )}
      </div>
    </div>
  );
}

// ── Collection Card ────────────────────────────────────────────────────────────

function CollectionCard({ char, label, color1, color2, starred, onStar, onClick }: {
  char: string; label: string; color1: string; color2: string;
  starred: boolean; onStar: (e: React.MouseEvent) => void; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-2xl overflow-hidden text-left"
      style={{
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
        boxShadow: `0 4px 16px ${color1}44`,
        aspectRatio: "1",
        padding: 0,
      }}
    >
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:"8px 4px 4px" }}>
        <span style={{ fontFamily:"Noto Serif JP, serif", fontWeight:700, fontSize:36, color:"rgba(255,255,255,0.95)", lineHeight:1, textShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>{char}</span>
        <span style={{ fontFamily:"Nunito, sans-serif", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.8)", marginTop:4, textAlign:"center", lineHeight:1.1, padding:"0 4px" }}>{label}</span>
      </div>
      <button
        onClick={onStar}
        style={{
          position:"absolute", top:6, right:6,
          width:24, height:24, borderRadius:"50%",
          background:"rgba(0,0,0,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center",
          border:"none", cursor:"pointer",
          padding:0,
        }}
      >
        <Star size={12} fill={starred ? "#ffd700" : "none"} color={starred ? "#ffd700" : "rgba(255,255,255,0.8)"} />
      </button>
    </motion.button>
  );
}

// ── Kanji Screen ───────────────────────────────────────────────────────────────

function KanjiScreen({ unlockedKanji, favorites, customNames, onSelect, onToggleFav }: {
  unlockedKanji: Set<string>; favorites: Set<string>;
  customNames: Record<string,string>;
  onSelect: (id:string) => void;
  onToggleFav: (key:string) => void;
}) {
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  const items = KANJI.filter(k => {
    if (!unlockedKanji.has(k.id)) return false;
    const key = `kanji:${k.id}`;
    if (favOnly && !favorites.has(key)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return k.char.includes(query) || k.meanings.some(m=>m.toLowerCase().includes(q))
      || k.onyomi.some(o=>o.includes(query)) || k.kunyomi.some(ku=>ku.includes(query))
      || (customNames[key]||"").toLowerCase().includes(q)
      || k.words.some(w=>w.meaning.toLowerCase().includes(q)||w.romaji.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontFamily:"Nunito,sans-serif", fontWeight:900, fontSize:20 }} className="text-foreground">漢字 Collection</h2>
          <span style={{ fontFamily:"Nunito,sans-serif", fontSize:12, fontWeight:700 }} className="text-muted-foreground">{unlockedKanji.size}/{KANJI.length}</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background:"var(--input-background)" }}>
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search kanji, meaning, reading..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              style={{ fontFamily:"Nunito,sans-serif" }} />
            {query && <button onClick={()=>setQuery("")}><X size={12} className="text-muted-foreground" /></button>}
          </div>
          <button onClick={()=>setFavOnly(f=>!f)}
            className="rounded-xl px-3 py-2 flex items-center gap-1 transition-colors"
            style={{ background: favOnly ? "var(--primary)" : "var(--input-background)" }}>
            <Star size={14} fill={favOnly?"#fff":"none"} color={favOnly?"#fff":"var(--muted-foreground)"} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <span style={{ fontSize:48 }}>{unlockedKanji.size === 0 ? "🎰" : "🔍"}</span>
            <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:14 }} className="text-muted-foreground text-center">
              {unlockedKanji.size === 0 ? "Head to Gacha to unlock your first kanji!" : "No results found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map(k => {
              const key = `kanji:${k.id}`;
              const [c1, c2] = CAT_COLORS[k.category] ?? ["#6b7280","#4b5563"];
              return (
                <CollectionCard key={k.id} char={k.char}
                  label={customNames[key] || k.meanings[0]}
                  color1={c1} color2={c2}
                  starred={favorites.has(key)}
                  onStar={e=>{ e.stopPropagation(); onToggleFav(key); }}
                  onClick={()=>onSelect(k.id)} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Radicals Screen ────────────────────────────────────────────────────────────

function RadicalsScreen({ unlockedRadicals, favorites, customNames, onSelect, onToggleFav }: {
  unlockedRadicals: Set<string>; favorites: Set<string>;
  customNames: Record<string,string>;
  onSelect: (id:string) => void;
  onToggleFav: (key:string) => void;
}) {
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  const items = RADICALS.filter((r,i) => {
    if (!unlockedRadicals.has(r.id)) return false;
    const key = `radical:${r.id}`;
    if (favOnly && !favorites.has(key)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return r.char.includes(query) || r.meanings.some(m=>m.toLowerCase().includes(q))
      || (customNames[key]||"").toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontFamily:"Nunito,sans-serif", fontWeight:900, fontSize:20 }} className="text-foreground">部首 Radicals</h2>
          <span style={{ fontFamily:"Nunito,sans-serif", fontSize:12, fontWeight:700 }} className="text-muted-foreground">{unlockedRadicals.size}/{RADICALS.length}</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background:"var(--input-background)" }}>
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search radicals..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              style={{ fontFamily:"Nunito,sans-serif" }} />
            {query && <button onClick={()=>setQuery("")}><X size={12} className="text-muted-foreground" /></button>}
          </div>
          <button onClick={()=>setFavOnly(f=>!f)}
            className="rounded-xl px-3 py-2 flex items-center gap-1 transition-colors"
            style={{ background: favOnly ? "var(--primary)" : "var(--input-background)" }}>
            <Star size={14} fill={favOnly?"#fff":"none"} color={favOnly?"#fff":"var(--muted-foreground)"} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <span style={{ fontSize:48 }}>{unlockedRadicals.size === 0 ? "🎰" : "🔍"}</span>
            <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:14 }} className="text-muted-foreground text-center">
              {unlockedRadicals.size === 0 ? "Spin the Gacha to discover radicals!" : "No results found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((r,i) => {
              const key = `radical:${r.id}`;
              const c = RAD_COLORS[i % RAD_COLORS.length];
              const c2 = RAD_COLORS[(i + 4) % RAD_COLORS.length];
              return (
                <CollectionCard key={r.id} char={r.char}
                  label={customNames[key] || r.meanings[0]}
                  color1={c} color2={c2}
                  starred={favorites.has(key)}
                  onStar={e=>{ e.stopPropagation(); onToggleFav(key); }}
                  onClick={()=>onSelect(r.id)} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chat Section ───────────────────────────────────────────────────────────────

function ChatSection({ entryKey, msgs, onSend }: {
  entryKey: string; msgs: ChatMsg[]; onSend: (key:string, text:string, reply:string) => void;
}) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, thinking]);

  const send = useCallback((text: string) => {
    if (!text.trim() || thinking) return;
    setInput("");
    setThinking(true);
    setTimeout(() => {
      onSend(entryKey, text, getAIReply(text.toLowerCase()));
      setThinking(false);
    }, 900 + Math.random() * 600);
  }, [thinking, entryKey, onSend]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle size={15} className="text-primary" />
        <span style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:14 }} className="text-foreground">Chat with AI</span>
      </div>

      {/* Messages */}
      {msgs.length > 0 && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {msgs.map(m => (
            <div key={m.id} style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth:"82%", padding:"8px 12px", borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role==="user" ? "var(--primary)" : "var(--secondary)",
                color: m.role==="user" ? "#fff" : "var(--foreground)",
                fontFamily:"Nunito,sans-serif", fontSize:13, fontWeight:500, lineHeight:1.45,
              }}>{m.text}</div>
            </div>
          ))}
          {thinking && (
            <div style={{ display:"flex", justifyContent:"flex-start" }}>
              <div style={{ padding:"8px 14px", borderRadius:"16px 16px 16px 4px", background:"var(--secondary)" }}>
                <motion.span animate={{ opacity:[1,0.3,1] }} transition={{ duration:1, repeat:Infinity }} style={{ fontFamily:"Nunito", fontSize:18, letterSpacing:4 }}>...</motion.span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={()=>send(p)} disabled={thinking}
            style={{
              fontFamily:"Nunito,sans-serif", fontSize:11, fontWeight:700,
              padding:"5px 10px", borderRadius:20,
              background:"var(--secondary)", color:"var(--secondary-foreground)",
              border:"1px solid var(--border)", cursor:"pointer",
              opacity: thinking ? 0.5 : 1, transition:"opacity 0.2s",
            }}>{p}</button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-center">
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && send(input)}
          placeholder="Ask anything about this kanji..."
          disabled={thinking}
          style={{
            flex:1, background:"var(--input-background)", borderRadius:12,
            padding:"8px 12px", fontFamily:"Nunito,sans-serif", fontSize:13,
            border:"1px solid var(--border)", outline:"none", color:"var(--foreground)",
          }} />
        <button onClick={()=>send(input)} disabled={!input.trim()||thinking}
          style={{
            width:36, height:36, borderRadius:10, border:"none", cursor:"pointer",
            background: "var(--primary)", display:"flex", alignItems:"center", justifyContent:"center",
            opacity: (!input.trim()||thinking) ? 0.4 : 1, transition:"opacity 0.2s",
          }}>
          <Send size={15} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ── Kanji Entry Page ────────────────────────────────────────────────────────────

function KanjiEntryPage({ id, unlockedKanji, unlockedRadicals, favorites, customNames, notes, chatMsgs, onBack, onToggleFav, onSetName, onSetNote, onChat, onNavKanji, onNavRadical }: {
  id: string; unlockedKanji: Set<string>; unlockedRadicals: Set<string>;
  favorites: Set<string>; customNames: Record<string,string>; notes: Record<string,string>;
  chatMsgs: Record<string,ChatMsg[]>;
  onBack: () => void; onToggleFav: (k:string)=>void; onSetName:(k:string,v:string)=>void;
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
        <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:14 }}>
          <ChevronLeft size={20} /> Back
        </button>
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
          <span style={{ fontFamily:"Noto Serif JP, serif", fontSize:80, fontWeight:700, color:"rgba(255,255,255,0.95)", lineHeight:1 }}>{k.char}</span>
        </div>

        {/* Name / edit */}
        <div className="flex items-center gap-2">
          {editingName ? (
            <input ref={nameRef} value={nameVal} onChange={e=>setNameVal(e.target.value)}
              onBlur={saveName} onKeyDown={e=>{ if(e.key==="Enter") saveName(); if(e.key==="Escape"){ setEditingName(false); setNameVal(customNames[key]||k.meanings[0]); }}}
              style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:20, textAlign:"center", background:"var(--input-background)", borderRadius:8, border:"2px solid var(--primary)", padding:"2px 8px", color:"var(--foreground)", outline:"none", maxWidth:200 }} />
          ) : (
            <h1 style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:22 }} className="text-foreground">{customNames[key] || k.meanings[0]}</h1>
          )}
          <button onClick={()=>setEditingName(true)} className="text-muted-foreground"><Pencil size={15} /></button>
        </div>
        {customNames[key] && customNames[key] !== k.meanings[0] && (
          <p style={{ fontFamily:"Nunito,sans-serif", fontSize:12 }} className="text-muted-foreground">{k.meanings.join(", ")}</p>
        )}
      </div>

      {/* Content sections */}
      <div className="flex flex-col gap-4 px-4 pb-8">
        {/* Readings */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Readings</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <span style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:11, padding:"2px 8px", borderRadius:20, background:`${cat1}22`, color:cat1 }}>On</span>
              <span style={{ fontFamily:"Noto Serif JP,serif", fontSize:16 }} className="text-foreground">{k.onyomi.join("、")}</span>
            </div>
            <div className="flex items-start gap-3">
              <span style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:11, padding:"2px 8px", borderRadius:20, background:`${cat2}22`, color:cat2 }}>Kun</span>
              <span style={{ fontFamily:"Noto Serif JP,serif", fontSize:16 }} className="text-foreground">{k.kunyomi.join("、")}</span>
            </div>
          </div>
        </div>

        {/* Radicals */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Radicals in this kanji</p>
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
                  <span style={{ fontFamily:"Noto Serif JP,serif", fontSize:20, color: isUnlocked ? c : "var(--muted-foreground)" }}>{rad.char}</span>
                  <span style={{ fontFamily:"Nunito,sans-serif", fontSize:11, fontWeight:700, color: isUnlocked ? c : "var(--muted-foreground)" }}>{rad.meanings[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Words */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Example Words</p>
          <div className="flex flex-col gap-2">
            {k.words.map((w,i) => (
              <div key={i} style={{ padding:"8px 10px", borderRadius:10, background:"var(--muted)" }}>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily:"Noto Serif JP,serif", fontSize:18, fontWeight:700 }} className="text-foreground">{w.japanese}</span>
                  <span style={{ fontFamily:"Noto Serif JP,serif", fontSize:12 }} className="text-muted-foreground">({w.furigana})</span>
                </div>
                <div style={{ fontFamily:"Nunito,sans-serif", fontSize:11, fontStyle:"italic" }} className="text-muted-foreground">{w.romaji}</div>
                <div style={{ fontFamily:"Nunito,sans-serif", fontSize:13, fontWeight:600, marginTop:2 }} className="text-foreground">{w.meaning}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">My Notes</p>
          <textarea value={notes[key]||""} onChange={e=>onSetNote(key,e.target.value)}
            placeholder="Add your personal notes, mnemonics, or reminders..."
            rows={3}
            style={{
              width:"100%", background:"var(--input-background)", borderRadius:10, border:"1px solid var(--border)",
              padding:"8px 10px", fontFamily:"Nunito,sans-serif", fontSize:13, color:"var(--foreground)",
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

function RadicalEntryPage({ id, unlockedKanji, unlockedRadicals, favorites, customNames, notes, chatMsgs, onBack, onToggleFav, onSetName, onSetNote, onChat, onNavKanji, onNavRadical }: {
  id: string; unlockedKanji: Set<string>; unlockedRadicals: Set<string>;
  favorites: Set<string>; customNames: Record<string,string>; notes: Record<string,string>;
  chatMsgs: Record<string,ChatMsg[]>;
  onBack:()=>void; onToggleFav:(k:string)=>void; onSetName:(k:string,v:string)=>void;
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
        <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:14 }}>
          <ChevronLeft size={20} /> Back
        </button>
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
          <span style={{ fontFamily:"Noto Serif JP,serif", fontSize:80, fontWeight:700, color:"rgba(255,255,255,0.95)", lineHeight:1 }}>{r.char}</span>
        </div>
        <div className="flex items-center gap-2">
          {editingName ? (
            <input ref={nameRef} value={nameVal} onChange={e=>setNameVal(e.target.value)}
              onBlur={saveName} onKeyDown={e=>{if(e.key==="Enter")saveName();if(e.key==="Escape"){setEditingName(false);setNameVal(customNames[key]||r.meanings[0]);}}}
              style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:20, textAlign:"center", background:"var(--input-background)", borderRadius:8, border:"2px solid var(--primary)", padding:"2px 8px", color:"var(--foreground)", outline:"none", maxWidth:200 }} />
          ) : (
            <h1 style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:22 }} className="text-foreground">{customNames[key] || r.meanings[0]}</h1>
          )}
          <button onClick={()=>setEditingName(true)} className="text-muted-foreground"><Pencil size={15} /></button>
        </div>
        <p style={{ fontFamily:"Nunito,sans-serif", fontSize:12 }} className="text-muted-foreground">{r.strokes} strokes</p>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8">
        {/* Meanings */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Meanings</p>
          <div className="flex flex-wrap gap-2">
            {r.meanings.map(m=>(
              <span key={m} style={{ padding:"4px 10px", borderRadius:20, background:`${c1}22`, color:c1, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:13 }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Kanji using this radical */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Kanji using this radical</p>
          {r.kanjiIds.length === 0 ? (
            <p style={{ fontFamily:"Nunito,sans-serif", fontSize:13 }} className="text-muted-foreground">No kanji entries yet</p>
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
                    <span style={{ fontFamily:"Noto Serif JP,serif", fontSize:22, color: isUnlocked ? kc1 : "var(--muted-foreground)" }}>{kj.char}</span>
                    <span style={{ fontFamily:"Nunito,sans-serif", fontSize:11, fontWeight:700, color: isUnlocked ? kc1 : "var(--muted-foreground)" }}>{kj.meanings[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">My Notes</p>
          <textarea value={notes[key]||""} onChange={e=>onSetNote(key,e.target.value)}
            placeholder="Notes on this radical..."
            rows={3}
            style={{ width:"100%", background:"var(--input-background)", borderRadius:10, border:"1px solid var(--border)", padding:"8px 10px", fontFamily:"Nunito,sans-serif", fontSize:13, color:"var(--foreground)", outline:"none", resize:"none", lineHeight:1.5 }} />
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

function AchievementsPage({ unlockedKanji, unlockedRadicals, favorites, notes, onBack }: {
  unlockedKanji: Set<string>; unlockedRadicals: Set<string>;
  favorites: Set<string>; notes: Record<string,string>; onBack:()=>void;
}) {
  const unlocked = ACHIEVEMENTS.filter(a=>a.check(unlockedKanji,unlockedRadicals,favorites,notes));
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-3 pb-4 shrink-0">
        <button onClick={onBack} className="text-muted-foreground"><ChevronLeft size={22} /></button>
        <div>
          <h2 style={{ fontFamily:"Nunito,sans-serif", fontWeight:900, fontSize:20 }} className="text-foreground">Achievements</h2>
          <p style={{ fontFamily:"Nunito,sans-serif", fontSize:12 }} className="text-muted-foreground">{unlocked.length}/{ACHIEVEMENTS.length} unlocked</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4 shrink-0">
        <div style={{ height:8, borderRadius:4, background:"var(--muted)", overflow:"hidden" }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${(unlocked.length/ACHIEVEMENTS.length)*100}%` }} transition={{ duration:1, ease:"easeOut" }}
            style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#ff3d71,#ffd700)" }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-3">
          {ACHIEVEMENTS.map(a=>{
            const done = a.check(unlockedKanji,unlockedRadicals,favorites,notes);
            return (
              <motion.div key={a.id}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{
                  display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:16,
                  background: done ? "linear-gradient(135deg, rgba(255,61,113,0.12), rgba(255,215,0,0.08))" : "var(--card)",
                  border:`1px solid ${done ? "rgba(255,61,113,0.25)" : "var(--border)"}`,
                  opacity: done ? 1 : 0.5,
                }}>
                <div style={{
                  width:48, height:48, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26,
                  background: done ? "linear-gradient(135deg,rgba(255,61,113,0.2),rgba(255,215,0,0.2))" : "var(--muted)",
                  border: done ? "1px solid rgba(255,215,0,0.3)" : "1px solid var(--border)",
                  filter: done ? "none" : "grayscale(1)",
                }}>{a.icon}</div>
                <div className="flex-1">
                  <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:14 }} className="text-foreground">{a.name}</p>
                  <p style={{ fontFamily:"Nunito,sans-serif", fontSize:12 }} className="text-muted-foreground">{a.desc}</p>
                </div>
                {done && <Check size={18} color="#ffd700" />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Settings Page ──────────────────────────────────────────────────────────────

function SettingsPage({ darkMode, volume, onDark, onVolume, onResetProgress, onResetAll, onBack }: {
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

function TabBar({ active, onChange }: { active: Tab; onChange:(t:Tab)=>void }) {
  const tabs: { id:Tab; label:string; icon:React.ReactNode; jp:string }[] = [
    { id:"kanji",    label:"Kanji",    jp:"漢字", icon:<BookOpen size={18} /> },
    { id:"gacha",    label:"Gacha",    jp:"ガチャ", icon:<Sparkles size={18} /> },
    { id:"radicals", label:"Radicals", jp:"部首", icon:<Layers size={18} /> },
  ];
  return (
    <div style={{
      display:"flex", height:64,
      background:"var(--card)", borderTop:"1px solid var(--border)",
      paddingBottom:8,
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, cursor:"pointer", border:"none", background:"transparent", transition:"all 0.2s" }}>
            <motion.div animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }} transition={{ type:"spring", stiffness:500, damping:25 }}>
              <div style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)", transition:"color 0.2s" }}>{t.icon}</div>
            </motion.div>
            <span style={{
              fontFamily:"Nunito,sans-serif", fontSize:10, fontWeight: isActive ? 800 : 600,
              color: isActive ? "var(--primary)" : "var(--muted-foreground)",
              transition:"color 0.2s",
            }}>{t.jp}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Unlock Prompt Modal ────────────────────────────────────────────────────────

function UnlockPrompt({ entryType, id, onConfirm, onCancel }: {
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
          <span style={{ fontFamily:"Noto Serif JP,serif", fontSize:64, fontWeight:700, lineHeight:1, color:"var(--primary)" }}>{entry?.char}</span>
          <div className="text-center">
            <p style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:16 }} className="text-foreground">Unlock {entryType === "kanji" ? "Kanji" : "Radical"}?</p>
            <p style={{ fontFamily:"Nunito,sans-serif", fontSize:13 }} className="text-muted-foreground">Add <strong>{entry?.char} ({entry && ("meanings" in entry ? entry.meanings[0] : entry.meanings[0])})</strong> to your collection</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} style={{ flex:1, padding:"12px", borderRadius:14, background:"var(--muted)", border:"none", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:15, color:"var(--muted-foreground)", cursor:"pointer" }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex:1, padding:"12px", borderRadius:14, background:"var(--primary)", border:"none", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:15, color:"#fff", cursor:"pointer" }}>Unlock ✨</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Phone Frame ────────────────────────────────────────────────────────────────

function PhoneFrame({ children, darkMode }: { children:React.ReactNode; darkMode:boolean }) {
  return (
    <div style={{
      minHeight:"100vh", background: darkMode ? "#050411" : "#e8e0f0",
      display:"flex", alignItems:"center", justifyContent:"center", padding:24,
    }}>
      {/* Phone chassis */}
      <div style={{
        width:393, flexShrink:0,
        height:852, borderRadius:55, padding:12, position:"relative",
        background: "linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 100%)",
        boxShadow: "0 0 0 1px #555, 0 40px 100px rgba(0,0,0,0.7), inset 0 0 0 2px #606060",
      }}>
        {/* Power button */}
        <div style={{ position:"absolute", top:140, right:-3, width:4, height:64, borderRadius:"0 3px 3px 0", background:"#333", boxShadow:"inset -1px 0 2px rgba(0,0,0,0.5)" }} />
        {/* Volume buttons */}
        <div style={{ position:"absolute", top:130, left:-3, width:4, height:36, borderRadius:"3px 0 0 3px", background:"#333" }} />
        <div style={{ position:"absolute", top:180, left:-3, width:4, height:36, borderRadius:"3px 0 0 3px", background:"#333" }} />
        <div style={{ position:"absolute", top:92, left:-3, width:4, height:28, borderRadius:"3px 0 0 3px", background:"#333" }} />

        {/* Screen */}
        <div style={{
          width:"100%", height:"100%", borderRadius:44, overflow:"hidden",
          background:"var(--background)", position:"relative", display:"flex", flexDirection:"column",
        }}>
          {/* Dynamic island */}
          <div style={{
            position:"absolute", top:13, left:"50%", transform:"translateX(-50%)",
            width:128, height:38, background:"#000", borderRadius:20, zIndex:50,
            boxShadow:"0 0 0 1px rgba(255,255,255,0.1)",
          }}>
            {/* Tiny camera dot */}
            <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", width:10, height:10, borderRadius:"50%", background:"#1a1a1a", border:"1px solid #333" }} />
          </div>

          {/* Safe area top (below island) */}
          <div style={{ height:60, shrink:0, flexShrink:0 }} />

          {/* App content */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>
            {children}
          </div>

          {/* Home indicator */}
          <div style={{ height:30, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <div style={{ width:120, height:5, borderRadius:3, background:"rgba(128,128,128,0.35)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

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
