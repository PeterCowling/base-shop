import MiniSearch from "minisearch";

import {
  XA_MINISEARCH_FIELDS,
  XA_MINISEARCH_SEARCH_OPTIONS,
  XA_MINISEARCH_STORE_FIELDS,
  xaMiniSearchProcessTerm,
  type XaSearchDoc,
} from "./xaSearchConfig";
import type { XaSearchIndexJson } from "./xaSearchDb";
import type { XaSearchWorkerRequest, XaSearchWorkerResponse } from "./xaSearchProtocol";

type XaIndex = MiniSearch<XaSearchDoc>;

function createIndex(): XaIndex {
  return new MiniSearch<XaSearchDoc>({
    fields: XA_MINISEARCH_FIELDS,
    storeFields: XA_MINISEARCH_STORE_FIELDS,
    processTerm: xaMiniSearchProcessTerm,
    searchOptions: XA_MINISEARCH_SEARCH_OPTIONS,
  });
}

let index: XaIndex | null = null;

function ensureIndex() {
  if (!index) index = createIndex();
  return index;
}

function respond(message: XaSearchWorkerResponse) {
  self.postMessage(message);
}

self.addEventListener("message", (event: MessageEvent<XaSearchWorkerRequest>) => {
  const message = event.data;
  if (!message || typeof message !== "object") return;

  const requestId = message.requestId;
  try {
    if (message.action === "build") {
      const next = createIndex();
      next.addAll(message.docs);
      index = next;
      const serialized = JSON.stringify(next) as XaSearchIndexJson;
      respond({ requestId, ok: true, action: "build", index: serialized });
      return;
    }

    if (message.action === "load") {
      index = MiniSearch.loadJSON(message.index, {
        fields: XA_MINISEARCH_FIELDS,
        storeFields: XA_MINISEARCH_STORE_FIELDS,
        processTerm: xaMiniSearchProcessTerm,
        searchOptions: XA_MINISEARCH_SEARCH_OPTIONS,
      });
      respond({ requestId, ok: true, action: "load" });
      return;
    }

    if (message.action === "search") {
      const engine = ensureIndex();
      const trimmed = message.query.trim();
      if (!trimmed) {
        respond({ requestId, ok: true, action: "search", ids: [] });
        return;
      }
      const results = engine.search(trimmed, XA_MINISEARCH_SEARCH_OPTIONS);
      const ids = results
        .slice(0, message.limit)
        .map((result) => String(result.id));
      respond({ requestId, ok: true, action: "search", ids });
      return;
    }
  } catch (err) {
    respond({
      requestId,
      ok: false,
      action: message.action,
      error: err instanceof Error ? err.message : "Search worker error", // i18n-exempt -- XA-0100 [ttl=2026-12-31] internal error
    });
  }
});
