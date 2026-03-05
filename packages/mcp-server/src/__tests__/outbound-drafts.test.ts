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
      get: jest.Mock;
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
        get: jest.fn(async ({ id }: { id: string }) => ({
          data: {
            id,
            message: {
              id: id === "draft-existing-001" ? "msg-existing-001" : "msg-001",
            },
          },
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
    headers:
      typeof globalThis.Headers === "function"
        ? new globalThis.Headers({ "Content-Type": "application/json" })
        : ({ get: () => "application/json" } as unknown as Headers),
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
    headers:
      typeof globalThis.Headers === "function"
        ? new globalThis.Headers({ "Content-Type": "application/json" })
        : ({ get: () => "application/json" } as unknown as Headers),
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

  it("TC-07-05: invalid Firebase records are skipped and reported", async () => {
    mockFetch.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-valid": makePendingRecord("pre-arrival"),
          "record-invalid": {
            to: "not-an-email",
            subject: "",
            bodyText: "",
            category: "pre-arrival",
            status: "pending",
            createdAt: "not-a-date",
          },
        });
      }
      return makeFirebasePatchResponse();
    });

    const result = await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });

    const payload = JSON.parse(result.content[0].text) as {
      processed: number;
      drafted: number;
      invalidRecords: Array<{ id: string; error: string }>;
    };

    expect(payload.processed).toBe(1);
    expect(payload.drafted).toBe(1);
    expect(payload.invalidRecords).toHaveLength(1);
    expect(payload.invalidRecords[0]?.id).toBe("record-invalid");
    expect(gmailStub.users.drafts.create).toHaveBeenCalledTimes(1);
    const invalidPatchCall = mockFetch.mock.calls.find(
      ([url, opts]) =>
        String(url).includes("/outboundDrafts/record-invalid.json") &&
        opts?.method === "PATCH",
    );
    expect(invalidPatchCall).toBeDefined();
    expect(String(invalidPatchCall?.[1]?.body)).toContain('"status":"failed"');
  });

  it("TC-07-06: only invalid Firebase records return no-pending summary", async () => {
    mockFetch.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-invalid": {
            to: "broken",
            subject: "",
            bodyText: "",
            category: "pre-arrival",
            status: "pending",
            createdAt: "also-broken",
          },
        });
      }
      return makeFirebasePatchResponse();
    });

    const result = await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });
    const payload = JSON.parse(result.content[0].text) as {
      processed: number;
      invalidRecords: Array<{ id: string; error: string }>;
      message: string;
    };

    expect(payload.processed).toBe(0);
    expect(payload.invalidRecords).toHaveLength(1);
    expect(payload.message).toContain("filtering invalid records");
    expect(gmailStub.users.drafts.create).not.toHaveBeenCalled();
    const invalidPatchCall = mockFetch.mock.calls.find(
      ([url, opts]) =>
        String(url).includes("/outboundDrafts/record-invalid.json") &&
        opts?.method === "PATCH",
    );
    expect(invalidPatchCall).toBeDefined();
    expect(String(invalidPatchCall?.[1]?.body)).toContain("Invalid outbound draft record");
  });

});

