import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __clearRateLimitStoreForTests } from "../../../../../lib/rateLimit";

const hasUploaderSessionMock = jest.fn();
const getMediaBucketMock = jest.fn();
const parseImageDimensionsFromBufferMock = jest.fn();
const validateMinImageEdgeMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();

class MockCatalogDraftContractError extends Error {
  readonly code: string;
  readonly status?: number;
  constructor(code: string, message: string, options?: { status?: number }) {
    super(message);
    this.name = "CatalogDraftContractError";
    this.code = code;
    this.status = options?.status;
  }
}

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/r2Media", () => ({
  getMediaBucket: (...args: unknown[]) => getMediaBucketMock(...args),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
  writeCloudDraftSnapshot: (...args: unknown[]) => writeCloudDraftSnapshotMock(...args),
  CatalogDraftContractError: MockCatalogDraftContractError,
}));

jest.mock("../../../../../lib/uploaderLogger", () => ({
  uploaderLog: jest.fn(),
}));

jest.mock("@acme/lib/xa", () => ({
  parseImageDimensionsFromBuffer: (...args: unknown[]) => parseImageDimensionsFromBufferMock(...args),
}));

jest.mock("@acme/lib/math/ops", () => ({
  validateMinImageEdge: (...args: unknown[]) => validateMinImageEdgeMock(...args),
  toPositiveInt: (_value: unknown, fallback: number) => fallback,
}));

function makePngMagicBytes(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(16).fill(0)]);
}

function makeFormDataRequest(
  file: File | null,
  params: { storefront?: string; slug?: string } = {},
): Request {
  const url = new URL("http://localhost/api/catalog/images");
  if (params.storefront) url.searchParams.set("storefront", params.storefront);
  if (params.slug) url.searchParams.set("slug", params.slug);

  const formData = new FormData();
  if (file) formData.append("file", file);

  const request = new Request(url.toString(), {
    method: "POST",
  });
  Object.defineProperty(request, "formData", {
    configurable: true,
    value: async () => formData,
  });
  return request;
}

function makeValidFile(sizeBytes = 1024): File {
  const buf = makePngMagicBytes();
  const content = Buffer.concat([buf, Buffer.alloc(Math.max(0, sizeBytes - buf.length))]);
  return new File([content], "test.png", { type: "image/png" });
}

const mockBucketPut = jest.fn();
const mockBucketDelete = jest.fn();
const mockBucket = { put: mockBucketPut, get: jest.fn(), head: jest.fn(), delete: mockBucketDelete };

