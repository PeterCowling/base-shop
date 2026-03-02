import { Readable } from "node:stream";

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const listCatalogDraftsMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const parseStorefrontMock = jest.fn();
const buildSubmissionZipStreamMock = jest.fn();
const buildSubmissionZipFromCloudDraftsMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();
const getCloudflareContextMock = jest.fn();
const getUploaderKvMock = jest.fn();
const kvPutMock = jest.fn();
const kvGetMock = jest.fn();
const kvDeleteMock = jest.fn();
const waitUntilMock = jest.fn();

jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: (...args: unknown[]) => getCloudflareContextMock(...args),
}));

jest.mock("../../../../../lib/catalogCsv", () => ({
  listCatalogDrafts: (...args: unknown[]) => listCatalogDraftsMock(...args),
}));

jest.mock("../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
}));

jest.mock("../../../../../lib/submissionZip", () => ({
  buildSubmissionZipStream: (...args: unknown[]) => buildSubmissionZipStreamMock(...args),
  buildSubmissionZipFromCloudDrafts: (...args: unknown[]) => buildSubmissionZipFromCloudDraftsMock(...args),
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/localFsGuard", () => ({
  isLocalFsRuntimeEnabled: (...args: unknown[]) => isLocalFsRuntimeEnabledMock(...args),
}));

jest.mock("../../../../../lib/syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
}));

describe("catalog submission route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    kvPutMock.mockResolvedValue(undefined);
    kvGetMock.mockResolvedValue(null);
    kvDeleteMock.mockResolvedValue(undefined);
    waitUntilMock.mockImplementation(() => {});
    getUploaderKvMock.mockResolvedValue({
      put: kvPutMock,
      get: kvGetMock,
      delete: kvDeleteMock,
    });
    getCloudflareContextMock.mockResolvedValue({
      env: { XA_UPLOADER_KV: { put: kvPutMock, get: kvGetMock, delete: kvDeleteMock } },
      ctx: { waitUntil: waitUntilMock },
    });
    listCatalogDraftsMock.mockResolvedValue({
      path: "/repo/apps/xa-uploader/data/products.csv",
      products: [],
      revisionsById: {},
    });
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [],
      revisionsById: {},
      docRevision: "doc-1",
    });
  });

  it("returns invalid class for known submission validation errors", async () => {
    buildSubmissionZipStreamMock.mockRejectedValueOnce(
      new Error("Select 1–10 products per submission."),
    );

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: [] }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "invalid",
        reason: "submission_validation_failed",
      }),
    );
  });

  it("TC-06a/b: returns 202 and enqueues submission job when local fs runtime is disabled", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValue(false);
    readCloudDraftSnapshotMock.mockResolvedValueOnce({
      products: [
        {
          id: "p1",
          slug: "studio-jacket",
          title: "Studio Jacket",
          brandHandle: "atelier-x",
          collectionHandle: "outerwear",
          collectionTitle: "Outerwear",
          price: "189",
          description: "A structured layer.",
          createdAt: "2025-12-01T12:00:00.000Z",
          forSale: true,
          forRental: false,
          popularity: "0",
          deposit: "0",
          stock: "0",
          sizes: "S|M|L",
          taxonomy: {
            department: "women",
            category: "clothing",
            subcategory: "outerwear",
            color: "black",
            material: "wool",
          },
          imageFiles: "studio-jacket-front.jpg|studio-jacket-side.jpg",
          imageAltTexts: "Studio jacket front|Studio jacket side",
          imageRoles: "front|side",
        },
      ],
      revisionsById: {},
      docRevision: "doc-1",
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: ["studio-jacket"] }),
      }),
    );

    expect(response.status).toBe(202);
    const payload = (await response.json()) as { ok: boolean; jobId: string };
    expect(payload).toEqual({ ok: true, jobId: expect.any(String) });
    expect(kvPutMock).toHaveBeenCalledWith(
      `xa-submission-job:${payload.jobId}`,
      expect.any(String),
      { expirationTtl: 3600 },
    );
    expect(waitUntilMock).toHaveBeenCalledWith(expect.any(Promise));
  });

  it("TC-02b: returns 400 draft_schema_invalid when selected product fails schema validation", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValue(false);
    readCloudDraftSnapshotMock.mockResolvedValueOnce({
      products: [{ slug: "bad-product", title: "" }],
      revisionsById: {},
      docRevision: "doc-1",
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: ["bad-product"] }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "invalid",
        reason: "draft_schema_invalid",
      }),
    );
  });

  it("TC-06g: keeps synchronous zip response on local fs path", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    listCatalogDraftsMock.mockResolvedValueOnce({
      path: "/repo/apps/xa-uploader/data/products.csv",
      products: [
        {
          slug: "studio-jacket",
          title: "Studio Jacket",
          brandHandle: "atelier-x",
          collectionHandle: "outerwear",
          collectionTitle: "Outerwear",
          price: "189",
          description: "A structured layer.",
          createdAt: "2025-12-01T12:00:00.000Z",
          forSale: true,
          forRental: false,
          popularity: "0",
          deposit: "0",
          stock: "0",
          sizes: "S|M|L",
          taxonomy: {
            department: "women",
            category: "clothing",
            subcategory: "outerwear",
            color: "black",
            material: "wool",
          },
          imageFiles: "studio-jacket-front.jpg",
          imageAltTexts: "Studio jacket front",
          imageRoles: "front",
        },
      ],
      revisionsById: {},
    });
    buildSubmissionZipStreamMock.mockResolvedValueOnce({
      filename: "submission.zip",
      manifest: { submissionId: "sub-1", suggestedR2Key: "submissions/sub-1.zip" },
      stream: Readable.from(Buffer.from([80, 75, 3, 4])),
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: ["studio-jacket"] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(buildSubmissionZipStreamMock).toHaveBeenCalledTimes(1);
    expect(getUploaderKvMock).not.toHaveBeenCalled();
  });

  it("TC-08e: returns internal_error and logs route/error/duration for unknown failures", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    buildSubmissionZipStreamMock.mockRejectedValueOnce(
      new Error("EACCES /Users/petercowling/base-shop/apps/xa-uploader/data/products.csv"),
    );

    try {
      const { POST } = await import("../route");
      const response = await POST(
        new Request("http://localhost/api/catalog/submission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: ["studio-jacket"] }),
        }),
      );

      expect(response.status).toBe(500);
      const payload = (await response.json()) as { error?: string; reason?: string };
      expect(payload.error).toBe("internal_error");
      expect(payload.reason).toBe("submission_export_failed");
      expect(JSON.stringify(payload)).not.toContain("EACCES");
      expect(JSON.stringify(payload)).not.toContain("/Users/petercowling");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          route: "POST /api/catalog/submission",
          error: "EACCES /Users/petercowling/base-shop/apps/xa-uploader/data/products.csv",
          durationMs: expect.any(Number),
        }),
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
