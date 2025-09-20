// packages/ui/src/components/cms/page-builder/style/customPresets.ts
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

export type CustomPreset = { id: string; label: string; value: Partial<StyleOverrides> };

const KEY = "page-builder:custom-style-presets";

export function loadCustomPresets(): CustomPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CustomPreset[];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: CustomPreset[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

export function addCustomPreset(preset: CustomPreset): CustomPreset[] {
  const current = loadCustomPresets();
  const next = [preset, ...current.filter((p) => p.id !== preset.id)];
  saveCustomPresets(next);
  return next;
}

export function deleteCustomPreset(id: string): CustomPreset[] {
  const current = loadCustomPresets();
  const next = current.filter((p) => p.id !== id);
  saveCustomPresets(next);
  return next;
}

export function makeId(label: string): string {
  const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const rand = Math.random().toString(36).slice(2, 8);
  return `custom-${slug || 'preset'}-${rand}`;
}

export function updateCustomPreset(id: string, patch: Partial<CustomPreset>): CustomPreset[] {
  const current = loadCustomPresets();
  const next = current.map((p) => (p.id === id ? { ...p, ...patch } : p));
  saveCustomPresets(next);
  return next;
}

export function importCustomPresets(json: string): CustomPreset[] | null {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    const incoming = parsed.filter((p) => p && typeof p.id === 'string' && typeof p.label === 'string' && typeof p.value === 'object') as CustomPreset[];
    const map = new Map<string, CustomPreset>();
    for (const p of loadCustomPresets()) map.set(p.id, p);
    for (const p of incoming) map.set(p.id, p);
    const next = Array.from(map.values());
    saveCustomPresets(next);
    return next;
  } catch {
    return null;
  }
}

export function duplicateCustomPreset(id: string): CustomPreset[] {
  const current = loadCustomPresets();
  const idx = current.findIndex((p) => p.id === id);
  if (idx === -1) return current;
  const src = current[idx];
  const copy: CustomPreset = {
    id: makeId(`${src.label}-copy`),
    label: `${src.label} (copy)`,
    value: { ...src.value },
  };
  const next = [copy, ...current];
  saveCustomPresets(next);
  return next;
}

export function moveCustomPreset(id: string, dir: 'up' | 'down'): CustomPreset[] {
  const current = loadCustomPresets();
  const idx = current.findIndex((p) => p.id === id);
  if (idx === -1) return current;
  const target = dir === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= current.length) return current;
  const next = current.slice();
  const [item] = next.splice(idx, 1);
  next.splice(target, 0, item);
  saveCustomPresets(next);
  return next;
}
