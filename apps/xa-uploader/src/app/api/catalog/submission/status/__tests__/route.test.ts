import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const hasUploaderSessionMock = jest.fn();
const getUploaderKvMock = jest.fn();
const getJobMock = jest.fn();

const TEST_JOB_ID = "9cbf271e-8e08-4dbe-8f31-398e9168f6b0";

jest.mock("../../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../../lib/syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
}));

jest.mock("../../../../../../lib/submissionJobStore", () => ({
  getJob: (...args: unknown[]) => getJobMock(...args),
}));

describe("catalog submission status route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    getUploaderKvMock.mockResolvedValue({
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    });
    getJobMock.mockResolvedValue({
      status: "pending",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    });
  });

  it("TC-06c: returns pending submission job state", async () => {
    getJobMock.mockResolvedValueOnce({
      status: "pending",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    });

    const { GET } = await import("../[jobId]/route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/status"), {
      params: Promise.resolve({ jobId: TEST_JOB_ID }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        status: "pending",
      }),
    );
  });

  it("TC-06d: returns completed submission job state with download url", async () => {
    getJobMock.mockResolvedValueOnce({
      status: "complete",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:05:00.000Z",
      downloadUrl: `/api/catalog/submission/download/${TEST_JOB_ID}`,
    });

    const { GET } = await import("../[jobId]/route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/status"), {
      params: Promise.resolve({ jobId: TEST_JOB_ID }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        status: "complete",
        downloadUrl: `/api/catalog/submission/download/${TEST_JOB_ID}`,
      }),
    );
  });

  it("TC-06e: returns 404 when submission job id is unknown", async () => {
    getJobMock.mockResolvedValueOnce(null);

    const { GET } = await import("../[jobId]/route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/status"), {
      params: Promise.resolve({ jobId: "2182cca5-a221-4f90-8cfb-bf245a4835f2" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: false }));
  });

  it("TC-06f: returns 404 when request is unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { GET } = await import("../[jobId]/route");
    const response = await GET(new Request("http://localhost/api/catalog/submission/status"), {
      params: Promise.resolve({ jobId: TEST_JOB_ID }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: false }));
    expect(getUploaderKvMock).not.toHaveBeenCalled();
    expect(getJobMock).not.toHaveBeenCalled();
  });
});
