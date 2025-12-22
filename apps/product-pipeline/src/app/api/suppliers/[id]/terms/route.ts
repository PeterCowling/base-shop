import { withPipelineContext } from "@/lib/api-context";
import {
  onRequestGet,
  onRequestPost,
} from "@/routes/api/suppliers/[id]/terms";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return withPipelineContext(request, resolvedParams, onRequestGet);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return withPipelineContext(request, resolvedParams, onRequestPost);
}
