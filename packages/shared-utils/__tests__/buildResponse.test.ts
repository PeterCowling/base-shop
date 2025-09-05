import { buildResponse } from "../src/buildResponse";

describe("buildResponse", () => {
  it("decodes base64 bodies and rehydrates headers", async () => {
    const message = "all good";
    const body = Buffer.from(message).toString("base64");
    const resp = buildResponse({
      response: {
        status: 200,
        headers: { "content-type": "text/plain", "x-extra": "1" },
        body,
      },
    });
    expect(resp.status).toBe(200);
    expect(resp.headers.get("content-type")).toBe("text/plain");
    expect(resp.headers.get("x-extra")).toBe("1");
    await expect(resp.text()).resolves.toBe(message);
  });

  it("returns a Response with error status and decoded message", async () => {
    const message = "something went wrong";
    const body = Buffer.from(message).toString("base64");
    const resp = buildResponse({
      response: {
        status: 500,
        headers: { "content-type": "text/plain" },
        body,
      },
    });
    expect(resp.status).toBe(500);
    await expect(resp.text()).resolves.toBe(message);
  });

  it("handles undefined body gracefully", async () => {
    const resp = buildResponse({
      response: { status: 204, headers: { "x-test": "1" } },
    });
    expect(resp.status).toBe(204);
    expect(resp.headers.get("x-test")).toBe("1");
    await expect(resp.text()).resolves.toBe("");
  });

  it("handles null body gracefully", async () => {
    const resp = buildResponse({
      response: { status: 204, headers: { "x-test": "1" }, body: null },
    });
    expect(resp.status).toBe(204);
    expect(resp.headers.get("x-test")).toBe("1");
    await expect(resp.text()).resolves.toBe("");
  });

  it("parses JSON payloads via res.json()", async () => {
    const data = { ok: true };
    const body = Buffer.from(JSON.stringify(data)).toString("base64");
    const resp = buildResponse({
      response: {
        status: 200,
        headers: { "content-type": "application/json" },
        body,
      },
    });

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual(data);
  });
});

