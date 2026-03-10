// apps/brikette/src/test/utils/entryAttribution.test.ts
// Test stubs for entryAttribution utility.
// Tests run in CI only — never run jest locally (docs/testing-policy.md).

import type { EntryAttributionPayload } from "@/utils/entryAttribution";

const samplePayload: EntryAttributionPayload = {
  source_surface: "content_page",
  source_cta: "sticky_cta",
  resolved_intent: "hostel",
  product_type: null,
  decision_mode: "direct_resolution",
  destination_funnel: "hostel_central",
  locale: "en",
  fallback_triggered: false,
  next_page: "/en/book",
};

describe("entryAttribution", () => {
  test.todo("write/read round-trip: writeAttribution followed by readAttribution returns identical payload");

  test.todo(
    "incognito failure mode: when sessionStorage.setItem throws, writeAttribution does not throw and readAttribution returns null"
  );

  test.todo(
    "URL decoration: decorateUrlWithAttribution appends _bsrc, _bint, and _bfun query params to the given URL"
  );

  test.todo("clearAttribution removes the stored key so readAttribution returns null after clear");

  test.todo("readAttribution returns null when sessionStorage has no entry for the key");

  test.todo(
    "SSR safety: readAttribution and writeAttribution return early without throwing when window is undefined"
  );
});

// Suppress unused import warning during stub phase
void samplePayload;
