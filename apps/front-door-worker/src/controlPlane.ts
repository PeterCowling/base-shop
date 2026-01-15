import type { Env } from "./index";
import type { HostMapping } from "./hostMapping";

const TOKEN_HEADER = "x-control-plane-token";

function unauthorised(): Response {
  return new Response("unauthorised", { status: 401 }); // i18n-exempt -- FD-0001 [ttl=2026-12-31] internal endpoint
}

function badRequest(message: string): Response {
  return new Response(message, { status: 400 }); // i18n-exempt -- FD-0001 [ttl=2026-12-31] internal endpoint
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requireToken(request: Request, env: Env): Response | null {
  const expected = typeof env.CONTROL_PLANE_TOKEN === "string" ? env.CONTROL_PLANE_TOKEN : "";
  if (!expected) return unauthorised();

  const provided = request.headers.get(TOKEN_HEADER) ?? request.headers.get("authorization");
  if (!provided) return unauthorised();
  if (provided !== expected && provided !== `Bearer ${expected}`) return unauthorised();
  return null;
}

type UpsertBody = Omit<HostMapping, "host"> & { host: string };

function parseUpsertBody(value: unknown): UpsertBody | null {
  if (!value || typeof value !== "object") return null;
  const host = (value as { host?: unknown }).host;
  const shopId = (value as { shopId?: unknown }).shopId;
  const canonicalHost = (value as { canonicalHost?: unknown }).canonicalHost;
  const defaultLocale = (value as { defaultLocale?: unknown }).defaultLocale;
  const mode = (value as { mode?: unknown }).mode;
  const redirectTo = (value as { redirectTo?: unknown }).redirectTo;
  const expiresAt = (value as { expiresAt?: unknown }).expiresAt;

  if (typeof host !== "string" || !host.trim()) return null;
  if (typeof shopId !== "string" || !shopId.trim()) return null;
  if (typeof canonicalHost !== "string" || !canonicalHost.trim()) return null;
  if (typeof defaultLocale !== "string" || !defaultLocale.trim()) return null;
  if (typeof mode !== "string" || !mode.trim()) return null;

  return {
    host: host.trim().toLowerCase(),
    shopId: shopId.trim(),
    canonicalHost: canonicalHost.trim().toLowerCase(),
    defaultLocale: defaultLocale.trim().toLowerCase(),
    mode: mode.trim() as UpsertBody["mode"],
    ...(typeof redirectTo === "string" && redirectTo.trim()
      ? { redirectTo: redirectTo.trim().toLowerCase() }
      : {}),
    ...(typeof expiresAt === "number" && Number.isFinite(expiresAt) ? { expiresAt } : {}),
  };
}

function kvKey(host: string): string {
  return `host:${host.toLowerCase()}`;
}

export async function handleControlPlane(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/__internal/")) return null;
  if (url.pathname !== "/__internal/host-mapping") {
    return new Response("not found", { status: 404 }); // i18n-exempt -- FD-0001 [ttl=2026-12-31] internal endpoint
  }

  const authError = requireToken(request, env);
  if (authError) return authError;

  if (!env.ROUTING_DB) {
    return new Response("ROUTING_DB binding is required", { status: 500 }); // i18n-exempt -- FD-0001 [ttl=2026-12-31] internal endpoint
  }

  if (request.method === "PUT") {
    const body = await request.json().catch(() => null);
    const parsed = parseUpsertBody(body);
    if (!parsed) return badRequest("Invalid host mapping payload"); // i18n-exempt -- FD-0001 [ttl=2026-12-31] internal endpoint

    const now = Date.now();
    await env.ROUTING_DB.prepare(
      "INSERT INTO host_mappings (host, shop_id, canonical_host, default_locale, mode, redirect_to, expires_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) ON CONFLICT(host) DO UPDATE SET shop_id = excluded.shop_id, canonical_host = excluded.canonical_host, default_locale = excluded.default_locale, mode = excluded.mode, redirect_to = excluded.redirect_to, expires_at = excluded.expires_at, updated_at = excluded.updated_at", // i18n-exempt -- FD-0001 [ttl=2026-12-31] SQL statement
    )
      .bind(
        parsed.host,
        parsed.shopId,
        parsed.canonicalHost,
        parsed.defaultLocale,
        parsed.mode,
        parsed.redirectTo ?? null,
        parsed.expiresAt ?? null,
        now,
        now,
      )
      .run();

    if (env.HOST_MAPPING_CACHE) {
      const mapping: HostMapping = parsed;
      const record = { mapping, cachedAtMs: now };
      await env.HOST_MAPPING_CACHE.put(kvKey(parsed.host), JSON.stringify(record), { expirationTtl: 300 });
    }

    return json({ ok: true });
  }

  if (request.method === "DELETE") {
    const host = url.searchParams.get("host")?.trim().toLowerCase();
    if (!host) return badRequest("Missing host"); // i18n-exempt -- FD-0001 [ttl=2026-12-31] internal endpoint

    await env.ROUTING_DB.prepare("DELETE FROM host_mappings WHERE host = ?1") // i18n-exempt -- FD-0001 [ttl=2026-12-31] SQL statement
      .bind(host)
      .run();
    if (env.HOST_MAPPING_CACHE) {
      await env.HOST_MAPPING_CACHE.delete(kvKey(host));
    }
    return json({ ok: true });
  }

  return new Response("method not allowed", { status: 405 }); // i18n-exempt -- FD-0001 [ttl=2026-12-31] internal endpoint
}
