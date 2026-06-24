export const AI_REPLIES = [
  "This kanji evolved from older written forms, and its readings depend heavily on whether it appears alone, in compounds, or with okurigana.",
  "The radical is the dictionary indexing component. Components and visual parts can differ from the official radical, which is why a kanji may feel like it contains more pieces than this section shows.",
  "Try linking the meaning, the main reading, and the visible radical into one small story. Short vivid mnemonics are easier to recall than long explanations.",
  "Japanese kanji usually have on'yomi readings from Chinese-derived vocabulary and kun'yomi readings from native Japanese words. Compound words often use on'yomi, but there are many exceptions.",
  "This entry is generated from dictionary data. Treat it as a reliable base layer, then add your own notes and examples as you learn.",
];

export function getAIReply(prompt: string) {
  if (prompt.includes("mean")) return AI_REPLIES[0];
  if (prompt.includes("radical")) return AI_REPLIES[1];
  if (prompt.includes("remember")) return AI_REPLIES[2];
  if (prompt.includes("pronoun") || prompt.includes("chang")) return AI_REPLIES[3];
  return AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
}
