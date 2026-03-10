import { resolveInboxChannelAdapter } from "../channel-adapters.server";

describe("resolveInboxChannelAdapter", () => {
  it("defaults unknown channels to email", () => {
    const adapter = resolveInboxChannelAdapter("unknown-channel");

    expect(adapter.channel).toBe("email");
    expect(adapter.reviewMode).toBe("email_draft");
    expect(adapter.capabilities.supportsRecipients).toBe(true);
  });

  it("returns Prime direct messaging capabilities", () => {
    const adapter = resolveInboxChannelAdapter("prime_direct");

    expect(adapter.channel).toBe("prime_direct");
    expect(adapter.reviewMode).toBe("message_draft");
    expect(adapter.capabilities).toMatchObject({
      supportsSubject: false,
      supportsRecipients: false,
      supportsHtml: false,
      supportsDraftMutations: true,
      supportsDraftSave: true,
      supportsDraftRegenerate: false,
      supportsDraftSend: true,
      supportsThreadMutations: true,
      sendLabel: "Send message",
      readOnlyNotice: expect.stringContaining("send"),
    });
  });

  it("returns Prime broadcast messaging capabilities", () => {
    const adapter = resolveInboxChannelAdapter("prime_broadcast");

    expect(adapter.channel).toBe("prime_broadcast");
    expect(adapter.reviewMode).toBe("message_draft");
    expect(adapter.capabilities).toMatchObject({
      supportsSubject: false,
      supportsRecipients: false,
      supportsHtml: false,
      supportsDraftMutations: true,
      supportsDraftSave: true,
      supportsDraftRegenerate: false,
      supportsDraftSend: true,
      supportsThreadMutations: true,
      sendLabel: "Send broadcast",
      readOnlyNotice: expect.stringContaining("broadcast"),
    });
  });
});
