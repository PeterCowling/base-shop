import itFixture from "../__fixtures__/draft-pipeline/IT-01.json";
import mltFixture from "../__fixtures__/draft-pipeline/MLT-01.json";
import ppFixture from "../__fixtures__/draft-pipeline/PP-01.json";
import sglCheckInFixture from "../__fixtures__/draft-pipeline/SGL-01.json";
import sglCancellationFixture from "../__fixtures__/draft-pipeline/SGL-04.json";
import {
  type AgentDraftResult,
  deriveDraftFailureReason,
  draftFailureReasonFromCode,
  generateAgentDraft,
  type ThreadContext,
  toParitySnapshot,
} from "../draft-pipeline.server";

jest.mock("@/lib/gmail-client", () => ({
  listGmailThreads: jest.fn().mockResolvedValue({ threads: [] }),
  getGmailThread: jest.fn(),
}));

type DraftPipelineFixture = {
  id: string;
  class: string;
  description: string;
  input: {
    from?: string;
    subject?: string;
    body: string;
  };
  expected: {
    dominant_scenario_category: string;
    comparison_fields: string[];
  };
};

const fixtures: DraftPipelineFixture[] = [
  sglCheckInFixture,
  sglCancellationFixture,
  mltFixture,
  ppFixture,
  itFixture,
];

function buildInput(fixture: DraftPipelineFixture): ThreadContext {
  if (fixture.id === "PP-01") {
    return {
      ...fixture.input,
      prepaymentStep: "first",
      prepaymentProvider: "hostelworld",
    };
  }

  return fixture.input;
}

