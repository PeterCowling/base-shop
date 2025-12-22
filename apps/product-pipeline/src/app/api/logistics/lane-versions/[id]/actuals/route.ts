import { withPipelineContext } from "@/lib/api-context";
import { onRequestPost } from "@/routes/api/logistics/lane-versions/[id]/actuals";

export const runtime = "edge";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return withPipelineContext(request, resolvedParams, onRequestPost);
}
