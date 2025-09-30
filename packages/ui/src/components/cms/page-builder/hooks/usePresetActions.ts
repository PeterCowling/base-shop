import { useMemo, useCallback } from "react";
import { useTranslations } from "@acme/i18n";
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
  const t = useTranslations();
  const canSavePreset = useMemo(() => {
    if (!Array.isArray(selectedIds) || selectedIds.length !== 1) return false;
    const id = selectedIds[0];
    const c = (components || []).find((x) => x.id === id);
    return !!c && c.type === "Section";
  }, [components, selectedIds]);

  const onSavePreset = useCallback(async () => {
    try {
      if (!Array.isArray(selectedIds) || selectedIds.length !== 1) {
        setToast({ open: true, message: t("cms.builder.presets.save.selectSingleSection") });
        return;
      }
      const id = selectedIds[0];
      const c = (components || []).find((x) => x.id === id);
      if (!c || c.type !== "Section") {
        setToast({ open: true, message: t("cms.builder.presets.save.notASection") });
        return;
      }

      const label = (typeof window !== "undefined"
        ? window.prompt(
            t("cms.builder.presets.save.labelPrompt"),
            (c as { label?: string }).label || t("cms.builder.presets.save.labelDefault")
          )
        : null) || "";
      if (!label.trim()) return;

      const lockedRaw =
        (typeof window !== "undefined"
          ? window.prompt(
              t("cms.builder.presets.save.lockedKeysPrompt"),
              ""
            ) || ""
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
      if (!res.ok) throw new Error(t("cms.builder.presets.save.error"));
      setToast({ open: true, message: t("cms.builder.presets.save.success") });
    } catch (err) {
      
      console.error("save preset failed", err); // i18n-exempt -- INTL-204 dev console log [ttl=2026-12-31]
      setToast({ open: true, message: t("cms.builder.presets.save.error") });
    }
  }, [components, selectedIds, setToast, shop, t]);

  return { canSavePreset, onSavePreset } as const;
}
