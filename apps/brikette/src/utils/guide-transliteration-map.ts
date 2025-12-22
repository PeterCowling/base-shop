// Transliteration map for guide slugs (data-driven)
// Source: transliteration@2.3.5 (MIT) – see LICENSE entry in vendor notice.
// Data shards live under `src/data/guides/transliteration/*.json`.
// Keep this loader narrow and typed.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- LINT-1007 [ttl=2026-12-31] JSON import is emitted by the build pipeline
// @ts-ignore - JSON imported at build time
import RAW_MAP from "../data/guides/transliteration/all.json";

export const GUIDE_TRANSLITERATION_MAP = Object.freeze(
  (RAW_MAP as unknown) as Record<string, string>,
);
