import "server-only";

import {
  type InboxChannel,
  type InboxChannelDescriptor,
  isInboxChannel,
} from "./channels";

export type InboxChannelAdapter = InboxChannelDescriptor;

const EMAIL_CHANNEL_ADAPTER: InboxChannelAdapter = {
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
};

const PRIME_DIRECT_CHANNEL_ADAPTER: InboxChannelAdapter = {
  channel: "prime_direct",
  channelLabel: "Prime chat",
  lane: "support",
  reviewMode: "message_draft",
  capabilities: {
    supportsSubject: false,
    supportsRecipients: false,
    supportsHtml: false,
    supportsDraftMutations: true,
    supportsDraftSave: true,
    supportsDraftRegenerate: false,
    supportsDraftSend: true,
    supportsThreadMutations: true,
    subjectLabel: "Subject",
    recipientLabel: "Recipients",
    bodyLabel: "Message",
    bodyPlaceholder: "Write the Prime message to send in this thread.",
    sendLabel: "Send message",
    readOnlyNotice: "Prime review currently supports draft save, send, resolve, and dismiss. Regenerate remains disabled.",
  },
};

const PRIME_BROADCAST_CHANNEL_ADAPTER: InboxChannelAdapter = {
  channel: "prime_broadcast",
  channelLabel: "Prime broadcast",
  lane: "promotion",
  reviewMode: "message_draft",
  capabilities: {
    supportsSubject: false,
    supportsRecipients: false,
    supportsHtml: false,
    supportsDraftMutations: true,
    supportsDraftSave: true,
    supportsDraftRegenerate: false,
    supportsDraftSend: true,
    supportsThreadMutations: true,
    subjectLabel: "Subject",
    recipientLabel: "Audience",
    bodyLabel: "Broadcast message",
    bodyPlaceholder: "Write the broadcast or promotional message to send in Prime.",
    sendLabel: "Send broadcast",
    readOnlyNotice: "Prime review currently supports draft save, send, resolve, and dismiss for existing broadcast threads. Regenerate remains disabled.",
  },
};

const CHANNEL_ADAPTERS: Record<InboxChannel, InboxChannelAdapter> = {
  email: EMAIL_CHANNEL_ADAPTER,
  prime_direct: PRIME_DIRECT_CHANNEL_ADAPTER,
  prime_broadcast: PRIME_BROADCAST_CHANNEL_ADAPTER,
};

export function resolveInboxChannelAdapter(channel: unknown): InboxChannelAdapter {
  if (!isInboxChannel(channel)) {
    return EMAIL_CHANNEL_ADAPTER;
  }

  return CHANNEL_ADAPTERS[channel];
}
