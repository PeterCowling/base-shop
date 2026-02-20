/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  ingestUnknownAnswerEntries,
  promoteReviewedLedgerEntry,
  readActiveFaqPromotions,
  readReviewedLedgerEntries,
  readReviewedPromotionRecords,
  revertReviewedLedgerPromotion,
  setReviewedLedgerState,
  transitionReviewedLedgerState,
} from "../tools/reviewed-ledger.js";

describe("reviewed-ledger ingestion (TASK-07)", () => {
  let tmpDir: string;
  let ledgerPath: string;
  let promotionPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "reviewed-ledger-"));
    ledgerPath = path.join(tmpDir, "reviewed-learning-ledger.jsonl");
    promotionPath = path.join(tmpDir, "reviewed-learning-promotions.json");
    process.env.REVIEWED_LEDGER_PATH = ledgerPath;
    process.env.REVIEWED_PROMOTION_PATH = promotionPath;
  });

  afterEach(() => {
    delete process.env.REVIEWED_LEDGER_PATH;
    delete process.env.REVIEWED_PROMOTION_PATH;
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

  it("TC-08-01: approved record promotes and appears in active FAQ promotion reads", async () => {
    const created = await ingestUnknownAnswerEntries({
      questions: ["Can I store luggage before check-in?"],
      draftedAnswer: "Yes, luggage storage is available before check-in.",
      sourcePath: "queue",
      scenarioCategory: "luggage",
      language: "EN",
      normalizedText: "Guest asks about luggage storage before check in.",
    });
    const entry = created.created[0];
    await setReviewedLedgerState(entry.entry_id, "approved", "2026-02-20T13:00:00Z");

    const promotion = await promoteReviewedLedgerEntry(entry.entry_id, "2026-02-20T13:05:00Z");
    expect(promotion.idempotent).toBe(false);
    expect(promotion.promotionRecord.key).toBe(`faq:${entry.question_hash}`);

    const promotionRecords = await readReviewedPromotionRecords();
    expect(promotionRecords).toHaveLength(1);
    expect(promotionRecords[0].status).toBe("active");
    const activePromotions = await readActiveFaqPromotions();
    expect(activePromotions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          question: "Can I store luggage before check-in?",
          answer: "Yes, luggage storage is available before check-in.",
        }),
      ]),
    );
  });

  it("TC-08-02: rejected/deferred records cannot be promoted", async () => {
    const created = await ingestUnknownAnswerEntries({
      questions: ["Can I check in at 5am?"],
      draftedAnswer: "Please contact us first for early check-in options.",
      sourcePath: "queue",
      scenarioCategory: "check-in",
      language: "EN",
      normalizedText: "Guest asks for 5am check in.",
    });
    const entry = created.created[0];

    await setReviewedLedgerState(entry.entry_id, "rejected", "2026-02-20T13:10:00Z");
    await expect(
      promoteReviewedLedgerEntry(entry.entry_id, "2026-02-20T13:11:00Z"),
    ).rejects.toThrow("promotion_requires_approved_state");

    const createdDeferred = await ingestUnknownAnswerEntries({
      questions: ["Can I use kitchen after midnight?"],
      draftedAnswer: "Kitchen access varies by policy and quiet hours.",
      sourcePath: "queue",
      scenarioCategory: "house-rules",
      language: "EN",
      normalizedText: "Guest asks about midnight kitchen use.",
    });
    const deferred = createdDeferred.created[0];
    await setReviewedLedgerState(deferred.entry_id, "deferred", "2026-02-20T13:12:00Z");
    await expect(
      promoteReviewedLedgerEntry(deferred.entry_id, "2026-02-20T13:13:00Z"),
    ).rejects.toThrow("promotion_requires_approved_state");

    expect(await readReviewedPromotionRecords()).toHaveLength(0);
  });

  it("TC-08-03: duplicate promotion request is idempotent", async () => {
    const created = await ingestUnknownAnswerEntries({
      questions: ["What is checkout time?"],
      draftedAnswer: "Checkout is by 10:30.",
      sourcePath: "queue",
      scenarioCategory: "checkout",
      language: "EN",
      normalizedText: "Guest asks checkout time.",
    });
    const entry = created.created[0];
    await setReviewedLedgerState(entry.entry_id, "approved", "2026-02-20T13:20:00Z");

    const first = await promoteReviewedLedgerEntry(entry.entry_id, "2026-02-20T13:21:00Z");
    const second = await promoteReviewedLedgerEntry(entry.entry_id, "2026-02-20T13:22:00Z");
    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);

    const promotionRecords = await readReviewedPromotionRecords();
    expect(promotionRecords).toHaveLength(1);

    const persisted = await readReviewedLedgerEntries();
    const promoted = persisted.find((row) => row.entry_id === entry.entry_id);
    expect(promoted?.history.map((event) => event.event)).toEqual(
      expect.arrayContaining(["promoted", "promotion_idempotent"]),
    );
  });

  it("TC-08-04: rollback/unpublish removes promoted entry from active promotion reads", async () => {
    const created = await ingestUnknownAnswerEntries({
      questions: ["Do you offer late checkout?"],
      draftedAnswer: "Late checkout depends on availability.",
      sourcePath: "queue",
      scenarioCategory: "checkout",
      language: "EN",
      normalizedText: "Guest asks late checkout availability.",
    });
    const entry = created.created[0];
    await setReviewedLedgerState(entry.entry_id, "approved", "2026-02-20T13:30:00Z");
    await promoteReviewedLedgerEntry(entry.entry_id, "2026-02-20T13:31:00Z");

    const rollback = await revertReviewedLedgerPromotion(entry.entry_id, "2026-02-20T13:32:00Z");
    expect(rollback.idempotent).toBe(false);
    expect(rollback.promotionRecord?.status).toBe("reverted");
    const activePromotions = await readActiveFaqPromotions();
    expect(
      activePromotions.find((record) => record.question === "Do you offer late checkout?"),
    ).toBeUndefined();
  });

  it("TC-08-05: conflicting promotion key is rejected without mutating promoted record", async () => {
    const created = await ingestUnknownAnswerEntries({
      questions: ["Can I leave luggage after checkout?"],
      draftedAnswer: "Yes, storage is available after checkout for a limited time.",
      sourcePath: "queue",
      scenarioCategory: "luggage",
      language: "EN",
      normalizedText: "Guest asks luggage after checkout.",
    });
    const entry = created.created[0];
    await setReviewedLedgerState(entry.entry_id, "approved", "2026-02-20T13:40:00Z");

    fs.writeFileSync(
      promotionPath,
      JSON.stringify({
        records: [
          {
            key: `faq:${entry.question_hash}`,
            source_entry_id: "ledger-other-source",
            question_hash: entry.question_hash,
            question: entry.question,
            answer: "Conflicting answer from another source.",
            status: "active",
            promoted_at: "2026-02-20T13:41:00Z",
            reverted_at: null,
          },
        ],
      }),
      "utf-8",
    );

    await expect(
      promoteReviewedLedgerEntry(entry.entry_id, "2026-02-20T13:42:00Z"),
    ).rejects.toThrow("promotion_conflict_existing_key");

    const promotionRecords = await readReviewedPromotionRecords();
    expect(promotionRecords).toHaveLength(1);
    expect(promotionRecords[0].source_entry_id).toBe("ledger-other-source");
    expect(promotionRecords[0].answer).toBe("Conflicting answer from another source.");
  });
});
