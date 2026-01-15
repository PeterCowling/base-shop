// apps/telemetry-worker/src/endpoints.ts
// i18n-exempt file -- OPS-000 [ttl=2025-12-31]: machine-facing telemetry worker responses

import type { Env } from "./index";
import { validateEvents } from "./validation";
import { insertEvents, queryEvents } from "./storage";
import { getCorsHeaders, checkOrigin } from "./cors";

export async function handlePost(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  // Check CORS origin
  if (!checkOrigin(request, env)) {
    return new Response("Forbidden", {
      status: 403,
      headers: corsHeaders,
    });
  }

  // Optional: Check auth token
  if (env.TELEMETRY_AUTH_TOKEN) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.TELEMETRY_AUTH_TOKEN}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const events = Array.isArray(body) ? body : [body];

    // Validate size (<1MB) and shape
    const validation = validateEvents(events);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert to D1
    await insertEvents(env.DB, events);

    return new Response(
      JSON.stringify({ success: true, count: events.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // i18n-exempt -- OPS-000 [ttl=2025-12-31]: telemetry worker logs for operators
    console.error("[telemetry-worker] Failed to insert events", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function handleGet(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  if (!checkOrigin(request, env)) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const params = {
      kind: url.searchParams.get("kind") || undefined,
      name: url.searchParams.get("name") || undefined,
      app: url.searchParams.get("app") || undefined,
      level: url.searchParams.get("level") || undefined,
      start: parseInt(url.searchParams.get("start") || "0") || undefined,
      end: parseInt(url.searchParams.get("end") || "0") || undefined,
      limit: Math.min(parseInt(url.searchParams.get("limit") || "100"), 1000),
      cursor: url.searchParams.get("cursor") || undefined,
    };

    const result = await queryEvents(env.DB, params);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // i18n-exempt -- OPS-000 [ttl=2025-12-31]: telemetry worker logs for operators
    console.error("[telemetry-worker] Failed to query events", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export function handleHealth(): Response {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
