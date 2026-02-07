import type { XaSearchDoc } from "./xaSearchConfig";
import type { XaSearchIndexJson } from "./xaSearchDb";

export type XaSearchWorkerAction = "build" | "load" | "search";

export type XaSearchWorkerRequest =
  | { requestId: string; action: "build"; docs: XaSearchDoc[] }
  | { requestId: string; action: "load"; index: XaSearchIndexJson }
  | { requestId: string; action: "search"; query: string; limit: number };

export type XaSearchWorkerResponse =
  | { requestId: string; ok: true; action: "build"; index: XaSearchIndexJson }
  | { requestId: string; ok: true; action: "load" }
  | { requestId: string; ok: true; action: "search"; ids: string[] }
  | { requestId: string; ok: false; action: XaSearchWorkerAction; error: string };
