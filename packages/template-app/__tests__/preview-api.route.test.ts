import type { NextRequest } from "next/server";

const ResponseWithJson = Response as unknown as typeof Response & {
  json?: (data: unknown, init?: ResponseInit) => Response;
};
if (typeof ResponseWithJson.json !== "function") {
  ResponseWithJson.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

describe("/api/preview POST", () => {
  it("returns ok and sets cookie when versions provided", async () => {
    const { POST } = await import("../src/app/api/preview/route");
    const res = await POST({ json: async () => ({ versions: { a: 1 } }) } as unknown as NextRequest);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.cookies.get("component-versions")?.value).toBe(
      JSON.stringify({ a: 1 })
    );
  });

  it("does not set cookie when versions missing", async () => {
    const { POST } = await import("../src/app/api/preview/route");
    const res = await POST({ json: async () => ({}) } as unknown as NextRequest);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.cookies.get("component-versions")).toBeUndefined();
  });
});
