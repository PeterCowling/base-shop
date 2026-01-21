import type { PageComponent } from "@acme/types";

type Viewport = "desktop" | "tablet" | "mobile";
type PosSize = { id: string; left: number | null; top: number | null; width: number | null; height: number | null };

function parsePx(v?: string): number | null {
  if (!v) return null;
  const s = v.trim();
  if (s.endsWith("px")) {
    const n = parseFloat(s.slice(0, -2));
    return Number.isNaN(n) ? null : n;
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function collect(components: PageComponent[], viewport?: Viewport): Record<string, PosSize> {
  const map: Record<string, PosSize> = {};
  const cap = (vp?: Viewport): "Desktop" | "Tablet" | "Mobile" | null =>
    vp === "desktop" ? "Desktop" : vp === "tablet" ? "Tablet" : vp === "mobile" ? "Mobile" : null;
  const vpc = cap(viewport);
  const getStringProp = (node: PageComponent, key: string): string | undefined => {
    const v = (node as unknown as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  };
  const walk = (nodes: PageComponent[]) => {
    for (const n of nodes) {
      // Resolve per-viewport values when provided
      const leftStr = (vpc ? getStringProp(n, `left${vpc}`) : undefined) ?? getStringProp(n, "left");
      const topStr = (vpc ? getStringProp(n, `top${vpc}`) : undefined) ?? getStringProp(n, "top");
      const widthStr = (vpc ? getStringProp(n, `width${vpc}`) : undefined) ?? getStringProp(n, "width");
      const heightStr = (vpc ? getStringProp(n, `height${vpc}`) : undefined) ?? getStringProp(n, "height");
      map[n.id] = {
        id: n.id,
        left: parsePx(leftStr),
        top: parsePx(topStr),
        width: parsePx(widthStr),
        height: parsePx(heightStr),
      };
      const children = (n as unknown as { children?: PageComponent[] }).children;
      if (Array.isArray(children)) walk(children);
    }
  };
  walk(components);
  return map;
}

function bounds(items: PosSize[]) {
  const xs = items.map((i) => i.left ?? 0);
  const ys = items.map((i) => i.top ?? 0);
  const rs = items.map((i) => (i.left ?? 0) + (i.width ?? 0));
  const bs = items.map((i) => (i.top ?? 0) + (i.height ?? 0));
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...rs), maxY: Math.max(...bs) };
}

export function alignLeft(components: PageComponent[], ids: string[], viewport?: Viewport) {
  const map = collect(components, viewport);
  const items = ids.map((id) => map[id]).filter(Boolean);
  const { minX } = bounds(items);
  return items.map((i) => ({ id: i.id, left: `${minX}px` }));
}

export function alignTop(components: PageComponent[], ids: string[], viewport?: Viewport) {
  const map = collect(components, viewport);
  const items = ids.map((id) => map[id]).filter(Boolean);
  const { minY } = bounds(items);
  return items.map((i) => ({ id: i.id, top: `${minY}px` }));
}

export function alignRight(components: PageComponent[], ids: string[], viewport?: Viewport) {
  const map = collect(components, viewport);
  const items = ids.map((id) => map[id]).filter(Boolean);
  const { maxX } = bounds(items);
  return items
    .filter((i) => i.width !== null)
    .map((i) => ({ id: i.id, left: `${maxX - (i.width as number)}px` }));
}

export function alignBottom(components: PageComponent[], ids: string[], viewport?: Viewport) {
  const map = collect(components, viewport);
  const items = ids.map((id) => map[id]).filter(Boolean);
  const { maxY } = bounds(items);
  return items
    .filter((i) => i.height !== null)
    .map((i) => ({ id: i.id, top: `${maxY - (i.height as number)}px` }));
}

export function alignCenterX(components: PageComponent[], ids: string[], viewport?: Viewport) {
  const map = collect(components, viewport);
  const items = ids.map((id) => map[id]).filter(Boolean);
  const { minX, maxX } = bounds(items);
  const cx = (minX + maxX) / 2;
  return items
    .filter((i) => i.width !== null)
    .map((i) => ({ id: i.id, left: `${cx - (i.width as number) / 2}px` }));
}

export function alignCenterY(components: PageComponent[], ids: string[], viewport?: Viewport) {
  const map = collect(components, viewport);
  const items = ids.map((id) => map[id]).filter(Boolean);
  const { minY, maxY } = bounds(items);
  const cy = (minY + maxY) / 2;
  return items
    .filter((i) => i.height !== null)
    .map((i) => ({ id: i.id, top: `${cy - (i.height as number) / 2}px` }));
}

export function distributeHorizontal(components: PageComponent[], ids: string[], viewport?: Viewport) {
  const map = collect(components, viewport);
  const items = ids.map((id) => map[id]).filter((i) => i && i.width !== null && i.left !== null) as (PosSize & { width: number; left: number })[];
  if (items.length < 3) return [] as { id: string; left: string }[];
  const sorted = [...items].sort((a, b) => a.left - b.left);
  const { minX, maxX } = bounds(sorted);
  const totalWidth = sorted.reduce((acc, i) => acc + (i.width as number), 0);
  const gap = (maxX - minX - totalWidth) / (sorted.length - 1);
  let current = minX;
  return sorted.map((i) => {
    const patch = { id: i.id, left: `${current}px` };
    current += (i.width as number) + gap;
    return patch;
  });
}

export function distributeVertical(components: PageComponent[], ids: string[], viewport?: Viewport) {
  const map = collect(components, viewport);
  const items = ids.map((id) => map[id]).filter((i) => i && i.height !== null && i.top !== null) as (PosSize & { height: number; top: number })[];
  if (items.length < 3) return [] as { id: string; top: string }[];
  const sorted = [...items].sort((a, b) => a.top - b.top);
  const { minY, maxY } = bounds(sorted);
  const totalHeight = sorted.reduce((acc, i) => acc + (i.height as number), 0);
  const gap = (maxY - minY - totalHeight) / (sorted.length - 1);
  let current = minY;
  return sorted.map((i) => {
    const patch = { id: i.id, top: `${current}px` };
    current += (i.height as number) + gap;
    return patch;
  });
}
