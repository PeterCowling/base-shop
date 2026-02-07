// functions/api/octorate/confirm-link.ts
// Input: sku, checkin, checkout, plan (flex|nr); pass through utm_* and children params
// Action: Build confirm URL, preflight quickly; return availability and URLs, with a safe
// fallback to results.xhtml if preflight fails or circuit breaker is open.

import {
  Plan,
  buildConfirmUrl,
  buildResultsUrl,
  breakerOpen,
  detectAvailability,
  quickGet,
  recordFailure,
  recordSuccess,
  isSupportedSku,
} from "./_utils";

type Json = Record<string, unknown>;

function json(data: Json, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    ...init,
  });
}

function bad(message: string, code = 400) {
  return json({ error: message }, { status: code });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const p = url.searchParams;

  const sku = p.get("sku");
  const plan = (p.get("plan") || "flex").toLowerCase() as Plan;
  const checkin = p.get("checkin");
  const checkout = p.get("checkout");
  const children = p.get("children");
  const childrenAges = p.get("childrenAges") || "";

  if (!isSupportedSku(sku)) return bad("Invalid or missing sku");
  if (plan !== "flex" && plan !== "nr") return bad("Invalid plan; must be flex or nr");
  if (!checkin || !checkout) return bad("Missing checkin/checkout");

  const utms = new URLSearchParams();
  for (const [k, v] of p.entries()) {
    if (k.startsWith("utm_")) utms.set(k, v);
  }

  const extras = {
    children: children ? Number(children) || 0 : 0,
    childrenAges,
  } as const;

  const confirmUrl = buildConfirmUrl(sku!, plan, checkin, checkout, utms, extras);
  const resultUrl = buildResultsUrl(checkin, checkout, utms, extras);

  // If breaker is open, skip preflight and return a safe fallback
  if (breakerOpen()) {
    return json({
      status: "unknown",
      confirmUrl,
      resultUrl,
      note: "breaker_open",
    });
  }

  try {
    const { ok, body } = await quickGet(confirmUrl, 2500, 32_768);
    if (!ok) {
      recordFailure();
      return json({ status: "fallback", confirmUrl, resultUrl });
    }
    const state = detectAvailability(body);
    if (state === "available") {
      recordSuccess();
      return json({ status: "available", confirmUrl });
    }
    if (state === "unavailable") {
      recordSuccess();
      return json({ status: "unavailable", confirmUrl, resultUrl });
    }
    // unknown → safe fallback
    recordFailure();
    return json({ status: "fallback", confirmUrl, resultUrl });
  } catch {
    recordFailure();
    return json({ status: "error", confirmUrl, resultUrl });
  }
}
