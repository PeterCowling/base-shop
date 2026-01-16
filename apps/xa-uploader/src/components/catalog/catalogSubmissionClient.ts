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
  const response = await fetch("/api/catalog/submission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slugs, storefront }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackError);
  }

  const blob = await response.blob();
  const filename =
    parseFilenameFromDisposition(response.headers.get("Content-Disposition")) || "submission.zip";
  const submissionId = response.headers.get("X-XA-Submission-Id") || "";
  const r2Key = response.headers.get("X-XA-Submission-R2-Key") || "";
  return { blob, filename, submissionId, r2Key };
}
