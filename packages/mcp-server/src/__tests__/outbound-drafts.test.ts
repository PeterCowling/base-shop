/** @jest-environment node */

/**
 * TC-07: prime_process_outbound_drafts label attribution
 *
 * Verifies that Flow 2 outbound drafts receive:
 *   - TC-07-01: Brikette/Outcome/Drafted (PROCESSED_DRAFTED) label
 *   - TC-07-02: Agent/Human label (default actor)
 *   - TC-07-03: actor parameter accepted; "claude" applies Agent/Claude instead
 *   - TC-07-04: existing category labels still present (OUTBOUND_PRE_ARRIVAL,
 *               OUTBOUND_OPERATIONS, READY_FOR_REVIEW)
 */

import { getGmailClient } from "../clients/gmail";
import { LABELS } from "../tools/gmail";
import { handleOutboundDraftTool } from "../tools/outbound-drafts";

type GmailLabel = { id: string; name: string };

type GmailStub = {
  users: {
    labels: {
      list: jest.Mock;
      create: jest.Mock;
    };
    messages: {
      modify: jest.Mock;
    };
    drafts: {
      create: jest.Mock;
    };
  };
};

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

// Mock fetch for Firebase interactions
const mockFetch = jest.fn();
global.fetch = mockFetch;

const getGmailClientMock = getGmailClient as jest.Mock;

// Label IDs assigned by the stub for each label name
const LABEL_ID_MAP: Record<string, string> = {
  [LABELS.PROCESSED_DRAFTED]: "lbl-outcome-drafted",
  [LABELS.AGENT_HUMAN]: "lbl-agent-human",
  [LABELS.AGENT_CLAUDE]: "lbl-agent-claude",
  [LABELS.AGENT_CODEX]: "lbl-agent-codex",
  [LABELS.READY_FOR_REVIEW]: "lbl-ready-for-review",
  [LABELS.OUTBOUND_PRE_ARRIVAL]: "lbl-outbound-pre-arrival",
  [LABELS.OUTBOUND_OPERATIONS]: "lbl-outbound-operations",
};

function makeLabelList(): GmailLabel[] {
  return Object.entries(LABEL_ID_MAP).map(([name, id]) => ({ id, name }));
}

function createGmailStub(): GmailStub {
  const labelsStore = makeLabelList();

  return {
    users: {
      labels: {
        list: jest.fn(async () => ({ data: { labels: labelsStore } })),
        create: jest.fn(async ({ requestBody }: { requestBody: { name: string } }) => {
          const newLabel = { id: `lbl-new-${requestBody.name}`, name: requestBody.name };
          labelsStore.push(newLabel);
          return { data: newLabel };
        }),
      },
      messages: {
        modify: jest.fn(async () => ({ data: {} })),
      },
      drafts: {
        create: jest.fn(async () => ({
          data: { id: "draft-001", message: { id: "msg-001" } },
        })),
      },
    },
  };
}

function makeFirebaseResponse(records: Record<string, object>): Response {
  const factory = (): Partial<Response> => ({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "Content-Type": "application/json" }),
    json: async () => records,
    text: async () => JSON.stringify(records),
    clone: () => factory() as Response,
  });
  return factory() as unknown as Response;
}

function makeFirebasePatchResponse(): Response {
  const factory = (): Partial<Response> => ({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "Content-Type": "application/json" }),
    json: async () => ({}),
    text: async () => "{}",
    clone: () => factory() as Response,
  });
  return factory() as unknown as Response;
}

const BASE_FIREBASE_URL = "https://test-db.firebaseio.com";

function makePendingRecord(category: "pre-arrival" | "extension-ops") {
  return {
    to: "guest@example.com",
    subject: "Your upcoming arrival",
    bodyText: "Hello, your check-in is tomorrow.",
    category,
    status: "pending" as const,
    createdAt: "2026-02-19T10:00:00.000Z",
  };
}

