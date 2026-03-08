import type { XaCategory } from "./types.js";

export const xaImageRoles = [
  "front",
  "side",
  "top",
  "back",
  "detail",
  "interior",
  "scale",
] as const;

export type XaImageRole = (typeof xaImageRoles)[number];

const roleSortRank: Record<XaImageRole, number> = {
  front: 0,
  back: 1,
  top: 2,
  side: 3,
  detail: 4,
  interior: 5,
  scale: 6,
};

const xaImageRoleSet = new Set<string>(xaImageRoles);

export function normalizeXaImageRole(raw: string | null | undefined): XaImageRole | undefined {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (!normalized || !xaImageRoleSet.has(normalized)) return undefined;
  return normalized as XaImageRole;
}

export function requiredImageRolesByCategory(category: XaCategory): XaImageRole[] {
  if (category === "clothing") return ["front", "side"];
  if (category === "bags") return ["front", "side", "top"];
  return ["front", "side", "detail"];
}

export function roleFallbackSequenceByCategory(category: XaCategory): XaImageRole[] {
  const required = requiredImageRolesByCategory(category);
  const requiredSet = new Set(required);
  const optional = xaImageRoles.filter((role) => !requiredSet.has(role));
  return [...required, ...optional];
}

export function inferXaImageRoleFromText(raw: string | null | undefined): XaImageRole | undefined {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text) return undefined;
  const tokens = text.split(/[^a-z]+/g).filter(Boolean);
  for (const token of tokens) {
    if (xaImageRoleSet.has(token)) return token as XaImageRole;
  }
  return undefined;
}

export function sortXaMediaByRole<T extends { role?: string | null }>(media: readonly T[]): T[] {
  return media
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftRole = normalizeXaImageRole(left.item.role);
      const rightRole = normalizeXaImageRole(right.item.role);
      const leftRank = leftRole ? roleSortRank[leftRole] : Number.MAX_SAFE_INTEGER;
      const rightRank = rightRole ? roleSortRank[rightRole] : Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.index - right.index;
    })
    .map(({ item }) => item);
}
