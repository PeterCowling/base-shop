/* eslint-disable ds/no-hardcoded-copy -- TECH-000 [ttl=2026-12-31] HTTP content-type headers are transport metadata, not UI copy. */
import { buildRobotsTxt } from "@/seo/robots";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildRobotsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
