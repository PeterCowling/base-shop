import type { MetadataRoute } from "next";
import { env } from "@acme/config";

export default function robots(): MetadataRoute.Robots {
    const base = env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/ai-sitemap.xml`],
  };
}
