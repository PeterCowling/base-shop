import { NextResponse } from "next/server";
import { type z } from "zod";

export function invalidJsonResponse() {
  return NextResponse.json(
    {
      success: false,
      code: "INVALID_JSON",
      error: "Invalid JSON payload",
    },
    { status: 400 },
  );
}

export function invalidPayloadResponse(validationError: z.ZodError, error: string) {
  return NextResponse.json(
    {
      success: false,
      code: "INVALID_PAYLOAD",
      error,
      details: validationError.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.join("."),
      })),
    },
    { status: 422 },
  );
}

export function notFoundResponse(error: string) {
  return NextResponse.json(
    {
      success: false,
      code: "NOT_FOUND",
      error,
    },
    { status: 404 },
  );
}

export function badRequestResponse(error: string) {
  return NextResponse.json(
    {
      success: false,
      code: "BAD_REQUEST",
      error,
    },
    { status: 400 },
  );
}

export function conflictResponse(error: string) {
  return NextResponse.json(
    {
      success: false,
      code: "CONFLICT",
      error,
    },
    { status: 409 },
  );
}

function isGmailAuthExpiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("401") ||
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("invalid_grant")
  );
}

export function inboxApiErrorResponse(error: unknown, code = "INBOX_API_ERROR", status = 502) {
  if (isGmailAuthExpiredError(error)) {
    return NextResponse.json(
      {
        success: false,
        code: "GMAIL_AUTH_EXPIRED",
        error: "Email sending failed — Gmail authorisation has expired. Contact your administrator.",
      },
      { status: 502 },
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    {
      success: false,
      code,
      error: message,
    },
    { status },
  );
}

export async function readJsonPayload(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (!raw.trim()) {
    return {};
  }

  return JSON.parse(raw) as unknown;
}

export function ensureReplySubject(subject: string | null | undefined): string {
  const trimmed = subject?.trim();
  if (!trimmed) {
    return "Re: Guest inquiry";
  }
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}
