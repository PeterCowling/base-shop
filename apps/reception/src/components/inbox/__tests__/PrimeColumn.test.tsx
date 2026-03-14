/**
 * Tests for PrimeColumn compose button + modal (TASK-08)
 *
 * TC-01: PrimeColumn renders with "New broadcast" button in header.
 * TC-02: Button click → modal opens.
 * TC-03: Modal with empty textarea → "Send" button disabled.
 * TC-04: Modal with text → "Send" button enabled. Click "Send" → fetch called.
 * TC-05: fetch returns 200 → modal closes.
 * TC-06: fetch returns 503 → error message in modal, modal stays open.
 * TC-07: ESC / close button → modal closes without fetch.
 * TC-08: Existing PrimeColumn thread list rendering unaffected.
 */

import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { buildMcpAuthHeaders } from "@/services/mcpAuthHeaders";
import type { InboxThreadSummary } from "@/services/useInbox";

import PrimeColumn from "../PrimeColumn";

jest.mock("@/services/mcpAuthHeaders", () => ({
  buildMcpAuthHeaders: jest.fn().mockResolvedValue({
    "Content-Type": "application/json",
    Authorization: "Bearer test-token",
  }),
}));

jest.mock("../ThreadList", () => ({
  __esModule: true,
  default: ({ threads }: any) => (
    <div data-testid="thread-list">
      {threads.map((t: any) => (
        <div key={t.id} data-testid={`thread-${t.id}`}>
          {t.id}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@acme/design-system/atoms", () => ({
  Button: ({ children, onClick, disabled, "aria-label": ariaLabel, "aria-busy": ariaBusy, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-busy={ariaBusy}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("@acme/design-system/primitives", () => ({
  Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

const mockBuildMcpAuthHeaders = jest.mocked(buildMcpAuthHeaders);

function buildThread(id: string, channel: "prime_direct" | "prime_broadcast" | "email" = "prime_direct"): InboxThreadSummary {
  return {
    id,
    source: "prime",
    status: "pending",
    channel,
    channelLabel: "Prime Direct",
    lane: "support",
    reviewMode: "prime_chat",
    capabilities: {
      supportsSubject: false,
      supportsRecipients: false,
      supportsHtml: false,
      supportsDraftMutations: true,
      supportsDraftSave: true,
      supportsDraftRegenerate: false,
      supportsDraftSend: true,
      supportsThreadMutations: true,
      subjectLabel: null,
      recipientLabel: null,
      bodyLabel: "Reply",
      bodyPlaceholder: "Write a reply.",
      sendLabel: "Send",
      readOnlyNotice: null,
    },
    subject: null,
    snippet: "Hello",
    latestMessageAt: "2026-03-14T10:00:00.000Z",
    lastSyncedAt: null,
    updatedAt: "2026-03-14T10:00:00.000Z",
    needsManualDraft: false,
    draftFailureCode: null,
    draftFailureMessage: null,
    latestAdmissionDecision: null,
    latestAdmissionReason: null,
    currentDraft: null,
    guestBookingRef: null,
    guestFirstName: null,
    guestLastName: null,
  };
}

function renderPrimeColumn(threads: InboxThreadSummary[] = []) {
  const onSelect = jest.fn();
  render(
    <PrimeColumn
      threads={threads}
      selectedThreadId={null}
      loading={false}
      error={null}
      onSelect={onSelect}
    />,
  );
  return { onSelect };
}

describe("PrimeColumn compose button + modal (TASK-08)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockBuildMcpAuthHeaders.mockResolvedValue({
      "Content-Type": "application/json",
      Authorization: "Bearer test-token",
    });
  });

  describe("TC-01: PrimeColumn renders with 'New broadcast' button", () => {
    it("shows 'New broadcast' button in column header", () => {
      renderPrimeColumn();

      expect(screen.getByRole("button", { name: /new broadcast/i })).toBeInTheDocument();
    });
  });

  describe("TC-02: Button click → modal opens", () => {
    it("opens compose modal when 'New broadcast' button is clicked", async () => {
      const user = userEvent.setup();
      renderPrimeColumn();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /new broadcast/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    });
  });

  describe("TC-03: Modal with empty textarea → Send disabled", () => {
    it("disables Send button when textarea is empty", async () => {
      const user = userEvent.setup();
      renderPrimeColumn();

      await user.click(screen.getByRole("button", { name: /new broadcast/i }));

      const sendBtn = screen.getByRole("button", { name: /^send$/i });
      expect(sendBtn).toBeDisabled();
    });
  });

  describe("TC-04: Modal with text → Send enabled + fetch called", () => {
    it("enables Send button when textarea has text and calls fetch on click", async () => {
      const user = userEvent.setup();
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPrimeColumn();

      await user.click(screen.getByRole("button", { name: /new broadcast/i }));

      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, "Hello guests!");

      const sendBtn = screen.getByRole("button", { name: /^send$/i });
      expect(sendBtn).not.toBeDisabled();

      await user.click(sendBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/mcp/inbox/prime-compose",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ text: "Hello guests!" }),
          }),
        );
      });
    });
  });

  describe("TC-05: fetch returns 200 → modal closes", () => {
    it("closes modal on successful send", async () => {
      const user = userEvent.setup();
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPrimeColumn();

      await user.click(screen.getByRole("button", { name: /new broadcast/i }));
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, "Hello!");
      await user.click(screen.getByRole("button", { name: /^send$/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("TC-06: fetch returns 503 → error shown, modal stays open", () => {
    it("shows error message and keeps modal open on 503", async () => {
      const user = userEvent.setup();
      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: "Prime messaging not configured" }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPrimeColumn();

      await user.click(screen.getByRole("button", { name: /new broadcast/i }));
      const textarea = screen.getByPlaceholderText(/type your message/i);
      await user.type(textarea, "Hello!");
      await user.click(screen.getByRole("button", { name: /^send$/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent(/not available/i);
      });

      // Modal stays open
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("TC-07: ESC / close button → modal closes without fetch", () => {
    it("closes modal when close button is clicked without calling fetch", async () => {
      const user = userEvent.setup();
      const fetchMock = jest.fn();
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPrimeColumn();

      await user.click(screen.getByRole("button", { name: /new broadcast/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /close/i }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("closes modal when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderPrimeColumn();

      await user.click(screen.getByRole("button", { name: /new broadcast/i }));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("TC-08: Existing thread list rendering unaffected", () => {
    it("renders thread list and compose button together without interference", () => {
      const threads = [buildThread("thread-1"), buildThread("thread-2")];
      renderPrimeColumn(threads);

      // Thread count badge visible
      expect(screen.getByText("2")).toBeInTheDocument();

      // Compose button still present
      expect(screen.getByRole("button", { name: /new broadcast/i })).toBeInTheDocument();

      // No modal open yet
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("email threads are filtered from prime thread list", () => {
      const threads = [
        buildThread("prime-1", "prime_direct"),
        buildThread("email-1", "email"),
      ];
      renderPrimeColumn(threads);

      // Only 1 prime thread shown in badge
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });
});