describe("prime_process_outbound_drafts — label attribution (TC-07)", () => {
  let gmailStub: GmailStub;

  beforeEach(() => {
    jest.clearAllMocks();
    gmailStub = createGmailStub();
    getGmailClientMock.mockResolvedValue({
      success: true,
      client: gmailStub,
    });

    // Firebase GET returns one pending record
    mockFetch.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-001": makePendingRecord("pre-arrival"),
        });
      }
      // PATCH
      return makeFirebasePatchResponse();
    });
  });

  // -------------------------------------------------------------------------
  // TC-07-01: PROCESSED_DRAFTED label in addLabelIds
  // -------------------------------------------------------------------------
  it("TC-07-01: applies PROCESSED_DRAFTED (Brikette/Outcome/Drafted) to every draft", async () => {
    await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });

    expect(gmailStub.users.messages.modify).toHaveBeenCalled();

    const calls = gmailStub.users.messages.modify.mock.calls as Array<
      [{ userId: string; id: string; requestBody: { addLabelIds: string[] } }]
    >;
    for (const [args] of calls) {
      expect(args.requestBody.addLabelIds).toContain(
        LABEL_ID_MAP[LABELS.PROCESSED_DRAFTED],
      );
    }
  });

  // -------------------------------------------------------------------------
  // TC-07-02: Agent/Human label in addLabelIds (default actor)
  // -------------------------------------------------------------------------
  it("TC-07-02: applies Agent/Human label by default (no actor param)", async () => {
    await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });

    expect(gmailStub.users.messages.modify).toHaveBeenCalled();

    const calls = gmailStub.users.messages.modify.mock.calls as Array<
      [{ userId: string; id: string; requestBody: { addLabelIds: string[] } }]
    >;
    for (const [args] of calls) {
      expect(args.requestBody.addLabelIds).toContain(
        LABEL_ID_MAP[LABELS.AGENT_HUMAN],
      );
    }
  });

  // -------------------------------------------------------------------------
  // TC-07-03: actor param accepted; "claude" applies Agent/Claude
  // -------------------------------------------------------------------------
  it("TC-07-03: actor=claude applies Agent/Claude instead of Agent/Human", async () => {
    await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
      actor: "claude",
    });

    expect(gmailStub.users.messages.modify).toHaveBeenCalled();

    const calls = gmailStub.users.messages.modify.mock.calls as Array<
      [{ userId: string; id: string; requestBody: { addLabelIds: string[] } }]
    >;
    for (const [args] of calls) {
      expect(args.requestBody.addLabelIds).toContain(
        LABEL_ID_MAP[LABELS.AGENT_CLAUDE],
      );
      expect(args.requestBody.addLabelIds).not.toContain(
        LABEL_ID_MAP[LABELS.AGENT_HUMAN],
      );
    }
  });

  // -------------------------------------------------------------------------
  // TC-07-04: existing category labels still present
  // -------------------------------------------------------------------------
  it("TC-07-04: existing category labels (OUTBOUND_PRE_ARRIVAL, READY_FOR_REVIEW) still in addLabelIds", async () => {
    await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });

    expect(gmailStub.users.messages.modify).toHaveBeenCalled();

    const calls = gmailStub.users.messages.modify.mock.calls as Array<
      [{ userId: string; id: string; requestBody: { addLabelIds: string[] } }]
    >;
    for (const [args] of calls) {
      expect(args.requestBody.addLabelIds).toContain(
        LABEL_ID_MAP[LABELS.READY_FOR_REVIEW],
      );
      expect(args.requestBody.addLabelIds).toContain(
        LABEL_ID_MAP[LABELS.OUTBOUND_PRE_ARRIVAL],
      );
    }
  });

  // Also verify extension-ops category gets OUTBOUND_OPERATIONS
  it("TC-07-04b: extension-ops category still gets OUTBOUND_OPERATIONS label", async () => {
    mockFetch.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-002": makePendingRecord("extension-ops"),
        });
      }
      return makeFirebasePatchResponse();
    });

    await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });

    const calls = gmailStub.users.messages.modify.mock.calls as Array<
      [{ userId: string; id: string; requestBody: { addLabelIds: string[] } }]
    >;
    expect(calls.length).toBeGreaterThan(0);
    for (const [args] of calls) {
      expect(args.requestBody.addLabelIds).toContain(
        LABEL_ID_MAP[LABELS.OUTBOUND_OPERATIONS],
      );
    }
  });
});
