/* i18n-exempt file -- ABC-123 worker API error strings are not user-facing UI [ttl=2026-06-30] */
export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PAGES_ORIGIN: string;
  SITE_URL: string;
  ORDERS_KV: KVNamespace;
  RECONCILIATION_URL?: string;
  RECONCILIATION_AUTH_HEADER?: string;
  INVENTORY_AUTHORITY_URL?: string;
  INVENTORY_AUTHORITY_TOKEN?: string;
}

type CatalogVariant = {
  id: string;
  stripePriceId: string;
  price: number;
  currency: "USD";
  size: "kids" | "adult";
  color: "sand" | "ocean" | "berry";
  productNameKey: string;
  inStock: boolean;
};

type CatalogColor = {
  key: "sand" | "ocean" | "berry";
};

type CatalogSize = {
  key: "kids" | "adult";
};

type StripeSessionPayload = {
  id?: string;
  payment_intent?: string;
  customer?: string;
  amount_total?: number;
  currency?: string;
  payment_status?: string;
  created?: number;
  metadata?: Record<string, string>;
};

type StripeWebhookEvent = {
  type?: string;
  data?: { object?: StripeSessionPayload };
};

const COLORS: CatalogColor[] = [
  { key: "sand" },
  { key: "ocean" },
  { key: "berry" },
];

const SIZES: CatalogSize[] = [
  { key: "kids" },
  { key: "adult" },
];

const buildVariants = (
  prefix: string,
  productNameKey: string,
  priceBySize: Record<CatalogVariant["size"], number>
): CatalogVariant[] => {
  return SIZES.flatMap((size) =>
    COLORS.map((color) => ({
      id: `${prefix}-${size.key}-${color.key}`,
      stripePriceId: `price_${prefix}_${size.key}_${color.key}`,
      price: priceBySize[size.key],
      currency: "USD",
      size: size.key,
      color: color.key,
      productNameKey,
      inStock: true,
    }))
  );
};

const catalog = [
  ...buildVariants("classic", "product.classic.name", { kids: 3400, adult: 3800 }),
  ...buildVariants("sport", "product.sport.name", { kids: 3600, adult: 4000 }),
];

const catalogById = new Map(catalog.map((variant) => [variant.id, variant]));
const catalogByPriceId = new Map(catalog.map((variant) => [variant.stripePriceId, variant]));

const MIN_QTY = 1;
const MAX_QTY = 10;

const jsonResponse = (body: unknown, init: ResponseInit, origin: string | null, env: Env) => {
  const headers = new Headers(init.headers);
  applyCors(headers, origin, env);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers });
};

const textResponse = (body: string, init: ResponseInit, origin: string | null, env: Env) => {
  const headers = new Headers(init.headers);
  applyCors(headers, origin, env);
  return new Response(body, { ...init, headers });
};

const applyCors = (headers: Headers, origin: string | null, env: Env) => {
  const allowedOrigin = resolveAllowedOrigin(origin, env);
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Stripe-Signature");
  headers.set("Access-Control-Max-Age", "86400");
};

const resolveAllowedOrigin = (origin: string | null, env: Env): string | null => {
  if (!env.PAGES_ORIGIN) return null;
  const allowed = env.PAGES_ORIGIN.split(",").map((entry) => entry.trim());
  if (!origin) return allowed[0] ?? null;
  return allowed.includes(origin) ? origin : allowed[0] ?? null;
};

const normalizeQty = (qty: number): number => {
  if (!Number.isFinite(qty)) return MIN_QTY;
  if (qty < MIN_QTY) return MIN_QTY;
  if (qty > MAX_QTY) return MAX_QTY;
  return Math.floor(qty);
};

const parseItems = (data: unknown): Array<{ variantId: string; quantity: number }> => {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = Array.isArray(record.items) ? record.items : [];
  // Emit analytics-style echo for debugging/telemetry; not persisted.
  // i18n-exempt -- worker-only internal instrumentation [ttl=2026-06-30]
  console.log(
    JSON.stringify({
      event: "cart_items_parsed",
      source: "cochlearfit-worker",
      count: items.length,
    }),
  );
  const list = items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;
      if (typeof entry.variantId !== "string") return null;
      const qty = typeof entry.quantity === "number" ? entry.quantity : Number(entry.quantity);
      return { variantId: entry.variantId, quantity: normalizeQty(qty) };
    })
    .filter((item): item is { variantId: string; quantity: number } => Boolean(item));

  if (list.length > 0) return list;

  if (typeof record.variantId === "string") {
    const qty = typeof record.quantity === "number" ? record.quantity : Number(record.quantity);
    return [{ variantId: record.variantId, quantity: normalizeQty(qty) }];
  }

  return [];
};

const buildInventoryAuthorityItems = (
  items: Array<{ variantId: string; quantity: number }>,
): Array<{ sku: string; quantity: number; variantAttributes: Record<string, string> }> => {
  return items.flatMap((item) => {
    const variant = catalogById.get(item.variantId);
    if (!variant) return [];
    return [
      {
        sku: variant.id,
        quantity: item.quantity,
        variantAttributes: { size: variant.size },
      },
    ];
  });
};

