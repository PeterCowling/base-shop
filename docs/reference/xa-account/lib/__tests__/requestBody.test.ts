import {
  InvalidBodyError,
  PayloadTooLargeError,
  readFormBodyWithLimit,
  readJsonBodyWithLimit,
} from "../requestBody";

describe("requestBody", () => {
  it("parses valid json payloads within limits", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ ok: true, count: 2 }),
    });

    await expect(readJsonBodyWithLimit(request, 1024)).resolves.toEqual({ ok: true, count: 2 });
  });

  it("rejects oversized payloads", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: "x".repeat(2048),
    });

    await expect(readJsonBodyWithLimit(request, 512)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it("rejects invalid json payloads", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: "{invalid",
    });

    await expect(readJsonBodyWithLimit(request, 1024)).rejects.toBeInstanceOf(InvalidBodyError);
  });

  it("rejects empty payloads", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
    });

    await expect(readJsonBodyWithLimit(request, 1024)).rejects.toBeInstanceOf(InvalidBodyError);
  });

  it("parses urlencoded payloads within limits", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: "code=abc123&next=%2Faccount%2Forders",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    const form = await readFormBodyWithLimit(request, 1024);
    expect(form.get("code")).toBe("abc123");
    expect(form.get("next")).toBe("/account/orders");
  });
});
