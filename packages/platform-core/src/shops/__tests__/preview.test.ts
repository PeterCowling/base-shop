import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { createPreviewToken } from "../../previewTokens";

jest.mock("../deployInfo", () => {
  const actual = jest.requireActual("../deployInfo");
  return {
    ...actual,
    readDeployInfo: jest.fn(),
  };
});

const { readDeployInfo } = jest.requireMock("../deployInfo") as {
  readDeployInfo: jest.Mock;
};

afterEach(() => {
  readDeployInfo.mockReset();
  delete process.env.PREVIEW_TOKEN_SECRET;
  delete process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
  delete process.env.NEXT_PUBLIC_BASE_URL;
});

describe("buildPagePreview", () => {
  it("prefers stage previewUrl and attaches preview token", async () => {
    readDeployInfo.mockReturnValueOnce({
      previewUrl: "https://stage.example",
      env: "stage",
    });
    process.env.PREVIEW_TOKEN_SECRET = "secret";

    const { buildPagePreview } = await import("../preview");
    const result = buildPagePreview({ shopId: "shop-1", pageId: "page-1" });

    const expectedToken = createPreviewToken(
      { shopId: "shop-1", pageId: "page-1" },
      "secret",
    );

    expect(result.source).toBe("stage");
    expect(result.token).toBe(expectedToken);
    expect(result.url).toContain(
      `https://stage.example/preview/page-1?token=${expectedToken}`,
    );
  });

  it("falls back to NEXT_PUBLIC_BASE_URL when deploy info missing", async () => {
    readDeployInfo.mockReturnValueOnce(null);
    process.env.NEXT_PUBLIC_BASE_URL = "https://fallback.example";

    const { buildPagePreview } = await import("../preview");
    const result = buildPagePreview({ shopId: "shop-1", pageId: "page-2" });

    expect(result.source).toBe("env");
    expect(result.url).toBe("https://fallback.example/preview/page-2");
    expect(result.token).toBeNull();
  });
});

describe("resolvePreviewBaseUrl", () => {
  it("returns local fallback when deploy info is unusable", async () => {
    readDeployInfo.mockReturnValueOnce({ url: "not-a-url" });
    const { resolvePreviewBaseUrl } = await import("../preview");
    const result = resolvePreviewBaseUrl({ shopId: "shop-1" });

    expect(result.source).toBe("local");
    expect(result.baseUrl?.origin).toBe("http://localhost:3000");
  });
});
