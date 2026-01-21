// file path: src/locales/guides.stub.ts
// -----------------------------------------------------------------------------
// Test-only fallback seed for the `guides` namespace. This surface remains a
// tiny aggregator and defers heavy data to single-purpose modules.
// -----------------------------------------------------------------------------

import { breadcrumbs } from "./guides.stub/breadcrumbs";
import { components } from "./guides.stub/components";
import { content } from "./guides.stub/content";
import { labels } from "./guides.stub/labels";
import { meta } from "./guides.stub/meta";
import { tagsIndex } from "./guides.stub/tagsIndex";
import { transportNotice } from "./guides.stub/transportNotice";
import type { GuidesNamespace } from "./guides.types";

export const guidesTestStubBundle: GuidesNamespace = {
  labels,
  breadcrumbs,
  tagsIndex,
  components,
  transportNotice,
  meta,
  content,
};
