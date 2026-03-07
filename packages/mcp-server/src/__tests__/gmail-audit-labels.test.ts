/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, REQUIRED_LABELS, setLockStore } from "../tools/gmail";
import { createLockStore } from "../utils/lock-store";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

// Hardcoded legacy label values matching LEGACY_LABELS in gmail.ts (not exported).
const KNOWN_LEGACY_LABEL_VALUES = [
  "Brikette/Inbox/Needs-Processing",
  "Brikette/Inbox/Processing",
  "Brikette/Inbox/Awaiting-Agreement",
  "Brikette/Inbox/Deferred",
  "Brikette/Processed/Drafted",
  "Brikette/Processed/Acknowledged",
  "Brikette/Processed/Skipped",
  "Brikette/Promotional",
  "Brikette/Spam",
];

let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-labels-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

function buildLabelStub(labelNames: string[]) {
  const labels = labelNames.map((name, i) => ({ id: `label-${i + 1}`, name }));
  return {
    users: {
      labels: {
        list: jest.fn(async () => ({ data: { labels } })),
        create: jest.fn(),
      },
      messages: {
        get: jest.fn(),
        modify: jest.fn(),
        list: jest.fn(async () => ({ data: { messages: [] } })),
      },
      threads: {
        get: jest.fn(async () => ({ data: { messages: [] } })),
      },
      drafts: {
        list: jest.fn(async () => ({ data: { drafts: [] } })),
        create: jest.fn(),
      },
    },
  };
}

describe("gmail_audit_labels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-A1: Gmail has only REQUIRED_LABELS → known full, legacy = [], orphaned = []
  it("TC-A1: all required labels present → known full, no legacy, no orphaned", async () => {
    const stub = buildLabelStub([...REQUIRED_LABELS]);
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_audit_labels", {});

    expect(result.isError).toBeFalsy();
    const content = JSON.parse((result.content as Array<{ text: string }>)[0].text) as {
      known: string[];
      legacy: string[];
      orphaned: string[];
      total_brikette: number;
    };
    expect(content.known).toHaveLength(REQUIRED_LABELS.length);
    expect(content.legacy).toEqual([]);
    expect(content.orphaned).toEqual([]);
    expect(content.total_brikette).toBe(REQUIRED_LABELS.length);
  });

  // TC-A2: Gmail has REQUIRED_LABELS + 2 LEGACY_LABELS + 1 unknown → legacy = 2, orphaned = 1
  it("TC-A2: mixed labels → correct classification into known/legacy/orphaned", async () => {
    const twoLegacy = KNOWN_LEGACY_LABEL_VALUES.slice(0, 2);
    const oneOrphaned = "Brikette/Unknown/SomeOldLabel";
    const stub = buildLabelStub([...REQUIRED_LABELS, ...twoLegacy, oneOrphaned]);
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_audit_labels", {});

    expect(result.isError).toBeFalsy();
    const content = JSON.parse((result.content as Array<{ text: string }>)[0].text) as {
      known: string[];
      legacy: string[];
      orphaned: string[];
      total_brikette: number;
    };
    expect(content.known).toHaveLength(REQUIRED_LABELS.length);
    expect(content.legacy).toHaveLength(2);
    expect(content.legacy).toEqual(expect.arrayContaining(twoLegacy));
    expect(content.orphaned).toHaveLength(1);
    expect(content.orphaned).toContain(oneOrphaned);
    expect(content.total_brikette).toBe(REQUIRED_LABELS.length + 3);
  });

  // TC-A3: Gmail has zero Brikette/* labels → all lists empty, tool succeeds
  it("TC-A3: no Brikette labels present → all lists empty, tool succeeds", async () => {
    const stub = buildLabelStub(["INBOX", "SENT", "TRASH", "Unrelated/Label"]);
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_audit_labels", {});

    expect(result.isError).toBeFalsy();
    const content = JSON.parse((result.content as Array<{ text: string }>)[0].text) as {
      known: string[];
      legacy: string[];
      orphaned: string[];
      total_brikette: number;
    };
    expect(content.known).toEqual([]);
    expect(content.legacy).toEqual([]);
    expect(content.orphaned).toEqual([]);
    expect(content.total_brikette).toBe(0);
  });
});
