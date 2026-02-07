import jwt from "jsonwebtoken";

import { apiRequest } from "../../test-utils";

describe("components route", () => {
  beforeAll(() => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "testsecret";
  });

  const sign = (shopId: string, opts: jwt.SignOptions = {}) =>
    jwt.sign(
      {},
      process.env.UPGRADE_PREVIEW_TOKEN_SECRET!,
      {
        algorithm: "HS256",
        audience: "upgrade-preview",
        issuer: "acme",
        subject: `shop:${shopId}:upgrade-preview`,
        expiresIn: "1h",
        ...opts,
      },
    );

  it("rejects requests without token", async () => {
    const res = await apiRequest("GET", "/components/cover-me-pretty");
    expect(res.status).toBe(403);
  });

  it("rejects requests with invalid token", async () => {
    const token = jwt.sign(
      {},
      "wrongsecret",
      {
        algorithm: "HS256",
        audience: "upgrade-preview",
        issuer: "acme",
        subject: "shop:cover-me-pretty:upgrade-preview",
        expiresIn: "1h",
      },
    );
    const res = await apiRequest("GET", "/components/cover-me-pretty", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("returns 400 for invalid shop id", async () => {
    const res = await apiRequest("GET", "/components/INVALID$ID");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid shop id" });
  });

  it("returns components for valid token", async () => {
    const token = sign("cover-me-pretty");
    const res = await apiRequest("GET", "/components/cover-me-pretty", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ components: [] });
  });

  it("returns config diff when requested", async () => {
    const token = sign("cover-me-pretty");
    const res = await apiRequest("GET", "/components/cover-me-pretty?diff", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      components: [],
      configDiff: { templates: [], translations: [] },
    });
  });

  it("rejects token with mismatched subject", async () => {
    const token = sign("xyz");
    const res = await apiRequest("GET", "/components/cover-me-pretty", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("rejects token with mismatched audience", async () => {
    const token = sign("cover-me-pretty", { audience: "other" });
    const res = await apiRequest("GET", "/components/cover-me-pretty", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("rejects token with mismatched issuer", async () => {
    const token = sign("cover-me-pretty", { issuer: "other" });
    const res = await apiRequest("GET", "/components/cover-me-pretty", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("rejects expired token", async () => {
    const token = sign("cover-me-pretty", { expiresIn: -1 });
    const res = await apiRequest("GET", "/components/cover-me-pretty", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("rejects token without expiration", async () => {
    const token = jwt.sign(
      {},
      process.env.UPGRADE_PREVIEW_TOKEN_SECRET!,
      {
        algorithm: "HS256",
        audience: "upgrade-preview",
        issuer: "acme",
        subject: "shop:cover-me-pretty:upgrade-preview",
        noTimestamp: true,
      },
    );
    const res = await apiRequest("GET", "/components/cover-me-pretty", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });
});
