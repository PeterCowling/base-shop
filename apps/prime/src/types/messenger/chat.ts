// src/types/messenger/chat.ts
// This file is a thin re-export shim. All type definitions live in:
//   apps/prime/src/lib/chat/messageSchema.ts

export type {
  Message,
  MessageAttachment,
  MessageAttachmentKind,
  MessageAudience,
  MessageCard,
  MessageDraftMeta,
  MessageDraftSource,
  MessageDraftStatus,
  MessageKind,
  MessageLink,
  MessageLinkVariant,
} from '../../lib/chat/messageSchema';