describe("generateAgentDraft", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("returns an error result for malformed input instead of throwing", async () => {
    await expect(generateAgentDraft({ body: "" })).resolves.toMatchObject({
      status: "error",
      plainText: null,
      html: null,
      error: {
        code: "invalid_input",
      },
    });
  });

  it("assembles interpret, generate, and quality stages for the saved parity fixtures", async () => {
    const results = await Promise.all(fixtures.map(async (fixture) => ({
      fixture,
      result: await generateAgentDraft(buildInput(fixture)),
    })));

    for (const { fixture, result } of results) {
      const snapshot = toParitySnapshot(result);

      expect(result.status).not.toBe("error");
      expect(
        Object.keys(snapshot).sort(),
      ).toEqual(fixture.expected.comparison_fields.slice().sort());
      expect(snapshot.branded_html_present).toBe(true);
      expect(snapshot.quality_result).not.toBeNull();
      expect(snapshot.selected_template_subject).not.toBeUndefined();
      expect(snapshot.selected_template_category).not.toBeUndefined();
    }
  });

  it("keeps the check-in path high-confidence and quality-passing", async () => {
    const result = await generateAgentDraft(sglCheckInFixture.input);
    const snapshot = toParitySnapshot(result);

    expect(result.status).not.toBe("error");
    expect(snapshot.selected_template_category === "check-in" || snapshot.selected_template_category === "faq").toBe(true);
    expect(snapshot.quality_result?.passed).toBe(true);
    expect(snapshot.answered_question_set.some((question) => /check[-\s]?in/i.test(question))).toBe(true);
  });

  it("uses the workflow-specific prepayment template path when the caller supplies step/provider context", async () => {
    const result = await generateAgentDraft(buildInput(ppFixture));
    const snapshot = toParitySnapshot(result);

    expect(result.status).not.toBe("error");
    expect(snapshot.dominant_scenario_category).toBe("prepayment");
    expect(snapshot.selected_template_subject).toBe(
      "Prepayment - 1st Attempt Failed (Hostelworld)",
    );
    expect(snapshot.selected_template_category).toBe("prepayment");
  });

  it("answers multiple questions in the saved multi-topic fixture", async () => {
    const result = await generateAgentDraft(mltFixture.input);
    const snapshot = toParitySnapshot(result);

    expect(result.status).not.toBe("error");
    expect(snapshot.answered_question_set.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.quality_result?.failed_checks).not.toContain("unanswered_questions");
  });

  it("preserves language detection for the Italian fixture", async () => {
    const result = await generateAgentDraft(itFixture.input);
    const snapshot = toParitySnapshot(result);

    expect(result.status).not.toBe("error");
    expect(snapshot.interpreted_language).toBe("IT");
    expect(snapshot.answered_question_set.some((question) => /colazione|breakfast/i.test(question))).toBe(true);
    expect(snapshot.branded_html_present).toBe(true);
  });

  it("builds a deterministic Hostelworld pricing breakdown when a pricing query has a booking reference", async () => {
    const { getGmailThread, listGmailThreads } = jest.requireMock("@/lib/gmail-client") as {
      listGmailThreads: jest.Mock;
      getGmailThread: jest.Mock;
    };

    listGmailThreads.mockResolvedValue({
      threads: [{ id: "thread-booking-source" }],
    });
    getGmailThread.mockResolvedValue({
      id: "thread-booking-source",
      historyId: "h-1",
      snippet: "",
      messages: [
        {
          id: "msg-1",
          threadId: "thread-booking-source",
          labelIds: [],
          historyId: "h-1",
          snippet: "",
          internalDate: "0",
          receivedAt: "2026-03-11T00:00:00.000Z",
          from: "Hostelworld <bookings@hostelworld.com>",
          to: [],
          subject: "Booking 7763-575812314",
          inReplyTo: null,
          references: null,
          body: {
            plain:
              "Reservation Code 7763-575812314 Total Price EUR 605.88 Deposit Paid EUR 90.88 Balance Due - Available Now EUR 590.59",
          },
          attachments: [],
        },
      ],
    });

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/financialsRoom/7763-575812314.json")) {
        return new Response(JSON.stringify({
          balance: 575.58,
          totalDue: 575.58,
          totalPaid: 0,
          totalAdjust: 0,
          transactions: {},
        }), { status: 200 });
      }
      if (url.includes("/cityTax/7763-575812314.json")) {
        return new Response(JSON.stringify({
          occ_1: { balance: 7.5, totalDue: 7.5, totalPaid: 0 },
          occ_2: { balance: 7.5, totalDue: 7.5, totalPaid: 0 },
        }), { status: 200 });
      }
      throw new Error(`Unexpected fetch ${url}`);
    }) as typeof fetch;

    const result = await generateAgentDraft({
      from: "Anna-Marie Leach <annamarie.leach4@gmail.com>",
      subject: "Re: Your Hostel Brikette Reservation",
      body:
        "Hello, I would still like to keep the booking. Can you please explain how the total reached $690.07? I see the total was €605.88.",
      bookingRef: "7763-575812314",
      guestName: "Anna-Marie",
    });

    expect(result.status).toBe("ready");
    expect(result.templateUsed?.subject).toBe("Hostelworld Pricing Breakdown");
    expect(result.templateUsed?.category).toBe("payment");
    expect(result.plainText).toContain("Room price before tax: €605.88");
    expect(result.plainText).toContain("Hostelworld deposit already paid: €90.88");
    expect(result.plainText).toContain("Room amount due: €575.58");
    expect(result.plainText).toContain("City tax due: €15.00");
    expect(result.plainText).toContain("All prices are in euros.");
    expect(result.plainText).toContain("contact Hostelworld directly");
    expect(result.qualityResult?.passed).toBe(true);
  });

  it("builds an affirmative deterministic room-allocation reply when all guests are in the same room", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/bookings/ROOM-SAME-1.json")) {
        return new Response(JSON.stringify({
          occ_1: { roomNumbers: ["4"], leadGuest: true },
          occ_2: { roomNumbers: ["4"], leadGuest: false },
        }), { status: 200 });
      }
      throw new Error(`Unexpected fetch ${url}`);
    }) as typeof fetch;

    const result = await generateAgentDraft({
      from: "Isabella Jane Grano <isabella@example.com>",
      subject: "Re: Your Hostel Brikette Reservation",
      body: "Hello, I believe we booked the same room. Can you confirm that we are together?",
      bookingRef: "ROOM-SAME-1",
      guestName: "Isabella",
    });

    expect(result.status).toBe("ready");
    expect(result.templateUsed?.subject).toBe("Booking Room Allocation Clarification");
    expect(result.templateUsed?.category).toBe("booking-issues");
    expect(result.plainText).toContain("Your booking currently shows 2 guests on this reservation.");
    expect(result.plainText).toContain("all guests are booked together in room 4");
    expect(result.qualityResult?.passed).toBe(true);
  });

  it("builds an alternative deterministic room-allocation reply when guests are not all in the same room", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/bookings/ROOM-SPLIT-1.json")) {
        return new Response(JSON.stringify({
          occ_1: { roomNumbers: ["4"], leadGuest: true },
          occ_2: { roomNumbers: ["5"], leadGuest: false },
          occ_3: { roomNumbers: ["5"], leadGuest: false },
        }), { status: 200 });
      }
      throw new Error(`Unexpected fetch ${url}`);
    }) as typeof fetch;

    const result = await generateAgentDraft({
      from: "Isabella Jane Grano <isabella@example.com>",
      subject: "Re: Your Hostel Brikette Reservation",
      body: "Hello, I think we may be split up rather than in the same room. Can you check?",
      bookingRef: "ROOM-SPLIT-1",
      guestName: "Isabella",
    });

    expect(result.status).toBe("ready");
    expect(result.templateUsed?.subject).toBe("Booking Room Allocation Clarification");
    expect(result.plainText).toContain("Your booking currently shows 3 guests on this reservation.");
    expect(result.plainText).toContain("The current room allocation shown in our system is:");
    expect(result.plainText).toContain("- 1 guest: room 4");
    expect(result.plainText).toContain("- 2 guests: room 5");
    expect(result.plainText).toContain("does not show all guests in the same room");
    expect(result.qualityResult?.passed).toBe(true);
  });

  it("builds a deterministic gratitude reply for a thank-you-only guest message", async () => {
    const result = await generateAgentDraft({
      from: "Matilda Urcuyo <matilda@example.com>",
      subject: "Re: We received this message from Matilda Urcuyo",
      body:
        "##- Please type your reply above this line -## Confirmation number: 6078502124 You have a new message from a guest Matilda Urcuyo said: Re: We received this message from Matilda Urcuyo Thank you!!! Reply --> https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/messaging /inbox.html?product_id=6078502124 Reservation details Guest name: Matilda Urcuyo This e-mail was sent by Booking.com",
      guestName: "Matilda",
    });

    expect(result.status).toBe("ready");
    expect(result.templateUsed?.subject).toBe("Guest Thank You Acknowledgement");
    expect(result.templateUsed?.category).toBe("faq");
    expect(result.plainText).toContain("You are most welcome :)");
    expect(result.plainText).toContain("We look forward to seeing you at the hostel.");
    expect(result.qualityResult?.passed).toBe(true);
  });

  it("does not use the gratitude reply when the guest still has a request", async () => {
    const result = await generateAgentDraft({
      from: "Matilda Urcuyo <matilda@example.com>",
      subject: "Re: We received this message from Matilda Urcuyo",
      body: "Thank you. Can you also confirm the room number?",
      guestName: "Matilda",
    });

    expect(result.status).not.toBe("error");
    expect(result.templateUsed?.subject).not.toBe("Guest Thank You Acknowledgement");
    expect(result.plainText).not.toContain("You are most welcome :)");
  });
});

