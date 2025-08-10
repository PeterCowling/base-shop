import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const now = new Date().toISOString();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/api/ai/catalog`, lastModified: now },
  ];
}
