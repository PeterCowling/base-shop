import { withPipelineContext } from "@/lib/api-context";
import {
  onRequestGet,
  onRequestPatch,
} from "@/routes/api/candidates/[id]";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return withPipelineContext(request, resolvedParams, onRequestGet);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return withPipelineContext(request, resolvedParams, onRequestPatch);
}
