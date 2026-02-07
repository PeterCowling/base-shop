import type { MetadataRoute } from "next";

import { loadCoreEnv } from "@acme/config/env/core";

export default function robots(): MetadataRoute.Robots {
    const { NEXT_PUBLIC_BASE_URL } = loadCoreEnv();
    const base =
      (NEXT_PUBLIC_BASE_URL as string | undefined) ||
      "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/ai-sitemap.xml`],
  };
}
