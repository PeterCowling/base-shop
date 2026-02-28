import { withPipelineContext } from "@/lib/api-context";
import { onRequestPost } from "@/routes/api/stages/b/run";

export const runtime = "edge";

export const dynamic = "force-static";

export async function POST(request: Request) {
  return withPipelineContext(request, {}, onRequestPost);
}
