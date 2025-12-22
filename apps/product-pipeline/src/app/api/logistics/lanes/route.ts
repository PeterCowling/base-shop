import { withPipelineContext } from "@/lib/api-context";
import {
  onRequestGet,
  onRequestPost,
} from "@/routes/api/logistics/lanes";

export const runtime = "edge";

export async function GET(request: Request) {
  return withPipelineContext(request, {}, onRequestGet);
}

export async function POST(request: Request) {
  return withPipelineContext(request, {}, onRequestPost);
}
