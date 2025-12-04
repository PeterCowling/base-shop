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
  try {
    const target = new URL(
      joinApi(cmsBase, `/api/shop/${encodeURIComponent(shopId)}/upgrade-history`),
      getBase()
    ).toString();
    const upstream = await fetch(target);
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `upstream_${upstream.status}` });
    }
    const data = await upstream.json();
    res.status(200).json(data);
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
