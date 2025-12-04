import type { NextApiRequest, NextApiResponse } from "next";

const cmsBase = process.env.NEXT_PUBLIC_CMS_BASE_URL || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const shopId = Array.isArray(id) ? id[0] : id;
  if (!shopId) {
    return res.status(400).json({ error: "shop id required" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const target = new URL(
      joinApi(cmsBase, `/api/shop/${encodeURIComponent(shopId)}/publish-upgrade`),
      getBase()
    ).toString();
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "error" });
  }
}

function joinApi(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}

function getBase() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
