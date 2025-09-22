import type { PageComponent } from "@acme/types";
import { decorateComponentForViewport } from "./decorateComponentForViewport";
import type { EditorMap, Viewport } from "./types";

export function decorateTreeForViewport(
  list: PageComponent[],
  editor: EditorMap,
  viewport?: Viewport,
): PageComponent[] {
  return list.map((n) => {
    const merged = decorateComponentForViewport(n, editor, viewport) as PageComponent & {
      children?: PageComponent[];
    };
    const children = merged.children;
    if (Array.isArray(children)) {
      merged.children = decorateTreeForViewport(children, editor, viewport);
    }
    return merged as PageComponent;
  });
}

