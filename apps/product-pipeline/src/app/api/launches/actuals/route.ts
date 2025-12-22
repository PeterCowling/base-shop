import { withPipelineContext } from "@/lib/api-context";
import { onRequestPost } from "@/routes/api/launches/actuals";

export const runtime = "edge";

export async function POST(request: Request) {
  return withPipelineContext(request, {}, onRequestPost);
}
