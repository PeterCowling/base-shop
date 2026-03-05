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
    expect(body.key).toMatch(/^xa-b\/hermes-birkin-25\/\d+-front-[a-f0-9]{12}\.png$/);
    expect(mockBucketPut).toHaveBeenCalledTimes(1);
  });

  it("TC-01b: slug and role query params are normalized before key construction", async () => {
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "Hermes Birkin 25 Noir",
      role: "Front",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.key).toMatch(/^xa-b\/hermes-birkin-25-noir\/\d+-front-[a-f0-9]{12}\.png$/);
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

  it("TC-05: valid image upload returns 200 even when mocked dimensions are small", async () => {
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

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
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

  it("TC-07b: invalid storefront/slug/role query params return 400 missing_params", async () => {
    const { POST } = await import("../route");

    const invalidStorefrontRequest = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-c",
      slug: "test",
      role: "front",
    });
    const invalidStorefrontResponse = await POST(invalidStorefrontRequest);
    const invalidStorefrontBody = await invalidStorefrontResponse.json();
    expect(invalidStorefrontResponse.status).toBe(400);
    expect(invalidStorefrontBody.error).toBe("missing_params");

    const invalidRoleRequest = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
      role: "front/../../etc",
    });
    const invalidRoleResponse = await POST(invalidRoleRequest);
    const invalidRoleBody = await invalidRoleResponse.json();
    expect(invalidRoleResponse.status).toBe(400);
    expect(invalidRoleBody.error).toBe("missing_params");

    const invalidSlugRequest = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "////",
      role: "front",
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
      role: "front",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("upload_failed");
  });

  it("TC-09: R2 bucket unavailable falls back to local file write", async () => {
    getMediaBucketMock.mockResolvedValue(null);
    const { POST } = await import("../route");
    const request = makeFormDataRequest(makeValidFile(), {
      storefront: "xa-b",
      slug: "test",
      role: "front",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(String(body.key)).toMatch(/^images\/test\/\d+-front-[a-f0-9]{12}\.png$/);
  });

  it("TC-10: same-millisecond uploads for same slug+role generate different keys", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_709_578_800_000);
    try {
      const { POST } = await import("../route");
      const firstRequest = makeFormDataRequest(makeValidFile(), {
        storefront: "xa-b",
        slug: "test",
        role: "front",
      });
      const secondRequest = makeFormDataRequest(makeValidFile(), {
        storefront: "xa-b",
        slug: "test",
        role: "front",
      });

      const firstResponse = await POST(firstRequest);
      const secondResponse = await POST(secondRequest);
      const firstBody = await firstResponse.json();
      const secondBody = await secondResponse.json();

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(firstBody.key).not.toEqual(secondBody.key);
      expect(String(firstBody.key)).toMatch(/^xa-b\/test\/1709578800000-front-[a-f0-9]{12}\.png$/);
      expect(String(secondBody.key)).toMatch(/^xa-b\/test\/1709578800000-front-[a-f0-9]{12}\.png$/);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
