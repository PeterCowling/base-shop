import { buildRobotsTxt } from "@/seo/robots";

export const dynamic: "force-static" | undefined = process.env.OUTPUT_EXPORT
  ? "force-static"
  : undefined;

export function GET(): Response {
  return new Response(buildRobotsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

