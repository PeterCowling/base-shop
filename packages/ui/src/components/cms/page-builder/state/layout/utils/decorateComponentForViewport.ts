import { isHiddenForViewport } from "./isHiddenForViewport";
import type { EditorMap, Viewport } from "./types";

export function decorateComponentForViewport<T extends { id: string }>(
  node: T,
  editor: EditorMap,
  viewport?: Viewport,
): T & { name?: string; locked?: boolean; zIndex?: number; hidden?: boolean } {
  const flags = (editor ?? {})[node.id] ?? {};
  const hidden = isHiddenForViewport(
    node.id,
    editor,
    (node as any).hidden as boolean | undefined,
    viewport,
  );
  const merged: any = { ...node };
  if (flags.name !== undefined) merged.name = flags.name;
  if (flags.locked !== undefined) merged.locked = flags.locked;
  if (flags.zIndex !== undefined) merged.zIndex = flags.zIndex as number;
  if (hidden !== undefined) merged.hidden = hidden;
  return merged as T & { name?: string; locked?: boolean; zIndex?: number; hidden?: boolean };
}
