#!/usr/bin/env node
/**
 * Quick test of draft_generate tool
 */

import { handleDraftGenerateTool } from "../src/tools/draft-generate.js";

const testPlan = {
  normalized_text: "Hi, I would like to know if you have availability for next week.",
  language: "EN" as const,
  intents: {
    questions: [{ text: "Do you have availability?", evidence: "test" }],
    requests: [],
    confirmations: []
  },
  agreement: {
    status: "none" as const,
    confidence: 0,
    evidence_spans: [],
    requires_human_confirmation: false,
    detected_language: "EN",
    additional_content: false
  },
  workflow_triggers: {
    prepayment: false,
    terms_and_conditions: false,
    booking_monitor: false
  },
  scenario: {
    category: "faq",
    confidence: 0.85
  }
};

async function test() {
  console.info("Testing draft_generate...");
  console.info("CWD:", process.cwd());

  try {
    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: testPlan,
      subject: "Availability inquiry",
      recipientName: "John"
    });
    console.info("Result:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
