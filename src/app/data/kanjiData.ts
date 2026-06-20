import type { Achievement, KanjiEntry, RadicalEntry } from "../types";

export const RADICALS: RadicalEntry[] = [
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

export const KANJI: KanjiEntry[] = [
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

export const ACHIEVEMENTS: Achievement[] = [
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

export const CAT_COLORS: Record<string,[string,string]> = {
  nature:    ["#059669","#0d9488"],
  people:    ["#3b82f6","#4f46e5"],
  body:      ["#8b5cf6","#7c3aed"],
  feelings:  ["#ec4899","#be185d"],
  food:      ["#f97316","#ea580c"],
  education: ["#eab308","#d97706"],
  language:  ["#06b6d4","#0891b2"],
  places:    ["#10b981","#059669"],
};
export const RAD_COLORS = ["#6366f1","#8b5cf6","#3b82f6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#14b8a6","#f43f5e","#22c55e","#a855f7","#0ea5e9","#fb923c","#84cc16","#e879f9"];

export const QUICK_PROMPTS = ["What does this mean?","Why these radicals?","How can I remember it?","Why does pronunciation change?"];
export const AI_REPLIES = [
  "This kanji evolved from an ancient pictograph — its meaning runs deep in Japanese culture, a visual metaphor refined over centuries of calligraphic tradition.",
  "The radical composition is intentional: each component contributes semantic meaning. Together they hint at both the pronunciation and the core concept.",
  "Try creating a vivid story where the radicals act out the meaning. Visual mnemonics stick far better than rote repetition.",
  "Japanese kanji often have two reading types: on'yomi (borrowed from Chinese) used in compounds, and kun'yomi (native Japanese) when standalone. Context determines which to use.",
  "This is a fundamental building block — master it and you'll spot it everywhere in compound words and related kanji!",
  "The current form is a simplified evolution of the original pictographic script. Tracing its history makes the visual logic clear.",
];
export function getAIReply(p: string) {
  if (p.includes("mean")) return AI_REPLIES[0];
  if (p.includes("radical")) return AI_REPLIES[1];
  if (p.includes("remember")) return AI_REPLIES[2];
  if (p.includes("pronoun") || p.includes("chang")) return AI_REPLIES[3];
  return AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
}
