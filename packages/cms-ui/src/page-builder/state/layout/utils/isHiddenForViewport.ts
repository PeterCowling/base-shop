import type { EditorMap, Viewport } from "./types";

export function isHiddenForViewport(
  id: string,
  editor: EditorMap,
  fallbackHidden?: boolean,
  viewport?: Viewport,
): boolean {
  const flags = editor?.[id];
  if (!flags) return !!fallbackHidden;
  if (!flags.hidden) return !!fallbackHidden;
  if (!viewport) return flags.hidden.length > 0;
  return flags.hidden.includes(viewport);
}

