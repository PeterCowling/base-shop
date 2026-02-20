/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  ingestUnknownAnswerEntries,
  readReviewedLedgerEntries,
  transitionReviewedLedgerState,
} from "../tools/reviewed-ledger.js";

describe("reviewed-ledger ingestion (TASK-07)", () => {
  let tmpDir: string;
  let ledgerPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "reviewed-ledger-"));
    ledgerPath = path.join(tmpDir, "reviewed-learning-ledger.jsonl");
    process.env.REVIEWED_LEDGER_PATH = ledgerPath;
  });

  afterEach(() => {
    delete process.env.REVIEWED_LEDGER_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("TC-07-01: unknown scenario triggers reviewed-ledger record creation", async () => {
    const result = await ingestUnknownAnswerEntries({
      questions: ["What is the exact check-in cut-off time?"],
      draftedAnswer: "Please check our latest check-in guidance before arrival.",
      sourcePath: "queue",
      scenarioCategory: "check-in",
      language: "EN",
      normalizedText: "Guest asks for exact check-in cut-off time and options.",
    });

    expect(result.created).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
    expect(result.path).toBe(ledgerPath);

    const entry = result.created[0];
    expect(entry.review_state).toBe("new");
    expect(entry.verdict).toBe("new");
    expect(entry.source_path).toBe("queue");
    expect(entry.scenario_category).toBe("check-in");
    expect(entry.language).toBe("EN");
    expect(entry.question).toBe("What is the exact check-in cut-off time?");

    const persisted = await readReviewedLedgerEntries();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].question_hash).toBe(entry.question_hash);
  });

  it("TC-07-02: duplicate unknown detection is idempotent by question hash", async () => {
    await ingestUnknownAnswerEntries({
      questions: ["Do you provide airport transfer?"],
      draftedAnswer: "We can share transfer guidance after confirming your arrival details.",
      sourcePath: "queue",
      scenarioCategory: "transportation",
      language: "EN",
      normalizedText: "Guest asks for airport transfer options.",
    });

    const second = await ingestUnknownAnswerEntries({
      questions: ["Do you provide airport transfer?"],
      draftedAnswer: "We can share transfer guidance after confirming your arrival details.",
      sourcePath: "queue",
      scenarioCategory: "transportation",
      language: "EN",
      normalizedText: "Guest asks for airport transfer options.",
    });

    expect(second.created).toHaveLength(0);
    expect(second.duplicates).toHaveLength(1);

    const persisted = await readReviewedLedgerEntries();
    expect(persisted).toHaveLength(1);
  });

  it("TC-07-03: state transitions enforce allowed transition rules", async () => {
    const created = await ingestUnknownAnswerEntries({
      questions: ["Is breakfast available for very early departures?"],
      draftedAnswer: "Breakfast details vary; we will confirm specific options.",
      sourcePath: "queue",
      scenarioCategory: "breakfast",
      language: "EN",
      normalizedText: "Guest asks about early breakfast availability.",
    });

    const entry = created.created[0];
    const approved = transitionReviewedLedgerState(entry, "approved", "2026-02-20T12:00:00Z");
    expect(approved.review_state).toBe("approved");

    expect(() =>
      transitionReviewedLedgerState(approved, "deferred", "2026-02-20T12:05:00Z"),
    ).toThrow("invalid_transition:approved->deferred");

    const deferred = transitionReviewedLedgerState(entry, "deferred", "2026-02-20T12:10:00Z");
    const rejected = transitionReviewedLedgerState(deferred, "rejected", "2026-02-20T12:15:00Z");
    expect(rejected.review_state).toBe("rejected");
  });
});
