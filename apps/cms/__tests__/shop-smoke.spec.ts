import { getShopBaseUrl } from "@platform-core/shops/url";
import type { Environment } from "@acme/types";

/**
 * Thread D shop smoke tests (initial slice).
 *
 * These tests are intentionally conservative and non-destructive: they use
 * publicly reachable routes and avoid any irreversible side effects. They are
 * exercised via the root `pnpm test:shop-smoke` command.
 */

const shopId = process.env.SHOP_ID ?? "";
const shopEnv = (process.env.SHOP_ENV ?? "dev") as Environment;

if (!shopId) {
  console.warn("SHOP_ID is not set; shop smoke tests will be skipped.");
}

const baseUrl = shopId ? getShopBaseUrl({ shopId, env: shopEnv }) : null;

const describeOrSkip = baseUrl ? describe : describe.skip;

describeOrSkip("shop smoke", () => {
  const origin = baseUrl!.origin.replace(/\/+$/, "");

  it("serves home page", async () => {
    const res = await fetch(`${origin}/`, { method: "GET" });
    expect(res.status).toBeLessThan(500);
  });

  it("serves at least one product or listing page", async () => {
    const candidates = ["/products", "/shop", "/collections", "/en/shop"];
    const responses = await Promise.all(
      candidates.map((p) =>
        fetch(`${origin}${p}`, {
          method: "GET",
        }).catch(() => null),
      ),
    );

    const ok = responses.some((res) => res && res.status < 500);
    expect(ok).toBe(true);
  });

  it("serves a product detail page for the smoke fixture", async () => {
    const res = await fetch(`${origin}/en/product/smoke-product`, {
      method: "GET",
    }).catch(() => null);
    expect(res).not.toBeNull();
    if (res) {
      expect(res.status).toBeLessThan(500);
    }
  });

  it("exposes cart API without server errors", async () => {
    const res = await fetch(`${origin}/api/cart`, { method: "GET" }).catch(
      () => null,
    );
    expect(res).not.toBeNull();
    if (res) {
      expect(res.status).toBeLessThan(500);
    }
  });

  it("supports basic cart add/update/remove for a sample SKU", async () => {
    // Add a known sample product from the shared catalogue.
    let cookieHeader = "";
    let lineId = "";

    const addRes = await fetch(`${origin}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku: { id: "green-sneaker" },
        qty: 1,
      }),
    }).catch(() => null);
    expect(addRes).not.toBeNull();
    if (!addRes) return;
    expect(addRes.status).toBeLessThan(500);
    const setCookie = addRes.headers.get("set-cookie");
    if (setCookie) {
      cookieHeader = setCookie.split(";")[0] ?? "";
    }
    const addBody = (await addRes.json().catch(() => ({}))) as {
      ok?: boolean;
      cart?: Record<string, unknown>;
    };
    expect(addBody.ok).toBe(true);
    expect(addBody.cart && typeof addBody.cart === "object").toBe(true);
    const keys = Object.keys(addBody.cart ?? {});
    expect(keys.length).toBeGreaterThan(0);
    lineId = keys[0]!;

    // Update quantity for the same line.
    const patchRes = await fetch(`${origin}/api/cart`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ id: lineId, qty: 2 }),
    }).catch(() => null);
    expect(patchRes).not.toBeNull();
    if (!patchRes) return;
    expect(patchRes.status).toBeLessThan(500);
    const patchBody = (await patchRes.json().catch(() => ({}))) as {
      ok?: boolean;
      cart?: Record<string, { qty?: number }>;
    };
    expect(patchBody.ok).toBe(true);
    const patchedLine = patchBody.cart?.[lineId];
    if (patchedLine && typeof patchedLine.qty === "number") {
      expect(patchedLine.qty).toBe(2);
    }

    // Remove the line.
    const deleteRes = await fetch(`${origin}/api/cart`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ id: lineId }),
    }).catch(() => null);
    expect(deleteRes).not.toBeNull();
    if (!deleteRes) return;
    expect(deleteRes.status).toBeLessThan(500);
    const deleteBody = (await deleteRes.json().catch(() => ({}))) as {
      ok?: boolean;
      cart?: Record<string, unknown>;
    };
    expect(deleteBody.ok).toBe(true);
  });

  it("can create a checkout session for a non-empty cart", async () => {
    // Seed a minimal cart as precondition.
    let cookieHeader = "";
    const addRes = await fetch(`${origin}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku: { id: "green-sneaker" },
        qty: 1,
      }),
    }).catch(() => null);
    expect(addRes).not.toBeNull();
    if (!addRes) return;
    expect(addRes.status).toBeLessThan(500);
    const setCookie = addRes.headers.get("set-cookie");
    if (setCookie) {
      cookieHeader = setCookie.split(";")[0] ?? "";
    }

    const checkoutRes = await fetch(`${origin}/api/checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({
        currency: "EUR",
        taxRegion: "",
      }),
    }).catch(() => null);
    expect(checkoutRes).not.toBeNull();
    if (!checkoutRes) return;
    expect(checkoutRes.status).toBeLessThan(500);
    const body = (await checkoutRes.json().catch(() => ({}))) as {
      sessionId?: string;
    };
    if (checkoutRes.status < 400) {
      expect(typeof body.sessionId).toBe("string");
      expect((body.sessionId ?? "").length).toBeGreaterThan(0);
    }
  });

  it("exposes preview route for the smoke page without server errors", async () => {
    const res = await fetch(`${origin}/preview/smoke-page`, {
      method: "GET",
    }).catch(() => null);
    expect(res).not.toBeNull();
    if (res) {
      expect(res.status).toBeLessThan(500);
    }
  });
});
