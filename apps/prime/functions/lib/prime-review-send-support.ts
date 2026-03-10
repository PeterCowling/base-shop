import type {
  MessageAttachment,
  MessageCard,
  MessageLink,
} from '../../src/types/messenger/chat';

import type {
  PrimeMessageDraftRow,
  PrimeMessageRecordRow,
  PrimeMessageThreadRow,
} from './prime-messaging-repositories';

export function buildReviewMessageId(now: number): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `msg_${now}_${suffix}`;
}

export function parseJsonObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function parseLinks(raw: string | null): MessageLink[] | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as MessageLink[]) : null;
  } catch {
    return null;
  }
}

export function parseAttachments(raw: string | null): MessageAttachment[] | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as MessageAttachment[]) : null;
  } catch {
    return null;
  }
}

export function parseCards(raw: string | null): MessageCard[] | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as MessageCard[]) : null;
  } catch {
    return null;
  }
}

export function parseStringArray(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

export function buildThreadSendConflictMessage(thread: PrimeMessageThreadRow): string | null {
  if (thread.review_status === 'resolved') {
    return 'Prime review thread is already resolved'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (thread.review_status === 'auto_archived') {
    return 'Prime review thread is already archived'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (thread.review_status === 'sent') {
    return 'Prime review thread is already sent'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  return null;
}

export function resolveSentMessageKind(
  thread: PrimeMessageThreadRow,
): PrimeMessageRecordRow['kind'] {
  return thread.channel_type === 'broadcast' ? 'promotion' : 'support';
}

export function resolveSentAdmissionReason(thread: PrimeMessageThreadRow): string {
  return thread.channel_type === 'broadcast' ? 'staff_broadcast_send' : 'staff_direct_send';
}

export function getCurrentReviewDraft(drafts: PrimeMessageDraftRow[]): PrimeMessageDraftRow | null {
  return drafts.find((draft) => draft.status !== 'dismissed' && draft.status !== 'sent') ?? null;
}
