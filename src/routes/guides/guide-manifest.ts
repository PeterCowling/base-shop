// src/routes/guides/guide-manifest.ts
import type { GuideKey } from "../../guides/slugs/keys";

import {
  assertKnownGuideKeys,
  type GuideManifest,
  type GuideManifestEntry,
} from "./manifest/definitions";
import { manifestSeed } from "./manifest/entries";

export * from "./manifest/definitions";
export type { GuideKey } from "../../guides/slugs/keys";

assertKnownGuideKeys(manifestSeed);

export const guideManifest: GuideManifest = allManifestEntries.reduce<GuideManifest>((acc, entry) => {
  acc[entry.key] = entry;
  return acc;
}, {} as GuideManifest);

export function getGuideManifestEntry(key: GuideKey): GuideManifestEntry | undefined {
  return guideManifest[key];
}

export function listGuideManifestEntries(): GuideManifestEntry[] {
  return Object.values(guideManifest);
}