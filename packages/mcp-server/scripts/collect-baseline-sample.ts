#!/usr/bin/env node
/**
 * Email Sample Collection Script
 *
 * Collects inbox emails for email autodraft analysis with pagination and filtering.
 *
 * Notes:
 * - Writes the sample to stdout (redirect to a *gitignored* location).
 * - Writes progress logs to stderr.
 *
 * Usage:
 *   cd packages/mcp-server
 *   pnpm exec tsx scripts/collect-baseline-sample.ts --max 200 --after 2025/06/01 --before 2025/09/01 --stage 1
 *   pnpm exec tsx scripts/collect-baseline-sample.ts --max 200 --after 2025/09/01 --before 2025/12/01 --stage 2
 *
 * CLI args:
 *   --max <n>        Maximum emails to collect (default: 50)
 *   --after <date>   Gmail date filter start (YYYY/MM/DD)
 *   --before <date>  Gmail date filter end (YYYY/MM/DD)
 *   --stage <n>      Stage number for output filename (default: 1)
 *   --exclude <domains>  Comma-separated sender domains to exclude
 */

import { getGmailClient } from "../src/clients/gmail.js";

interface EmailHeader {
  name: string;
  value: string;
}

interface CliArgs {
  max: number;
  after: string;
  before: string;
  stage: number;
  exclude: string[];
}

const DEFAULT_EXCLUSIONS = [
  "octorate.com",
  "hostelworld.com",
  "expediagroup.com",
  "booking.com",
  "revolut.com",
  "smtp.octorate.com",
  "google.com",
  "ikea.it",
];

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    max: 50,
    after: "2025/06/01",
    before: "2025/09/01",
    stage: 1,
    exclude: [],
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--max":
        result.max = parseInt(args[++i], 10);
        break;
      case "--after":
        result.after = args[++i];
        break;
      case "--before":
        result.before = args[++i];
        break;
      case "--stage":
        result.stage = parseInt(args[++i], 10);
        break;
      case "--exclude":
        result.exclude = args[++i].split(",").map(d => d.trim());
        break;
    }
  }

  return result;
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

function extractDomain(from: string): string {
  const match = from.match(/<([^>]+)>/);
  const email = match ? match[1] : from;
  const parts = email.split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "";
}

function isExcluded(from: string, exclusions: string[]): boolean {
  const domain = extractDomain(from);
  return exclusions.some(excluded => domain === excluded || domain.endsWith(`.${excluded}`));
}

async function main(): Promise<void> {
  const config = parseArgs();
  const allExclusions = [...DEFAULT_EXCLUSIONS, ...config.exclude];

  console.error(`[Collect] Starting email collection (stage ${config.stage})…`);
  console.error(`[Collect] Query: in:inbox after:${config.after} before:${config.before}`);
  console.error(`[Collect] Target: ${config.max} emails`);
  console.error(`[Collect] Excluded domains: ${allExclusions.join(", ")}`);
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
  const query = `in:inbox after:${config.after} before:${config.before}`;

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

  // Paginated message ID collection
  const messageIds: Array<{ id: string }> = [];
  let pageToken: string | undefined;
  const pageSize = 100; // Gmail max per page

  console.error("[Collect] Fetching email list (paginated)…");

  while (messageIds.length < config.max) {
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: Math.min(pageSize, config.max - messageIds.length),
      pageToken,
    });

    const page = listResponse.data.messages ?? [];
    for (const msg of page) {
      if (msg.id) {
        messageIds.push({ id: msg.id });
      }
    }

    console.error(`[Collect] Page fetched: ${page.length} messages (total: ${messageIds.length})`);

    pageToken = listResponse.data.nextPageToken ?? undefined;
    if (!pageToken || messageIds.length >= config.max) break;
  }

  console.error(`[Collect] Total message IDs: ${messageIds.length}`);

  if (messageIds.length === 0) {
    console.error("[Collect] No messages found.");
    return;
  }

  // Fetch details and filter
  const emails: EmailSummary[] = [];
  let skippedSystem = 0;

  console.error("[Collect] Fetching email details…\n");

  for (let i = 0; i < messageIds.length; i++) {
    const msg = messageIds[i];

    console.error(`[Collect] Processing ${i + 1}/${messageIds.length}: ${msg.id}`);

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

      // Filter out system/excluded senders
      if (isExcluded(from, allExclusions)) {
        skippedSystem++;
        continue;
      }

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

  console.error(`\n[Collect] Skipped ${skippedSystem} system/excluded emails`);
  console.error(`[Collect] Collected ${emails.length} customer emails`);
  console.error("[Collect] Writing output…\n");

  // Output header
  writeLine(`STAGE: ${config.stage}`);
  writeLine(`QUERY: ${query}`);
  writeLine(`DATE: ${new Date().toISOString()}`);
  writeLine(`TOTAL_FETCHED: ${messageIds.length}`);
  writeLine(`SYSTEM_EXCLUDED: ${skippedSystem}`);
  writeLine(`CUSTOMER_EMAILS: ${emails.length}`);
  writeLine("");

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

  console.error(`\n[Collect] Done. Stage ${config.stage}: ${emails.length} customer emails collected.`);
}

main().catch(error => {
  console.error("[Fatal]", error);
  process.exit(1);
});
