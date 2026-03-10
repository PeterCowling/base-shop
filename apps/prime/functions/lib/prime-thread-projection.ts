import type {
  MessageAttachment,
  MessageCard,
  MessageLink,
} from '../../src/types/messenger/chat';

import { type FirebaseEnv, FirebaseRest } from './firebase-rest';
import type {
  PrimeMessageDraftRow,
  PrimeMessageRecordRow,
  PrimeMessageThreadRow,
} from './prime-messaging-repositories';

type PrimeChannelMeta = {
  bookingId?: string;
  channelType?: string;
  audience?: string;
  title?: string;
  memberUids?: Record<string, boolean>;
  createdAt?: number;
};

function parseStringArray(raw: string | null): string[] {
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

function parseLinks(raw: string | null): MessageLink[] | null {
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

function parseAttachments(raw: string | null): MessageAttachment[] | null {
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

function parseCards(raw: string | null): MessageCard[] | null {
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

async function ensureDirectChannelMeta(
  firebase: FirebaseRest,
  thread: PrimeMessageThreadRow,
  occurredAt: number,
): Promise<void> {
  const memberUids = parseStringArray(thread.member_uids_json);
  const memberMap = Object.fromEntries(memberUids.map((uid) => [uid, true]));
  const existingMeta = await firebase.get<PrimeChannelMeta>(`messaging/channels/${thread.id}/meta`);

  if (!existingMeta) {
    await firebase.set(`messaging/channels/${thread.id}/meta`, {
      channelType: 'direct',
      bookingId: thread.booking_id,
      audience: thread.audience,
      memberUids: memberMap,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    });
    return;
  }

  const existingMembers = existingMeta.memberUids ?? {};
  const missingMember = memberUids.some((uid) => existingMembers[uid] !== true);
  if (
    existingMeta.channelType !== 'direct'
    || existingMeta.bookingId !== thread.booking_id
    || (existingMeta.audience !== undefined && existingMeta.audience !== thread.audience)
    || missingMember
  ) {
    throw new Error('Direct channel metadata failed validation');
  }

  await firebase.update(`messaging/channels/${thread.id}/meta`, {
    updatedAt: occurredAt,
  });
}

async function ensureBroadcastChannelMeta(
  firebase: FirebaseRest,
  thread: PrimeMessageThreadRow,
  occurredAt: number,
): Promise<void> {
  const existingMeta = await firebase.get<PrimeChannelMeta>(`messaging/channels/${thread.id}/meta`);

  if (!existingMeta) {
    await firebase.set(`messaging/channels/${thread.id}/meta`, {
      channelType: 'broadcast',
      bookingId: thread.booking_id,
      audience: thread.audience,
      title: thread.title ?? undefined,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    });
    return;
  }

  if (
    existingMeta.channelType !== 'broadcast'
    || existingMeta.bookingId !== thread.booking_id
    || existingMeta.audience !== thread.audience
  ) {
    throw new Error('Broadcast channel metadata failed validation');
  }

  await firebase.update(`messaging/channels/${thread.id}/meta`, {
    title: thread.title ?? null,
    updatedAt: occurredAt,
  });
}

export async function projectPrimeThreadMessageToFirebase(
  env: FirebaseEnv,
  input: {
    thread: PrimeMessageThreadRow;
    message: PrimeMessageRecordRow;
    draft?: PrimeMessageDraftRow | null;
    occurredAt?: number;
  },
): Promise<void> {
  const occurredAt = input.occurredAt ?? Date.now();
  const firebase = new FirebaseRest(env);

  if (input.thread.channel_type === 'broadcast') {
    await ensureBroadcastChannelMeta(firebase, input.thread, occurredAt);
  } else {
    await ensureDirectChannelMeta(firebase, input.thread, occurredAt);
  }

  const links = parseLinks(input.message.links_json);
  const attachments = parseAttachments(input.message.attachments_json);
  const cards = parseCards(input.message.cards_json);

  await firebase.set(`messaging/channels/${input.thread.id}/messages/${input.message.id}`, {
    content: input.message.content,
    senderId: input.message.sender_id,
    senderRole: input.message.sender_role,
    senderName: input.message.sender_name ?? undefined,
    createdAt: input.message.created_at,
    kind: input.message.kind,
    audience: input.message.audience,
    links: links ?? undefined,
    attachments: attachments ?? undefined,
    cards: cards ?? undefined,
    campaignId: input.message.campaign_id ?? undefined,
    draft: input.draft
      ? {
          draftId: input.draft.id,
          status: input.draft.status,
          source: input.draft.source,
          createdAt: input.draft.created_at,
        }
      : undefined,
  });
}
