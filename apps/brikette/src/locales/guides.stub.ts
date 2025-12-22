// file path: src/locales/guides.stub.ts
// -----------------------------------------------------------------------------
// Test-only fallback seed for the `guides` namespace. This surface remains a
// tiny aggregator and defers heavy data to single-purpose modules.
// -----------------------------------------------------------------------------

import type { GuidesNamespace } from "./guides.types";
import { labels } from "./guides.stub/labels";
import { breadcrumbs } from "./guides.stub/breadcrumbs";
import { tagsIndex } from "./guides.stub/tagsIndex";
import { components } from "./guides.stub/components";
import { transportNotice } from "./guides.stub/transportNotice";
import { meta } from "./guides.stub/meta";
import { content } from "./guides.stub/content";

export const guidesTestStubBundle: GuidesNamespace = {
  labels,
  breadcrumbs,
  tagsIndex,
  components,
  transportNotice,
  meta,
  content,
};
