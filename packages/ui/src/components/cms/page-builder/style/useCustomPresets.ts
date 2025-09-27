// packages/ui/src/components/cms/page-builder/style/useCustomPresets.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "@acme/i18n";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import {
  addCustomPreset,
  deleteCustomPreset,
  importCustomPresets,
  loadCustomPresets,
  makeId,
  updateCustomPreset,
  duplicateCustomPreset,
  moveCustomPreset,
  type CustomPreset,
} from "./customPresets";

export default function useCustomPresets(effects: NonNullable<StyleOverrides["effects"]> | undefined) {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [selectedCustom, setSelectedCustom] = useState<string>("");
  const t = useTranslations();

  useEffect(() => {
    setCustomPresets(loadCustomPresets());
  }, []);

  const saveCurrentAsPreset = useCallback((label?: string) => {
    if (!effects) return;
    const name = label ?? (typeof window !== 'undefined' ? window.prompt(String(t("Preset name"))) ?? undefined : undefined);
    if (!name) return;
    const id = makeId(name);
    const preset = { id, label: name, value: { effects: { ...effects } } } as CustomPreset;
    const next = addCustomPreset(preset);
    setCustomPresets(next);
    setSelectedCustom(id);
    return id;
  }, [effects, t]);

  const removeSelected = useCallback(() => {
    if (!selectedCustom) return;
    const ok = typeof window !== 'undefined' ? window.confirm(String(t("Delete selected preset?"))) : true;
    if (!ok) return;
    const next = deleteCustomPreset(selectedCustom);
    setCustomPresets(next);
    setSelectedCustom("");
  }, [selectedCustom, t]);

  const renameSelected = useCallback(() => {
    if (!selectedCustom) return;
    const label = typeof window !== 'undefined' ? window.prompt(String(t("New name"))) ?? undefined : undefined;
    if (!label) return;
    const next = updateCustomPreset(selectedCustom, { label });
    setCustomPresets(next);
  }, [selectedCustom, t]);

  const duplicateSelected = useCallback(() => {
    if (!selectedCustom) return;
    const next = duplicateCustomPreset(selectedCustom);
    setCustomPresets(next);
  }, [selectedCustom]);

  const moveSelected = useCallback((dir: 'up' | 'down') => {
    if (!selectedCustom) return;
    const next = moveCustomPreset(selectedCustom, dir);
    setCustomPresets(next);
  }, [selectedCustom]);

  const exportJSON = useCallback(() => {
    try {
      const json = JSON.stringify(customPresets, null, 2);
      return json;
    } catch {
      return "[]";
    }
  }, [customPresets]);

  const importJSON = useCallback((json?: string): boolean => {
    const data = json;
    if (!data) return false;
    const next = importCustomPresets(String(data));
    if (next) {
      setCustomPresets(next);
      return true;
    }
    return false;
  }, []);

  return {
    customPresets,
    selectedCustom,
    setSelectedCustom,
    saveCurrentAsPreset,
    removeSelected,
    renameSelected,
    duplicateSelected,
    moveSelected,
    exportJSON,
    importJSON,
  } as const;
}
