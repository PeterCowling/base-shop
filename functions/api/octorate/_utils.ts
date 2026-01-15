// functions/api/octorate/_utils.ts
// Shared helpers for Octorate deep-link building, parsing and fetch preflights.

export type Plan = "flex" | "nr";

// Suffix mapping per spec
const SUFFIX: Record<Plan, string> = { nr: "33849", flex: "33850" };

// Stable room → direct-plan mapping. Source of truth lives primarily in src/data/roomsData.ts
// but we duplicate the minimal rate-plan IDs here for edge-only usage to avoid bundling app code.
// Includes Room 14 seasonal default mapping as per v1.
const ROOM_RATEPLANS: Record<string, { nr: string; flex: string }> = {
  room_3: { nr: "433821", flex: "433892" },
  room_4: { nr: "433882", flex: "433893" },
  room_5: { nr: "433884", flex: "433895" },
  room_6: { nr: "433885", flex: "433896" },
  room_7: { nr: "433883", flex: "433894" }, // Private double (a.k.a. double_room)
  double_room: { nr: "433883", flex: "433894" }, // alias for room_7
  room_8: { nr: "614934", flex: "614933" },
  room_9: { nr: "433886", flex: "433897" },
  room_10: { nr: "433887", flex: "433898" },
  room_11: { nr: "433888", flex: "433899" },
  room_12: { nr: "433889", flex: "433900" },
  room_14: { nr: "804934", flex: "804933" }, // v1 primary mapping only
};

// Preferred order for suggesting alternatives. Private rooms first, then larger dorms.
export const PREFERRED_SKU_ORDER: readonly string[] = [
  "double_room",
  "room_7",
  "room_8",
  "room_10",
  "room_11",
  "room_12",
  "room_3",
  "room_4",
  "room_5",
  "room_6",
  "room_9",
  "room_14",
] as const;

export function skuOrderIndex(sku: string): number {
  const idx = PREFERRED_SKU_ORDER.indexOf(sku);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

export function getSkuFromRatePlanId(id: string): string | undefined {
  const canonical = ROOM_RATEPLANS.double_room;
  if (canonical && (canonical.nr === id || canonical.flex === id)) return "double_room";
  for (const [sku, plans] of Object.entries(ROOM_RATEPLANS)) {
    if (plans.nr === id || plans.flex === id) return sku;
  }
  return undefined;
}

export function isSupportedSku(sku: string | null | undefined): sku is string {
  if (!sku) return false;
  return Object.prototype.hasOwnProperty.call(ROOM_RATEPLANS, sku);
}

const OCTORATE_BASE = "https://book.octorate.com/octobook/site";
const CODICE = "45111"; // fixed per property

export function buildConfirmUrl(
  sku: string,
  plan: Plan,
  checkin: string,
  checkout: string,
  utms: URLSearchParams,
  extras?: Partial<{ children: number; childrenAges: string }>,
): string {
  const planId = ROOM_RATEPLANS[sku]?.[plan];
  if (!planId) throw new Error(`Unknown sku or plan: ${sku} / ${plan}`);
  const params = new URLSearchParams();
  params.set("codice", CODICE);
  params.set("checkin", checkin);
  params.set("checkout", checkout);
  params.set("room", `${planId}_${SUFFIX[plan]}`);
  params.set("pax", "1"); // always 1 per spec
  params.set("children", String(extras?.children ?? 0));
  params.set("childrenAges", extras?.childrenAges ?? "");
  applyUtms(params, utms);
  return `${OCTORATE_BASE}/reservation/confirm.xhtml?${params.toString()}`;
}

export function buildResultsUrl(
  checkin: string,
  checkout: string,
  utms: URLSearchParams,
  extras?: Partial<{ children: number; childrenAges: string }>,
): string {
  const params = new URLSearchParams();
  params.set("codice", CODICE);
  params.set("checkin", checkin);
  params.set("checkout", checkout);
  params.set("pax", "1"); // always 1 per spec
  params.set("children", String(extras?.children ?? 0));
  params.set("childrenAges", extras?.childrenAges ?? "");
  applyUtms(params, utms);
  return `${OCTORATE_BASE}/reservation/result.xhtml?${params.toString()}`;
}

function applyUtms(params: URLSearchParams, incoming: URLSearchParams) {
  const hasIncoming = Array.from(incoming.keys()).some((k) => k.startsWith("utm_"));
  if (hasIncoming) {
    for (const [k, v] of incoming.entries()) {
      if (k.startsWith("utm_")) params.set(k, v);
    }
  } else {
    params.set("utm_source", "site");
    params.set("utm_medium", "cta");
    params.set("utm_campaign", "direct_booking");
  }
}

// Heuristics for availability detection on confirm.xhtml
export const AVAILABILITY_MARKERS = {
  available: [
    // Common words/buttons when the confirm step is valid
    /confirm/i,
    /reservation/i,
    /guest/i,
    /payment/i,
    /book\s*now/i,
  ],
  unavailable: [
    /not\s*available/i,
    /sold\s*out/i,
    /no\s*availability/i,
    /error/i,
  ],
};

export async function quickGet(
  url: string,
  timeoutMs = 2500,
  maxBytes = 32_768,
): Promise<{ ok: boolean; body: string }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    const reader = res.body?.getReader();
    if (!reader) {
      return { ok: res.ok, body: "" };
    }
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
        if (received >= maxBytes) break;
      }
    }
    const body = new TextDecoder().decode(concatUint8(chunks));
    return { ok: res.ok, body };
  } finally {
    clearTimeout(id);
  }
}

function concatUint8(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export function detectAvailability(html: string): "available" | "unavailable" | "unknown" {
  const head = html.slice(0, 20000);
  const hasAvailable = AVAILABILITY_MARKERS.available.some((re) => re.test(head));
  const hasUnavailable = AVAILABILITY_MARKERS.unavailable.some((re) => re.test(head));
  if (hasAvailable && !hasUnavailable) return "available";
  if (hasUnavailable && !hasAvailable) return "unavailable";
  return "unknown";
}

// Small, in-memory circuit breaker; local to the Worker isolate.
const breaker = {
  failures: 0,
  lastReset: Date.now(),
  threshold: 5,
  windowMs: 60_000,
};

export function recordFailure() {
  const now = Date.now();
  if (now - breaker.lastReset > breaker.windowMs) {
    breaker.failures = 0;
    breaker.lastReset = now;
  }
  breaker.failures++;
}

export function recordSuccess() {
  const now = Date.now();
  if (now - breaker.lastReset > breaker.windowMs) {
    breaker.failures = 0;
    breaker.lastReset = now;
  } else if (breaker.failures > 0) {
    breaker.failures--;
  }
}

export function breakerOpen(): boolean {
  const now = Date.now();
  if (now - breaker.lastReset > breaker.windowMs) {
    breaker.failures = 0;
    breaker.lastReset = now;
    return false;
  }
  return breaker.failures >= breaker.threshold;
}

