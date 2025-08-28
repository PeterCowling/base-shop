import { buildResponse } from "../src/buildResponse";

describe("buildResponse", () => {
  it("decodes base64 body and preserves headers", async () => {
    const text = "hello";
    const body = Buffer.from(text).toString("base64");
    const resp = buildResponse({
      response: { status: 201, headers: { "x-test": "1" }, body },
    });
    expect(resp.status).toBe(201);
    expect(resp.headers.get("x-test")).toBe("1");
    await expect(resp.text()).resolves.toBe(text);
  });

  it("handles missing body", async () => {
    const resp = buildResponse({
      response: { status: 204, headers: { "x": "y" } },
    });
    expect(resp.status).toBe(204);
    const buf = await resp.arrayBuffer();
    expect(buf.byteLength).toBe(0);
  });
});