const validateInventoryWithAuthority = async (
  items: Array<{ variantId: string; quantity: number }>,
  env: Env,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
  const base = (env.INVENTORY_AUTHORITY_URL || "").replace(/\/$/, "");
  const token = env.INVENTORY_AUTHORITY_TOKEN;
  if (!base || !token) {
    return { ok: false, status: 503, message: "Inventory backend unavailable" };
  }

  const res = await fetch(`${base}/api/inventory/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items: buildInventoryAuthorityItems(items) }),
  });

  if (res.ok) return { ok: true };
  if (res.status === 409) {
    return { ok: false, status: 409, message: "Insufficient stock" };
  }
  return { ok: false, status: 503, message: "Inventory backend unavailable" };
};

const buildStripeForm = (items: Array<{ variantId: string; quantity: number }>, urls: { success: string; cancel: string }) => {
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", urls.success);
  params.set("cancel_url", urls.cancel);

  items.forEach((item, index) => {
    const variant = catalogById.get(item.variantId);
    if (!variant) return;
    params.set(`line_items[${index}][price]`, variant.stripePriceId);
    params.set(`line_items[${index}][quantity]`, String(item.quantity));
  });

  return params;
};

const createStripeSession = async (
  items: Array<{ variantId: string; quantity: number }>,
  locale: "en" | "it",
  env: Env
) => {
  const baseUrl = (env.SITE_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("Missing SITE_URL");
  }
  const success = `${baseUrl}/${locale}/thank-you?session_id={CHECKOUT_SESSION_ID}`;
  const cancel = `${baseUrl}/${locale}/checkout`;
  const form = buildStripeForm(items, { success, cancel });
  const clientReferenceId =
    typeof crypto.randomUUID === "function"
      ? `cfw-${crypto.randomUUID()}`
      : `cfw-${Date.now().toString(36)}`;

  // Align metadata with platform finance/reconciliation keys where possible.
  form.set("client_reference_id", clientReferenceId);
  form.set("metadata[shop_id]", "cochlearfit-worker");
  form.set("metadata[cart_id]", clientReferenceId);
  form.set("metadata[order_id]", "");
  form.set("metadata[internal_customer_id]", "");
  form.set("metadata[stripe_customer_id]", "");
  form.set("metadata[tax_mode]", "static_rates");
  form.set("metadata[inventory_reservation_id]", "");
  form.set("metadata[environment]", env.SITE_URL?.includes("localhost") ? "dev" : "prod");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Stripe session creation failed");
  }

  return (await response.json()) as { id: string; url: string };
};

const fetchStripeSession = async (sessionId: string, env: Env) => {
  const url = new URL(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`);
  url.searchParams.append("expand[]", "line_items");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Stripe session lookup failed");
  }

  return (await response.json()) as {
    id: string;
    status?: string;
    payment_status?: string;
    amount_total?: number;
    currency?: string;
    line_items?: { data?: Array<{ price?: { id?: string }; quantity?: number }> };
  };
};

