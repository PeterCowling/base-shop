import { withPipelineContext } from "@/lib/api-context";
import { onRequestPost } from "@/routes/api/game/actions/promotion-sortie";

export const runtime = "edge";

export async function POST(request: Request) {
  return withPipelineContext(request, {}, onRequestPost);
}

