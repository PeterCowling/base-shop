import { NextResponse } from "next/server";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { collectInProgressDispatchIds, loadActivePlans } from "@/lib/process-improvements/active-plans";
import { loadProcessImprovementsProjection } from "@/lib/process-improvements/projection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUserServer();
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "unauthorized_process_improvements_action" },
        { status: 403 }
      );
    }

    const projection = await loadProcessImprovementsProjection();
    const activePlans = loadActivePlans();
    const inProgressDispatchIds = [...collectInProgressDispatchIds(activePlans)];
    return NextResponse.json({
      items: projection.items,
      recentActions: projection.recentActions,
      completedIdeasCount: projection.completedIdeasCount,
      activePlans,
      inProgressDispatchIds,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "internal_server_error", details: String(error) },
      { status: 500 }
    );
  }
}