const verifyStripeSignature = async (
  payload: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> => {
  if (!signatureHeader) return false;
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.split("=")[1];
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.split("=")[1]);

  if (!timestamp || signatures.length === 0) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signedPayload = `${timestamp}.${payload}`;
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = [...new Uint8Array(signatureBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return signatures.includes(expected);
};

const handleCheckoutSession = async (request: Request, env: Env) => {
  const origin = request.headers.get("Origin");
  const body = await request.json().catch(() => null);
  const items = parseItems(body);

  if (items.length === 0) {
    return jsonResponse({ error: "Missing items" }, { status: 400 }, origin, env);
  }

  const invalid = items.find((item) => !catalogById.has(item.variantId));
  if (invalid) {
    return jsonResponse({ error: "Invalid variant" }, { status: 400 }, origin, env);
  }
  const inventoryStatus = await validateInventoryWithAuthority(items, env);
  if (!inventoryStatus.ok) {
    return jsonResponse(
      { error: inventoryStatus.message },
      { status: inventoryStatus.status },
      origin,
      env,
    );
  }

  const rawLocale = body && typeof (body as Record<string, unknown>).locale === "string"
    ? ((body as Record<string, unknown>).locale as string)
    : "en";
  const locale = rawLocale === "it" ? "it" : "en";

  const session = await createStripeSession(items, locale, env);

  // Emit minimal analytics-style events for shim visibility.
  // i18n-exempt -- worker-only internal instrumentation [ttl=2026-06-30]
  console.log(
    JSON.stringify({
      event: "checkout_session_created",
      source: "cochlearfit-worker",
      session_id: session.id,
      shop_id: "cochlearfit-worker",
      items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
    }),
  );

  return jsonResponse({ id: session.id, url: session.url }, { status: 200 }, origin, env);
};

const handleSessionStatus = async (request: Request, env: Env, sessionId: string) => {
  const origin = request.headers.get("Origin");
  const session = await fetchStripeSession(sessionId, env);
  const lineItems = session.line_items?.data ?? [];

  const items = lineItems
    .map((item) => {
      const priceId = item.price?.id;
      if (!priceId) return null;
      const variant = catalogByPriceId.get(priceId);
      if (!variant) return null;
      return {
        variantId: variant.id,
        name: variant.productNameKey,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity ?? 1,
        unitPrice: variant.price,
        currency: variant.currency,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const responseBody = {
    id: session.id,
    status: session.status ?? "unknown",
    paymentStatus: session.payment_status ?? "unknown",
    total: session.amount_total ?? 0,
    currency: (session.currency ?? "usd").toUpperCase(),
    items,
  };

  return jsonResponse(responseBody, { status: 200 }, origin, env);
};

const handleWebhook = async (request: Request, env: Env) => {
  const origin = request.headers.get("Origin");
  const signature = request.headers.get("Stripe-Signature");
  const payload = await request.text();

  const verified = await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!verified) {
    return textResponse("Invalid signature", { status: 400 }, origin, env);
  }

  const event = JSON.parse(payload) as StripeWebhookEvent;
  if (event.type === "checkout.session.completed") {
    const session: StripeSessionPayload = event.data?.object ?? {};
    console.log(
      JSON.stringify({
        event: "payment_succeeded",
        source: "cochlearfit-worker",
        session_id: session.id ?? "",
        payment_intent: session.payment_intent ?? "",
        stripe_customer_id: session.customer ?? "",
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? "USD",
      }),
    ); // i18n-exempt -- worker-only internal instrumentation [ttl=2026-06-30]
    const orderRecord = {
      id: String(session.id ?? ""),
      amountTotal: Number(session.amount_total ?? 0),
      currency: String(session.currency ?? "USD").toUpperCase(),
      status: String(session.payment_status ?? "paid"),
      created: Number(session.created ?? Date.now() / 1000),
      paymentIntentId: session.payment_intent
        ? String(session.payment_intent)
        : undefined,
      stripeCustomerId: session.customer ? String(session.customer) : undefined,
      cartId:
        typeof session.metadata?.cart_id === "string"
          ? session.metadata.cart_id
          : undefined,
      orderId:
        typeof session.metadata?.order_id === "string"
          ? session.metadata.order_id
          : undefined,
      internalCustomerId:
        typeof session.metadata?.internal_customer_id === "string"
          ? session.metadata.internal_customer_id
          : undefined,
      environment:
        typeof session.metadata?.environment === "string"
          ? session.metadata.environment
          : undefined,
    };
    if (orderRecord.id) {
      await env.ORDERS_KV.put(orderRecord.id, JSON.stringify(orderRecord));
      // Optional: forward to a central reconciliation endpoint if configured.
      if (env.RECONCILIATION_URL) {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (env.RECONCILIATION_AUTH_HEADER) {
          headers["Authorization"] = env.RECONCILIATION_AUTH_HEADER;
        }
        // Best-effort fire-and-forget; do not fail the webhook on analytics loss.
        fetch(env.RECONCILIATION_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...orderRecord,
            source: "cochlearfit-worker",
            event: "order_recorded",
          }),
        }).catch((err) => {
          console.log(
            JSON.stringify({
              event: "reconciliation_forward_failed",
              source: "cochlearfit-worker",
              error: String(err),
            }),
          ); // i18n-exempt -- worker-only internal instrumentation [ttl=2026-06-30]
        });
      }
    }
  }

  return textResponse("ok", { status: 200 }, origin, env);
};

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return textResponse("", { status: 204 }, request.headers.get("Origin"), env);
    }

    // Contract-compatible alias: dash-separated path used by the platform standard.
    const isCheckoutSessionPost =
      request.method === "POST" &&
      (url.pathname === "/api/checkout/session" || url.pathname === "/api/checkout-session");

    if (isCheckoutSessionPost) {
      try {
        return await handleCheckoutSession(request, env);
      } catch {
        return jsonResponse({ error: "Checkout session failed" }, { status: 500 }, request.headers.get("Origin"), env);
      }
    }

    const isCheckoutSessionGet =
      request.method === "GET" &&
      (url.pathname.startsWith("/api/checkout/session/") ||
        url.pathname.startsWith("/api/checkout-session/"));

    if (isCheckoutSessionGet) {
      const sessionId = url.pathname
        .replace("/api/checkout/session/", "")
        .replace("/api/checkout-session/", "");
      if (!sessionId) {
        return jsonResponse({ error: "Missing session id" }, { status: 400 }, request.headers.get("Origin"), env);
      }
      try {
        return await handleSessionStatus(request, env, sessionId);
      } catch {
        return jsonResponse({ error: "Session lookup failed" }, { status: 500 }, request.headers.get("Origin"), env);
      }
    }

    const isStripeWebhookPost =
      request.method === "POST" &&
      (url.pathname === "/api/stripe/webhook" || url.pathname === "/api/stripe-webhook");

    if (isStripeWebhookPost) {
      return await handleWebhook(request, env);
    }

    return jsonResponse({ error: "Not found" }, { status: 404 }, request.headers.get("Origin"), env);
  },
};

export default handler;
