/** @jest-environment node */

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool } from "../tools/gmail";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

describe("gmail_list_query", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function buildGmailClient() {
    return {
      users: {
        messages: {
          list: jest.fn(),
          get: jest.fn(),
        },
      },
    };
  }

  it("rejects empty query", async () => {
    const gmail = buildGmailClient();
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_list_query", { query: "" });

    expect(result).toEqual(
      expect.objectContaining({
        isError: true,
      })
    );
    expect(gmail.users.messages.list).not.toHaveBeenCalled();
  });

  it("defaults limit to 50 when omitted", async () => {
    const gmail = buildGmailClient();
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    gmail.users.messages.list.mockResolvedValue({ data: { messages: [] } });

    await handleGmailTool("gmail_list_query", { query: "in:inbox" });

    expect(gmail.users.messages.list).toHaveBeenCalledWith({
      userId: "me",
      q: "in:inbox",
      maxResults: 50,
    });
  });

  it("caps limit at 100", async () => {
    const gmail = buildGmailClient();
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    gmail.users.messages.list.mockResolvedValue({ data: { messages: [] } });

    await handleGmailTool("gmail_list_query", { query: "in:inbox", limit: 100 });

    expect(gmail.users.messages.list).toHaveBeenCalledWith({
      userId: "me",
      q: "in:inbox",
      maxResults: 100,
    });
  });

  it("passes query to Gmail list call and returns email metadata", async () => {
    const gmail = buildGmailClient();
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    gmail.users.messages.list.mockResolvedValue({ data: { messages: [{ id: "msg-1" }] } });
    gmail.users.messages.get.mockResolvedValue({
      data: {
        id: "msg-1",
        threadId: "thread-1",
        snippet: "Hello",
        payload: {
          headers: [
            { name: "Subject", value: "Test" },
            { name: "From", value: "Guest <guest@example.com>" },
            { name: "Date", value: "Mon, 01 Jan 2026 10:00:00 +0000" },
          ],
        },
      },
    });

    const result = await handleGmailTool("gmail_list_query", {
      query: "in:inbox",
      limit: 1,
    });

    expect(gmail.users.messages.list).toHaveBeenCalledWith({
      userId: "me",
      q: "in:inbox",
      maxResults: 1,
    });
    expect(gmail.users.messages.get).toHaveBeenCalled();
    const payload = JSON.parse(result.content[0].text);
    expect(payload.emails).toEqual([
      expect.objectContaining({
        id: "msg-1",
        threadId: "thread-1",
        subject: "Test",
        from: "Guest <guest@example.com>",
        date: "Mon, 01 Jan 2026 10:00:00 +0000",
        snippet: "Hello",
      }),
    ]);
  });
});
