const FLUENT_EMOJI: Record<string, string> = {
  "\u{1F35A}": "/emoji/fluent/rice.png",
  "\u{1F9E9}": "/emoji/fluent/puzzle-piece.png",
  "\u{1F58C}\uFE0F": "/emoji/fluent/paintbrush.png",
  "\u{1F346}": "/emoji/fluent/eggplant.png",
  "\u{1F947}": "/emoji/fluent/first-place-medal.png",
  "\u{1F38B}": "/emoji/fluent/tanabata-tree.png",
  "\u{1F646}": "/emoji/fluent/person-ok.png",
  "\u{1F4CD}": "/emoji/fluent/round-pushpin.png",
  "\u{1F31F}": "/emoji/fluent/glowing-star.png",
  "\u{1F4AB}": "/emoji/fluent/dizzy.png",
  "\u{1F396}\uFE0F": "/emoji/fluent/military-medal.png",
  "\u2754": "/emoji/fluent/question-mark.png",
  "\u{1F331}": "/emoji/fluent/seedling.png",
  "\u{1F313}": "/emoji/fluent/moon.png",
  "\u{1F393}": "/emoji/fluent/graduation-cap.png",
  "\u{1F4AC}": "/emoji/fluent/speech-balloon.png",
  "\u{1F916}": "/emoji/fluent/robot.png",
  "\u{1F9E0}": "/emoji/fluent/brain.png",
};

export function AchievementEmoji({ emoji }: { emoji: string }) {
  const src = FLUENT_EMOJI[emoji];
  if (!src) return <span aria-hidden="true">{emoji}</span>;

  return <img src={src} alt="" aria-hidden="true" width={38} height={38} style={{ objectFit: "contain" }} />;
}
