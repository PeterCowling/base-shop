import type { MetadataRoute } from "next";

export const runtime = "edge";

function isStealthEnabled() {
  return ["1", "true", "yes", "on"].includes(
    (
      process.env.XA_STEALTH_MODE ??
      process.env.STEALTH_MODE ??
      process.env.NEXT_PUBLIC_STEALTH_MODE ??
      ""
    ).toLowerCase(),
  );
}

export default function robots(): MetadataRoute.Robots {
  if (isStealthEnabled()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  const allowIndex = process.env.XA_ALLOW_INDEXING === "true";
  if (allowIndex) {
    return {
      rules: [{ userAgent: "*", allow: "/" }],
    };
  }
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
