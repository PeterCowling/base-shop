import { NextResponse } from "next/server";

import { getJob } from "../../../../../../lib/submissionJobStore";
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
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { jobId } = await context.params;
  if (jobId.length > 64 || !UUID_RE.test(jobId)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const kv = await getUploaderKv();
  if (!kv) {
    return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });
  }

  const job = await getJob(kv, jobId);
  if (!job) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    ...job,
    downloadUrl:
      job.status === "complete"
        ? job.downloadUrl ?? `/api/catalog/submission/download/${jobId}`
        : job.downloadUrl,
  });
}
