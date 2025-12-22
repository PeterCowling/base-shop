// src/routes/guides/fiordo-di-furore-bus-return/constants.ts
import type { GuideKey } from "@/routes.guides-helpers";

// i18n-exempt -- I18N-TECHDEBT [ttl=2026-12-31] Guide identifier used for content lookups; copy resides in localisation bundles
export const GUIDE_KEY = "fiordoDiFuroreBusReturn" as const satisfies GuideKey;
export const GUIDE_SLUG = "fiordo-di-furore-bus-return" as const;

export const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;
