import { NextResponse } from "next/server";
import { z } from "zod";

const CreateQueueItemSchema = z.object({
  action: z.enum(["work-idea", "break-into-tasks", "draft-plan", "custom"]),
  target: z.string().min(1),
  targetType: z.enum(["card", "idea"]),
  instructions: z.string().optional(),
  content: z.string().optional(),
});

/**
 * POST /api/agent-queue/create
 * Create a new agent queue item
 *
 * MVP-E2: Enable users to request agent work via UI
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = CreateQueueItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-33 MVP-E2 API error message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        // i18n-exempt -- BOS-33 MVP-E2 API error message [ttl=2026-03-31]
        error: "Agent queue is not available in the D1-hosted Edge runtime yet.",
      },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-33 MVP-E2 API error message [ttl=2026-03-31]
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
