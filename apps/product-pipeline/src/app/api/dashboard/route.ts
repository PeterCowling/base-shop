import { withPipelineContext } from "@/lib/api-context";
import { onRequestGet } from "@/routes/api/dashboard";

export const runtime = "nodejs";

export const dynamic = "force-static";

export async function GET(request: Request) {
  return withPipelineContext(request, {}, onRequestGet);
}
