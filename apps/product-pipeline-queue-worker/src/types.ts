/* i18n-exempt file -- PP-1100 Stage M queue worker types [ttl=2026-06-30] */

export type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results?: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
  run: () => Promise<{ meta?: { changes?: number } }>;
};

export type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<unknown>;
};

export type R2Bucket = {
  put: (
    key: string,
    value: Blob | ArrayBuffer | ReadableStream<Uint8Array> | string,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ) => Promise<unknown>;
};

export type Env = {
  PIPELINE_DB: D1Database;
  PIPELINE_EVIDENCE: R2Bucket;
  PIPELINE_RUNNER_USER_AGENT?: string;
  PIPELINE_RUNNER_ACCEPT_LANGUAGE?: string;
  PIPELINE_RUNNER_CAPTURE_TIMEOUT_MS?: string;
};

export type StageMJobInput = {
  kind: "amazon_search" | "amazon_listing" | "taobao_listing";
  marketplace?: string;
  query?: string;
  url?: string;
  maxResults?: number;
  notes?: string;
  captureMode?: "queue" | "runner";
  captureProfile?: string;
};

export type StageMQueueMessage = {
  jobId: string;
  candidateId: string;
  stage: "M";
  kind: StageMJobInput["kind"];
  input: StageMJobInput;
  enqueuedAt: string;
  source: string;
};

export type StageRunRow = {
  id: string;
  candidate_id: string | null;
  stage: string;
  status: string;
  input_json: string | null;
  output_json: string | null;
  error_json: string | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type StageMItem = {
  price?: unknown;
  reviews?: unknown;
  sponsored?: unknown;
};

export type StageMOutput = {
  kind?: string;
  marketplace?: string | null;
  query?: string | null;
  url?: string | null;
  maxResults?: number | null;
  priceSample?: number[];
  priceMin?: number | null;
  priceMax?: number | null;
  priceMedian?: number | null;
  reviewMedian?: number | null;
  sponsoredShare?: number | null;
  generatedAt?: string | null;
};

export type RunnerError = {
  message: string;
  code?: string;
  details?: unknown;
};

export type StoredArtifact = {
  kind: string;
  uri: string;
};
