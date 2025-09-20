// apps/shop-bcd/__tests__/preview-token.test.ts
import path from "node:path";
import { createHmac } from "node:crypto";

describe("/api/preview-token", () => {
  const appDir = path.join(__dirname, "..");
  let cwd: string;

  beforeEach(() => {
    cwd = process.cwd();
    process.chdir(appDir);
  });

  afterEach(() => {
    process.chdir(cwd);
    jest.resetModules();
  });

  test("returns 401 for unauthorized", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockRejectedValue(new Error("no")),
    }));
    const { GET } = await import("../src/app/api/preview-token/route");
    const res = await GET(new Request("https://example.com/api/preview-token"));
    expect(res.status).toBe(401);
  });

  test("returns token when authorized", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn(),
    }));
    jest.doMock("@acme/config/env/auth", () => ({
      authEnv: { UPGRADE_PREVIEW_TOKEN_SECRET: "shhh" },
    }));
    const { GET } = await import("../src/app/api/preview-token/route");
    const res = await GET(
      new Request("https://example.com/api/preview-token?pageId=abc"),
    );
    const token = createHmac("sha256", "shhh").update("abc").digest("hex");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token });
  });
});
