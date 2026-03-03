export function parseFilenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/filename="([^"]+)"/);
  return match?.[1] || null;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export class SubmissionApiError extends Error {
  reason?: string;

  constructor(message: string, reason?: string) {
    super(message);
    this.name = "SubmissionApiError";
    this.reason = reason;
  }
}

export async function enqueueSubmissionJob(
  slugs: string[],
  storefront?: string,
): Promise<{ jobId: string }> {
  const response = await fetch("/api/catalog/submission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slugs, storefront }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string; reason?: string } | null;
    throw new SubmissionApiError(data?.error || "submission_failed", data?.reason);
  }

  const data = (await response.json().catch(() => null)) as { ok?: boolean; jobId?: string } | null;
  if (!data?.ok || !data.jobId) {
    throw new SubmissionApiError("submission_failed");
  }
  return { jobId: data.jobId };
}

export async function pollSubmissionJobStatus(jobId: string): Promise<{
  status: string;
  downloadUrl?: string;
  error?: string;
}> {
  const response = await fetch(`/api/catalog/submission/status/${encodeURIComponent(jobId)}`);
  if (!response.ok) {
    throw new SubmissionApiError("poll_failed");
  }
  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; status?: string; downloadUrl?: string; error?: string }
    | null;
  return {
    status: data?.status ?? "unknown",
    downloadUrl: data?.downloadUrl,
    error: data?.error,
  };
}

export async function pollJobUntilComplete(
  jobId: string,
  options?: { maxWaitMs?: number; intervalMs?: number },
): Promise<string> {
  const maxWaitMs = Math.max(1, Math.min(options?.maxWaitMs ?? 120_000, 120_000));
  const intervalMs = Math.max(1, Math.min(options?.intervalMs ?? 2_000, 2_000));
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const status = await pollSubmissionJobStatus(jobId);
    if (status.status === "complete") {
      if (!status.downloadUrl) throw new SubmissionApiError("missing_download_url");
      return status.downloadUrl;
    }
    if (status.status === "failed") {
      throw new SubmissionApiError(status.error ?? "submission_job_failed");
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new SubmissionApiError("submission_timeout");
}

export async function fetchSubmissionZip(
  slugs: string[],
  fallbackError: string,
  storefront?: string,
): Promise<{
  blob: Blob;
  filename: string;
  submissionId: string;
  r2Key: string;
}> {
  try {
    const { jobId } = await enqueueSubmissionJob(slugs, storefront);
    const downloadUrl = await pollJobUntilComplete(jobId);
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new SubmissionApiError("download_failed");
    }
    const blob = await response.blob();
    const filename =
      parseFilenameFromDisposition(response.headers.get("Content-Disposition")) || "submission.zip";
    return { blob, filename, submissionId: jobId, r2Key: "" };
  } catch (error) {
    if (error instanceof SubmissionApiError) {
      throw error;
    }
    throw new SubmissionApiError(fallbackError);
  }
}
