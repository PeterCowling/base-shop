import { useMemo, useCallback } from "react";
import type { PageComponent } from "@acme/types";

type ToastState = { open: boolean; message: string; retry?: () => void };

interface UsePresetActionsOptions {
  shop: string | null | undefined;
  components: PageComponent[];
  selectedIds: string[];
  setToast: (updater: ToastState | ((current: ToastState) => ToastState)) => void;
}

/**
 * Single purpose: provide preset-related actions for the Page Builder
 * (canSavePreset and onSavePreset).
 */
export default function usePresetActions({
  shop,
  components,
  selectedIds,
  setToast,
}: UsePresetActionsOptions) {
  const canSavePreset = useMemo(() => {
    if (!Array.isArray(selectedIds) || selectedIds.length !== 1) return false;
    const id = selectedIds[0];
    const c = (components || []).find((x: any) => (x as any)?.id === id) as any;
    return !!c && c.type === "Section";
  }, [components, selectedIds]);

  const onSavePreset = useCallback(async () => {
    try {
      if (!Array.isArray(selectedIds) || selectedIds.length !== 1) {
        setToast({ open: true, message: "Select a single Section to save as preset" });
        return;
      }
      const id = selectedIds[0];
      const c = (components || []).find((x: any) => (x as any)?.id === id) as any;
      if (!c || c.type !== "Section") {
        setToast({ open: true, message: "Selected item is not a Section" });
        return;
      }

      const label = (typeof window !== "undefined"
        ? window.prompt("Preset label", c.label || "Section Preset")
        : null) || "";
      if (!label.trim()) return;

      const lockedRaw =
        (typeof window !== "undefined"
          ? window.prompt("Locked keys (optional, comma-separated)", "") || ""
          : "");
      const locked = lockedRaw
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const preset = {
        id: `${Date.now()}`,
        label,
        template: c,
        locked: locked.length ? locked : undefined,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "editor",
      };

      const target = shop
        ? `/api/sections/${encodeURIComponent(shop)}/presets`
        : "/api/sections/default/presets";
      const res = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      if (!res.ok) throw new Error("Failed to save preset");
      setToast({ open: true, message: "Preset saved" });
    } catch (err) {
       
      console.error("save preset failed", err);
      setToast({ open: true, message: "Failed to save preset" });
    }
  }, [components, selectedIds, setToast, shop]);

  return { canSavePreset, onSavePreset } as const;
}

