import React from "react";

describe("shared react-compat polyfills", () => {
  test("React.act exists and returns a thenable", async () => {
    expect(typeof (React as any).act).toBe("function");
    const result = (React as any).act(() => {});
    expect(typeof (result as any)?.then).toBe("function");
    await result;
  });

  test("React internals aliases are present", () => {
    const client = (React as any)
      .__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const secret = (React as any)
      .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    // At least one should exist, and aliases should converge to same object
    expect(client || secret).toBeTruthy();
    if (client && secret) {
      expect(client).toBe(secret);
    }
  });

  test("Response.json static helper exists and sets content-type", async () => {
    expect(typeof (Response as any).json).toBe("function");
    const r = (Response as any).json({ ok: true }, 201) as Response;
    expect(r.status).toBe(201);
    expect(r.headers.get("content-type")).toMatch(/application\/json/i);
    const text = await r.text();
    expect(JSON.parse(text)).toEqual({ ok: true });
  });

  test("MessageChannel delivers messages asynchronously", async () => {
    const mc = new (globalThis as any).MessageChannel();
    const received: any[] = [];
    mc.port1.onmessage = (e: MessageEvent) => {
      received.push(e.data);
    };
    mc.port2.postMessage({ hello: "world" });
    // Wait a macrotask to allow the polyfill to flush
    await new Promise((r) => setTimeout(r, 0));
    expect(received).toEqual([{ hello: "world" }]);
  });
});

