import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const hasUploaderSessionMock = jest.fn();
const getMediaBucketMock = jest.fn();
const parseImageDimensionsFromBufferMock = jest.fn();
const validateMinImageEdgeMock = jest.fn();

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/r2Media", () => ({
  getMediaBucket: (...args: unknown[]) => getMediaBucketMock(...args),
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
  params: { storefront?: string; slug?: string; role?: string } = {},
): Request {
  const url = new URL("http://localhost/api/catalog/images");
  if (params.storefront) url.searchParams.set("storefront", params.storefront);
  if (params.slug) url.searchParams.set("slug", params.slug);
  if (params.role) url.searchParams.set("role", params.role);

  const formData = new FormData();
  if (file) formData.append("file", file);

  return new Request(url.toString(), {
    method: "POST",
    body: formData,
  });
}

function makeValidFile(sizeBytes = 1024): File {
  const buf = makePngMagicBytes();
  const content = Buffer.concat([buf, Buffer.alloc(Math.max(0, sizeBytes - buf.length))]);
  return new File([content], "test.png", { type: "image/png" });
}

const mockBucketPut = jest.fn();
const mockBucket = { put: mockBucketPut, get: jest.fn(), head: jest.fn() };

describe("catalog images route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    getMediaBucketMock.mockResolvedValue(mockBucket);
    parseImageDimensionsFromBufferMock.mockReturnValue({ format: "png", width: 2000, height: 1800 });
    validateMinImageEdgeMock.mockReturnValue(true);
    mockBucketPut.mockResolvedValue({ key: "test-key" });
  });

  it("TC-01: authenticated upload of valid image returns 200 with key", async () => {
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "hermes-birkin-25",
      role: "front",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.key).toMatch(/^xa-b\/hermes-birkin-25\/\d+-front\.png$/);
    expect(mockBucketPut).toHaveBeenCalledTimes(1);
  });

  it("TC-02: unauthenticated request returns 404", async () => {
    hasUploaderSessionMock.mockResolvedValue(false);
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
      role: "front",
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
      role: "front",
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
      role: "front",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error).toBe("file_too_large");
  });

  it("TC-05: undersized image returns 400 image_too_small", async () => {
    validateMinImageEdgeMock.mockReturnValue(false);
    parseImageDimensionsFromBufferMock.mockReturnValue({ format: "png", width: 800, height: 600 });
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
      role: "front",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("image_too_small");
  });

  it("TC-06: missing file returns 400 no_file", async () => {
    const { POST } = await import("../route");
    const request = makeFormDataRequest(null, {
      storefront: "xa-b",
      slug: "test",
      role: "front",
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
      // slug and role missing
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("missing_params");
  });

  it("TC-08: R2 put failure returns 500 upload_failed", async () => {
    mockBucketPut.mockRejectedValue(new Error("R2 write error"));
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
      role: "front",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("upload_failed");
  });

  it("TC-09: R2 bucket unavailable returns 503", async () => {
    getMediaBucketMock.mockResolvedValue(null);
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
      role: "front",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe("r2_unavailable");
  });
});
