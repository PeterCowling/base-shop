#!/usr/bin/env node
import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { handleBriketteResourceRead } from "../src/resources/brikette-knowledge.js";
import {
  buildPolicyKeywordSet,
  type EmailTemplate,
  lintTemplates,
} from "../src/utils/template-lint.js";

const DATA_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const LINK_TIMEOUT_MS = 5000;

async function checkLink(url: string): Promise<{ ok: boolean; status?: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    return { ok: response.ok, status: response.status };
  } catch {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
      return { ok: response.ok, status: response.status };
    } catch {
      return { ok: false };
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function loadTemplates(): Promise<EmailTemplate[]> {
  const content = await readFile(join(DATA_ROOT, "email-templates.json"), "utf-8");
  return JSON.parse(content) as EmailTemplate[];
}

async function loadPolicyKeywords(): Promise<Set<string>> {
  const result = await handleBriketteResourceRead("brikette://policies");
  const payload = JSON.parse(result.contents[0].text) as {
    summary: Record<string, unknown>;
    faqItems: Array<{ question: string; answer: string }>;
  };

  const entries: string[] = [];
  for (const item of payload.faqItems ?? []) {
    entries.push(item.question, item.answer);
  }

  entries.push(JSON.stringify(payload.summary ?? {}));
  return buildPolicyKeywordSet(entries);
}

async function run(): Promise<void> {
  const templates = await loadTemplates();
  const policyKeywords = await loadPolicyKeywords();

  const issues = await lintTemplates(templates, {
    policyKeywords,
    checkLink,
  });

  if (issues.length === 0) {
    console.info("Template lint: OK");
    return;
  }

  console.error("Template lint failed:\n");
  for (const issue of issues) {
    console.error(`- [${issue.code}] ${issue.subject}: ${issue.details}`);
  }
  process.exit(1);
}

run().catch((error) => {
  console.error("Template lint failed with error:", error);
  process.exit(1);
});
