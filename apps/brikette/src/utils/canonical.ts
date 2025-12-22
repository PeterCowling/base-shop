// src/utils/canonical.ts
import { BASE_URL } from "@/config/site";

type CanonicalArgs = { lang: string; segments: readonly string[] };

export function getCanonicalUrl({ lang, segments }: CanonicalArgs): string {
  const path = ["", lang, ...segments].join("/").replace(/\/{2,}/g, "/");
  return `${BASE_URL}${path}`;
}

