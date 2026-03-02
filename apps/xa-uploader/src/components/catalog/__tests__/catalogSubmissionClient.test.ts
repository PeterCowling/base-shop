import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  enqueueSubmissionJob,
  fetchSubmissionZip,
  parseFilenameFromDisposition,
  pollJobUntilComplete,
  pollSubmissionJobStatus,
  SubmissionApiError,
} from "../catalogSubmissionClient";

describe("catalogSubmissionClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses filename from Content-Disposition header", () => {
    expect(parseFilenameFromDisposition('attachment; filename="submission.zip"')).toBe("submission.zip");
    expect(parseFilenameFromDisposition("attachment")).toBeNull();
    expect(parseFilenameFromDisposition(null)).toBeNull();
  });

  it("enqueueSubmissionJob returns job id on success", async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ ok: true, jobId: "job-1" }), { status: 202 })) as unknown as typeof fetch;

    await expect(enqueueSubmissionJob(["studio-jacket"], "xa-b")).resolves.toEqual({ jobId: "job-1" });
  });

  it("enqueueSubmissionJob throws SubmissionApiError with reason on api failure", async () => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ error: "invalid", reason: "too_many_submission_slugs" }), { status: 400 })) as unknown as typeof fetch;

    await expect(enqueueSubmissionJob(["x"])).rejects.toMatchObject({
      name: "SubmissionApiError",
      message: "invalid",
      reason: "too_many_submission_slugs",
    });
  });

  it("pollSubmissionJobStatus throws poll_failed for non-ok status response", async () => {
    global.fetch = jest.fn(async () => new Response(null, { status: 500 })) as unknown as typeof fetch;
    await expect(pollSubmissionJobStatus("job-1")).rejects.toThrow("poll_failed");
  });

  it("pollJobUntilComplete resolves download url when job completes", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, status: "pending" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, status: "complete", downloadUrl: "/api/catalog/submission/download/job-1" }),
          { status: 200 },
        ),
      ) as unknown as typeof fetch;

    await expect(pollJobUntilComplete("job-1", { intervalMs: 1, maxWaitMs: 100 })).resolves.toBe(
      "/api/catalog/submission/download/job-1",
    );
  });

  it("pollJobUntilComplete throws when complete status has no download url", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, status: "complete" }), { status: 200 })) as unknown as typeof fetch;

    await expect(pollJobUntilComplete("job-1", { intervalMs: 1, maxWaitMs: 50 })).rejects.toThrow(
      "missing_download_url",
    );
  });

  it("pollJobUntilComplete throws failed reason from backend", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, status: "failed", error: "submission_job_failed" }), { status: 200 }),
      ) as unknown as typeof fetch;

    await expect(pollJobUntilComplete("job-1", { intervalMs: 1, maxWaitMs: 50 })).rejects.toThrow(
      "submission_job_failed",
    );
  });

  it("pollJobUntilComplete throws submission_timeout when status never completes", async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true, status: "pending" }), { status: 200 }),
      ) as unknown as typeof fetch;

    const pending = pollJobUntilComplete("job-1", { intervalMs: 5, maxWaitMs: 20 });
    const assertion = expect(pending).rejects.toThrow("submission_timeout");
    await jest.advanceTimersByTimeAsync(50);
    await assertion;
    jest.useRealTimers();
  });

  it("fetchSubmissionZip downloads blob and filename", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, jobId: "job-1" }), { status: 202 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, status: "complete", downloadUrl: "/api/catalog/submission/download/job-1" }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(new Blob(["zip-binary"]), {
          status: 200,
          headers: { "Content-Disposition": 'attachment; filename="submission.2026-03-02.zip"' },
        }),
      ) as unknown as typeof fetch;

    const result = await fetchSubmissionZip(["studio-jacket"], "fallback_error", "xa-b");
    expect(result.filename).toBe("submission.2026-03-02.zip");
    expect(result.submissionId).toBe("job-1");
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("fetchSubmissionZip wraps unknown failures in fallback SubmissionApiError", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    await expect(fetchSubmissionZip(["studio-jacket"], "fallback_error", "xa-b")).rejects.toMatchObject({
      name: "SubmissionApiError",
      message: "fallback_error",
    });
  });

  it("fetchSubmissionZip preserves SubmissionApiError details", async () => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ error: "invalid", reason: "invalid_json" }), { status: 400 })) as unknown as typeof fetch;

    const err = await fetchSubmissionZip(["studio-jacket"], "fallback_error", "xa-b").catch((error) => error as Error);
    expect(err).toBeInstanceOf(SubmissionApiError);
    expect(err.message).toBe("invalid");
    expect((err as SubmissionApiError).reason).toBe("invalid_json");
  });
});
