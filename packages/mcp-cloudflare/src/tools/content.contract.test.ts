/** @jest-environment node */

import { cfFetchText } from "../client";

import {
  CONTENT_MARKDOWN_CONTRACT_VERSION,
  handleContentTool,
} from "./content";

jest.mock("../client", () => ({
  cfFetchText: jest.fn(),
}));

function parsePayload(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

describe("cloudflare markdown content contract", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("TC-01: returns normalized markdown payload for successful markdown fetch", async () => {
    const cfFetchTextMock = cfFetchText as jest.Mock;
    cfFetchTextMock.mockResolvedValue({
      ok: true,
      status: 200,
      finalUrl: "https://example.com/article",
      contentType: "text/markdown; charset=utf-8",
      body: "# Title\n\nContent body",
    });

    const result = await handleContentTool("content_markdown_fetch", {
      url: "https://example.com/article",
    });

    const payload = parsePayload(result);
    expect(result.isError).toBeUndefined();
    expect(payload.contractVersion).toBe(CONTENT_MARKDOWN_CONTRACT_VERSION);
    expect(payload.source).toEqual(
      expect.objectContaining({
        url: "https://example.com/article",
        finalUrl: "https://example.com/article",
        status: 200,
      })
    );
    expect(payload.markdown).toContain("# Title");
    expect(payload.quality).toEqual(
      expect.objectContaining({
        empty: false,
      })
    );
  });

  it("TC-02: returns structured unavailable error when markdown endpoint is unavailable", async () => {
    const cfFetchTextMock = cfFetchText as jest.Mock;
    cfFetchTextMock.mockResolvedValue({
      ok: false,
      status: 403,
      finalUrl: "https://example.com/article",
      contentType: "text/html; charset=utf-8",
      body: "forbidden",
    });

    const result = await handleContentTool("content_markdown_fetch", {
      url: "https://example.com/article",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("MARKDOWN_UNAVAILABLE");
  });

  it("TC-03: returns structured contract mismatch for non-markdown response", async () => {
    const cfFetchTextMock = cfFetchText as jest.Mock;
    cfFetchTextMock.mockResolvedValue({
      ok: true,
      status: 200,
      finalUrl: "https://example.com/article",
      contentType: "text/html; charset=utf-8",
      body: "<html>fallback</html>",
    });

    const result = await handleContentTool("content_markdown_fetch", {
      url: "https://example.com/article",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("MARKDOWN_CONTRACT_MISMATCH");
  });
});
