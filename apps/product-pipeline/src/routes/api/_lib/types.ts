/* i18n-exempt file -- PP-1100 internal pipeline types [ttl=2026-06-30] */

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

export type R2HttpMetadata = {
  contentType?: string;
};

export type R2Object = {
  body: ReadableStream<Uint8Array> | null;
  httpMetadata?: R2HttpMetadata;
};

export type R2Bucket = {
  put: (
    key: string,
    value: Blob | ArrayBuffer | ReadableStream<Uint8Array> | string,
    options?: {
      httpMetadata?: R2HttpMetadata;
      customMetadata?: Record<string, string>;
    },
  ) => Promise<unknown>;
  get: (key: string) => Promise<R2Object | null>;
};

export type Queue<Body = unknown> = {
  send: (message: Body) => Promise<void>;
  sendBatch?: (messages: Body[]) => Promise<void>;
};

export type PipelineEventContext<Env, Params = Record<string, string>> = {
  request: Request;
  env: Env;
  params: Params;
};
