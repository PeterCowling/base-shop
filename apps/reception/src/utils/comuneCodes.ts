import comuniData from "../data/comuni.json";

type ComuneEntry = (typeof comuniData)[number];

export type ComuneInfo = readonly [code: string, province: string];

const UNKNOWN_INFO: ComuneInfo = ["Unknown", "Unknown"];

function normalizeComuneName(value: string): string {
  return value.trim().toLowerCase();
}

function buildComuneInfoMap(entries: readonly ComuneEntry[]): Map<string, ComuneInfo> {
  const map = new Map<string, ComuneInfo>();

  for (const entry of entries) {
    const key = normalizeComuneName(entry.commune);
    if (!key) continue;
    if (map.has(key)) continue;
    map.set(key, [entry.code, entry.province]);
  }

  return map;
}

const COMUNE_INFO_BY_NAME = buildComuneInfoMap(comuniData);

export function getComuneInfo(comuneName: string): ComuneInfo {
  const normalized = normalizeComuneName(comuneName);
  if (!normalized) return UNKNOWN_INFO;
  return COMUNE_INFO_BY_NAME.get(normalized) ?? UNKNOWN_INFO;
}
