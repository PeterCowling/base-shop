import { NextResponse } from "next/server";
import { z } from "zod";

import { syncInbox } from "@/lib/inbox/sync.server";

import { requireStaffAuth } from "../_shared/staff-auth";

const inboxSyncPayloadSchema = z
  .object({
    rescanWindowDays: z.number().int().min(1).max(90).optional(),
  })
  .strict();

function invalidJsonResponse() {
  return NextResponse.json(
    {
      success: false,
      code: "INVALID_JSON",
      error: "Invalid JSON payload",
    },
    { status: 400 },
  );
}

function invalidPayloadResponse(validationError: z.ZodError) {
  return NextResponse.json(
    {
      success: false,
      code: "INVALID_PAYLOAD",
      error: "Invalid inbox sync payload",
      details: validationError.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.join("."),
      })),
    },
    { status: 422 },
  );
}

function syncErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    {
      success: false,
      code: "INBOX_SYNC_ERROR",
      error: message,
    },
    { status: 502 },
  );
}

async function readPayload(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export async function POST(request: Request) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  let rawPayload: unknown;
  try {
    rawPayload = await readPayload(request);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_JSON") {
      return invalidJsonResponse();
    }
    throw error;
  }

  const parsedPayload = inboxSyncPayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    return invalidPayloadResponse(parsedPayload.error);
  }

  try {
    const result = await syncInbox({
      actorUid: auth.uid,
      rescanWindowDays: parsedPayload.data.rescanWindowDays,
    });
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return syncErrorResponse(error);
  }
}
