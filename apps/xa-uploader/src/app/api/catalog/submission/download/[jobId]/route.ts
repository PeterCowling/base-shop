import {
  getJob,
  type SubmissionKvNamespace,
  zipKey,
} from "../../../../../../lib/submissionJobStore";
import { getUploaderKv } from "../../../../../../lib/syncMutex";
import { hasUploaderSession } from "../../../../../../lib/uploaderAuth";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return new Response(null, { status: 404 });
  }

  const { jobId } = await context.params;
  if (jobId.length > 64 || !UUID_RE.test(jobId)) {
    return new Response(null, { status: 404 });
  }

  const kv = await getUploaderKv();
  if (!kv) {
    return new Response(null, { status: 503 });
  }

  const job = await getJob(kv, jobId);
  if (!job) {
    return new Response(null, { status: 404 });
  }

  const zipData = await (kv as SubmissionKvNamespace)
    .get(zipKey(jobId), { type: "arrayBuffer" })
    .catch(() => null);
  if (!zipData) {
    return new Response(null, { status: 404 });
  }

  return new Response(zipData, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="submission-${jobId}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
