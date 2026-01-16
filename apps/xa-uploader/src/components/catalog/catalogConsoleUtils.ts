export function toErrorMap(error: unknown) {
  if (!error || typeof error !== "object") return {};
  if (!("issues" in error)) return {};
  const issues = (error as { issues: Array<{ path: Array<string | number>; message: string }> })
    .issues;
  const out: Record<string, string> = {};
  issues.forEach((issue) => {
    const key = issue.path.map(String).join(".");
    out[key] ||= issue.message;
  });
  return out;
}

export function buildLogBlock(
  label: string,
  entry?: { code: number; stdout: string; stderr: string },
) {
  if (!entry) return "";
  const chunks = [`# ${label} (exit ${entry.code})`];
  if (entry.stdout.trim()) chunks.push(entry.stdout.trim());
  if (entry.stderr.trim()) chunks.push(entry.stderr.trim());
  return chunks.join("\n\n").trim();
}

