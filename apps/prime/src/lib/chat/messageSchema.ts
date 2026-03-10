/**
 * Zod schemas for chat Message and related types.
 *
 * This is the single source of truth for all Message-related type definitions.
 * `apps/prime/src/types/messenger/chat.ts` re-exports from here.
 *
 * Two top-level schemas handle the two access paths:
 * - `RawMessagePayloadSchema` — Firebase RTDB path (id is the node key, not in payload)
 * - `MessageSchema` — Direct Messaging API path (id is included in the payload)
 *
 * Both use `.passthrough()` to preserve unknown fields, matching the current
 * `{ id, ...(raw as Omit<Message, 'id'>) }` spread behaviour in `toMessage`.
 */

import { z } from 'zod';

// ──────────────────────────────────────────────
// Enum / union types
// ──────────────────────────────────────────────

const MessageKindSchema = z.enum(['support', 'promotion', 'draft', 'system']);
export type MessageKind = z.infer<typeof MessageKindSchema>;

const MessageAudienceSchema = z.enum([
  'thread',
  'booking',
  'room',
  'whole_hostel',
]);
export type MessageAudience = z.infer<typeof MessageAudienceSchema>;

const MessageLinkVariantSchema = z.enum(['primary', 'secondary']);
export type MessageLinkVariant = z.infer<typeof MessageLinkVariantSchema>;

const MessageAttachmentKindSchema = z.enum(['image', 'file']);
export type MessageAttachmentKind = z.infer<typeof MessageAttachmentKindSchema>;

const MessageDraftStatusSchema = z.enum([
  'suggested',
  'under_review',
  'approved',
  'sent',
  'dismissed',
]);
export type MessageDraftStatus = z.infer<typeof MessageDraftStatusSchema>;

const MessageDraftSourceSchema = z.enum(['agent', 'staff']);
export type MessageDraftSource = z.infer<typeof MessageDraftSourceSchema>;

const SenderRoleSchema = z.enum([
  'guest',
  'staff',
  'admin',
  'owner',
  'na',
  'system',
]);

// ──────────────────────────────────────────────
// Leaf schemas
// ──────────────────────────────────────────────

export const MessageLinkSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  url: z.string(),
  variant: MessageLinkVariantSchema.optional(),
});
export type MessageLink = z.infer<typeof MessageLinkSchema>;

export const MessageAttachmentSchema = z.object({
  id: z.string().optional(),
  kind: MessageAttachmentKindSchema,
  url: z.string(),
  title: z.string().optional(),
  altText: z.string().optional(),
  mimeType: z.string().optional(),
});
export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;

export const MessageCardSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  imageUrl: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
});
export type MessageCard = z.infer<typeof MessageCardSchema>;

export const MessageDraftMetaSchema = z.object({
  draftId: z.string(),
  status: MessageDraftStatusSchema,
  source: MessageDraftSourceSchema,
  createdAt: z.number(),
});
export type MessageDraftMeta = z.infer<typeof MessageDraftMetaSchema>;

// ──────────────────────────────────────────────
// Shared message fields (all Message fields except `id`)
// ──────────────────────────────────────────────

const messageFieldsWithoutId = {
  content: z.string(),
  senderId: z.string(),
  senderRole: SenderRoleSchema,
  senderName: z.string().optional(),
  createdAt: z.number(),
  deleted: z.boolean().optional(),
  imageUrl: z.string().optional(),
  kind: MessageKindSchema.optional(),
  audience: MessageAudienceSchema.optional(),
  links: z.array(MessageLinkSchema).optional(),
  attachments: z.array(MessageAttachmentSchema).optional(),
  cards: z.array(MessageCardSchema).optional(),
  campaignId: z.string().optional(),
  draft: MessageDraftMetaSchema.optional(),
};

// ──────────────────────────────────────────────
// Top-level schemas
// ──────────────────────────────────────────────

/**
 * Firebase RTDB path schema — `id` is the node key and is NOT present in the
 * payload. The caller injects `id` externally after parsing.
 */
export const RawMessagePayloadSchema = z
  .object(messageFieldsWithoutId)
  .passthrough();
export type RawMessagePayload = z.infer<typeof RawMessagePayloadSchema>;

/**
 * Direct Messaging API path schema — `id` is included in the payload.
 */
export const MessageSchema = z
  .object({
    id: z.string(),
    ...messageFieldsWithoutId,
  })
  .passthrough();
export type Message = z.infer<typeof MessageSchema>;
