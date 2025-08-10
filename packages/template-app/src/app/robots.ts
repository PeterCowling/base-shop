import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/ai/catalog"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    additionalSitemaps: [`${base}/api/ai/catalog`],
  };
}
