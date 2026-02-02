/** @jest-environment node */

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool } from "../tools/gmail";

type GmailLabel = { id: string; name: string };

type GmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  internalDate: string;
  payload: {
    headers: { name: string; value: string }[];
  };
  snippet?: string;
};

type GmailStub = {
  users: {
    labels: {
      list: jest.Mock;
      create: jest.Mock;
    };
    messages: {
      get: jest.Mock;
      modify: jest.Mock;
      list: jest.Mock;
    };
    threads: {
      get: jest.Mock;
    };
    drafts: {
      create: jest.Mock;
    };
  };
};

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

function createGmailStub({
  labels,
  messages,
}: {
  labels?: GmailLabel[];
  messages: Record<string, GmailMessage>;
}): { gmail: GmailStub; messageStore: Record<string, GmailMessage>; labelsStore: GmailLabel[] } {
  const labelsStore = labels ? [...labels] : [];
  const messageStore = { ...messages };
  let labelCounter = labelsStore.length + 1;

  const gmail: GmailStub = {
    users: {
      labels: {
        list: jest.fn(async () => ({ data: { labels: labelsStore } })),
        create: jest.fn(async ({ requestBody }: { requestBody: { name: string } }) => {
          const newLabel = { id: `label-${labelCounter++}`, name: requestBody.name };
          labelsStore.push(newLabel);
          return { data: newLabel };
        }),
      },
      messages: {
        list: jest.fn(async () => ({ data: { messages: Object.values(messageStore).map(msg => ({ id: msg.id })) } })),
        get: jest.fn(async ({ id }: { id: string }) => ({ data: messageStore[id] })),
        modify: jest.fn(async ({ id, requestBody }: { id: string; requestBody: { addLabelIds?: string[]; removeLabelIds?: string[] } }) => {
          const message = messageStore[id];
          if (!message) {
            throw new Error(`Message not found: ${id}`);
          }
          const remove = requestBody.removeLabelIds || [];
          const add = requestBody.addLabelIds || [];
          message.labelIds = message.labelIds.filter(labelId => !remove.includes(labelId));
          for (const labelId of add) {
            if (!message.labelIds.includes(labelId)) {
              message.labelIds.push(labelId);
            }
          }
          return { data: message };
        }),
      },
      threads: {
        get: jest.fn(async () => ({ data: { messages: [] } })),
      },
      drafts: {
        create: jest.fn(async () => ({ data: { id: "draft-1", message: { id: "message-1" } } })),
      },
    },
  };

  return { gmail, messageStore, labelsStore };
}

describe("gmail label state machine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prevents concurrent processing when Processing label is active", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
    const processing = { id: "label-processing", name: "Brikette/Inbox/Processing" };

    const { gmail, messageStore } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: {
        "msg-1": {
          id: "msg-1",
          threadId: "thread-1",
          labelIds: [needsProcessing.id],
          internalDate: String(Date.now()),
          payload: { headers: [] },
        },
      },
    });

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const first = await handleGmailTool("gmail_get_email", { emailId: "msg-1" });
    expect(first).toHaveProperty("content");
    expect(gmail.users.messages.modify).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-1",
        requestBody: expect.objectContaining({
          addLabelIds: [processing.id],
          removeLabelIds: [needsProcessing.id],
        }),
      })
    );

    const second = await handleGmailTool("gmail_get_email", { emailId: "msg-1" });
    expect(second).toHaveProperty("isError", true);
    expect(second.content[0].text).toContain("being processed");

    expect(messageStore["msg-1"].labelIds).toContain(processing.id);
  });

  it("releases stale Processing lock after timeout", async () => {
    const processing = { id: "label-processing", name: "Brikette/Inbox/Processing" };
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };

    const { gmail, messageStore } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: {
        "msg-2": {
          id: "msg-2",
          threadId: "thread-2",
          labelIds: [processing.id, needsProcessing.id],
          internalDate: String(Date.now() - 31 * 60 * 1000),
          payload: { headers: [] },
        },
      },
    });

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_get_email", { emailId: "msg-2" });

    expect(result).toHaveProperty("content");
    expect(gmail.users.messages.modify).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-2",
        requestBody: expect.objectContaining({
          removeLabelIds: expect.arrayContaining([processing.id]),
        }),
      })
    );

    expect(messageStore["msg-2"].labelIds).toContain(processing.id);
  });

  it("applies workflow label transitions based on action", async () => {
    const awaitingAgreement = { id: "label-await", name: "Brikette/Inbox/Awaiting-Agreement" };
    const chase1 = { id: "label-chase-1", name: "Brikette/Workflow/Prepayment-Chase-1" };
    const chase2 = { id: "label-chase-2", name: "Brikette/Workflow/Prepayment-Chase-2" };

    const { gmail, messageStore } = createGmailStub({
      labels: [awaitingAgreement, chase1, chase2],
      messages: {
        "msg-3": {
          id: "msg-3",
          threadId: "thread-3",
          labelIds: [awaitingAgreement.id, chase1.id],
          internalDate: String(Date.now()),
          payload: { headers: [] },
        },
      },
    });

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", { emailId: "msg-3", action: "prepayment_chase_2" });

    expect(messageStore["msg-3"].labelIds).toContain(chase2.id);
    expect(messageStore["msg-3"].labelIds).not.toContain(chase1.id);
    expect(messageStore["msg-3"].labelIds).not.toContain(awaitingAgreement.id);
  });

  it("creates missing workflow labels and applies them", async () => {
    const { gmail, labelsStore, messageStore } = createGmailStub({
      labels: [],
      messages: {
        "msg-4": {
          id: "msg-4",
          threadId: "thread-4",
          labelIds: [],
          internalDate: String(Date.now()),
          payload: { headers: [] },
        },
      },
    });

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", { emailId: "msg-4", action: "awaiting_agreement" });

    const createdNames = labelsStore.map(label => label.name);
    expect(createdNames).toContain("Brikette/Inbox/Awaiting-Agreement");
    expect(messageStore["msg-4"].labelIds.length).toBeGreaterThan(0);
  });
});
