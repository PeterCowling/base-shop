/**
 * Unit tests for messageSchema.ts
 *
 * Covers valid and invalid parse paths for all schemas.
 * Tests run in CI only (per docs/testing-policy.md).
 */

import {
  MessageSchema,
  RawMessagePayloadSchema,
  MessageDraftMetaSchema,
  MessageLinkSchema,
  MessageAttachmentSchema,
  MessageCardSchema,
} from '../messageSchema';

// ──────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────

const validMinimalMessage = {
  id: 'msg-001',
  content: 'Hello',
  senderId: 'user-123',
  senderRole: 'guest',
  createdAt: 1700000000000,
};

const validFullMessage = {
  id: 'msg-002',
  content: 'Full message',
  senderId: 'user-456',
  senderRole: 'staff',
  senderName: 'Jane',
  createdAt: 1700000001000,
  deleted: false,
  imageUrl: 'https://example.com/img.jpg',
  kind: 'support',
  audience: 'thread',
  links: [{ label: 'Docs', url: 'https://docs.example.com', variant: 'primary' }],
  attachments: [{ kind: 'image', url: 'https://example.com/a.jpg' }],
  cards: [{ title: 'Card title' }],
  campaignId: 'camp-001',
  draft: { draftId: 'dr-001', status: 'suggested', source: 'agent', createdAt: 1700000000500 },
};

const validRawPayload = {
  // No `id` — Firebase RTDB path; id is the node key
  content: 'Firebase message',
  senderId: 'user-789',
  senderRole: 'admin',
  createdAt: 1700000002000,
};

// ──────────────────────────────────────────────
// MessageSchema
// ──────────────────────────────────────────────

describe('MessageSchema', () => {
  describe('TC-01: valid minimal message', () => {
    it('returns success for a minimal valid message', () => {
      const result = MessageSchema.safeParse(validMinimalMessage);
      expect(result.success).toBe(true);
    });
  });

  describe('TC-02: valid full message with all optional fields', () => {
    it('returns success and preserves all fields', () => {
      const result = MessageSchema.safeParse(validFullMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('msg-002');
        expect(result.data.kind).toBe('support');
        expect(result.data.links).toHaveLength(1);
        expect(result.data.draft?.status).toBe('suggested');
      }
    });
  });

  describe('TC-03: missing required field `content`', () => {
    it('returns failure when content is absent', () => {
      const { content: _omitted, ...rest } = validMinimalMessage;
      const result = MessageSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('TC-04: invalid senderRole enum value', () => {
    it('returns failure for an unknown senderRole', () => {
      const result = MessageSchema.safeParse({
        ...validMinimalMessage,
        senderRole: 'superadmin',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ──────────────────────────────────────────────
// RawMessagePayloadSchema
// ──────────────────────────────────────────────

describe('RawMessagePayloadSchema', () => {
  describe('TC-05: valid raw payload without `id`', () => {
    it('returns success when id is absent', () => {
      const result = RawMessagePayloadSchema.safeParse(validRawPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('TC-06: passthrough preserves unknown fields', () => {
    it('retains extra fields (including id) when present due to .passthrough()', () => {
      const payloadWithId = { ...validRawPayload, id: 'injected-key', extraField: 'preserved' };
      const result = RawMessagePayloadSchema.safeParse(payloadWithId);
      expect(result.success).toBe(true);
      if (result.success) {
        // .passthrough() retains unknown fields; id and extraField survive
        expect((result.data as Record<string, unknown>)['id']).toBe('injected-key');
        expect((result.data as Record<string, unknown>)['extraField']).toBe('preserved');
      }
    });
  });
});

// ──────────────────────────────────────────────
// MessageDraftMetaSchema
// ──────────────────────────────────────────────

describe('MessageDraftMetaSchema', () => {
  describe('TC-07: invalid status value', () => {
    it('returns failure for an unknown draft status', () => {
      const result = MessageDraftMetaSchema.safeParse({
        draftId: 'dr-001',
        status: 'pending', // not in enum
        source: 'agent',
        createdAt: 1700000000000,
      });
      expect(result.success).toBe(false);
    });
  });

  it('returns success for valid draft meta', () => {
    const result = MessageDraftMetaSchema.safeParse({
      draftId: 'dr-002',
      status: 'approved',
      source: 'staff',
      createdAt: 1700000000000,
    });
    expect(result.success).toBe(true);
  });
});

// ──────────────────────────────────────────────
// MessageLinkSchema
// ──────────────────────────────────────────────

describe('MessageLinkSchema', () => {
  describe('TC-08: missing required `url`', () => {
    it('returns failure when url is absent', () => {
      const result = MessageLinkSchema.safeParse({ label: 'Docs' });
      expect(result.success).toBe(false);
    });
  });

  it('returns success for a valid link with required fields only', () => {
    const result = MessageLinkSchema.safeParse({ label: 'Docs', url: 'https://docs.example.com' });
    expect(result.success).toBe(true);
  });

  it('returns success for a valid link with variant', () => {
    const result = MessageLinkSchema.safeParse({
      label: 'Book now',
      url: 'https://example.com/book',
      variant: 'secondary',
    });
    expect(result.success).toBe(true);
  });
});

// ──────────────────────────────────────────────
// MessageAttachmentSchema
// ──────────────────────────────────────────────

describe('MessageAttachmentSchema', () => {
  describe('TC-09: invalid `kind` value', () => {
    it('returns failure for kind: "video" (not in enum)', () => {
      const result = MessageAttachmentSchema.safeParse({
        kind: 'video',
        url: 'https://example.com/v.mp4',
      });
      expect(result.success).toBe(false);
    });
  });

  it('returns success for valid attachment with kind: "image"', () => {
    const result = MessageAttachmentSchema.safeParse({
      kind: 'image',
      url: 'https://example.com/img.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('returns success for valid attachment with kind: "file"', () => {
    const result = MessageAttachmentSchema.safeParse({
      kind: 'file',
      url: 'https://example.com/doc.pdf',
      title: 'My Document',
    });
    expect(result.success).toBe(true);
  });
});

// ──────────────────────────────────────────────
// MessageCardSchema
// ──────────────────────────────────────────────

describe('MessageCardSchema', () => {
  it('returns success for valid card with title only', () => {
    const result = MessageCardSchema.safeParse({ title: 'Card title' });
    expect(result.success).toBe(true);
  });

  it('returns success for valid card with all optional fields', () => {
    const result = MessageCardSchema.safeParse({
      id: 'card-001',
      title: 'Full card',
      body: 'Card body',
      imageUrl: 'https://example.com/card.jpg',
      ctaLabel: 'Book',
      ctaUrl: 'https://example.com/book',
    });
    expect(result.success).toBe(true);
  });

  it('returns failure when title is absent', () => {
    const result = MessageCardSchema.safeParse({ body: 'No title' });
    expect(result.success).toBe(false);
  });
});
