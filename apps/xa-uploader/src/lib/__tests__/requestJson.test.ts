import { describe, expect, it } from "@jest/globals";

import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../requestJson";

describe("requestJson", () => {
  it("throws payload too large from content-length guard", async () => {
    const request = new Request("https://uploader.example", {
      method: "POST",
      headers: { "content-length": "999" },
      body: JSON.stringify({ ok: true }),
    });

    await expect(readJsonBodyWithLimit(request, 100)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it("throws invalid json on empty body", async () => {
    const request = new Request("https://uploader.example", {
      method: "POST",
      body: "",
    });

    await expect(readJsonBodyWithLimit(request, 100)).rejects.toBeInstanceOf(InvalidJsonError);
  });

  it("throws invalid json on malformed payload", async () => {
    const request = new Request("https://uploader.example", {
      method: "POST",
      body: "{not-json",
    });

    await expect(readJsonBodyWithLimit(request, 100)).rejects.toBeInstanceOf(InvalidJsonError);
  });

  it("parses valid json payload", async () => {
    const request = new Request("https://uploader.example", {
      method: "POST",
      body: JSON.stringify({ storefront: "xa-b", slugs: ["studio-jacket"] }),
    });

    await expect(readJsonBodyWithLimit(request, 1024)).resolves.toEqual({
      storefront: "xa-b",
      slugs: ["studio-jacket"],
    });
  });
});
