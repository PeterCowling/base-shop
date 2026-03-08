export const inboxChannels = ["email", "prime_direct", "prime_broadcast"] as const;

export type InboxChannel = (typeof inboxChannels)[number];

export const inboxReviewModes = ["email_draft", "message_draft"] as const;

export type InboxReviewMode = (typeof inboxReviewModes)[number];

export type InboxChannelLane = "support" | "promotion";

export type InboxChannelCapabilities = {
  supportsSubject: boolean;
  supportsRecipients: boolean;
  supportsHtml: boolean;
  supportsDraftMutations: boolean;
  supportsDraftSave: boolean;
  supportsDraftRegenerate: boolean;
  supportsDraftSend: boolean;
  supportsThreadMutations: boolean;
  subjectLabel: string;
  recipientLabel: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  sendLabel: string;
  readOnlyNotice: string | null;
};

export type InboxChannelDescriptor = {
  channel: InboxChannel;
  channelLabel: string;
  lane: InboxChannelLane;
  reviewMode: InboxReviewMode;
  capabilities: InboxChannelCapabilities;
};

export function isInboxChannel(value: unknown): value is InboxChannel {
  return typeof value === "string" && inboxChannels.includes(value as InboxChannel);
}
