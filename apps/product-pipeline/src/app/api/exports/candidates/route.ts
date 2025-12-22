import { withPipelineContext } from "@/lib/api-context";
import { onRequestGet } from "@/routes/api/exports/candidates";

export const runtime = "edge";

export async function GET(request: Request) {
  return withPipelineContext(request, {}, onRequestGet);
}
