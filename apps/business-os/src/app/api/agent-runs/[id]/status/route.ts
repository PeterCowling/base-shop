import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * GET /api/agent-runs/[id]/status
 * Read run log file and return status
 *
 * MVP-E4: Agent run status UI
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Hosted (D1) path: agent runs are not stored in the repo filesystem.
  // MVP-E4 is local-only until we implement a D1-backed run log store.
  return NextResponse.json(
    { error: `Run log for task ${id} not found` },
    { status: 404 }
  );
}
