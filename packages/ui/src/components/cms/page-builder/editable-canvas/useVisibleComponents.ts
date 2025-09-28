import type { PageComponent } from "@acme/types";
import { isHiddenForViewport } from "../state/layout/utils";
import type { Props, Viewport } from "./types";

export function useVisibleComponents(
  components: PageComponent[],
  editor: Props["editor"],
  viewport: Viewport
) {
  const visibleComponents = components.filter((c) =>
    !isHiddenForViewport(c.id, editor, (c as Partial<{ hidden?: boolean }>).hidden, viewport)
  );

  const toUnderlyingIndex = (uiIndex: number): number => {
    if (uiIndex < visibleComponents.length) {
      const targetId = visibleComponents[uiIndex]?.id;
      if (targetId) {
        const idx = components.findIndex((c) => c.id === targetId);
        return idx >= 0 ? idx : components.length;
      }
    }
    return components.length;
  };

  return { visibleComponents, toUnderlyingIndex };
}

