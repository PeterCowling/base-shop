// src/types/messenger/chat.ts
import type { Role } from './roles';

export type MessageKind = 'support' | 'promotion' | 'draft' | 'system';

export type MessageAudience = 'thread' | 'booking' | 'room' | 'whole_hostel';

export type MessageLinkVariant = 'primary' | 'secondary';

export interface MessageLink {
  id?: string;
  label: string;
  url: string;
  variant?: MessageLinkVariant;
}

export type MessageAttachmentKind = 'image' | 'file';

export interface MessageAttachment {
  id?: string;
  kind: MessageAttachmentKind;
  url: string;
  title?: string;
  altText?: string;
  mimeType?: string;
}

export interface MessageCard {
  id?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export type MessageDraftStatus =
  | 'suggested'
  | 'under_review'
  | 'approved'
  | 'sent'
  | 'dismissed';

export type MessageDraftSource = 'agent' | 'staff';

export interface MessageDraftMeta {
  draftId: string;
  status: MessageDraftStatus;
  source: MessageDraftSource;
  createdAt: number;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: Role;
  senderName?: string;
  createdAt: number;
  deleted?: boolean;
  imageUrl?: string;
  kind?: MessageKind;
  audience?: MessageAudience;
  links?: MessageLink[];
  attachments?: MessageAttachment[];
  cards?: MessageCard[];
  campaignId?: string;
  draft?: MessageDraftMeta;
}
