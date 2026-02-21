/** @jest-environment node */

type ReviewState = "new" | "approved" | "rejected" | "deferred";
type PromotionStatus = "active" | "reverted";

type LedgerHistoryEvent = {
  at: string;
  event: "created" | "state_transition" | "promoted" | "promotion_idempotent" | "reverted";
  details: Record<string, string>;
};

type LedgerEntry = {
  entry_id: string;
  created_at: string;
  updated_at: string;
  review_state: ReviewState;
  question_hash: string;
  question: string;
  drafted_answer: string;
  promotion: {
    key: string | null;
    status: PromotionStatus | null;
    promoted_at: string | null;
    reverted_at: string | null;
  };
  history: LedgerHistoryEvent[];
};

type PromotionRecord = {
  key: string;
  source_entry_id: string;
  answer: string;
  status: PromotionStatus;
};

const ALLOWED_TRANSITIONS: Record<ReviewState, ReviewState[]> = {
  new: ["approved", "rejected", "deferred"],
  approved: [],
  rejected: [],
  deferred: ["approved", "rejected"],
};

function createEntry(seed: {
  entryId: string;
  questionHash: string;
  question: string;
  draftedAnswer: string;
  createdAt: string;
}): LedgerEntry {
  return {
    entry_id: seed.entryId,
    created_at: seed.createdAt,
    updated_at: seed.createdAt,
    review_state: "new",
    question_hash: seed.questionHash,
    question: seed.question,
    drafted_answer: seed.draftedAnswer,
    promotion: {
      key: null,
      status: null,
      promoted_at: null,
      reverted_at: null,
    },
    history: [
      {
        at: seed.createdAt,
        event: "created",
        details: { review_state: "new" },
      },
    ],
  };
}

function transitionState(entry: LedgerEntry, nextState: ReviewState, at: string): LedgerEntry {
  if (!ALLOWED_TRANSITIONS[entry.review_state].includes(nextState)) {
    throw new Error(
      `invalid_transition:${entry.review_state}->${nextState}`
    );
  }

  return {
    ...entry,
    review_state: nextState,
    updated_at: at,
    history: [
      ...entry.history,
      {
        at,
        event: "state_transition",
        details: {
          from: entry.review_state,
          to: nextState,
        },
      },
    ],
  };
}

function promoteApprovedEntry(
  entry: LedgerEntry,
  knowledge: Map<string, PromotionRecord>,
  at: string
): { entry: LedgerEntry; idempotent: boolean } {
  if (entry.review_state !== "approved") {
    throw new Error("promotion_requires_approved_state");
  }

  const promotionKey = `faq:${entry.question_hash}`;
  const existing = knowledge.get(promotionKey);

  if (existing) {
    if (existing.source_entry_id !== entry.entry_id) {
      throw new Error("promotion_conflict_existing_key");
    }

    return {
      entry: {
        ...entry,
        updated_at: at,
        promotion: {
          key: promotionKey,
          status: existing.status,
          promoted_at: entry.promotion.promoted_at ?? at,
          reverted_at: entry.promotion.reverted_at,
        },
        history: [
          ...entry.history,
          {
            at,
            event: "promotion_idempotent",
            details: { key: promotionKey },
          },
        ],
      },
      idempotent: true,
    };
  }

  knowledge.set(promotionKey, {
    key: promotionKey,
    source_entry_id: entry.entry_id,
    answer: entry.drafted_answer,
    status: "active",
  });

  return {
    entry: {
      ...entry,
      updated_at: at,
      promotion: {
        key: promotionKey,
        status: "active",
        promoted_at: at,
        reverted_at: null,
      },
      history: [
        ...entry.history,
        {
          at,
          event: "promoted",
          details: { key: promotionKey },
        },
      ],
    },
    idempotent: false,
  };
}

function rollbackPromotion(
  entry: LedgerEntry,
  knowledge: Map<string, PromotionRecord>,
  at: string
): { entry: LedgerEntry; idempotent: boolean } {
  const key = entry.promotion.key;
  if (!key) {
    return { entry, idempotent: true };
  }

  const existing = knowledge.get(key);
  if (!existing || existing.status === "reverted") {
    return { entry, idempotent: true };
  }

  knowledge.set(key, {
    ...existing,
    status: "reverted",
  });

  return {
    entry: {
      ...entry,
      updated_at: at,
      promotion: {
        ...entry.promotion,
        status: "reverted",
        reverted_at: at,
      },
      history: [
        ...entry.history,
        {
          at,
          event: "reverted",
          details: { key },
        },
      ],
    },
    idempotent: false,
  };
}

