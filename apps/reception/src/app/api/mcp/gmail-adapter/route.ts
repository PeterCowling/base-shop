import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createGmailDraft,
  getGmailProfile,
  listGmailThreads,
  sendGmailDraft,
} from "@/lib/gmail-client";

import { requireStaffAuth } from "../_shared/staff-auth";

const gmailAdapterPayloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("profile"),
  }).strict(),
  z.object({
    action: z.literal("list_threads"),
    maxResults: z.number().int().min(1).max(100).optional(),
    query: z.string().min(1).optional(),
    pageToken: z.string().min(1).optional(),
  }).strict(),
  z.object({
    action: z.literal("create_draft"),
    to: z.array(z.string().email()).min(1),
    subject: z.string().min(1),
    bodyPlain: z.string().min(1),
    bodyHtml: z.string().min(1).optional(),
    threadId: z.string().min(1).optional(),
    inReplyTo: z.string().min(1).optional(),
    references: z.string().min(1).optional(),
  }).strict(),
  z.object({
    action: z.literal("send_draft"),
    draftId: z.string().min(1),
  }).strict(),
]);

type GmailAdapterPayload = z.infer<typeof gmailAdapterPayloadSchema>;

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
      error: "Invalid Gmail adapter payload",
      details: validationError.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.join("."),
      })),
    },
    { status: 422 },
  );
}

function gmailAdapterErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    {
      success: false,
      code: "GMAIL_ADAPTER_ERROR",
      error: message,
    },
    { status: 502 },
  );
}

async function handlePayload(payload: GmailAdapterPayload) {
  switch (payload.action) {
    case "profile":
      return {
        action: payload.action,
        data: await getGmailProfile(),
      };
    case "list_threads":
      return {
        action: payload.action,
        data: await listGmailThreads({
          maxResults: payload.maxResults,
          query: payload.query,
          pageToken: payload.pageToken,
        }),
      };
    case "create_draft":
      return {
        action: payload.action,
        data: await createGmailDraft({
          to: payload.to,
          subject: payload.subject,
          bodyPlain: payload.bodyPlain,
          bodyHtml: payload.bodyHtml,
          threadId: payload.threadId,
          inReplyTo: payload.inReplyTo,
          references: payload.references,
        }),
      };
    case "send_draft":
      return {
        action: payload.action,
        data: await sendGmailDraft(payload.draftId),
      };
  }
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

  const parsedPayload = gmailAdapterPayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    return invalidPayloadResponse(parsedPayload.error);
  }

  try {
    const result = await handlePayload(parsedPayload.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return gmailAdapterErrorResponse(error);
  }
}
