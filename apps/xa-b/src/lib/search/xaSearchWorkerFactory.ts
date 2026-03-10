"use client";

export function createXaSearchWorker(): Worker {
  return new Worker(new URL("./xaSearch.worker.ts", import.meta.url), { type: "module" });
}