describe("prime_process_outbound_drafts — reliability hardening (TC-07)", () => {
  let gmailStub: GmailStub;

  beforeEach(() => {
    jest.clearAllMocks();
    gmailStub = createGmailStub();
    getGmailClientMock.mockResolvedValue({
      success: true,
      client: gmailStub,
    });

    mockFetch.mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-001": makePendingRecord("pre-arrival"),
        });
      }
      return makeFirebasePatchResponse();
    });
  });

  it("TC-07-07: label application failure marks record failed (fail-closed)", async () => {
    gmailStub.users.messages.modify.mockImplementation(async () => {
      throw new Error("gmail modify failed");
    });

    const result = await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });
    const payload = JSON.parse(result.content[0].text) as {
      processed: number;
      drafted: number;
      failed: number;
      results: Array<{ id: string; status: string; error?: string }>;
    };

    expect(payload.processed).toBe(1);
    expect(payload.drafted).toBe(0);
    expect(payload.failed).toBe(1);
    expect(payload.results[0]?.status).toBe("failed");
    expect(payload.results[0]?.error).toContain("Failed to apply draft outcome labels");

    const failedPatchCall = mockFetch.mock.calls.find(
      ([url, opts]) =>
        String(url).includes("/outboundDrafts/record-001.json") &&
        opts?.method === "PATCH" &&
        String(opts.body).includes('"status":"failed"'),
    );
    expect(failedPatchCall).toBeDefined();
  });

  it("TC-07-08: stale processing record is recovered and processed", async () => {
    mockFetch.mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-stale-processing": {
            ...makePendingRecord("pre-arrival"),
            status: "processing",
            processingStartedAt: "2020-01-01T00:00:00.000Z",
          },
        });
      }
      return makeFirebasePatchResponse();
    });

    const result = await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });
    const payload = JSON.parse(result.content[0].text) as {
      processed: number;
      drafted: number;
      failed: number;
    };

    expect(payload.processed).toBe(1);
    expect(payload.drafted).toBe(1);
    expect(payload.failed).toBe(0);
    expect(gmailStub.users.drafts.create).toHaveBeenCalledTimes(1);
  });

  it("TC-07-09: invalid non-pending record is not forcibly patched", async () => {
    mockFetch.mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-invalid-nonpending": {
            to: "broken",
            subject: "",
            bodyText: "",
            category: "pre-arrival",
            status: "drafted",
            createdAt: "not-a-date",
          },
        });
      }
      return makeFirebasePatchResponse();
    });

    await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });

    const invalidPatchCall = mockFetch.mock.calls.find(
      ([url, opts]) =>
        String(url).includes("/outboundDrafts/record-invalid-nonpending.json") &&
        opts?.method === "PATCH",
    );
    expect(invalidPatchCall).toBeUndefined();
  });

  it("TC-07-10: stale processing with existing draft reference is reconciled without re-drafting", async () => {
    mockFetch.mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-stale-existing-draft": {
            ...makePendingRecord("pre-arrival"),
            status: "processing",
            processingStartedAt: "2020-01-01T00:00:00.000Z",
            draftId: "draft-existing-001",
            gmailMessageId: "msg-existing-001",
          },
        });
      }
      return makeFirebasePatchResponse();
    });

    const result = await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });
    const payload = JSON.parse(result.content[0].text) as {
      processed: number;
      drafted: number;
      failed: number;
    };

    expect(payload.processed).toBe(1);
    expect(payload.drafted).toBe(1);
    expect(payload.failed).toBe(0);
    expect(gmailStub.users.drafts.create).not.toHaveBeenCalled();
    expect(gmailStub.users.drafts.get).toHaveBeenCalledWith({
      userId: "me",
      id: "draft-existing-001",
    });
    expect(gmailStub.users.messages.modify).toHaveBeenCalled();

    const draftedPatchCall = mockFetch.mock.calls.find(
      ([url, opts]) =>
        String(url).includes("/outboundDrafts/record-stale-existing-draft.json") &&
        opts?.method === "PATCH" &&
        String(opts.body).includes('"status":"drafted"'),
    );
    expect(draftedPatchCall).toBeDefined();
  });

  it("TC-07-11: non-stale processing with existing draft reference is skipped", async () => {
    mockFetch.mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-active-existing-draft": {
            ...makePendingRecord("pre-arrival"),
            status: "processing",
            processingStartedAt: new Date().toISOString(),
            draftId: "draft-existing-001",
            gmailMessageId: "msg-existing-001",
          },
        });
      }
      return makeFirebasePatchResponse();
    });

    const result = await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });
    const payload = JSON.parse(result.content[0].text) as {
      processed: number;
      message: string;
    };

    expect(payload.processed).toBe(0);
    expect(payload.message).toContain("No processable outbound drafts");
    expect(gmailStub.users.drafts.create).not.toHaveBeenCalled();
    expect(gmailStub.users.drafts.get).not.toHaveBeenCalled();
  });

  it("TC-07-12: stale processing with only gmailMessageId and no draftId is marked failed", async () => {
    mockFetch.mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === "GET") {
        return makeFirebaseResponse({
          "record-stale-missing-draftid": {
            ...makePendingRecord("pre-arrival"),
            status: "processing",
            processingStartedAt: "2020-01-01T00:00:00.000Z",
            gmailMessageId: "msg-existing-001",
          },
        });
      }
      return makeFirebasePatchResponse();
    });

    const result = await handleOutboundDraftTool("prime_process_outbound_drafts", {
      firebaseUrl: BASE_FIREBASE_URL,
    });
    const payload = JSON.parse(result.content[0].text) as {
      processed: number;
      drafted: number;
      failed: number;
      results: Array<{ status: string; error?: string }>;
    };

    expect(payload.processed).toBe(1);
    expect(payload.drafted).toBe(0);
    expect(payload.failed).toBe(1);
    expect(payload.results[0]?.status).toBe("failed");
    expect(payload.results[0]?.error).toContain("Missing draftId for processing reconciliation");
    expect(gmailStub.users.drafts.get).not.toHaveBeenCalled();

    const failedPatchCall = mockFetch.mock.calls.find(
      ([url, opts]) =>
        String(url).includes("/outboundDrafts/record-stale-missing-draftid.json") &&
        opts?.method === "PATCH" &&
        String(opts.body).includes('"status":"failed"'),
    );
    expect(failedPatchCall).toBeDefined();
  });
});
