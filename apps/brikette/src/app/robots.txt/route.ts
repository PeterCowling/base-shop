import { buildRobotsTxt } from "@/seo/robots";

export function GET(): Response {
  return new Response(buildRobotsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