describe("catalog images route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();
    hasUploaderSessionMock.mockResolvedValue(true);
    getMediaBucketMock.mockResolvedValue(mockBucket);
    parseImageDimensionsFromBufferMock.mockReturnValue({ format: "png", width: 2000, height: 1800 });
    validateMinImageEdgeMock.mockReturnValue(true);
    mockBucketPut.mockResolvedValue({ key: "test-key" });
    mockBucketDelete.mockResolvedValue(undefined);
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "rev-2" });
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [],
      revisionsById: {},
      docRevision: "rev-1",
    });
  });

  it("TC-01: authenticated upload of valid image returns 200 with key", async () => {
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "hermes-birkin-25",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.key).toMatch(/^xa-b\/hermes-birkin-25\/\d+-[a-f0-9]{12}\.png$/);
    expect(mockBucketPut).toHaveBeenCalledTimes(1);
  });

  it("TC-01b: slug query param is normalized before key construction", async () => {
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "Hermes Birkin 25 Noir",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.key).toMatch(/^xa-b\/hermes-birkin-25-noir\/\d+-[a-f0-9]{12}\.png$/);
  });

  it("TC-02: unauthenticated request returns 404", async () => {
    hasUploaderSessionMock.mockResolvedValue(false);
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("TC-03: non-image file returns 400 invalid_file_type", async () => {
    const { POST } = await import("../route");
    const txtFile = new File([Buffer.from("hello world")], "test.txt", { type: "text/plain" });
    const request = makeFormDataRequest(txtFile, {
      storefront: "xa-b",
      slug: "test",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_file_type");
  });

  it("TC-04: oversized file returns 413 file_too_large", async () => {
    const { POST } = await import("../route");
    const bigFile = makeValidFile(9 * 1024 * 1024); // 9MB > 8MB limit
    const request = makeFormDataRequest(bigFile, {
      storefront: "xa-b",
      slug: "test",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error).toBe("file_too_large");
  });

  it("TC-05: valid image upload returns 200 even when mocked dimensions are small", async () => {
    validateMinImageEdgeMock.mockReturnValue(false);
    parseImageDimensionsFromBufferMock.mockReturnValue({ format: "png", width: 800, height: 600 });
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("TC-06: missing file returns 400 no_file", async () => {
    const { POST } = await import("../route");
    const request = makeFormDataRequest(null, {
      storefront: "xa-b",
      slug: "test",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("no_file");
  });

  it("TC-07: missing query params returns 400 missing_params", async () => {
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      // slug missing
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("missing_params");
  });

  it("TC-07b: invalid storefront/slug query params return 400 missing_params", async () => {
    const { POST } = await import("../route");

    const invalidStorefrontRequest = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-c",
      slug: "test",
    });
    const invalidStorefrontResponse = await POST(invalidStorefrontRequest);
    const invalidStorefrontBody = await invalidStorefrontResponse.json();
    expect(invalidStorefrontResponse.status).toBe(400);
    expect(invalidStorefrontBody.error).toBe("missing_params");

    const invalidSlugRequest = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "////",
    });
    const invalidSlugResponse = await POST(invalidSlugRequest);
    const invalidSlugBody = await invalidSlugResponse.json();
    expect(invalidSlugResponse.status).toBe(400);
    expect(invalidSlugBody.error).toBe("missing_params");
  });

  it("TC-08: R2 put failure returns 500 upload_failed", async () => {
    mockBucketPut.mockRejectedValue(new Error("R2 write error"));
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("upload_failed");
  });

  it("TC-09: R2 bucket unavailable returns 503 r2_unavailable", async () => {
    getMediaBucketMock.mockResolvedValue(null);
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("r2_unavailable");
  });

  it("TC-10: same-millisecond uploads for same slug generate different keys", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_709_578_800_000);
    try {
      const { POST } = await import("../route");
      const firstRequest = makeFormDataRequest(makeValidFile(), {
        storefront: "xa-b",
        slug: "test",
      });
      const secondRequest = makeFormDataRequest(makeValidFile(), {
        storefront: "xa-b",
        slug: "test",
      });

      const firstResponse = await POST(firstRequest);
      const secondResponse = await POST(secondRequest);
      const firstBody = await firstResponse.json();
      const secondBody = await secondResponse.json();

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(firstBody.key).not.toEqual(secondBody.key);
      expect(String(firstBody.key)).toMatch(/^xa-b\/test\/1709578800000-[a-f0-9]{12}\.png$/);
      expect(String(secondBody.key)).toMatch(/^xa-b\/test\/1709578800000-[a-f0-9]{12}\.png$/);
    } finally {
      nowSpy.mockRestore();
    }
  });
});

function makeDeleteRequest(params: { storefront?: string; key?: string } = {}): Request {
  const url = new URL("http://localhost/api/catalog/images");
  if (params.storefront) url.searchParams.set("storefront", params.storefront);
  if (params.key) url.searchParams.set("key", params.key);
  return new Request(url.toString(), { method: "DELETE" });
}

describe("catalog images DELETE route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();
    hasUploaderSessionMock.mockResolvedValue(true);
    getMediaBucketMock.mockResolvedValue(mockBucket);
    mockBucketDelete.mockResolvedValue(undefined);
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "rev-2" });
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [],
      revisionsById: {},
      docRevision: "rev-1",
    });
  });

  it("TC-D01: unreferenced image DELETE returns ok with deleted true", async () => {
    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(true);
    expect(writeCloudDraftSnapshotMock).toHaveBeenCalledWith({
      storefront: "xa-b",
      products: [],
      revisionsById: {},
      ifMatchDocRevision: "rev-1",
    });
    expect(mockBucketDelete).toHaveBeenCalledWith("xa-b/hermes-birkin-25/1234567890-abc123456789.png");
  });

  it("TC-D02: referenced image DELETE returns ok with deleted false and skipped still_referenced", async () => {
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [
        { imageFiles: "xa-b/hermes-birkin-25/1234567890-abc123456789.png", slug: "hermes-birkin-25" },
      ],
      revisionsById: {},
      docRevision: "rev-1",
    });

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(false);
    expect(body.skipped).toBe("still_referenced");
    expect(writeCloudDraftSnapshotMock).not.toHaveBeenCalled();
    expect(mockBucketDelete).not.toHaveBeenCalled();
  });

  it("TC-D03: R2 bucket.delete throws returns 500 image_delete_failed", async () => {
    mockBucketDelete.mockRejectedValue(new Error("R2 delete error"));

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("upload_failed");
    expect(body.reason).toBe("image_delete_failed");
  });

  it("TC-D04: R2 bucket unavailable (media bucket unavailable) returns 503", async () => {
    mockBucketDelete.mockRejectedValue(new Error("media bucket unavailable"));

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe("r2_unavailable");
  });

  it("TC-D05: reference check throws returns 500 reference_check_failed", async () => {
    readCloudDraftSnapshotMock.mockRejectedValue(new Error("contract service down"));

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("upload_failed");
    expect(body.reason).toBe("reference_check_failed");
  });

  it("TC-D06: unauthenticated DELETE returns 404", async () => {
    hasUploaderSessionMock.mockResolvedValue(false);

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    expect(response.status).toBe(404);
  });

  it("TC-D07: missing query params returns 400 missing_params", async () => {
    const { DELETE } = await import("../route");

    // Missing key
    const missingKeyRequest = makeDeleteRequest({ storefront: "xa-b" });
    const missingKeyResponse = await DELETE(missingKeyRequest);
    const missingKeyBody = await missingKeyResponse.json();
    expect(missingKeyResponse.status).toBe(400);
    expect(missingKeyBody.error).toBe("missing_params");

    __clearRateLimitStoreForTests();

    // Missing storefront
    const missingStorefrontRequest = makeDeleteRequest({ key: "xa-b/test/img.png" });
    const missingStorefrontResponse = await DELETE(missingStorefrontRequest);
    const missingStorefrontBody = await missingStorefrontResponse.json();
    expect(missingStorefrontResponse.status).toBe(400);
    expect(missingStorefrontBody.error).toBe("missing_params");
  });

  it("TC-D08: invalid key format returns 400 missing_params", async () => {
    const { DELETE } = await import("../route");

    // Path traversal
    const traversalRequest = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/../secret/file.png",
    });
    const traversalResponse = await DELETE(traversalRequest);
    const traversalBody = await traversalResponse.json();
    expect(traversalResponse.status).toBe(400);
    expect(traversalBody.error).toBe("missing_params");

    __clearRateLimitStoreForTests();

    // Wrong prefix
    const wrongPrefixRequest = makeDeleteRequest({
      storefront: "xa-b",
      key: "other/test/file.png",
    });
    const wrongPrefixResponse = await DELETE(wrongPrefixRequest);
    const wrongPrefixBody = await wrongPrefixResponse.json();
    expect(wrongPrefixResponse.status).toBe(400);
    expect(wrongPrefixBody.error).toBe("missing_params");

    __clearRateLimitStoreForTests();

    // Too few segments
    const fewSegmentsRequest = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/test",
    });
    const fewSegmentsResponse = await DELETE(fewSegmentsRequest);
    const fewSegmentsBody = await fewSegmentsResponse.json();
    expect(fewSegmentsResponse.status).toBe(400);
    expect(fewSegmentsBody.error).toBe("missing_params");
  });

  it("TC-D09: fence write 409 conflict returns concurrent_edit error without R2 delete", async () => {
    writeCloudDraftSnapshotMock.mockRejectedValue(
      new MockCatalogDraftContractError("conflict", "Draft snapshot revision conflict.", { status: 409 }),
    );

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("concurrent_edit");
    expect(body.concurrentEdit).toBe(true);
    expect(mockBucketDelete).not.toHaveBeenCalled();
  });

  it("TC-D10: fence write non-409 failure returns 500 without R2 delete", async () => {
    writeCloudDraftSnapshotMock.mockRejectedValue(new Error("network error"));

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("upload_failed");
    expect(body.reason).toBe("fence_write_failed");
    expect(mockBucketDelete).not.toHaveBeenCalled();
  });

  it("TC-D11: docRevision null aborts delete without fence write or R2 delete", async () => {
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [],
      revisionsById: {},
      docRevision: null,
    });

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("snapshot_revision_unavailable");
    expect(writeCloudDraftSnapshotMock).not.toHaveBeenCalled();
    expect(mockBucketDelete).not.toHaveBeenCalled();
  });

  it("TC-D12: fence write passes products and revisionsById from snapshot", async () => {
    const snapshotProducts = [
      { imageFiles: "xa-b/other-product/other-image.png", slug: "other-product" },
    ];
    const snapshotRevisions = { "other-product": "rev-abc" };
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: snapshotProducts,
      revisionsById: snapshotRevisions,
      docRevision: "rev-42",
    });

    const { DELETE } = await import("../route");
    const request = makeDeleteRequest({
      storefront: "xa-b",
      key: "xa-b/hermes-birkin-25/1234567890-abc123456789.png",
    });

    await DELETE(request);

    expect(writeCloudDraftSnapshotMock).toHaveBeenCalledWith({
      storefront: "xa-b",
      products: snapshotProducts,
      revisionsById: snapshotRevisions,
      ifMatchDocRevision: "rev-42",
    });
  });
});
