import handler from "../src/index";

describe("checkout-gateway-worker", () => {
  beforeEach(() => {
    // @ts-expect-error - jest mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("responds to health checks", async () => {
    const res = await handler.fetch(new Request("https://gateway.example/health"), {});
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("denies non-allowlisted paths", async () => {
    const res = await handler.fetch(
      new Request("https://gateway.example/api/nope"),
      { NODE_COMMERCE_ORIGIN: "https://node.example" },
    );
    expect(res.status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("requires x-shop-id for non-webhook endpoints", async () => {
    const res = await handler.fetch(
      new Request("https://gateway.example/api/checkout-session", { method: "POST" }),
      { NODE_COMMERCE_ORIGIN: "https://node.example" },
    );
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects shop endpoints without the front-door token when configured", async () => {
    const res = await handler.fetch(
      new Request("https://gateway.example/api/checkout-session", {
        method: "POST",
        headers: { "x-shop-id": "shop_1" },
      }),
      { NODE_COMMERCE_ORIGIN: "https://node.example", FRONT_DOOR_AUTH_TOKEN: "front-door-secret" },
    );
    expect(res.status).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("proxies shop endpoints when the front-door token matches", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await handler.fetch(
      new Request("https://gateway.example/api/checkout-session", {
        method: "POST",
        headers: { "x-shop-id": "shop_1", "x-front-door-token": "front-door-secret" },
      }),
      { NODE_COMMERCE_ORIGIN: "https://node.example", FRONT_DOOR_AUTH_TOKEN: "front-door-secret" },
    );
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const upstreamReq = (global.fetch as jest.Mock).mock.calls[0]?.[0] as Request;
    expect(upstreamReq.headers.get("x-front-door-token")).toBeNull();
  });

  it("does not require the front-door token for webhook endpoints", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await handler.fetch(
      new Request("https://gateway.example/api/stripe-webhook", { method: "POST" }),
      { NODE_COMMERCE_ORIGIN: "https://node.example", FRONT_DOOR_AUTH_TOKEN: "front-door-secret" },
    );
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not require x-shop-id for webhook endpoints", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await handler.fetch(
      new Request("https://gateway.example/api/stripe-webhook", { method: "POST" }),
      { NODE_COMMERCE_ORIGIN: "https://node.example" },
    );
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("strips x-shop-id from webhook requests before proxying", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await handler.fetch(
      new Request("https://gateway.example/api/stripe-webhook", {
        method: "POST",
        headers: { "x-shop-id": "evil" },
      }),
      { NODE_COMMERCE_ORIGIN: "https://node.example", NODE_COMMERCE_AUTH_HEADER: "Bearer node-secret" },
    );

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const upstreamReq = (global.fetch as jest.Mock).mock.calls[0]?.[0] as Request;
    expect(upstreamReq.url).toBe("https://node.example/api/stripe-webhook");
    expect(upstreamReq.headers.get("x-shop-id")).toBeNull();
    expect(upstreamReq.headers.get("authorization")).toBe("Bearer node-secret");
    expect(upstreamReq.headers.get("x-request-id")).toBeTruthy();
  });
});
