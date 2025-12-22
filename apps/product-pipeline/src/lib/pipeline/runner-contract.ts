/* i18n-exempt file -- PP-1100 internal pipeline contract [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/pipeline/runner-contract.ts

export type PipelineStage = "P" | "M";
export type RunnerStage = "M";

export type RunnerJobStatus = "queued" | "running" | "succeeded" | "failed";

export type StageMJobKind = "amazon_search" | "amazon_listing" | "taobao_listing";

export type StageMJobInput = {
  kind: StageMJobKind;
  marketplace?: string;
  query?: string;
  url?: string;
  maxResults?: number;
  notes?: string;
  captureMode?: "queue" | "runner";
  captureProfile?: string;
};

export type RunnerJob = {
  id: string;
  stage: RunnerStage;
  status: RunnerJobStatus;
  candidateId: string;
  leadId?: string | null;
  input: StageMJobInput;
  createdAt: string;
  startedAt?: string | null;
};

export type RunnerClaimRequest = {
  runnerId: string;
  stage?: RunnerStage;
  limit?: number;
  captureMode?: "queue" | "runner";
};

export type RunnerClaimResponse = {
  jobs: RunnerJob[];
};

export type RunnerArtifact = {
  kind: string;
  uri: string;
  checksum?: string;
};

export type RunnerError = {
  message: string;
  code?: string;
  details?: unknown;
};

export type RunnerCompleteRequest = {
  jobId: string;
  status: "succeeded" | "failed";
  output?: unknown;
  error?: RunnerError;
  artifacts?: RunnerArtifact[];
};
