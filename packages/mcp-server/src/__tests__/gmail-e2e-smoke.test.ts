/** @jest-environment node */

/**
 * Gmail E2E Smoke Test (TASK-10)
 *
 * Validates real Gmail API connectivity and basic operations:
 *   - OAuth token validity (getProfile)
 *   - Brikette label hierarchy exists (labels.list)
 *   - Draft lifecycle (create, verify, delete)
 *
 * Gated by GMAIL_E2E=1 environment variable. When not set, the entire
 * suite is skipped with a descriptive message. This allows the file to
 * be included in normal test runs without side effects.
 *
 * Uses the withRetry utility (TASK-03) for resilience against transient
 * API failures during test execution.
 */

import type { gmail_v1 } from "googleapis";

import { getGmailClient } from "../clients/gmail";
import { withRetry } from "../utils/gmail-retry";

// ---------------------------------------------------------------------------
// Env-var gate
// ---------------------------------------------------------------------------

const ENABLED = process.env.GMAIL_E2E === "1";

// ---------------------------------------------------------------------------
// Expected Brikette labels — a representative subset that MUST exist for the
// email system to function. We don't assert every label, just the core ones.
// ---------------------------------------------------------------------------

const EXPECTED_LABEL_PREFIXES = [
  "Brikette/Queue/",
  "Brikette/Outcome/",
  "Brikette/Agent/",
];

const EXPECTED_CORE_LABELS = [
  "Brikette/Queue/Needs-Processing",
  "Brikette/Queue/In-Progress",
  "Brikette/Queue/Deferred",
  "Brikette/Outcome/Drafted",
  "Brikette/Agent/Codex",
];

// ---------------------------------------------------------------------------
// Test draft subject — clearly identifiable so accidental leftovers are easy
// to find and clean up manually.
// ---------------------------------------------------------------------------

const TEST_DRAFT_SUBJECT =
  "[E2E-TEST] Smoke test draft \u2014 safe to delete";

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

(ENABLED ? describe : describe.skip)("Gmail E2E Smoke Tests (TASK-10)", () => {
  let gmail: gmail_v1.Gmail;

  /** Track every draft ID we create so afterAll can clean up, even on failure. */
  const createdDraftIds: string[] = [];

  // -----------------------------------------------------------------------
  // Setup: acquire a real Gmail client from token.json
  // -----------------------------------------------------------------------

  beforeAll(async () => {
    const result = await getGmailClient();

    if (!result.success) {
      // Surface the real error so the developer knows what went wrong
      // (e.g. expired token, missing credentials). Throw so Jest marks the
      // suite as failed rather than silently passing.
      throw new Error(
        `Gmail client initialization failed: ${result.error}` +
          (result.needsSetup
            ? " — run the OAuth setup flow first."
            : ""),
      );
    }

    gmail = result.client;
  }, /* timeout */ 30_000);

  // -----------------------------------------------------------------------
  // Teardown: delete any drafts we created (best-effort)
  // -----------------------------------------------------------------------

  afterAll(async () => {
    for (const draftId of createdDraftIds) {
      try {
        await withRetry(
          () =>
            gmail.users.drafts.delete({
              userId: "me",
              id: draftId,
            }),
          { maxRetries: 2, baseDelay: 500 },
        );
      } catch (cleanupError) {
        // TC-05: warn but don't let cleanup failures mask the real result
        const msg =
          cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError);
        console.warn(
          `[gmail-e2e] Failed to delete draft ${draftId}: ${msg}`,
        );
      }
    }
  }, /* timeout */ 30_000);

  // -----------------------------------------------------------------------
  // TC-01 / TC-03: OAuth token valid — getProfile succeeds
  // -----------------------------------------------------------------------

  it("validates OAuth token via getProfile", async () => {
    const profile = await withRetry(() =>
      gmail.users.getProfile({ userId: "me" }),
    );

    expect(profile.data).toBeDefined();
    expect(profile.data.emailAddress).toBeTruthy();
    // Sanity: email looks like an email address
    expect(profile.data.emailAddress).toMatch(/@/);
  });

  // -----------------------------------------------------------------------
  // TC-01: Brikette labels exist
  // -----------------------------------------------------------------------

  it("lists Brikette labels", async () => {
    const response = await withRetry(() =>
      gmail.users.labels.list({ userId: "me" }),
    );

    const allLabels = response.data.labels ?? [];
    const labelNames: string[] = allLabels
      .map((l: { name?: string | null }) => l.name)
      .filter((n): n is string => typeof n === "string");

    // Verify at least one label per expected prefix
    for (const prefix of EXPECTED_LABEL_PREFIXES) {
      const matching = labelNames.filter((n) => n.startsWith(prefix));
      expect(matching.length).toBeGreaterThanOrEqual(
        1,
      );
    }

    // Verify specific core labels exist
    for (const expectedLabel of EXPECTED_CORE_LABELS) {
      expect(labelNames).toContain(expectedLabel);
    }
  });

  // -----------------------------------------------------------------------
  // TC-01 / TC-04: Draft lifecycle — create, verify, delete
  // -----------------------------------------------------------------------

  it("draft lifecycle: create, verify, delete", async () => {
    // --- Create ---
    const createResponse = await withRetry(() =>
      gmail.users.drafts.create({
        userId: "me",
        requestBody: {
          message: {
            raw: Buffer.from(
              [
                `Subject: ${TEST_DRAFT_SUBJECT}`,
                "Content-Type: text/plain; charset=utf-8",
                "",
                "This is an automated E2E smoke test draft. If you see this in your drafts, it was not cleaned up properly — safe to delete.",
              ].join("\r\n"),
            ).toString("base64url"),
          },
        },
      }),
    );

    const draftId = createResponse.data.id;
    expect(draftId).toBeTruthy();

    // Track for afterAll cleanup (safety net)
    createdDraftIds.push(draftId!);

    // --- Verify ---
    const getResponse = await withRetry(() =>
      gmail.users.drafts.get({
        userId: "me",
        id: draftId!,
      }),
    );

    expect(getResponse.data.id).toBe(draftId);

    // --- Delete ---
    await withRetry(() =>
      gmail.users.drafts.delete({
        userId: "me",
        id: draftId!,
      }),
    );

    // Remove from cleanup list since we already deleted it
    const idx = createdDraftIds.indexOf(draftId!);
    if (idx !== -1) {
      createdDraftIds.splice(idx, 1);
    }

    // Verify deletion: getting the draft should now 404
    await expect(
      gmail.users.drafts.get({ userId: "me", id: draftId! }),
    ).rejects.toThrow();
  }, /* timeout */ 30_000);
});

// ---------------------------------------------------------------------------
// Skip message — ensures Jest output is clear when the gate is closed.
// ---------------------------------------------------------------------------

if (!ENABLED) {
  it("Skipping E2E: set GMAIL_E2E=1 to run", () => {
    // No-op: this test exists solely to print a visible skip/pass message
    // in test output when the E2E suite is not enabled.
  });
}
