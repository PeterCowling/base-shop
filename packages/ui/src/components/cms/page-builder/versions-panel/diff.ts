import type { PageComponent } from "@acme/types";

export interface ModifiedEntry {
  id: string;
  keys: string[];
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  addedIds: string[];
  removedIds: string[];
  modifiedList: ModifiedEntry[];
  a: Record<string, PageComponent>;
  b: Record<string, PageComponent>;
}

export function computeDiffSummary(current: PageComponent[], selected: PageComponent[] | null): DiffSummary | null {
  if (!selected) return null;
  const flat = (list: PageComponent[]): Record<string, PageComponent> => {
    const out: Record<string, PageComponent> = {};
    const walk = (n: PageComponent) => {
      out[(n as any).id] = n;
      const kids = (n as any).children as PageComponent[] | undefined;
      if (Array.isArray(kids)) kids.forEach(walk);
    };
    list.forEach(walk);
    return out;
  };
  const a = flat(current);
  const b = flat(selected);
  const aIds = new Set(Object.keys(a));
  const bIds = new Set(Object.keys(b));
  const addedIds: string[] = [];
  const removedIds: string[] = [];
  const modifiedList: ModifiedEntry[] = [];
  bIds.forEach((id) => { if (!aIds.has(id)) addedIds.push(id); });
  aIds.forEach((id) => { if (!bIds.has(id)) removedIds.push(id); });
  aIds.forEach((id) => {
    if (!bIds.has(id)) return;
    const aa = a[id] as any;
    const bb = b[id] as any;
    const keys = Array.from(new Set([...Object.keys(aa ?? {}), ...Object.keys(bb ?? {})])).filter((k) => k !== "id");
    const changed = keys.filter((k) => JSON.stringify(aa?.[k]) !== JSON.stringify(bb?.[k]));
    if (changed.length > 0) modifiedList.push({ id, keys: changed });
  });
  return {
    added: addedIds.length,
    removed: removedIds.length,
    modified: modifiedList.length,
    addedIds,
    removedIds,
    modifiedList,
    a,
    b,
  };
}

export function replaceComponentById(list: PageComponent[], targetId: string, replacement: PageComponent | undefined): PageComponent[] {
  const walk = (nodes: PageComponent[]): PageComponent[] =>
    nodes.map((n) => {
      if ((n as any).id === targetId && replacement) {
        return replacement as PageComponent;
      }
      const kids = (n as any).children as PageComponent[] | undefined;
      if (Array.isArray(kids)) {
        const nextKids = walk(kids);
        if (nextKids !== kids) {
          return { ...(n as any), children: nextKids } as PageComponent;
        }
      }
      return n;
    });
  return walk(list);
}

