/** @jest-environment node */

/**
 * TC-L1: LOCAL ensureLabelMap (gmail.ts:~967) emits a stderr warning when
 *         labels.create throws. Exercised through gmail_organize_inbox which
 *         calls the LOCAL ensureLabelMap with REQUIRED_LABELS.
 *
 * TC-L2: CANONICAL ensureLabelMap (gmail-shared.ts:~564) emits a stderr warning
 *         when labels.create throws. Exercised by calling ensureLabelMap directly.
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="gmail-ensure-label"
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, setLockStore } from "../tools/gmail";
import { ensureLabelMap } from "../tools/gmail-shared";
import { createLockStore } from "../utils/lock-store";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ensure-label-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ensureLabelMap stderr warning on create failure (TASK-03)", () => {
  // TC-L1: LOCAL path via gmail_organize_inbox → gmail.ts:~967
  it("TC-L1: gmail_organize_inbox emits stderr warning when labels.create throws (LOCAL ensureLabelMap)", async () => {
    const stub = {
      users: {
        labels: {
          // Return empty list so ensureLabelMap tries to create all REQUIRED_LABELS
          list: jest.fn(async () => ({ data: { labels: [] } })),
          create: jest.fn().mockRejectedValue(new Error("Permission denied")),
        },
        messages: {
          list: jest.fn(async () => ({ data: { messages: [] } })),
          get: jest.fn(),
          modify: jest.fn(),
        },
        threads: { get: jest.fn(async () => ({ data: { messages: [] } })) },
        drafts: { list: jest.fn(async () => ({ data: { drafts: [] } })), create: jest.fn() },
      },
    };
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const stderrWrites: string[] = [];
    const stderrSpy = jest
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk: unknown) => {
        stderrWrites.push(String(chunk));
        return true;
      });

    // gmail_organize_inbox calls LOCAL ensureLabelMap(gmail, REQUIRED_LABELS) first
    await handleGmailTool("gmail_organize_inbox", {});

    stderrSpy.mockRestore();

    const warnings = stderrWrites.filter((w) => w.includes("[ensureLabelMap]"));
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    // Warning must contain the label name
    expect(warnings[0]).toMatch(/\[ensureLabelMap\] Failed to create label ".+"/);
  });

  // TC-L2: CANONICAL path via gmail-shared.ts:~564 called directly
  it("TC-L2: CANONICAL ensureLabelMap emits stderr warning when labels.create throws", async () => {
    const stub = {
      users: {
        labels: {
          list: jest.fn(async () => ({ data: { labels: [] } })),
          create: jest.fn().mockRejectedValue(new Error("Quota exceeded")),
        },
      },
    } as Parameters<typeof ensureLabelMap>[0];

    const stderrWrites: string[] = [];
    const stderrSpy = jest
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk: unknown) => {
        stderrWrites.push(String(chunk));
        return true;
      });

    // Directly call CANONICAL ensureLabelMap from gmail-shared.ts with a label to create
    await ensureLabelMap(stub, ["Brikette/Queue/In-Progress"]);

    stderrSpy.mockRestore();

    const warnings = stderrWrites.filter((w) => w.includes("[ensureLabelMap]"));
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(warnings[0]).toContain("Brikette/Queue/In-Progress");
  });
});
