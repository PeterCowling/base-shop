import handler from "../index";
import { catalog } from "../worker-catalog.generated";

describe("inventory authority requests", () => {
  test("includes x-shop-id header and keeps body items-only", async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn(async () => {
      // Return 409 to ensure the checkout handler exits before Stripe calls.
      return new Response(JSON.stringify({ ok: false }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      const variantId = catalog[0]?.id;
      expect(typeof variantId).toBe("string");

      const req = new Request("https://example.com/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://shop.example",
        },
        body: JSON.stringify({ items: [{ variantId, quantity: 1 }] }),
      });

      const res = await handler.fetch(req, {
        STRIPE_SECRET_KEY: "sk_test_dummy",
        STRIPE_WEBHOOK_SECRET: "whsec_dummy",
        PAGES_ORIGIN: "https://shop.example",
        SITE_URL: "https://example.com",
        // KV is not used in this code path; pass a dummy object to satisfy Env shape.
        ORDERS_KV: {} as unknown as KVNamespace,
        INVENTORY_AUTHORITY_URL: "https://inventory.example",
        INVENTORY_AUTHORITY_TOKEN: "token",
      });

      expect(res.status).toBe(409);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] ?? [];
      expect(url).toBe("https://inventory.example/api/inventory/validate");

      const headers = (init as RequestInit | undefined)?.headers as Record<string, string> | undefined;
      expect(headers).toBeDefined();
      expect(headers).toMatchObject({
        "Content-Type": "application/json",
        Authorization: "Bearer token",
        "x-shop-id": "cochlearfit",
      });

      const body = JSON.parse(String((init as RequestInit | undefined)?.body ?? "{}")) as Record<string, unknown>;
      expect(body.items).toBeDefined();
      expect(body.shopId).toBeUndefined();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
