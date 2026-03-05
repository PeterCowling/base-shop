import { NextResponse } from "next/server";
import { z } from "zod";

import {
  type BookingEmailInput,
  sendBookingEmail,
} from "@acme/mcp-server/booking-email";

import { requireStaffAuth } from "../_shared/staff-auth";

const bookingEmailPayloadSchema = z
  .object({
    bookingRef: z.string().min(1),
    recipients: z.array(z.string().email()).min(1),
    occupantLinks: z.array(z.string().min(1)).min(1),
    subject: z.string().min(1).optional(),
  })
  .strict();

function invalidJsonResponse() {
  return NextResponse.json(
    {
      success: false,
      code: "INVALID_JSON",
      error: "Invalid JSON payload",
    },
    { status: 400 }
  );
}

function invalidPayloadResponse(validationError: z.ZodError) {
  return NextResponse.json(
    {
      success: false,
      code: "INVALID_PAYLOAD",
      error: "Invalid booking email payload",
      details: validationError.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.join("."),
      })),
    },
    { status: 422 }
  );
}

function mcpToolErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    {
      success: false,
      code: "MCP_TOOL_ERROR",
      error: message,
    },
    { status: 502 }
  );
}

export async function POST(request: Request) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return invalidJsonResponse();
  }

  const parsedPayload = bookingEmailPayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    return invalidPayloadResponse(parsedPayload.error);
  }

  const payload = parsedPayload.data as BookingEmailInput;

  try {
    const result = await sendBookingEmail(payload);
    return NextResponse.json(result);
  } catch (error) {
    return mcpToolErrorResponse(error);
  }
}
