import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { performProcessImprovementsOperatorActionDecision } from "@/lib/process-improvements/operator-action-service";

const DecisionRequestSchema = z.object({
  actionId: z.string().min(1),
  snoozeDays: z.number().int().min(1).max(90).optional(),
});

const DecisionParamSchema = z.enum(["done", "snooze"]);

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

    const result = await performProcessImprovementsOperatorActionDecision({
      decision: parsedDecision.data,
      actionId: parsedBody.data.actionId,
      actor: currentUser,
      snoozeDays: parsedBody.data.snoozeDays,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason, details: result.error },
        {
          status:
            result.reason === "write_error"
              ? 500
              : result.reason === "no_match"
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
