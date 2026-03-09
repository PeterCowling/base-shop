// src/types/messenger/chat.ts
// This file is a thin re-export shim. All type definitions live in:
//   apps/prime/src/lib/chat/messageSchema.ts

export type {
  MessageKind,
  MessageAudience,
  MessageLinkVariant,
  MessageLink,
  MessageAttachmentKind,
  MessageAttachment,
  MessageCard,
  MessageDraftStatus,
  MessageDraftSource,
  MessageDraftMeta,
  Message,
} from '../../lib/chat/messageSchema';
