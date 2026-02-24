import { describe, expect, it } from "@jest/globals";

import { GET } from "../route";

describe("search sync route", () => {
  it("returns payload with cache headers on first request", async () => {
    const response = GET(new Request("https://xa-b.test/api/search/sync"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=0, must-revalidate",
    );

    const etag = response.headers.get("ETag");
    expect(etag).toMatch(/^"xa-search-/);

    await expect(response.json()).resolves.toMatchObject({
      version: etag,
      products: expect.any(Array),
    });
  });

  it("returns 304 when If-None-Match matches computed ETag", async () => {
    const warm = GET(new Request("https://xa-b.test/api/search/sync"));
    const etag = warm.headers.get("ETag");
    if (!etag) throw new Error("ETag missing");

    const cached = GET(
      new Request("https://xa-b.test/api/search/sync", {
        headers: { "if-none-match": etag },
      }),
    );

    expect(cached.status).toBe(304);
    expect(cached.headers.get("ETag")).toBe(etag);
    expect(cached.headers.get("Cache-Control")).toBe(
      "private, max-age=0, must-revalidate",
    );
    await expect(cached.text()).resolves.toBe("");
  });
});
