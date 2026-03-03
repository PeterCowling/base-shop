import { describe, expect, it, jest } from "@jest/globals";

import { enqueueJob, getJob, JOB_TTL_SECONDS, updateJob } from "../submissionJobStore";

describe("submissionJobStore", () => {
  it("enqueueJob writes pending state with ttl", async () => {
    const put = jest.fn().mockResolvedValue(undefined);

    await enqueueJob({ put, get: jest.fn(), delete: jest.fn() }, "job-1");

    expect(put).toHaveBeenCalledWith(
      "xa-submission-job:job-1",
      expect.any(String),
      { expirationTtl: JOB_TTL_SECONDS },
    );
    const payload = JSON.parse(put.mock.calls[0][1] as string) as { status: string };
    expect(payload.status).toBe("pending");
  });

  it("updateJob is noop when job key is missing", async () => {
    const kv = {
      get: jest.fn().mockResolvedValue(null),
      put: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    await updateJob(kv, "job-1", { status: "running" });

    expect(kv.put).not.toHaveBeenCalled();
  });

  it("updateJob merges patch and refreshes updatedAt", async () => {
    const current = {
      status: "pending",
      createdAt: "2026-03-02T00:00:00.000Z",
      updatedAt: "2026-03-02T00:00:00.000Z",
    };

    const kv = {
      get: jest.fn().mockResolvedValue(JSON.stringify(current)),
      put: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    await updateJob(kv, "job-1", { status: "running" });

    const payload = JSON.parse(kv.put.mock.calls[0][1] as string) as {
      status: string;
      updatedAt: string;
    };
    expect(payload.status).toBe("running");
    expect(payload.updatedAt).not.toBe(current.updatedAt);
  });

  it("getJob returns null when json is malformed", async () => {
    const kv = {
      get: jest.fn().mockResolvedValue("{not-json"),
      put: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    await expect(getJob(kv, "job-1")).resolves.toBeNull();
  });
});
