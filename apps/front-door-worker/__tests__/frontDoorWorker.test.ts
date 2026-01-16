import handler from "../src/index";

function makeCtx(): ExecutionContext {
  return {
    waitUntil: (_promise: Promise<unknown>) => {
      // noop for unit tests
    },
    passThroughOnException: () => {
      // noop for unit tests
    },
  } as ExecutionContext;
}

describe("front-door-worker", () => {
  beforeEach(() => {
    // @ts-expect-error - jest mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns 404 for unknown hosts", async () => {
    const res = await handler.fetch(
      new Request("https://unknown.example/en"),
      { HOST_MAPPING_JSON: "{}", GATEWAY_ORIGIN: "https://gateway.example" },
      makeCtx(),
    );
    expect(res.status).toBe(404);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("redirects alias hosts to canonical host", async () => {
    const res = await handler.fetch(
      new Request("https://alias.example/en/products?x=1"),
      {
        HOST_MAPPING_JSON: JSON.stringify({
          "alias.example": {
            shopId: "shop_1",
            canonicalHost: "shop.example",
            defaultLocale: "en",
            mode: "active",
          },
        }),
      },
      makeCtx(),
    );
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://shop.example/en/products?x=1");
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("enforces locale prefix for non-exempt routes", async () => {
    const res = await handler.fetch(
      new Request("https://shop.example/products"),
      {
        HOST_MAPPING_JSON: JSON.stringify({
          "shop.example": {
            shopId: "shop_1",
            canonicalHost: "shop.example",
            defaultLocale: "en",
            mode: "active",
          },
        }),
      },
      makeCtx(),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://shop.example/en/products");
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("injects x-shop-id and proxies storefront routes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await handler.fetch(
      new Request("https://shop.example/api/cart", {
        method: "GET",
        headers: { "x-shop-id": "evil", "x-front-door-token": "evil" },
      }),
      {
        HOST_MAPPING_JSON: JSON.stringify({
          "shop.example": {
            shopId: "shop_1",
            canonicalHost: "shop.example",
            defaultLocale: "en",
            mode: "active",
          },
        }),
      },
      makeCtx(),
    );

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const upstreamReq = (global.fetch as jest.Mock).mock.calls[0]?.[0] as Request;
    expect(upstreamReq.url).toBe("https://shop.example/api/cart");
    expect(upstreamReq.headers.get("x-shop-id")).toBe("shop_1");
    expect(upstreamReq.headers.get("x-front-door-token")).toBeNull();
    expect(upstreamReq.headers.get("x-request-id")).toBeTruthy();
  });

  it("rewrites gateway routes to the configured gateway origin", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await handler.fetch(
      new Request("https://shop.example/api/checkout-session", { method: "POST" }),
      {
        HOST_MAPPING_JSON: JSON.stringify({
          "shop.example": {
            shopId: "shop_1",
            canonicalHost: "shop.example",
            defaultLocale: "en",
            mode: "active",
          },
        }),
        GATEWAY_ORIGIN: "https://gateway.example",
        GATEWAY_AUTH_TOKEN: "front-door-secret",
      },
      makeCtx(),
    );

    expect(res.status).toBe(200);
    const upstreamReq = (global.fetch as jest.Mock).mock.calls[0]?.[0] as Request;
    expect(upstreamReq.url).toBe("https://gateway.example/api/checkout-session");
    expect(upstreamReq.headers.get("x-shop-id")).toBe("shop_1");
    expect(upstreamReq.headers.get("x-front-door-token")).toBe("front-door-secret");
  });

  it("bypasses locale prefix for Next.js assets and static files", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response("ok", { status: 200 }));

    const env = {
      HOST_MAPPING_JSON: JSON.stringify({
        "shop.example": {
          shopId: "shop_1",
          canonicalHost: "shop.example",
          defaultLocale: "en",
          mode: "active",
        },
      }),
    };

    const nextRes = await handler.fetch(
      new Request("https://shop.example/_next/static/chunk.js"),
      env,
      makeCtx(),
    );
    expect(nextRes.status).toBe(200);

    const icoRes = await handler.fetch(
      new Request("https://shop.example/favicon.ico"),
      env,
      makeCtx(),
    );
    expect(icoRes.status).toBe(200);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("bypasses locale prefix for runtime non-locale routes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response("ok", { status: 200 }));

    const env = {
      HOST_MAPPING_JSON: JSON.stringify({
        "shop.example": {
          shopId: "shop_1",
          canonicalHost: "shop.example",
          defaultLocale: "en",
          mode: "active",
        },
      }),
    };

    const res = await handler.fetch(new Request("https://shop.example/success"), env, makeCtx());
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
