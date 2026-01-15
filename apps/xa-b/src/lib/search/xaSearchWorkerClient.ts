"use client";

import type {
  XaSearchWorkerRequest,
  XaSearchWorkerResponse,
} from "./xaSearchProtocol";
import type { XaSearchDoc } from "./xaSearchConfig";
import type { XaSearchIndexJson } from "./xaSearchDb";

type PendingRequest = {
  resolve: (value: XaSearchWorkerResponse) => void;
  reject: (error: Error) => void;
  timeoutId: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;

let worker: Worker | null = null;
const pending = new Map<string, PendingRequest>();

function createRequestId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./xaSearch.worker.ts", import.meta.url), { type: "module" });
  worker.addEventListener("message", (event: MessageEvent<XaSearchWorkerResponse>) => {
    const message = event.data;
    if (!message || typeof message !== "object") return;
    const entry = pending.get(message.requestId);
    if (!entry) return;
    pending.delete(message.requestId);
    clearTimeout(entry.timeoutId);
    entry.resolve(message);
  });
  worker.addEventListener("error", (event) => {
    const error =
      event instanceof ErrorEvent
        ? event.error
        : new Error("Search worker failed"); // i18n-exempt -- XA-0100 [ttl=2026-12-31] internal error
    for (const [requestId, entry] of pending.entries()) {
      pending.delete(requestId);
      clearTimeout(entry.timeoutId);
      entry.reject(error);
    }
  });
  return worker;
}

async function request(message: XaSearchWorkerRequest, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const instance = getWorker();
  return await new Promise<XaSearchWorkerResponse>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pending.delete(message.requestId);
      reject(new Error("Search worker timed out")); // i18n-exempt -- XA-0100 [ttl=2026-12-31] internal error
    }, timeoutMs);
    pending.set(message.requestId, { resolve, reject, timeoutId });
    instance.postMessage(message);
  });
}

export async function buildXaSearchIndex(docs: XaSearchDoc[]) {
  const requestId = createRequestId();
  const res = await request({ requestId, action: "build", docs });
  if (res.ok === false) throw new Error(res.error);
  if (res.action !== "build") throw new Error("Unexpected search worker response"); // i18n-exempt -- XA-0100 [ttl=2026-12-31] internal error
  return res.index;
}

export async function loadXaSearchIndex(index: XaSearchIndexJson) {
  const requestId = createRequestId();
  const res = await request({ requestId, action: "load", index });
  if (res.ok === false) throw new Error(res.error);
  if (res.action !== "load") throw new Error("Unexpected search worker response"); // i18n-exempt -- XA-0100 [ttl=2026-12-31] internal error
}

export async function searchXaIndex(query: string, limit: number) {
  const requestId = createRequestId();
  const res = await request({ requestId, action: "search", query, limit });
  if (res.ok === false) throw new Error(res.error);
  if (res.action !== "search") throw new Error("Unexpected search worker response"); // i18n-exempt -- XA-0100 [ttl=2026-12-31] internal error
  return res.ids;
}
