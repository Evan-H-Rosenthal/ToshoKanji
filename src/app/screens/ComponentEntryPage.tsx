import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Lock, RefreshCw, Star } from "lucide-react";
import { ChatSection } from "../components/ChatSection";
import { KANJI } from "../data/generated/kanji.generated";
import { COMPONENTS } from "../data/generated/components.generated";
import { getLearningCategoryColors } from "../data/ui/categoryColors";
import type { ChatMsg, ComponentEntry } from "../types";

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getComponentGroup(component: ComponentEntry) {
  const primary = component.canonicalComponentId
    ? COMPONENTS.find((entry) => entry.id === component.canonicalComponentId) ?? component
    : component;
  const variants = COMPONENTS.filter((entry) => entry.canonicalComponentId === primary.id);
  const entries = [primary, ...variants];
  const forms = uniqueValues(entries.flatMap((entry) => entry.forms?.length ? entry.forms : [entry.char]));
  const kanjiIds = uniqueValues(entries.flatMap((entry) => entry.kanjiIds));

  return { primary, forms, kanjiIds };
}

export function ComponentEntryPage({ id, unlockedKanji, favorites, notes, chatMsgs, onBack, backLabel, onBackToCollection, onToggleFav, onSetNote, onChat, onNavKanji }: {
  id: string;
  unlockedKanji: Set<string>;
  favorites: Set<string>;
  notes: Record<string, string>;
  chatMsgs: Record<string, ChatMsg[]>;
  onBack: () => void;
  backLabel: string;
  onBackToCollection?: () => void;
  onToggleFav: (key: string) => void;
  onSetNote: (key: string, value: string) => void;
  onChat: (key: string, question: string, answer: string) => void;
  onNavKanji: (id: string) => void;
  onNavComponent: (id: string) => void;
}) {
  const selectedComponent = COMPONENTS.find((entry) => entry.id === id);
  const group = useMemo(() => selectedComponent ? getComponentGroup(selectedComponent) : undefined, [selectedComponent]);
  const initialForm = selectedComponent?.char ?? group?.primary.char ?? "";
  const initialVariantIndex = group ? Math.max(0, group.forms.indexOf(initialForm)) : 0;
  const [variantIndex, setVariantIndex] = useState(initialVariantIndex);

  useEffect(() => {
    setVariantIndex(initialVariantIndex);
  }, [initialVariantIndex, id]);

  if (!selectedComponent || !group) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }}>
            <ChevronLeft size={20} /> {backLabel}
          </button>
        </div>
        <div className="px-4 py-6">
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800 }} className="text-foreground">Component not found.</p>
        </div>
      </div>
    );
  }

  const variantForms = group.forms.length > 0 ? group.forms : [group.primary.char];
  const currentVariant = variantForms[Math.min(variantIndex, variantForms.length - 1)];
  const key = `component:${group.primary.id}`;
  const componentName = group.primary.meanings?.[0] ?? "Component";
  const isCanonicalRadical = group.primary.kind === "canonical-radical";
  const radicalFavoriteKey = isCanonicalRadical && group.primary.radicalId ? `radical:${group.primary.radicalId}` : undefined;

  const cycleVariant = () => {
    if (variantForms.length > 1) {
      setVariantIndex((value) => (value + 1) % variantForms.length);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div className="flex flex-col items-start gap-1">
          <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground" style={{ fontFamily:"var(--ui-font)", fontWeight:700, fontSize:14 }}>
            <ChevronLeft size={20} /> {backLabel}
          </button>
          {onBackToCollection && (
            <button
              onClick={onBackToCollection}
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
              Back to Collection.
            </button>
          )}
        </div>
        {radicalFavoriteKey && (
          <button onClick={() => onToggleFav(radicalFavoriteKey)}>
            <Star size={22} fill={favorites.has(radicalFavoriteKey) ? "#ffd700" : "none"} color={favorites.has(radicalFavoriteKey) ? "#ffd700" : "var(--muted-foreground)"} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center pb-4 pt-2 px-4 shrink-0">
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f3f4f6, #d1d5db)",
            border: "1px solid rgba(107,114,128,0.28)",
            boxShadow: "0 12px 34px rgba(107,114,128,0.24), 0 0 0 6px rgba(107,114,128,0.10)",
            marginBottom: 10,
          }}
        >
          <span style={{ fontFamily:"var(--jp-font)", fontSize:80, fontWeight:700, color:"#374151", lineHeight:1, userSelect:"text" }}>{currentVariant}</span>
        </div>
        {variantForms.length > 1 && (
          <button
            type="button"
            onClick={cycleVariant}
            aria-label="Cycle component variant"
            className="text-muted-foreground"
            style={{
              width: 34,
              height: 30,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "var(--card)",
              marginBottom: 9,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
          </button>
        )}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h1 style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:22 }} className="text-foreground">{componentName}</h1>
            {isCanonicalRadical && (
              <span style={{ padding:"3px 8px", borderRadius:999, background:"var(--muted)", border:"1px solid var(--border)", fontFamily:"var(--ui-font)", fontSize:10, fontWeight:900, color:"var(--muted-foreground)", textTransform:"uppercase" }}>
                {group.primary.radicalNumber ? `Radical ${group.primary.radicalNumber}` : "Canonical radical"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8">
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">Meanings</p>
          {group.primary.meanings && group.primary.meanings.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {group.primary.meanings.map((meaning) => (
                <span key={meaning} style={{ padding:"4px 10px", borderRadius:20, background:"var(--muted)", border:"1px solid var(--border)", color:"var(--foreground)", fontFamily:"var(--ui-font)", fontWeight:700, fontSize:13 }}>
                  {meaning}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:13 }} className="text-muted-foreground">No learner meaning available yet.</p>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Variants</p>
          <div className="flex flex-wrap gap-2">
            {variantForms.map((form, index) => {
              const isPrimary = form === group.primary.char;
              const isSelected = form === currentVariant;
              return (
                <button
                  key={`${form}-${index}`}
                  type="button"
                  onClick={() => setVariantIndex(index)}
                  style={{
                    display:"flex",
                    alignItems:"center",
                    gap:7,
                    padding:"6px 11px",
                    borderRadius:12,
                    background: isSelected ? "rgba(107,114,128,0.18)" : "var(--muted)",
                    border: isPrimary ? "2px solid #6b7280" : "1px solid var(--border)",
                    cursor:"pointer",
                  }}
                >
                  <span style={{ fontFamily:"var(--jp-font)", fontSize:23, color:"#374151" }}>{form}</span>
                  <span style={{ fontFamily:"var(--ui-font)", fontSize:10, fontWeight:900, color:"var(--muted-foreground)", textTransform:"uppercase" }}>
                    {isPrimary ? "Primary" : "Variant"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-3">Kanji Using This Component</p>
          {group.kanjiIds.length === 0 ? (
            <p style={{ fontFamily:"var(--ui-font)", fontSize:13 }} className="text-muted-foreground">No kanji entries yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {group.kanjiIds.map((kanjiId) => {
                const kanji = KANJI.find((entry) => entry.id === kanjiId);
                if (!kanji) return null;
                const isUnlocked = unlockedKanji.has(kanjiId);
                const [kc1] = getLearningCategoryColors(kanji.learningCategory);
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

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }} className="text-muted-foreground mb-2">My Notes</p>
          <textarea
            value={notes[key] || ""}
            onChange={(event) => onSetNote(key, event.target.value)}
            placeholder="Add your personal notes, mnemonics, or reminders..."
            rows={3}
            style={{
              width:"100%",
              background:"var(--input-background)",
              borderRadius:10,
              border:"1px solid var(--border)",
              padding:"8px 10px",
              fontFamily:"var(--ui-font)",
              fontSize:13,
              color:"var(--foreground)",
              outline:"none",
              resize:"none",
              lineHeight:1.5,
            }}
          />
        </div>

        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <ChatSection entryKey={key} msgs={chatMsgs[key] || []} onSend={onChat} contextLabel="component" />
        </div>
      </div>
    </div>
  );
}
