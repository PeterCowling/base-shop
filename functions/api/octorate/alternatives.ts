// functions/api/octorate/alternatives.ts
// Input: checkin, checkout, optional excludeSku, optional plan (flex|nr)
// Output: up to 4 alternatives with confirm deep-links for requested plan (or both if plan omitted)
// plus a generic results.xhtml URL for the same dates. Short-ttl cached. Circuit-breaker aware.

import {
  Plan,
  buildConfirmUrl,
  buildResultsUrl,
  breakerOpen,
  getSkuFromRatePlanId,
  quickGet,
  recordFailure,
  recordSuccess,
  skuOrderIndex,
} from "./_utils";

export type Alt = { sku: string; plan: Plan; confirmUrl: string };

export function extractRatePlanIdsFromHtml(html: string): string[] {
  const ratePlanMatches = new Set<string>();
  const hrefRe = /href\s*=\s*"([^"]+reservation\/confirm\.xhtml[^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html))) {
    try {
      const link = new URL(m[1], "https://book.octorate.com");
      const roomParam = link.searchParams.get("room");
      if (!roomParam) continue;
      const rp = roomParam.split("_")[0];
      if (/^\d+$/.test(rp)) ratePlanMatches.add(rp);
    } catch {
      // ignore parse errors for malformed anchors
    }
  }
  return Array.from(ratePlanMatches);
}

export function rankAndLimitAlternatives(found: Alt[], max = 4): Alt[] {
  const seen = new Set<string>();
  const dedup: Alt[] = [];
  for (const a of found) {
    const key = `${a.sku}:${a.plan}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(a);
  }

  dedup.sort((a, b) => {
    const ai = skuOrderIndex(a.sku);
    const bi = skuOrderIndex(b.sku);
    if (ai !== bi) return ai - bi;
    if (a.plan === b.plan) return 0;
    return a.plan === "flex" ? -1 : 1;
  });

  return dedup.slice(0, max);
}

function json(data: Record<string, unknown>, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
    ...init,
  });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const p = url.searchParams;

  const checkin = p.get("checkin");
  const checkout = p.get("checkout");
  if (!checkin || !checkout) return json({ error: "Missing checkin/checkout" }, { status: 400 });

  const exclude = p.get("excludeSku") || undefined;
  const plan = (p.get("plan") || "") as Plan | "";
  const children = p.get("children");
  const childrenAges = p.get("childrenAges") || "";

  const utms = new URLSearchParams();
  for (const [k, v] of p.entries()) {
    if (k.startsWith("utm_")) utms.set(k, v);
  }

  const extras = {
    children: children ? Number(children) || 0 : 0,
    childrenAges,
  } as const;

  const resultUrl = buildResultsUrl(checkin, checkout, utms, extras);

  const cacheKey = new Request(
    `${url.origin}/__cf_cache/octorate_alts?checkin=${checkin}&checkout=${checkout}&children=${extras.children}&ages=${encodeURIComponent(
      extras.childrenAges,
    )}&plan=${plan}&exclude=${exclude ?? ""}`,
    { method: "GET" },
  );

  // Try cache first
  // Cloudflare Workers expose `caches.default`; cast for local TS env typing
  const cfDefaultCache = (caches as unknown as CacheStorage & { default: Cache }).default;
  const cached = await cfDefaultCache.match(cacheKey);
  if (cached) {
    // ensure resultUrl (which may differ only by UTM) is present alongside the cached list
    const data = await cached.json();
    return json({ ...data, resultUrl }, { headers: { "Cache-Control": "public, max-age=60" } });
  }

  if (breakerOpen()) {
    // if breaker is open, don't parse remote HTML; return only the generic results URL
    return json({ alternatives: [], resultUrl, note: "breaker_open" }, { status: 200 });
  }

  // Fetch the results page and extract confirm links
  try {
    const resultsPage = resultUrl; // already built with pax=1 and UTMs
    const { ok, body } = await quickGet(resultsPage, 3000, 64_000);
    if (!ok) {
      recordFailure();
      return json({ alternatives: [], resultUrl, note: "fetch_failed" }, { status: 200 });
    }

    const ratePlanIds = extractRatePlanIdsFromHtml(body);

    // Map rate plan IDs back to SKUs and build alternatives
    const found: Alt[] = [];
    for (const ratePlanId of ratePlanIds) {
      const sku = getSkuFromRatePlanId(ratePlanId);
      if (!sku) continue;
      if (exclude && sku === exclude) continue;
      if (plan === "flex" || plan === "nr") {
        found.push({ sku, plan, confirmUrl: buildConfirmUrl(sku, plan, checkin, checkout, utms, extras) });
      } else {
        // If caller didn't express a plan preference, include both with flex first
        found.push({ sku, plan: "flex", confirmUrl: buildConfirmUrl(sku, "flex", checkin, checkout, utms, extras) });
        found.push({ sku, plan: "nr", confirmUrl: buildConfirmUrl(sku, "nr", checkin, checkout, utms, extras) });
      }
    }

    const top = rankAndLimitAlternatives(found, 4);

    recordSuccess();
    const response = json(
      { alternatives: top, resultUrl },
      {
        headers: {
          "Cache-Control": "public, max-age=180, s-maxage=180, stale-while-revalidate=60",
        },
      },
    );
    // Cache for a short TTL to avoid repeated parsing
    eventWaitUntilSafe(cfDefaultCache.put(cacheKey, response.clone()));
    return response;
  } catch {
    recordFailure();
    return json({ alternatives: [], resultUrl, note: "error" }, { status: 200 });
  }
}

function eventWaitUntilSafe(p: Promise<unknown>) {
  // Cloudflare Pages Functions expose waitUntil via global context in some runtimes;
  // here we just best-effort fire and forget.
  p.catch(() => void 0);
}

