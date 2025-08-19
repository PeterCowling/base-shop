import type { MetadataRoute } from "next";
import { coreEnv } from "@acme/config/env/core";

export default function robots(): MetadataRoute.Robots {
  const base = coreEnv.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/ai-sitemap.xml`],
  };
}
