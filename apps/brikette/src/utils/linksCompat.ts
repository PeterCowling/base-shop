// src/utils/linksCompat.ts
// Helper to adapt legacy links implementations that expect optional `{ data }`
// to the React Router v7 zero‑arg LinksFunction shape without churn.
import type { LinkDescriptor, LinksFunction } from "react-router";

type LegacyLinks = (args?: { data?: unknown; location?: unknown } | unknown) => LinkDescriptor[];

export function toLinks(fn: LegacyLinks): LinksFunction {
  // React Router v7 calls links() with no args; forward undefined so
  // legacy implementations that handle missing data still work.
  return (() => fn(undefined)) as unknown as LinksFunction;
}
