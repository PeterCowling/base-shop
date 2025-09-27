import type { PageComponent } from "@acme/types";
import type { Action } from "../state";
import { useCallback } from "react";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { getStyleClipboard, setStyleClipboard } from "../style/styleClipboard";

interface Args {
  selectedComponent: PageComponent | null;
  selectedIds: string[];
  components: PageComponent[];
  dispatch: (action: Action) => void;
}

const useStyleClipboardActions = ({ selectedComponent, selectedIds, components, dispatch }: Args) => {
  const copyStyles = useCallback(() => {
    if (!selectedComponent) return;
    let overrides: StyleOverrides = {};
    try {
      overrides = selectedComponent.styles ? (JSON.parse(String(selectedComponent.styles)) as StyleOverrides) : {};
    } catch {
      overrides = {};
    }
    setStyleClipboard(overrides);
    // i18n-exempt -- PB-233: Internal builder toast message
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Styles copied" })); } catch {}
  }, [selectedComponent]);

  const pasteStyles = useCallback(() => {
    const clip = getStyleClipboard();
    if (!clip) return;
    const apply = (comp: PageComponent) => {
      let base: StyleOverrides = {};
      try {
        base = comp.styles ? (JSON.parse(String(comp.styles)) as StyleOverrides) : {};
      } catch {
        base = {};
      }
      const merged: StyleOverrides = {
        color: { ...(base.color ?? {}), ...(clip.color ?? {}) },
        typography: { ...(base.typography ?? {}), ...(clip.typography ?? {}) },
        typographyDesktop: { ...(base.typographyDesktop ?? {}), ...(clip.typographyDesktop ?? {}) },
        typographyTablet: { ...(base.typographyTablet ?? {}), ...(clip.typographyTablet ?? {}) },
        typographyMobile: { ...(base.typographyMobile ?? {}), ...(clip.typographyMobile ?? {}) },
      };
      dispatch({ type: "update", id: comp.id, patch: { styles: JSON.stringify(merged) } });
    };
    if (selectedIds.length > 1) {
      selectedIds.forEach((id) => {
        const comp = components.find((c) => c.id === id);
        if (comp) apply(comp);
      });
    } else if (selectedComponent) {
      apply(selectedComponent);
    }
    // i18n-exempt -- PB-233: Internal builder toast message
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Styles pasted" })); } catch {}
  }, [components, dispatch, selectedComponent, selectedIds]);

  return { copyStyles, pasteStyles };
};

export default useStyleClipboardActions;
