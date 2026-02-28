import { withPipelineContext } from "@/lib/api-context";
import { onRequestGet } from "@/routes/api/artifacts";

export const runtime = "edge";

export const dynamic = "force-static";

export async function GET(request: Request) {
  return withPipelineContext(request, {}, onRequestGet);
}
