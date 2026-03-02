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

  it("completes async submission job lifecycle and persists zip artifact", async () => {
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
          stock: "1",
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

    const kvStore = new Map<string, string | Buffer>();
    getUploaderKvMock.mockResolvedValueOnce({
      put: async (key: string, value: string | ArrayBuffer | Buffer) => {
        if (typeof value === "string") {
          kvStore.set(key, value);
          return;
        }
        if (value instanceof ArrayBuffer) {
          kvStore.set(key, Buffer.from(value));
          return;
        }
        kvStore.set(key, Buffer.from(value));
      },
      get: async (key: string, options?: { type?: string }) => {
        const value = kvStore.get(key);
        if (!value) return null;
        if (options?.type === "arrayBuffer") {
          if (typeof value === "string") return Buffer.from(value, "utf8").buffer;
          return value.buffer.slice(
            value.byteOffset,
            value.byteOffset + value.byteLength,
          );
        }
        return typeof value === "string" ? value : value.toString("utf8");
      },
      delete: async (key: string) => {
        kvStore.delete(key);
      },
    });

    buildSubmissionZipFromCloudDraftsMock.mockResolvedValueOnce({
      filename: "submission.zip",
      manifest: { submissionId: "sub-1", suggestedR2Key: "submissions/sub-1.zip" },
      stream: Readable.from([Buffer.from("zip-binary", "utf8")]),
    });

    let queuedJob: Promise<void> | null = null;
    waitUntilMock.mockImplementationOnce((promise: Promise<void>) => {
      queuedJob = promise;
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
    const payload = (await response.json()) as { jobId: string };
    expect(payload.jobId).toEqual(expect.any(String));
    expect(queuedJob).not.toBeNull();

    await queuedJob;

    const jobKey = `xa-submission-job:${payload.jobId}`;
    const zipStorageKey = `xa-submission-zip:${payload.jobId}`;
    const storedJob = kvStore.get(jobKey);
    const storedZip = kvStore.get(zipStorageKey);
    expect(typeof storedJob).toBe("string");
    expect(storedZip).toBeInstanceOf(Buffer);
    const parsedJob = JSON.parse(String(storedJob)) as { status?: string; downloadUrl?: string };
    expect(parsedJob.status).toBe("complete");
    expect(parsedJob.downloadUrl).toBe(`/api/catalog/submission/download/${payload.jobId}`);
  });

  it("marks async submission job as failed when zip generation throws", async () => {
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
          stock: "1",
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

    const kvStore = new Map<string, string | Buffer>();
    getUploaderKvMock.mockResolvedValueOnce({
      put: async (key: string, value: string | ArrayBuffer | Buffer) => {
        if (typeof value === "string") {
          kvStore.set(key, value);
          return;
        }
        if (value instanceof ArrayBuffer) {
          kvStore.set(key, Buffer.from(value));
          return;
        }
        kvStore.set(key, Buffer.from(value));
      },
      get: async (key: string) => {
        const value = kvStore.get(key);
        if (!value) return null;
        return typeof value === "string" ? value : value.toString("utf8");
      },
      delete: async (key: string) => {
        kvStore.delete(key);
      },
    });

    buildSubmissionZipFromCloudDraftsMock.mockRejectedValueOnce(new Error("zip builder crashed"));

    let queuedJob: Promise<void> | null = null;
    waitUntilMock.mockImplementationOnce((promise: Promise<void>) => {
      queuedJob = promise;
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
    const payload = (await response.json()) as { jobId: string };
    expect(queuedJob).not.toBeNull();

    await queuedJob;

    const storedJob = kvStore.get(`xa-submission-job:${payload.jobId}`);
    expect(typeof storedJob).toBe("string");
    const parsedJob = JSON.parse(String(storedJob)) as { status?: string; error?: string };
    expect(parsedJob.status).toBe("failed");
    expect(parsedJob.error).toBe("zip builder crashed");
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
          imageFiles: "studio-jacket-front.jpg|studio-jacket-side.jpg",
          imageAltTexts: "Studio jacket front|Studio jacket side",
          imageRoles: "front|side",
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
          stock: "1",
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
    });
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
