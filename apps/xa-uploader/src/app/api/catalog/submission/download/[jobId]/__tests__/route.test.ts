import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const hasUploaderSessionMock = jest.fn();
const getUploaderKvMock = jest.fn();
const getJobMock = jest.fn();

const TEST_JOB_ID = "9cbf271e-8e08-4dbe-8f31-398e9168f6b0";

jest.mock("../../../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../../../lib/syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
}));

jest.mock("../../../../../../../lib/submissionJobStore", () => ({
  getJob: (...args: unknown[]) => getJobMock(...args),
  zipKey: (jobId: string) => `xa-submission-zip:${jobId}`,
}));

describe("catalog submission download route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    getUploaderKvMock.mockResolvedValue({
      get: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      put: jest.fn(),
      delete: jest.fn(),
    });
    getJobMock.mockResolvedValue({
      status: "complete",
      createdAt: "2026-03-02T00:00:00.000Z",
      updatedAt: "2026-03-02T00:01:00.000Z",
      downloadUrl: `/api/catalog/submission/download/${TEST_JOB_ID}`,
    });
  });

  it("returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/download"), {
      params: Promise.resolve({ jobId: TEST_JOB_ID }),
    });

    expect(response.status).toBe(404);
    expect(getUploaderKvMock).not.toHaveBeenCalled();
  });

  it("returns 404 for invalid job id", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/download"), {
      params: Promise.resolve({ jobId: "bad-job-id" }),
    });

    expect(response.status).toBe(404);
    expect(getUploaderKvMock).not.toHaveBeenCalled();
  });

  it("returns 503 when kv is unavailable", async () => {
    getUploaderKvMock.mockResolvedValueOnce(null);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/download"), {
      params: Promise.resolve({ jobId: TEST_JOB_ID }),
    });

    expect(response.status).toBe(503);
  });

  it("returns 404 when job does not exist", async () => {
    getJobMock.mockResolvedValueOnce(null);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/download"), {
      params: Promise.resolve({ jobId: TEST_JOB_ID }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when zip object is missing", async () => {
    const kvGet = jest.fn().mockResolvedValue(null);
    getUploaderKvMock.mockResolvedValueOnce({ get: kvGet, put: jest.fn(), delete: jest.fn() });

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/download"), {
      params: Promise.resolve({ jobId: TEST_JOB_ID }),
    });

    expect(response.status).toBe(404);
    expect(kvGet).toHaveBeenCalledWith(`xa-submission-zip:${TEST_JOB_ID}`, { type: "arrayBuffer" });
  });

  it("returns zip payload with attachment headers", async () => {
    const zipData = new TextEncoder().encode("zip-body").buffer;
    const kvGet = jest.fn().mockResolvedValue(zipData);
    getUploaderKvMock.mockResolvedValueOnce({ get: kvGet, put: jest.fn(), delete: jest.fn() });

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/download"), {
      params: Promise.resolve({ jobId: TEST_JOB_ID }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(response.headers.get("Content-Disposition")).toContain(`submission-${TEST_JOB_ID}.zip`);
    const bytes = await response.arrayBuffer();
    expect(bytes.byteLength).toBe(zipData.byteLength);
  });
});
