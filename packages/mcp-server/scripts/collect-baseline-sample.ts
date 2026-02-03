#!/usr/bin/env node
/**
 * Baseline Email Sample Collection Script
 *
 * Collects up to 50 inbox threads for email autodraft baseline measurement.
 *
 * Notes:
 * - Writes the sample to stdout (redirect to a *gitignored* location).
 * - Writes progress logs to stderr.
 *
 * Usage:
 *   cd packages/mcp-server
 *   pnpm exec tsx scripts/collect-baseline-sample.ts > ../../.agents/private/email-autodraft-consolidation-baseline-sample.txt
 */

import { getGmailClient } from "../src/clients/gmail.js";

interface EmailHeader {
  name: string;
  value: string;
}

function getHeader(headers: EmailHeader[], name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value ?? "";
}

function decodeBase64(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

type GmailPayloadPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayloadPart[];
};

function extractBody(payload: GmailPayloadPart): { plain: string; html?: string } {
  const result: { plain: string; html?: string } = { plain: "" };

  const visit = (part: GmailPayloadPart): void => {
    if (part.mimeType === "text/plain" && part.body?.data) {
      result.plain = decodeBase64(part.body.data);
      return;
    }
    if (part.mimeType === "text/html" && part.body?.data) {
      result.html = decodeBase64(part.body.data);
      return;
    }
    for (const subpart of part.parts ?? []) visit(subpart);
  };

  visit(payload);

  if (!result.plain && result.html) {
    result.plain = result.html.replace(/<[^>]+>/g, "").trim();
  }

  return result;
}

async function main(): Promise<void> {
  console.error("[Baseline] Starting baseline sample collection…");
  console.error("[Baseline] Query: in:inbox after:2025/11/02 before:2026/02/03");
  console.error("[Baseline] Limit: 50 messages");
  console.error("");

  const writeLine = (line = ""): void => {
    process.stdout.write(`${line}\n`);
  };

  const clientResult = await getGmailClient();
  if (!clientResult.success) {
    console.error(`[Error] ${clientResult.error}`);
    if (clientResult.needsSetup) {
      console.error("");
      console.error("To set up Gmail:");
      console.error("1) Create OAuth credentials in Google Cloud Console");
      console.error("2) Save credentials.json to packages/mcp-server/");
      console.error("3) Run: cd packages/mcp-server && pnpm exec tsx test-gmail-auth.ts");
    }
    process.exit(1);
  }

  const gmail = clientResult.client;

  console.error("[Baseline] Fetching email list…");
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: "in:inbox after:2025/11/02 before:2026/02/03",
    maxResults: 50,
  });

  const messages = listResponse.data.messages ?? [];
  console.error(`[Baseline] Found ${messages.length} messages`);

  if (messages.length === 0) return;

  type ThreadContextItem = { from: string; date: string; snippet: string };
  type EmailSummary = {
    id: string;
    threadId: string;
    date: string;
    from: string;
    subject: string;
    snippet: string;
    body: string;
    threadContext: ThreadContextItem[];
  };

  const emails: EmailSummary[] = [];

  console.error("[Baseline] Fetching email details…\n");

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg.id) continue;

    console.error(`[Baseline] Processing ${i + 1}/${messages.length}: ${msg.id}`);

    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = (detail.data.payload?.headers ?? []) as EmailHeader[];
      const from = getHeader(headers, "From");
      const subject = getHeader(headers, "Subject") || "(no subject)";
      const date = getHeader(headers, "Date");

      const body = extractBody((detail.data.payload ?? {}) as GmailPayloadPart);

      let threadContext: ThreadContextItem[] = [];
      const threadId = detail.data.threadId ?? "";
      if (threadId) {
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "metadata",
          metadataHeaders: ["From", "Date"],
        });

        const threadMessages = thread.data.messages ?? [];
        if (threadMessages.length > 1) {
          threadContext = threadMessages
            .filter(m => m.id && m.id !== msg.id)
            .map(m => {
              const h = (m.payload?.headers ?? []) as EmailHeader[];
              return {
                from: getHeader(h, "From"),
                date: getHeader(h, "Date"),
                snippet: m.snippet ?? "",
              };
            });
        }
      }

      emails.push({
        id: msg.id,
        threadId,
        date,
        from,
        subject,
        snippet: detail.data.snippet ?? "",
        body: body.plain,
        threadContext,
      });
    } catch (error) {
      console.error(`[Error] Failed to fetch ${msg.id}: ${String(error)}`);
    }
  }

  console.error("\n[Baseline] Writing output…\n");

  writeLine("SAMPLE_LIST");
  emails.forEach((email, i) => {
    writeLine(`${i + 1}) ${email.id} | ${email.date} | ${email.from} | ${email.subject}`);
  });

  writeLine("");
  writeLine("");

  writeLine("EMAIL_DETAILS");
  emails.forEach(email => {
    writeLine("");
    writeLine(email.id);
    writeLine(`- date: ${email.date}`);
    writeLine(`- from: ${email.from}`);
    writeLine(`- subject: ${email.subject}`);
    writeLine(`- snippet: ${email.snippet}`);
    writeLine(`- body: ${email.body.substring(0, 2000)}${email.body.length > 2000 ? "..." : ""}`);
    if (email.threadContext.length > 0) {
      writeLine("- thread_context:");
      email.threadContext.forEach((item, idx) => {
        writeLine(`  [${idx + 1}] ${item.from} (${item.date}): ${item.snippet}`);
      });
    } else {
      writeLine("- thread_context: (no prior messages)");
    }
  });

  console.error(`\n[Baseline] Done. Collected ${emails.length} messages.`);
}

main().catch(error => {
  console.error("[Fatal]", error);
  process.exit(1);
});

