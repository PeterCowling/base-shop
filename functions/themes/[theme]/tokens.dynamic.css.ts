import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequest: PagesFunction = async ({ next }) => {
  const res = await next();
  res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return res;
};
