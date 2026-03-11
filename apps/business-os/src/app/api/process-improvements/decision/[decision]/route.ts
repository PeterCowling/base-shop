import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { performProcessImprovementsDecision } from "@/lib/process-improvements/decision-service";

const DecisionRequestSchema = z.object({
  ideaKey: z.string().min(1),
  dispatchId: z.string().min(1),
});

const DecisionParamSchema = z.enum(["do", "defer", "decline"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ decision: string }> }
) {
  try {
    const { decision } = await context.params;
    const parsedDecision = DecisionParamSchema.safeParse(decision);
    if (!parsedDecision.success) {
      return NextResponse.json(
        { error: "invalid_decision" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUserServer();
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "unauthorized_process_improvements_action" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsedBody = DecisionRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const result = await performProcessImprovementsDecision({
      decision: parsedDecision.data,
      dispatchId: parsedBody.data.dispatchId,
      ideaKey: parsedBody.data.ideaKey,
      actor: currentUser,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason, details: result.error },
        {
          status:
            result.reason === "write_error"
              ? 500
              : result.reason === "invalid_dispatch"
                ? 422
                : 409,
        }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "internal_server_error", details: String(error) },
      { status: 500 }
    );
  }
}
