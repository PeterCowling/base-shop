import type { UploaderKvNamespace } from "./syncMutex";

export type SubmissionJobState = {
  status: "pending" | "running" | "complete" | "failed";
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
  error?: string;
};

export type SubmissionKvNamespace = UploaderKvNamespace & {
  get(key: string): Promise<string | null>;
  get(key: string, options: { type: "arrayBuffer" }): Promise<ArrayBuffer | null>;
  put(
    key: string,
    value: string | ArrayBuffer | Buffer,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

export const JOB_TTL_SECONDS = 3600;

function jobKey(jobId: string): string {
  return `xa-submission-job:${jobId}`;
}

export function zipKey(jobId: string): string {
  return `xa-submission-zip:${jobId}`;
}

export async function enqueueJob(kv: UploaderKvNamespace, jobId: string): Promise<void> {
  const now = new Date().toISOString();
  const state: SubmissionJobState = { status: "pending", createdAt: now, updatedAt: now };
  await kv.put(jobKey(jobId), JSON.stringify(state), { expirationTtl: JOB_TTL_SECONDS });
}

export async function updateJob(
  kv: UploaderKvNamespace,
  jobId: string,
  patch: Partial<SubmissionJobState>,
): Promise<void> {
  const raw = await kv.get(jobKey(jobId));
  if (!raw) return;
  const current = JSON.parse(raw) as SubmissionJobState;
  const state: SubmissionJobState = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await kv.put(jobKey(jobId), JSON.stringify(state), { expirationTtl: JOB_TTL_SECONDS });
}

export async function getJob(kv: UploaderKvNamespace, jobId: string): Promise<SubmissionJobState | null> {
  const raw = await kv.get(jobKey(jobId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SubmissionJobState;
  } catch {
    return null;
  }
}
