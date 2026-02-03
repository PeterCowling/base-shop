#!/usr/bin/env node
/**
 * TASK-18: Integration Testing Script
 *
 * Runs full email pipeline on 50+ real emails and outputs test results.
 *
 * Usage:
 *   cd packages/mcp-server
 *   pnpm exec tsx scripts/run-integration-test.ts
 */

import { getGmailClient } from "../src/clients/gmail.js";
import { handleDraftGenerateTool } from "../src/tools/draft-generate.js";
import { handleDraftInterpretTool } from "../src/tools/draft-interpret.js";
import { handleDraftQualityTool } from "../src/tools/draft-quality-check.js";

interface EmailHeader {
  name: string;
  value: string;
}

interface TestResult {
  emailId: string;
  from: string;
  subject: string;
  date: string;
  category: string;
  categoryConfidence: number;
  agreementStatus: string;
  agreementConfidence: number;
  questionsCount: number;
  requestsCount: number;
  qualityPassed: boolean;
  failedChecks: string[];
  warnings: string[];
  templateUsed: string | null;
  editNeeded: "unknown"; // Manual review needed
  error?: string;
}

interface CategoryMetrics {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  acceptanceRate: number;
}

function getHeader(headers: EmailHeader[], name: string): string {
  const header = headers.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
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

function parseFromName(from: string): string {
  // Extract name from "Name <email>" or just return the email
  const match = from.match(/^"?([^"<]+)"?\s*<[^>]+>$/);
  return match ? match[1].trim() : from.split("@")[0];
}

