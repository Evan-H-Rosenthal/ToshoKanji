import type { ComponentEntry, KanjiEntry } from "../types";
import { COMPONENT_BY_ID } from "./entryIndexes";

export function getKanjiDisplayName(
  kanji: Pick<KanjiEntry, "id" | "meanings">,
  customNames: Record<string, string>,
) {
  return customNames[`kanji:${kanji.id}`] || kanji.meanings[0];
}

export function getComponentMeanings(component: ComponentEntry | undefined) {
  if (!component) return [];
  const canonicalComponent = component.canonicalComponentId
    ? COMPONENT_BY_ID.get(component.canonicalComponentId) ?? component
    : component;
  return canonicalComponent.characterMeanings?.length
    ? canonicalComponent.characterMeanings
    : component.characterMeanings ?? [];
}

export function getComponentDisplayName(
  component: ComponentEntry | undefined,
  radicalId: string | undefined,
  fallback: string,
  customNames: Record<string, string>,
) {
  const canonicalComponent = component?.canonicalComponentId
    ? COMPONENT_BY_ID.get(component.canonicalComponentId) ?? component
    : component;

  return (
    (canonicalComponent && customNames[`component:${canonicalComponent.id}`])
    || (radicalId && customNames[`radical:${radicalId}`])
    || getComponentMeanings(component)[0]
    || fallback
  );
}
