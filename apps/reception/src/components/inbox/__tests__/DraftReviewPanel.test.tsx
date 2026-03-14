import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { InboxThreadDetail } from "@/services/useInbox";

import DraftReviewPanel from "../DraftReviewPanel";

function buildThreadDetail(
  overrides: Partial<InboxThreadDetail> = {},
): InboxThreadDetail {
  const thread: InboxThreadDetail["thread"] = {
    id: "thread-1",
    status: "pending",
    channel: "email",
    channelLabel: "Email",
    lane: "support",
    reviewMode: "email_draft",
    capabilities: {
      supportsSubject: true,
      supportsRecipients: true,
      supportsHtml: true,
      supportsDraftMutations: true,
      supportsDraftSave: true,
      supportsDraftRegenerate: true,
      supportsDraftSend: true,
      supportsThreadMutations: true,
      subjectLabel: "Subject",
      recipientLabel: "To",
      bodyLabel: "Reply",
      bodyPlaceholder: "Write the reply to send to the guest.",
      sendLabel: "Send",
      readOnlyNotice: null,
    },
    subject: "Spring Savings",
    snippet: "88% off for Skylar Srl",
    latestMessageAt: "2026-03-11T10:00:00.000Z",
    lastSyncedAt: "2026-03-11T10:01:00.000Z",
    updatedAt: "2026-03-11T10:01:00.000Z",
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

  const currentDraft: InboxThreadDetail["currentDraft"] = {
    id: "draft-1",
    threadId: "thread-1",
    gmailDraftId: null,
    status: "generated",
    subject: "Re: Spring Savings",
    recipientEmails: ["guest@example.com"],
    plainText: "Thanks for the update.",
    html: null,
    originalPlainText: null,
    originalHtml: null,
    templateUsed: null,
    quality: null,
    interpret: null,
    createdByUid: "staff-1",
    createdAt: "2026-03-11T10:00:00.000Z",
    updatedAt: "2026-03-11T10:00:00.000Z",
  };

  return {
    thread,
    campaign: null,
    metadata: {},
    messages: [],
    totalMessages: 0,
    messageOffset: 0,
    events: [],
    admissionOutcomes: [],
    currentDraft,
    messageBodiesSource: "d1",
    warning: null,
    ...overrides,
  };
}

// TC-05 (TASK-03): deliveryStatus badge rendering
describe("DraftReviewPanel — Needs follow-up badge (TC-05)", () => {
  it("TC-05a: renders Needs follow-up badge when deliveryStatus === needs_follow_up", () => {
    const threadDetail = buildThreadDetail({
      currentDraft: {
        ...buildThreadDetail().currentDraft!,
        quality: { passed: true, deliveryStatus: "needs_follow_up" },
      },
    });

    render(
      <DraftReviewPanel
        threadDetail={threadDetail}
        savingDraft={false}
        regeneratingDraft={false}
        sendingDraft={false}
        resolvingThread={false}
        dismissingThread={false}
        onSave={jest.fn()}
        onRegenerate={jest.fn()}
        onSend={jest.fn()}
        onResolve={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(screen.getByText("Needs follow-up")).toBeInTheDocument();
  });

  it("TC-05b: does not render Needs follow-up badge when deliveryStatus is absent", () => {
    const threadDetail = buildThreadDetail({
      currentDraft: {
        ...buildThreadDetail().currentDraft!,
        quality: { passed: true },
      },
    });

    render(
      <DraftReviewPanel
        threadDetail={threadDetail}
        savingDraft={false}
        regeneratingDraft={false}
        sendingDraft={false}
        resolvingThread={false}
        dismissingThread={false}
        onSave={jest.fn()}
        onRegenerate={jest.fn()}
        onSend={jest.fn()}
        onResolve={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(screen.queryByText("Needs follow-up")).not.toBeInTheDocument();
  });

  it("TC-05c: does not render Needs follow-up badge when quality is null (legacy draft)", () => {
    const threadDetail = buildThreadDetail({
      currentDraft: {
        ...buildThreadDetail().currentDraft!,
        quality: null,
      },
    });

    render(
      <DraftReviewPanel
        threadDetail={threadDetail}
        savingDraft={false}
        regeneratingDraft={false}
        sendingDraft={false}
        resolvingThread={false}
        dismissingThread={false}
        onSave={jest.fn()}
        onRegenerate={jest.fn()}
        onSend={jest.fn()}
        onResolve={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(screen.queryByText("Needs follow-up")).not.toBeInTheDocument();
  });

  it("TC-05d: does not render Needs follow-up badge when deliveryStatus is ready", () => {
    const threadDetail = buildThreadDetail({
      currentDraft: {
        ...buildThreadDetail().currentDraft!,
        quality: { passed: true, deliveryStatus: "ready" },
      },
    });

    render(
      <DraftReviewPanel
        threadDetail={threadDetail}
        savingDraft={false}
        regeneratingDraft={false}
        sendingDraft={false}
        resolvingThread={false}
        dismissingThread={false}
        onSave={jest.fn()}
        onRegenerate={jest.fn()}
        onSend={jest.fn()}
        onResolve={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(screen.queryByText("Needs follow-up")).not.toBeInTheDocument();
  });
});

describe("DraftReviewPanel", () => {
  it("dismisses an email thread without opening Gmail in a new tab", async () => {
    const user = userEvent.setup();
    const windowOpenMock = jest.spyOn(window, "open");
    const threadDetail = buildThreadDetail();
    const onDismiss = jest.fn().mockResolvedValue({
      thread: threadDetail.thread,
      gmailMarkedRead: true,
    });

    render(
      <DraftReviewPanel
        threadDetail={threadDetail}
        savingDraft={false}
        regeneratingDraft={false}
        sendingDraft={false}
        resolvingThread={false}
        dismissingThread={false}
        onSave={jest.fn()}
        onRegenerate={jest.fn()}
        onSend={jest.fn()}
        onResolve={jest.fn()}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    await user.click(screen.getByRole("button", { name: /not relevant/i }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(windowOpenMock).not.toHaveBeenCalled();

    windowOpenMock.mockRestore();
  });
});
