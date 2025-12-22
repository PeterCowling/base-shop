import { withPipelineContext } from "@/lib/api-context";
import { onRequestPost } from "@/routes/api/stages/c/run";

export const runtime = "edge";

export async function POST(request: Request) {
  return withPipelineContext(request, {}, onRequestPost);
}