// --- deriveDraftFailureReason + draftFailureReasonFromCode ---

function buildMockDraftResult(overrides: Partial<AgentDraftResult>): AgentDraftResult {
  return {
    status: "ready",
    plainText: null,
    html: null,
    draftId: null,
    templateUsed: null,
    qualityResult: null,
    interpretResult: null,
    questionBlocks: [],
    knowledgeSources: [],
    ...overrides,
  };
}

describe("deriveDraftFailureReason", () => {
  it("returns invalid_input for error status with invalid_input code", () => {
    const result = deriveDraftFailureReason(
      buildMockDraftResult({
        status: "error",
        error: { code: "invalid_input", message: "Draft pipeline requires a non-empty body." },
      }),
    );

    expect(result.code).toBe("invalid_input");
    expect(result.message).toBe("The email had no body text to generate a reply from.");
  });

  it("returns generation_failed for error status without error object", () => {
    const result = deriveDraftFailureReason(
      buildMockDraftResult({ status: "error" }),
    );

    expect(result.code).toBe("generation_failed");
    expect(result.message).toBe("Draft generation failed unexpectedly.");
  });

  it("returns quality_gate_failed with specific failed checks", () => {
    const result = deriveDraftFailureReason(
      buildMockDraftResult({
        qualityResult: {
          passed: false,
          failed_checks: ["unanswered_questions", "missing_signature"],
          warnings: [],
          confidence: 0.5,
          question_coverage: [],
        },
      }),
    );

    expect(result.code).toBe("quality_gate_failed");
    expect(result.message).toContain("unanswered questions");
    expect(result.message).toContain("missing signature");
  });

  it("returns quality_gate_failed without check names when failed_checks is empty", () => {
    const result = deriveDraftFailureReason(
      buildMockDraftResult({
        qualityResult: {
          passed: false,
          failed_checks: [],
          warnings: [],
          confidence: 0,
          question_coverage: [],
        },
      }),
    );

    expect(result.code).toBe("quality_gate_failed");
    expect(result.message).toBe("Draft did not pass quality checks.");
  });

  it("returns generation_failed when qualityResult is null", () => {
    const result = deriveDraftFailureReason(
      buildMockDraftResult({ status: "ready", qualityResult: null }),
    );

    expect(result.code).toBe("generation_failed");
    expect(result.message).toBe("Draft generation failed unexpectedly.");
  });

  it("truncates to 3 failed check labels", () => {
    const result = deriveDraftFailureReason(
      buildMockDraftResult({
        qualityResult: {
          passed: false,
          failed_checks: [
            "unanswered_questions",
            "prohibited_claims",
            "missing_signature",
            "missing_html",
            "missing_required_link",
          ],
          warnings: [],
          confidence: 0,
          question_coverage: [],
        },
      }),
    );

    expect(result.code).toBe("quality_gate_failed");
    // Should only include 3 labels
    const commaCount = (result.message.match(/,/g) ?? []).length;
    expect(commaCount).toBe(2);
  });
});

describe("draftFailureReasonFromCode", () => {
  it("returns max_retries_exceeded with default message", () => {
    const result = draftFailureReasonFromCode("max_retries_exceeded");

    expect(result.code).toBe("max_retries_exceeded");
    expect(result.message).toBe("Draft generation failed after multiple retry attempts.");
  });

  it("returns custom message when provided", () => {
    const result = draftFailureReasonFromCode("custom_code", "Custom failure message.");

    expect(result.code).toBe("custom_code");
    expect(result.message).toBe("Custom failure message.");
  });

  it("returns generic fallback for unknown code without message", () => {
    const result = draftFailureReasonFromCode("unknown_code");

    expect(result.code).toBe("unknown_code");
    expect(result.message).toBe("Draft generation failed.");
  });
});