async function main(): Promise<void> {
  console.error("[Integration Test] Starting TASK-18 integration testing...");
  console.error("[Integration Test] Query: in:inbox after:2025/11/02 before:2026/02/03");
  console.error("[Integration Test] Limit: 50 messages\n");

  const clientResult = await getGmailClient();
  if (!clientResult.success) {
    console.error(`[Error] ${clientResult.error}`);
    process.exit(1);
  }

  const gmail = clientResult.client;

  // Step 1: List emails
  console.error("[Step 1] Fetching email list...");
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: "in:inbox after:2025/11/02 before:2026/02/03",
    maxResults: 50,
  });

  const messages = listResponse.data.messages ?? [];
  console.error(`[Step 1] Found ${messages.length} messages\n`);

  if (messages.length === 0) {
    console.error("[Error] No messages found");
    process.exit(1);
  }

  const results: TestResult[] = [];
  const categoryMetrics: Record<string, CategoryMetrics> = {};

  // Step 2: Process each email through the pipeline
  console.error("[Step 2] Running pipeline on each email...\n");

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg.id) continue;

    console.error(`[${i + 1}/${messages.length}] Processing ${msg.id}...`);

    const result: TestResult = {
      emailId: msg.id,
      from: "",
      subject: "",
      date: "",
      category: "unknown",
      categoryConfidence: 0,
      agreementStatus: "none",
      agreementConfidence: 0,
      questionsCount: 0,
      requestsCount: 0,
      qualityPassed: false,
      failedChecks: [],
      warnings: [],
      templateUsed: null,
      editNeeded: "unknown",
    };

    try {
      // Get full email
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = (detail.data.payload?.headers ?? []) as EmailHeader[];
      result.from = getHeader(headers, "From");
      result.subject = getHeader(headers, "Subject") || "(no subject)";
      result.date = getHeader(headers, "Date");

      const body = extractBody((detail.data.payload ?? {}) as GmailPayloadPart);

      // Skip if no body (system notifications, etc.)
      if (!body.plain || body.plain.length < 10) {
        result.category = "system_notification";
        result.error = "No meaningful body content";
        results.push(result);
        continue;
      }

      // Get thread context
      let threadContext: { messages: Array<{ from: string; date: string; snippet: string }> } | undefined;
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
          threadContext = {
            messages: threadMessages
              .filter(m => m.id && m.id !== msg.id)
              .map(m => {
                const h = (m.payload?.headers ?? []) as EmailHeader[];
                return {
                  from: getHeader(h, "From"),
                  date: getHeader(h, "Date"),
                  snippet: m.snippet ?? "",
                };
              }),
          };
        }
      }

      // Stage 1: Interpretation
      const interpretResult = await handleDraftInterpretTool("draft_interpret", {
        body: body.plain,
        subject: result.subject,
        threadContext,
      });

      if (!interpretResult.isError && interpretResult.content?.[0]?.type === "text") {
        const actionPlan = JSON.parse(interpretResult.content[0].text);

        result.category = actionPlan.scenario?.category ?? "unknown";
        result.categoryConfidence = actionPlan.scenario?.confidence ?? 0;
        result.agreementStatus = actionPlan.agreement?.status ?? "none";
        result.agreementConfidence = actionPlan.agreement?.confidence ?? 0;
        result.questionsCount = actionPlan.intents?.questions?.length ?? 0;
        result.requestsCount = actionPlan.intents?.requests?.length ?? 0;

        // Stage 2: Draft Generation
        const generateResult = await handleDraftGenerateTool("draft_generate", {
          actionPlan,
          subject: result.subject,
          recipientName: parseFromName(result.from),
        });

        if (!generateResult.isError && generateResult.content?.[0]?.type === "text") {
          const draftOutput = JSON.parse(generateResult.content[0].text);
          // template_used is an object with subject, category, confidence, selection
          const tmpl = draftOutput.template_used;
          result.templateUsed = tmpl?.subject ?? tmpl?.category ?? null;

          // Quality is embedded in generate output
          const quality = draftOutput.quality;
          if (quality) {
            result.qualityPassed = quality.passed ?? false;
            result.failedChecks = quality.failed_checks ?? [];
            result.warnings = quality.warnings ?? [];
          } else {
            // Stage 3: Quality Check (fallback)
            const qualityResult = await handleDraftQualityTool("draft_quality_check", {
              actionPlan,
              draft: {
                bodyPlain: draftOutput.draft?.bodyPlain ?? "",
                bodyHtml: draftOutput.draft?.bodyHtml,
              },
            });

            if (!qualityResult.isError && qualityResult.content?.[0]?.type === "text") {
              const qualityData = JSON.parse(qualityResult.content[0].text);
              result.qualityPassed = qualityData.passed ?? false;
              result.failedChecks = qualityData.failed_checks ?? [];
              result.warnings = qualityData.warnings ?? [];
            } else {
              result.error = "Quality check failed";
            }
          }
        } else {
          result.error = `Draft generation failed: ${JSON.stringify(generateResult)}`;
        }
      } else {
        result.error = "Interpretation failed";
      }
    } catch (error) {
      result.error = String(error);
    }

    results.push(result);

    // Update category metrics
    const cat = result.category;
    if (!categoryMetrics[cat]) {
      categoryMetrics[cat] = { total: 0, passed: 0, failed: 0, errors: 0, acceptanceRate: 0 };
    }
    categoryMetrics[cat].total++;
    if (result.error) {
      categoryMetrics[cat].errors++;
    } else if (result.qualityPassed) {
      categoryMetrics[cat].passed++;
    } else {
      categoryMetrics[cat].failed++;
    }
  }

  // Calculate acceptance rates
  for (const cat of Object.keys(categoryMetrics)) {
    const m = categoryMetrics[cat];
    m.acceptanceRate = m.total > 0 ? Math.round((m.passed / m.total) * 100) : 0;
  }

  // Step 3: Output results
  console.error("\n[Step 3] Writing results...\n");

  // Summary
  const totalEmails = results.length;
  const totalPassed = results.filter((result) => result.qualityPassed).length;
  const totalFailed = results.filter((result) => !result.qualityPassed && !result.error).length;
  const totalErrors = results.filter((result) => result.error).length;
  const criticalErrors = results.filter((result) =>
    result.failedChecks.some((check) => check.includes("prohibited") || check.includes("contradiction"))
  ).length;

  console.info("# TASK-18 Integration Test Results");
  console.info("");
  console.info("## Summary");
  console.info("");
  console.info(`- **Total Emails Tested:** ${totalEmails}`);
  console.info(
    `- **Quality Gate Passed:** ${totalPassed} (${Math.round((totalPassed / totalEmails) * 100)}%)`,
  );
  console.info(
    `- **Quality Gate Failed:** ${totalFailed} (${Math.round((totalFailed / totalEmails) * 100)}%)`,
  );
  console.info(`- **Pipeline Errors:** ${totalErrors}`);
  console.info(`- **Critical Errors:** ${criticalErrors}`);
  console.info("");

  console.info("## Category Breakdown");
  console.info("");
  console.info("| Category | Total | Passed | Failed | Errors | Acceptance Rate | Target |");
  console.info("|----------|-------|--------|--------|--------|-----------------|--------|");

  const targets: Record<string, string> = {
    faq: "≥85%",
    policy: "≥75%",
    payment: "≥70%",
    cancellation: "≥70%",
    complaint: "≥60%",
    multi_question: "≥65%",
  };

  for (const [cat, m] of Object.entries(categoryMetrics).sort((a, b) => b[1].total - a[1].total)) {
    const target = targets[cat] ?? "-";
    console.info(
      `| ${cat} | ${m.total} | ${m.passed} | ${m.failed} | ${m.errors} | ${m.acceptanceRate}% | ${target} |`,
    );
  }
  console.info("");

  console.info("## Agreement Detection");
  console.info("");
  const agreements = results.filter((result) => result.agreementStatus !== "none");
  const confirmed = agreements.filter((result) => result.agreementStatus === "confirmed");
  const likely = agreements.filter((result) => result.agreementStatus === "likely");
  const unclear = agreements.filter((result) => result.agreementStatus === "unclear");
  console.info(`- **Total with agreement signals:** ${agreements.length}`);
  console.info(`- **Confirmed:** ${confirmed.length}`);
  console.info(`- **Likely:** ${likely.length}`);
  console.info(`- **Unclear:** ${unclear.length}`);
  console.info("");

  console.info("## Quality Gate Failures");
  console.info("");
  const failedResults = results.filter((result) => result.failedChecks.length > 0);
  if (failedResults.length === 0) {
    console.info("No quality gate failures.");
  } else {
    console.info("| Email ID | Category | Failed Checks |");
    console.info("|----------|----------|---------------|");
    for (const r of failedResults.slice(0, 20)) {
      console.info(
        `| ${r.emailId.slice(0, 12)}... | ${r.category} | ${r.failedChecks.join(", ")} |`,
      );
    }
    if (failedResults.length > 20) {
      console.info(`| ... | ... | (${failedResults.length - 20} more) |`);
    }
  }
  console.info("");

  console.info("## Per-Email Results");
  console.info("");
  console.info("| # | Email ID | Date | Category | Agreement | Q/R | Quality | Template |");
  console.info("|---|----------|------|----------|-----------|-----|---------|----------|");

  results.forEach((r, i) => {
    const short = r.emailId.slice(0, 10);
    const dateShort = r.date.split(",")[1]?.trim().slice(0, 11) ?? r.date.slice(0, 11);
    const qr = `${r.questionsCount}/${r.requestsCount}`;
    const quality = r.error ? "ERROR" : (r.qualityPassed ? "PASS" : "FAIL");
    const template = typeof r.templateUsed === "string" ? r.templateUsed.slice(0, 15) : "-";
    console.info(
      `| ${i + 1} | ${short}... | ${dateShort} | ${r.category} | ${r.agreementStatus} | ${qr} | ${quality} | ${template} |`,
    );
  });

  console.error(`\n[Integration Test] Done. ${totalEmails} emails processed.`);
}

main().catch((error) => {
  console.error("[Fatal]", error);
  process.exit(1);
});