describe("ledger-promotion spike contract", () => {
  it("TC-14-01: prototype ingest enforces allowed and invalid state transitions", () => {
    const created = createEntry({
      entryId: "ledger-001",
      questionHash: "q-luggage-before-checkin",
      question: "Can I store luggage before check-in?",
      draftedAnswer:
        "Yes, luggage storage is available before check-in. We can confirm details on arrival.",
      createdAt: "2026-02-20T09:00:00Z",
    });

    const approved = transitionState(created, "approved", "2026-02-20T09:05:00Z");
    expect(approved.review_state).toBe("approved");

    const rejected = transitionState(created, "rejected", "2026-02-20T09:06:00Z");
    expect(rejected.review_state).toBe("rejected");

    const deferred = transitionState(created, "deferred", "2026-02-20T09:07:00Z");
    expect(deferred.review_state).toBe("deferred");

    expect(() =>
      transitionState(approved, "deferred", "2026-02-20T09:10:00Z")
    ).toThrow("invalid_transition:approved->deferred");

    expect(() =>
      transitionState(rejected, "approved", "2026-02-20T09:11:00Z")
    ).toThrow("invalid_transition:rejected->approved");
  });

  it("TC-14-02: duplicate promotion attempts resolve idempotently", () => {
    const knowledge = new Map<string, PromotionRecord>();

    const created = createEntry({
      entryId: "ledger-002",
      questionHash: "q-late-checkin",
      question: "What happens if I arrive after midnight?",
      draftedAnswer:
        "Late check-in is possible with advance notice. Follow the late check-in instructions.",
      createdAt: "2026-02-20T10:00:00Z",
    });

    const approved = transitionState(created, "approved", "2026-02-20T10:04:00Z");

    const firstPromotion = promoteApprovedEntry(
      approved,
      knowledge,
      "2026-02-20T10:05:00Z"
    );

    expect(firstPromotion.idempotent).toBe(false);
    expect(knowledge.size).toBe(1);

    const secondPromotion = promoteApprovedEntry(
      firstPromotion.entry,
      knowledge,
      "2026-02-20T10:06:00Z"
    );

    expect(secondPromotion.idempotent).toBe(true);
    expect(knowledge.size).toBe(1);
    expect(Array.from(knowledge.keys())).toEqual(["faq:q-late-checkin"]);
  });

  it("TC-14-03: rollback invalidates promoted entry without corrupting ledger history", () => {
    const knowledge = new Map<string, PromotionRecord>();

    const created = createEntry({
      entryId: "ledger-003",
      questionHash: "q-checkout-time",
      question: "What is checkout time?",
      draftedAnswer:
        "Checkout is by 10:30. Luggage storage is available after checkout.",
      createdAt: "2026-02-20T11:00:00Z",
    });

    const approved = transitionState(created, "approved", "2026-02-20T11:01:00Z");
    const promoted = promoteApprovedEntry(approved, knowledge, "2026-02-20T11:02:00Z");

    const rollback = rollbackPromotion(promoted.entry, knowledge, "2026-02-20T11:03:00Z");
    expect(rollback.idempotent).toBe(false);

    const promotionKey = rollback.entry.promotion.key;
    expect(promotionKey).toBe("faq:q-checkout-time");
    expect(knowledge.get("faq:q-checkout-time")?.status).toBe("reverted");
    expect(rollback.entry.promotion.status).toBe("reverted");

    const eventTrail = rollback.entry.history.map((event) => event.event);
    expect(eventTrail).toEqual([
      "created",
      "state_transition",
      "promoted",
      "reverted",
    ]);

    const secondRollback = rollbackPromotion(
      rollback.entry,
      knowledge,
      "2026-02-20T11:04:00Z"
    );
    expect(secondRollback.idempotent).toBe(true);
    expect(secondRollback.entry.history).toEqual(rollback.entry.history);
  });
});
