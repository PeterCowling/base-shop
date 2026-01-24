export type ComuneInfo = readonly [code: string, province: string];

const UNKNOWN_INFO: ComuneInfo = ["Unknown", "Unknown"];

function normalizeComuneName(value: string): string {
  return value.trim().toLowerCase();
}

// Module-level cache — built once on first call, then reused.
let comuneMapPromise: Promise<Map<string, ComuneInfo>> | null = null;

function loadComuneMap(): Promise<Map<string, ComuneInfo>> {
  if (!comuneMapPromise) {
    comuneMapPromise = import("../data/comuni.json").then((mod) => {
      const entries = (mod.default ?? mod) as Array<{ commune: string; code: string; province: string }>;
      const map = new Map<string, ComuneInfo>();
      for (const entry of entries) {
        const key = normalizeComuneName(entry.commune);
        if (!key || map.has(key)) continue;
        map.set(key, [entry.code, entry.province]);
      }
      return map;
    });
  }
  return comuneMapPromise;
}

export async function getComuneInfo(comuneName: string): Promise<ComuneInfo> {
  const normalized = normalizeComuneName(comuneName);
  if (!normalized) return UNKNOWN_INFO;
  const map = await loadComuneMap();
  return map.get(normalized) ?? UNKNOWN_INFO;
}
