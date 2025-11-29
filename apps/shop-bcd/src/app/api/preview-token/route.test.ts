/** @jest-environment node */
import { createHmac } from "crypto";

describe("GET /api/preview-token", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function makeReq(url: string) {
    return new Request(url);
  }

  it("returns token when authorized and secret configured", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("@acme/config/env/auth", () => ({
      __esModule: true,
      authEnv: { UPGRADE_PREVIEW_TOKEN_SECRET: "sekret" },
    }));
    const { GET } = await import("./route");
    const pageId = "abc123";
    const res = await GET(makeReq(`http://x/api/preview-token?pageId=${pageId}`));
    expect(res.status).toBe(200);
    type PreviewTokenResponse = { token: string };
    const body = (await res.json()) as PreviewTokenResponse;
    const expected = createHmac("sha256", "sekret").update(pageId).digest("hex");
    expect(body.token).toBe(expected);
  });

  it("returns 401 when unauthorized", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockRejectedValue(new Error("nope")),
    }));
    jest.doMock("@acme/config/env/auth", () => ({
      __esModule: true,
      authEnv: { UPGRADE_PREVIEW_TOKEN_SECRET: "sekret" },
    }));
    const { GET } = await import("./route");
    const res = await GET(makeReq("http://x/api/preview-token?pageId=1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when pageId missing", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("@acme/config/env/auth", () => ({
      __esModule: true,
      authEnv: { UPGRADE_PREVIEW_TOKEN_SECRET: "sekret" },
    }));
    const { GET } = await import("./route");
    const res = await GET(makeReq("http://x/api/preview-token"));
    expect(res.status).toBe(400);
  });

  it("returns 500 when secret missing", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("@acme/config/env/auth", () => ({
      __esModule: true,
      authEnv: {},
    }));
    const { GET } = await import("./route");
    const res = await GET(makeReq("http://x/api/preview-token?pageId=1"));
    expect(res.status).toBe(500);
  });
});
