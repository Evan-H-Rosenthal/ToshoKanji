import { ChevronLeft, Lock } from "lucide-react";
import { KANJI } from "../data/generated/kanji.generated";
import { COMPONENTS } from "../data/generated/components.generated";
import { RADICALS } from "../data/generated/radicals.generated";
import { CAT_COLORS, RAD_COLORS } from "../data/ui/categoryColors";

export function ComponentEntryPage({ id, unlockedKanji, unlockedRadicals, onBack, onBackToGacha, onNavKanji, onNavRadical }: {
  id: string;
  unlockedKanji: Set<string>;
  unlockedRadicals: Set<string>;
  onBack: () => void;
  onBackToGacha?: () => void;
  onNavKanji: (id: string) => void;
  onNavRadical: (id: string) => void;
}) {
  const component = COMPONENTS.find((entry) => entry.id === id);
  const radical = component?.radicalId ? RADICALS.find((entry) => entry.id === component.radicalId) : undefined;
  const componentIndex = component ? Math.max(0, COMPONENTS.indexOf(component)) : 0;
  const c1 = RAD_COLORS[componentIndex % RAD_COLORS.length];
  const c2 = RAD_COLORS[(componentIndex + 4) % RAD_COLORS.length];

  if (!component) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }}>
            <ChevronLeft size={20} /> Back
          </button>
        </div>
        <div className="px-4 py-6">
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800 }} className="text-foreground">Component not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div className="flex flex-col items-start gap-1">
          <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }}>
            <ChevronLeft size={20} /> Back
          </button>
          {onBackToGacha && (
            <button
              onClick={onBackToGacha}
              style={{
                marginLeft: 20,
                padding: "4px 9px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--muted)",
                color: "var(--muted-foreground)",
                fontFamily: "var(--ui-font)",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Back to gacha
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center pb-4 pt-2 px-4 shrink-0">
        <div style={{
          width:140, height:140, borderRadius:28, display:"flex", alignItems:"center", justifyContent:"center",
          background:`linear-gradient(135deg, ${c1}, ${c2})`,
          boxShadow:`0 12px 40px ${c1}55, 0 0 0 6px ${c1}22`,
          marginBottom:12,
        }}>
          <span style={{ fontFamily:"var(--jp-font)", fontSize:80, fontWeight:700, color:"rgba(255,255,255,0.95)", lineHeight:1 }}>{component.char}</span>
        </div>
        <h1 style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:22 }} className="text-foreground">Component</h1>
        <p style={{ fontFamily:"var(--ui-font)", fontSize:12, textTransform:"capitalize" }} className="text-muted-foreground">{component.kind.replace("-", " ")}</p>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8">
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Meanings</p>
          {component.meanings && component.meanings.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {component.meanings.map((meaning) => (
                <span key={meaning} style={{ padding:"4px 10px", borderRadius:20, background:`${c1}22`, color:c1, fontFamily:"var(--ui-font)", fontWeight:700, fontSize:13 }}>
                  {meaning}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:13 }} className="text-muted-foreground">No learner meaning available yet.</p>
          )}
        </div>

        {radical && (
          <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Linked Radical</p>
            <button
              onClick={() => onNavRadical(radical.id)}
              style={{
                display:"flex",
                alignItems:"center",
                gap:8,
                padding:"7px 12px",
                borderRadius:12,
                background: unlockedRadicals.has(radical.id) ? `${c2}22` : "var(--muted)",
                border:`1px solid ${unlockedRadicals.has(radical.id) ? c2+"44" : "var(--border)"}`,
                cursor:"pointer",
              }}
            >
              {!unlockedRadicals.has(radical.id) && <Lock size={10} className="text-muted-foreground" />}
              <span style={{ fontFamily:"var(--jp-font)", fontSize:24, color: unlockedRadicals.has(radical.id) ? c2 : "var(--muted-foreground)" }}>{radical.char}</span>
              <span style={{ fontFamily:"var(--ui-font)", fontSize:12, fontWeight:800, color: unlockedRadicals.has(radical.id) ? c2 : "var(--muted-foreground)" }}>
                {radical.meanings[0]}
              </span>
            </button>
          </div>
        )}

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Related Kanji</p>
          {component.kanjiIds.length === 0 ? (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:13 }} className="text-muted-foreground">No kanji entries yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {component.kanjiIds.map((kanjiId) => {
                const kanji = KANJI.find((entry) => entry.id === kanjiId);
                if (!kanji) return null;
                const isUnlocked = unlockedKanji.has(kanjiId);
                const [kc1] = CAT_COLORS[kanji.category] ?? ["#6b7280", "#4b5563"];
                return (
                  <button
                    key={kanjiId}
                    onClick={() => onNavKanji(kanjiId)}
                    style={{
                      display:"flex",
                      alignItems:"center",
                      gap:6,
                      padding:"6px 12px",
                      borderRadius:12,
                      background: isUnlocked ? `${kc1}22` : "var(--muted)",
                      border:`1px solid ${isUnlocked ? kc1+"44" : "var(--border)"}`,
                      cursor:"pointer",
                    }}
                  >
                    {!isUnlocked && <Lock size={10} className="text-muted-foreground" />}
                    <span style={{ fontFamily:"var(--jp-font)", fontSize:22, color: isUnlocked ? kc1 : "var(--muted-foreground)" }}>{kanji.char}</span>
                    <span style={{ fontFamily:"var(--ui-font)", fontSize:11, fontWeight:700, color: isUnlocked ? kc1 : "var(--muted-foreground)" }}>{kanji.meanings[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
