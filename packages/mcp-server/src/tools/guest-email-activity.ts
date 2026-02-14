import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

import { getGmailClient } from "../clients/gmail.js";
import { createRawEmail } from "../utils/email-mime.js";
import { stripLegacySignatureBlock } from "../utils/email-signature.js";
import { generateEmailHtml } from "../utils/email-template.js";

function resolveDataRoot(): string {
  const candidates = [
    join(process.cwd(), "packages", "mcp-server", "data"),
    join(process.cwd(), "data"),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "email-templates.json"))) {
      return candidate;
    }
  }

  return candidates[0];
}

const DATA_ROOT = resolveDataRoot();
const CACHE_TTL_MS = 5 * 60 * 1000;

interface EmailTemplateRecord {
  subject: string;
  body: string;
  category?: string;
}

type PrepaymentProvider = "octorate" | "hostelworld";

const templateCache = new Map<string, { data: EmailTemplateRecord[]; expires: number }>();

const guestEmailActivitySchema = z.object({
  bookingRef: z.string().min(1),
  activityCode: z.number().int(),
  recipients: z.array(z.string().email()).min(1),
  prepaymentProvider: z.enum(["octorate", "hostelworld"]).optional(),
  dryRun: z.boolean().optional().default(false),
});

export type GuestEmailActivityInput = z.infer<typeof guestEmailActivitySchema>;

export interface GuestEmailActivityResult {
  success: boolean;
  status: "drafted" | "deferred";
  bookingRef: string;
  activityCode: number;
  recipients: string[];
  subject?: string;
  reason?: string;
  dryRun?: boolean;
  preview?: {
    subject: string;
    bodyPlain: string;
  };
  prepaymentProvider?: PrepaymentProvider;
  draftId?: string;
  messageId?: string;
}

/** @internal - exposed for test isolation */
export function clearGuestEmailTemplateCache(): void {
  templateCache.clear();
}

async function loadTemplates(): Promise<EmailTemplateRecord[]> {
  const cached = templateCache.get("email-templates");
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const content = await readFile(join(DATA_ROOT, "email-templates.json"), "utf-8");
  const parsed = JSON.parse(content) as EmailTemplateRecord[];
  templateCache.set("email-templates", {
    data: parsed,
    expires: Date.now() + CACHE_TTL_MS,
  });

  return parsed;
}

function inferPrepaymentProvider(bookingRef: string): PrepaymentProvider {
  return bookingRef.trim().startsWith("7763-") ? "hostelworld" : "octorate";
}

function resolveTemplateSubject(
  activityCode: number,
  provider: PrepaymentProvider
): { subject?: string; reason?: string } {
  switch (activityCode) {
    case 21:
      return { subject: "Agreement Received" };
    case 5:
      return {
        subject:
          provider === "hostelworld"
            ? "Prepayment - 1st Attempt Failed (Hostelworld)"
            : "Prepayment - 1st Attempt Failed (Octorate)",
      };
    case 6:
      return { subject: "Prepayment - 2nd Attempt Failed" };
    case 7:
      return { subject: "Prepayment - Cancelled post 3rd Attempt" };
    case 8:
      return { subject: "Prepayment Successful" };
    case 27:
      // TASK-04: Wire activity code 27 (CANCELLED) to cancellation confirmation template
      return { subject: "Cancellation Confirmation" };
    case 2:
    case 3:
    case 4:
      return { reason: "unsupported-activity-code" };
    default:
      return { reason: "unknown-activity-code" };
  }
}

function findTemplateBySubject(
  templates: EmailTemplateRecord[],
  subject: string
): EmailTemplateRecord | undefined {
  const normalized = subject.trim().toLowerCase();
  return templates.find((template) => template.subject.trim().toLowerCase() === normalized);
}

export async function sendGuestEmailActivity(
  input: GuestEmailActivityInput
): Promise<GuestEmailActivityResult> {
  const { bookingRef, activityCode, recipients, prepaymentProvider, dryRun } =
    guestEmailActivitySchema.parse(input);

  const resolvedProvider = prepaymentProvider ?? inferPrepaymentProvider(bookingRef);
  const selection = resolveTemplateSubject(activityCode, resolvedProvider);

  if (!selection.subject) {
    return {
      success: true,
      status: "deferred",
      bookingRef,
      activityCode,
      recipients,
      reason: selection.reason ?? "unsupported-activity-code",
      dryRun,
      prepaymentProvider: resolvedProvider,
    };
  }

  const templates = await loadTemplates();
  const template = findTemplateBySubject(templates, selection.subject);

  if (!template) {
    return {
      success: true,
      status: "deferred",
      bookingRef,
      activityCode,
      recipients,
      reason: "template-not-found",
      dryRun,
      prepaymentProvider: resolvedProvider,
      subject: selection.subject,
    };
  }

  if (dryRun) {
    const sanitizedBody = stripLegacySignatureBlock(template.body);
    return {
      success: true,
      status: "drafted",
      bookingRef,
      activityCode,
      recipients,
      subject: template.subject,
      reason: "dry-run-no-draft-created",
      dryRun: true,
      preview: {
        subject: template.subject,
        bodyPlain: sanitizedBody,
      },
      prepaymentProvider: resolvedProvider,
    };
  }

  const clientResult = await getGmailClient();
  if (!clientResult.success) {
    if (clientResult.needsSetup) {
      throw new Error(
        `Gmail not configured. ${clientResult.error}\n\n` +
          `To set up Gmail:\n` +
          `1. Create OAuth credentials in Google Cloud Console\n` +
          `2. Save credentials.json to packages/mcp-server/\n` +
          `3. Run: cd packages/mcp-server && pnpm gmail:auth`
      );
    }
    throw new Error(clientResult.error);
  }

  const subject = template.subject;
  const bodyPlain = stripLegacySignatureBlock(template.body);
  const bodyHtml = generateEmailHtml({
    bodyText: bodyPlain,
    includeBookingLink: false,
    subject,
  });
  const raw = createRawEmail(recipients.join(", "), subject, bodyPlain, bodyHtml);

  const response = await clientResult.client.users.drafts.create({
    userId: "me",
    requestBody: {
      message: { raw },
    },
  });

  return {
    success: true,
    status: "drafted",
    bookingRef,
    activityCode,
    recipients,
    subject,
    prepaymentProvider: resolvedProvider,
    draftId: response.data?.id || undefined,
    messageId: response.data?.message?.id || undefined,
  };
}
