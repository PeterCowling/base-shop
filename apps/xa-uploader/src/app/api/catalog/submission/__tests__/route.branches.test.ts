import { Readable } from "node:stream";

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const listCatalogDraftsMock = jest.fn();
const parseStorefrontMock = jest.fn();
const buildSubmissionZipStreamMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const rateLimitMock = jest.fn();
const applyRateLimitHeadersMock = jest.fn();
const getRequestIpMock = jest.fn();
const readJsonBodyWithLimitMock = jest.fn();

class InvalidJsonErrorMock extends Error {}
class PayloadTooLargeErrorMock extends Error {}

jest.mock("../../../../../lib/catalogCsv", () => ({
  listCatalogDrafts: (...args: unknown[]) => listCatalogDraftsMock(...args),
}));

jest.mock("../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../lib/submissionZip", () => ({
  buildSubmissionZipStream: (...args: unknown[]) => buildSubmissionZipStreamMock(...args),
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  applyRateLimitHeaders: (...args: unknown[]) => applyRateLimitHeadersMock(...args),
  getRequestIp: (...args: unknown[]) => getRequestIpMock(...args),
}));

jest.mock("../../../../../lib/requestJson", () => ({
  InvalidJsonError: InvalidJsonErrorMock,
  PayloadTooLargeError: PayloadTooLargeErrorMock,
  readJsonBodyWithLimit: (...args: unknown[]) => readJsonBodyWithLimitMock(...args),
}));

describe("catalog submission route branch coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    getRequestIpMock.mockReturnValue("203.0.113.30");
    rateLimitMock.mockReturnValue({ allowed: true, remaining: 5, resetAt: Date.now() + 60_000 });
    applyRateLimitHeadersMock.mockImplementation(() => {});
    readJsonBodyWithLimitMock.mockResolvedValue({ slugs: ["studio-jacket"], storefront: "xa-b" });
    listCatalogDraftsMock.mockResolvedValue({
      path: "/repo/apps/xa-uploader/data/products.csv",
      products: [{ slug: "studio-jacket", title: "Studio jacket" }],
      revisionsById: {},
    });
    buildSubmissionZipStreamMock.mockResolvedValue({
      filename: "submission.zip",
      manifest: { submissionId: "sub-1", suggestedR2Key: "submissions/sub-1.zip" },
      stream: Readable.from([Buffer.from("zip-binary", "utf8")]),
    });
    delete process.env.XA_UPLOADER_SUBMISSION_MAX_BYTES;
  });

  it("returns a zip stream with submission headers on success", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(response.headers.get("X-XA-Submission-Id")).toBe("sub-1");
    expect(response.headers.get("X-XA-Submission-R2-Key")).toBeNull();
    expect(response.headers.get("Content-Disposition")).toContain("submission.zip");
  });

  it("exposes submission storage key only in explicit debug mode", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousExpose = process.env.XA_UPLOADER_EXPOSE_SUBMISSION_R2_KEY;
    process.env.NODE_ENV = "development";
    process.env.XA_UPLOADER_EXPOSE_SUBMISSION_R2_KEY = "1";
    try {
      const { POST } = await import("../route");
      const response = await POST(
        new Request("http://localhost/api/catalog/submission", { method: "POST" }),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("X-XA-Submission-R2-Key")).toBe("submissions/sub-1.zip");
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      if (previousExpose === undefined) delete process.env.XA_UPLOADER_EXPOSE_SUBMISSION_R2_KEY;
      else process.env.XA_UPLOADER_EXPOSE_SUBMISSION_R2_KEY = previousExpose;
      jest.resetModules();
    }
  });

  it("caps submission max bytes to free-tier ceiling even when env is higher", async () => {
    process.env.XA_UPLOADER_SUBMISSION_MAX_BYTES = String(200 * 1024 * 1024);
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(buildSubmissionZipStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          maxBytes: 25 * 1024 * 1024,
        }),
      }),
    );
  });

  it("returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", { method: "POST" }),
    );
    expect(response.status).toBe(404);
  });

  it("returns 429 when rate limited", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", { method: "POST" }),
    );
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited", reason: "submission_rate_limited" }),
    );
  });

  it("returns 400 when slug count exceeds cap", async () => {
    readJsonBodyWithLimitMock.mockResolvedValueOnce({ slugs: Array.from({ length: 21 }, (_, i) => `slug-${i}`) });
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", { method: "POST" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "invalid", reason: "too_many_submission_slugs" }),
    );
  });

  it("returns 400 for invalid JSON parse error", async () => {
    readJsonBodyWithLimitMock.mockRejectedValueOnce(new InvalidJsonErrorMock("invalid"));
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", { method: "POST" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "invalid", reason: "invalid_json" }),
    );
  });

  it("returns 413 for payload too large parse error", async () => {
    readJsonBodyWithLimitMock.mockRejectedValueOnce(new PayloadTooLargeErrorMock("too large"));
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", { method: "POST" }),
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "payload_too_large", reason: "payload_too_large" }),
    );
  });
});
