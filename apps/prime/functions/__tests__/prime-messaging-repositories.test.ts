/**
 * @jest-environment node
 */

import type { D1Database, D1PreparedStatement } from '@acme/platform-core/d1';

import {
  createPrimeMessage,
  createPrimeMessageCampaign,
  createPrimeMessageDraft,
  createPrimeMessageThread,
  enqueuePrimeProjectionJob,
  getPrimeLatestMessageCampaignForThread,
  getPrimeMessageCampaign,
  getPrimeMessageCampaignDelivery,
  getPrimeMessageCampaignRecord,
  getPrimeMessageCampaignTargetSnapshot,
  getPrimeMessageThread,
  getPrimeMessageThreadRecord,
  getPrimeProjectionJob,
  listPrimeMessageCampaignDeliveries,
  listPrimeMessageCampaignsForThread,
  listPrimeMessageCampaignTargetSnapshots,
  listPrimePendingProjectionJobs,
  listPrimeReviewThreads,
  recordPrimeMessageAdmission,
  updatePrimeMessageCampaign,
  updatePrimeMessageCampaignDelivery,
  updatePrimeMessageDraft,
  updatePrimeMessageThreadReviewStatus,
  updatePrimeProjectionJob,
  upsertPrimeMessageCampaignDelivery,
  upsertPrimeMessageCampaignTargetSnapshot,
  upsertPrimeMessageThread,
} from '../lib/prime-messaging-repositories';

type StatementRecord = {
  query: string;
  binds: unknown[];
};

type MockDbOptions = {
  firstByQuery?: Record<string, unknown>;
  firstByQuerySequence?: Record<string, unknown[]>;
  allByQuery?: Record<string, unknown[]>;
  allByQuerySequence?: Record<string, unknown[][]>;
};

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, ' ').trim();
}

function createMockDb(options: MockDbOptions = {}): {
  db: D1Database;
  statements: StatementRecord[];
} {
  const statements: StatementRecord[] = [];
  const firstCounters = new Map<string, number>();
  const allCounters = new Map<string, number>();

  function readFirst<T>(query: string): T | null {
    const sequence = options.firstByQuerySequence?.[query];
    if (sequence && sequence.length > 0) {
      const index = firstCounters.get(query) ?? 0;
      firstCounters.set(query, index + 1);
      return (sequence[Math.min(index, sequence.length - 1)] ?? null) as T | null;
    }

    return (options.firstByQuery?.[query] ?? null) as T | null;
  }

  function readAll<T>(query: string): T[] {
    const sequence = options.allByQuerySequence?.[query];
    if (sequence && sequence.length > 0) {
      const index = allCounters.get(query) ?? 0;
      allCounters.set(query, index + 1);
      return (sequence[Math.min(index, sequence.length - 1)] ?? []) as T[];
    }

    return (options.allByQuery?.[query] ?? []) as T[];
  }

  const db: D1Database = {
    prepare(query: string): D1PreparedStatement {
      const record: StatementRecord = { query: normalizeQuery(query), binds: [] };
      statements.push(record);

      const statement: D1PreparedStatement = {
        bind: (...args: unknown[]) => {
          record.binds = args;
          return statement;
        },
        all: async <T>() => ({ results: readAll<T>(record.query) }),
        first: async <T>() => readFirst<T>(record.query),
        run: async () => ({ success: true }),
      };

      return statement;
    },
    batch: async () => [],
  };

  return { db, statements };
}

describe('prime-messaging-repositories', () => {
  it('creates thread, message, draft, admission, and projection rows with canonical defaults', async () => {
    const { db, statements } = createMockDb();

    await createPrimeMessageThread(db, {
      id: 'thread-1',
      bookingId: 'BOOK123',
      channelType: 'direct',
      memberUids: ['occ_a', 'occ_b'],
      createdAt: 100,
    });

    await createPrimeMessage(db, {
      id: 'msg-1',
      threadId: 'thread-1',
      senderId: 'occ_a',
      senderRole: 'guest',
      content: 'Hello',
      createdAt: 110,
    });

    await createPrimeMessageDraft(db, {
      id: 'draft-1',
      threadId: 'thread-1',
      status: 'suggested',
      source: 'agent',
      content: 'Draft hello',
      createdAt: 120,
    });

    await recordPrimeMessageAdmission(db, {
      threadId: 'thread-1',
      draftId: 'draft-1',
      decision: 'draft_created',
      source: 'queue',
      createdAt: 130,
    });

    await enqueuePrimeProjectionJob(db, {
      id: 'proj-1',
      threadId: 'thread-1',
      entityType: 'draft',
      entityId: 'draft-1',
      createdAt: 140,
    });

    expect(statements).toHaveLength(5);
    expect(statements[0].query).toContain('INSERT INTO message_threads');
    expect(statements[0].binds[2]).toBe('direct');
    expect(statements[1].query).toContain('INSERT INTO message_records');
    expect(statements[1].binds[6]).toBe('support');
    expect(statements[2].query).toContain('INSERT INTO message_drafts');
    expect(statements[2].binds[4]).toBe('Draft hello');
    expect(statements[3].query).toContain('INSERT INTO message_admissions');
    expect(statements[3].binds[2]).toBe('draft_created');
    expect(statements[4].query).toContain('INSERT INTO message_projection_jobs');
    expect(statements[4].binds[5]).toBe('pending');
  });

  it('hydrates a thread record from canonical tables', async () => {
    const threadQuery = normalizeQuery('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeQuery('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftQuery = normalizeQuery('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeQuery('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeQuery('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const campaignQuery = normalizeQuery('SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC');

    const { db } = createMockDb({
      firstByQuery: {
        [threadQuery]: {
          id: 'thread-1',
          booking_id: 'BOOK123',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_a","occ_b"]',
          title: null,
          latest_message_at: 200,
          latest_inbound_message_at: 200,
          last_staff_reply_at: null,
          takeover_state: 'automated',
          review_status: 'pending',
          suppression_reason: null,
          metadata_json: null,
          created_at: 100,
          updated_at: 200,
        },
      },
      allByQuery: {
        [messageQuery]: [
          {
            id: 'msg-1',
            thread_id: 'thread-1',
            sender_id: 'occ_a',
            sender_role: 'guest',
            sender_name: 'Jane',
            content: 'Hello',
            kind: 'support',
            audience: 'thread',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            campaign_id: null,
            draft_id: null,
            deleted: 0,
            created_at: 110,
          },
        ],
        [draftQuery]: [
          {
            id: 'draft-1',
            thread_id: 'thread-1',
            status: 'suggested',
            source: 'agent',
            content: 'Draft hello',
            kind: 'draft',
            audience: 'thread',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            quality_json: null,
            interpret_json: null,
            created_by_uid: null,
            reviewer_uid: null,
            suppression_reason: null,
            sent_message_id: null,
            created_at: 120,
            updated_at: 120,
          },
        ],
        [admissionQuery]: [
          {
            id: 1,
            thread_id: 'thread-1',
            draft_id: 'draft-1',
            decision: 'draft_created',
            reason: null,
            source: 'queue',
            classifier_version: null,
            source_metadata_json: null,
            created_at: 130,
          },
        ],
        [projectionQuery]: [
          {
            id: 'proj-1',
            thread_id: 'thread-1',
            entity_type: 'draft',
            entity_id: 'draft-1',
            projection_target: 'firebase',
            status: 'pending',
            attempt_count: 0,
            last_attempt_at: null,
            last_error: null,
            created_at: 140,
            updated_at: 140,
          },
        ],
        [campaignQuery]: [
          {
            id: 'camp-1',
            thread_id: 'thread-1',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'under_review',
            title: 'Whole-hostel broadcast',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread"}',
            latest_draft_id: 'draft-1',
            sent_message_id: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 125,
            updated_at: 140,
          },
        ],
      },
    });

    const record = await getPrimeMessageThreadRecord(db, 'thread-1');

    expect(record?.thread.id).toBe('thread-1');
    expect(record?.messages).toHaveLength(1);
    expect(record?.drafts[0].status).toBe('suggested');
    expect(record?.admissions[0].decision).toBe('draft_created');
    expect(record?.projectionJobs[0].status).toBe('pending');
    expect(record?.campaigns[0].id).toBe('camp-1');
  });

  it('creates, updates, and loads canonical campaign rows', async () => {
    const campaignByIdQuery = normalizeQuery('SELECT * FROM message_campaigns WHERE id = ?');
    const latestCampaignQuery = normalizeQuery(
      `SELECT * FROM message_campaigns
       WHERE thread_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC
       LIMIT 1`
    );
    const listByThreadQuery = normalizeQuery(
      `SELECT * FROM message_campaigns
       WHERE thread_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`
    );
    const { db, statements } = createMockDb({
      firstByQuerySequence: {
        [campaignByIdQuery]: [
          {
            id: 'camp-1',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'under_review',
            title: 'Whole-hostel broadcast',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread"}',
            latest_draft_id: 'draft-1',
            sent_message_id: null,
            target_count: 1,
            sent_count: 0,
            projected_count: 0,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 100,
            updated_at: 120,
          },
          {
            id: 'camp-1',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'sent',
            title: 'Whole-hostel broadcast',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread"}',
            latest_draft_id: 'draft-1',
            sent_message_id: 'msg-1',
            target_count: 1,
            sent_count: 1,
            projected_count: 1,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 100,
            updated_at: 150,
          },
          {
            id: 'camp-1',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'sent',
            title: 'Whole-hostel broadcast',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread"}',
            latest_draft_id: 'draft-1',
            sent_message_id: 'msg-1',
            target_count: 1,
            sent_count: 1,
            projected_count: 1,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 100,
            updated_at: 150,
          },
        ],
        [latestCampaignQuery]: {
          id: 'camp-1',
          thread_id: 'broadcast_whole_hostel',
          campaign_type: 'broadcast',
          audience: 'whole_hostel',
          status: 'sent',
          title: 'Whole-hostel broadcast',
          metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread"}',
          latest_draft_id: 'draft-1',
          sent_message_id: 'msg-1',
          target_count: 1,
          sent_count: 1,
          projected_count: 1,
          failed_count: 0,
          last_error: null,
          created_by_uid: 'staff-1',
          reviewer_uid: 'staff-1',
          created_at: 100,
          updated_at: 150,
        },
      },
      allByQuery: {
        [listByThreadQuery]: [
          {
            id: 'camp-1',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'sent',
            title: 'Whole-hostel broadcast',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread"}',
            latest_draft_id: 'draft-1',
            sent_message_id: 'msg-1',
            target_count: 1,
            sent_count: 1,
            projected_count: 1,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 100,
            updated_at: 150,
          },
        ],
      },
    });

    await createPrimeMessageCampaign(db, {
      id: 'camp-1',
      threadId: 'broadcast_whole_hostel',
      audience: 'whole_hostel',
      status: 'under_review',
      title: 'Whole-hostel broadcast',
      metadata: { deliveryModel: 'shared_whole_hostel_broadcast_thread' },
      latestDraftId: 'draft-1',
      createdByUid: 'staff-1',
      reviewerUid: 'staff-1',
      createdAt: 100,
    });
    const updated = await updatePrimeMessageCampaign(db, {
      campaignId: 'camp-1',
      status: 'sent',
      title: 'Whole-hostel broadcast',
      metadata: { deliveryModel: 'shared_whole_hostel_broadcast_thread' },
      latestDraftId: 'draft-1',
      sentMessageId: 'msg-1',
      sentCount: 1,
      projectedCount: 1,
      createdByUid: 'staff-1',
      reviewerUid: 'staff-1',
      updatedAt: 150,
    });
    const byId = await getPrimeMessageCampaign(db, 'camp-1');
    const latest = await getPrimeLatestMessageCampaignForThread(db, 'broadcast_whole_hostel');
    const list = await listPrimeMessageCampaignsForThread(db, 'broadcast_whole_hostel');

    expect(updated?.status).toBe('sent');
    expect(updated?.target_count).toBe(1);
    expect(updated?.projected_count).toBe(1);
    expect(byId?.sent_message_id).toBe('msg-1');
    expect(latest?.id).toBe('camp-1');
    expect(list).toHaveLength(1);
    expect(statements.some((statement) => statement.query.includes('INSERT INTO message_campaigns'))).toBe(true);
    expect(statements.some((statement) => statement.query.includes('UPDATE message_campaigns'))).toBe(true);
  });

  it('upserts target snapshots and deliveries, then hydrates a campaign record', async () => {
    const campaignByIdQuery = normalizeQuery('SELECT * FROM message_campaigns WHERE id = ?');
    const snapshotByIdQuery = normalizeQuery('SELECT * FROM message_campaign_target_snapshots WHERE id = ?');
    const snapshotsByCampaignQuery = normalizeQuery(
      `SELECT * FROM message_campaign_target_snapshots
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`
    );
    const deliveryByIdQuery = normalizeQuery('SELECT * FROM message_campaign_deliveries WHERE id = ?');
    const deliveriesByCampaignQuery = normalizeQuery(
      `SELECT * FROM message_campaign_deliveries
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`
    );

    const { db, statements } = createMockDb({
      firstByQuery: {
        [campaignByIdQuery]: {
          id: 'camp-2',
          thread_id: 'broadcast_whole_hostel',
          campaign_type: 'event_invite',
          audience: 'booking',
          status: 'under_review',
          title: 'Wine tasting invite',
          metadata_json: '{"offerCode":"WINE10"}',
          latest_draft_id: 'draft-2',
          sent_message_id: null,
          target_count: 2,
          sent_count: 0,
          projected_count: 0,
          failed_count: 0,
          last_error: null,
          created_by_uid: 'staff-1',
          reviewer_uid: 'staff-1',
          created_at: 200,
          updated_at: 230,
        },
        [snapshotByIdQuery]: {
          id: 'target-1',
          campaign_id: 'camp-2',
          target_kind: 'booking',
          target_key: 'BOOK123',
          thread_id: 'broadcast_booking_BOOK123',
          booking_id: 'BOOK123',
          room_key: 'A1',
          guest_uuid: null,
          external_contact_key: null,
          target_metadata_json: '{"leadGuest":"occ_aaa"}',
          eligibility_context_json: '{"eligible":true}',
          created_at: 210,
          updated_at: 220,
        },
        [deliveryByIdQuery]: {
          id: 'delivery-1',
          campaign_id: 'camp-2',
          target_snapshot_id: 'target-1',
          delivery_status: 'projected',
          thread_id: 'broadcast_booking_BOOK123',
          draft_id: 'draft-2',
          message_id: 'msg-2',
          projection_job_id: 'proj-2',
          attempt_count: 1,
          last_attempt_at: 240,
          last_error: null,
          sent_at: 240,
          projected_at: 245,
          delivery_metadata_json: '{"channelId":"broadcast_booking_BOOK123"}',
          created_at: 230,
          updated_at: 245,
        },
      },
      allByQuery: {
        [snapshotsByCampaignQuery]: [
          {
            id: 'target-1',
            campaign_id: 'camp-2',
            target_kind: 'booking',
            target_key: 'BOOK123',
            thread_id: 'broadcast_booking_BOOK123',
            booking_id: 'BOOK123',
            room_key: 'A1',
            guest_uuid: null,
            external_contact_key: null,
            target_metadata_json: '{"leadGuest":"occ_aaa"}',
            eligibility_context_json: '{"eligible":true}',
            created_at: 210,
            updated_at: 220,
          },
        ],
        [deliveriesByCampaignQuery]: [
          {
            id: 'delivery-1',
            campaign_id: 'camp-2',
            target_snapshot_id: 'target-1',
            delivery_status: 'projected',
            thread_id: 'broadcast_booking_BOOK123',
            draft_id: 'draft-2',
            message_id: 'msg-2',
            projection_job_id: 'proj-2',
            attempt_count: 1,
            last_attempt_at: 240,
            last_error: null,
            sent_at: 240,
            projected_at: 245,
            delivery_metadata_json: '{"channelId":"broadcast_booking_BOOK123"}',
            created_at: 230,
            updated_at: 245,
          },
        ],
      },
    });

    const snapshot = await upsertPrimeMessageCampaignTargetSnapshot(db, {
      id: 'target-1',
      campaignId: 'camp-2',
      targetKind: 'booking',
      targetKey: 'BOOK123',
      threadId: 'broadcast_booking_BOOK123',
      bookingId: 'BOOK123',
      roomKey: 'A1',
      targetMetadata: { leadGuest: 'occ_aaa' },
      eligibilityContext: { eligible: true },
      createdAt: 210,
      updatedAt: 220,
    });
    const delivery = await upsertPrimeMessageCampaignDelivery(db, {
      id: 'delivery-1',
      campaignId: 'camp-2',
      targetSnapshotId: 'target-1',
      deliveryStatus: 'sent',
      threadId: 'broadcast_booking_BOOK123',
      draftId: 'draft-2',
      messageId: 'msg-2',
      projectionJobId: 'proj-2',
      attemptCount: 1,
      sentAt: 240,
      createdAt: 230,
      updatedAt: 240,
      deliveryMetadata: { channelId: 'broadcast_booking_BOOK123' },
    });
    const updatedDelivery = await updatePrimeMessageCampaignDelivery(db, {
      deliveryId: 'delivery-1',
      deliveryStatus: 'projected',
      threadId: 'broadcast_booking_BOOK123',
      draftId: 'draft-2',
      messageId: 'msg-2',
      projectionJobId: 'proj-2',
      attemptCount: 1,
      lastAttemptAt: 240,
      projectedAt: 245,
      deliveryMetadata: { channelId: 'broadcast_booking_BOOK123' },
      updatedAt: 245,
    });
    const snapshotById = await getPrimeMessageCampaignTargetSnapshot(db, 'target-1');
    const deliveryById = await getPrimeMessageCampaignDelivery(db, 'delivery-1');
    const targets = await listPrimeMessageCampaignTargetSnapshots(db, 'camp-2');
    const deliveries = await listPrimeMessageCampaignDeliveries(db, 'camp-2');
    const record = await getPrimeMessageCampaignRecord(db, 'camp-2');

    expect(snapshot.target_key).toBe('BOOK123');
    expect(delivery.delivery_status).toBe('projected');
    expect(updatedDelivery?.projected_at).toBe(245);
    expect(snapshotById?.thread_id).toBe('broadcast_booking_BOOK123');
    expect(deliveryById?.projection_job_id).toBe('proj-2');
    expect(targets).toHaveLength(1);
    expect(deliveries).toHaveLength(1);
    expect(record?.campaign.id).toBe('camp-2');
    expect(record?.targets[0].target_kind).toBe('booking');
    expect(record?.deliveries[0].delivery_status).toBe('projected');
    expect(statements.some((statement) => statement.query.includes('INSERT INTO message_campaign_target_snapshots'))).toBe(true);
    expect(statements.some((statement) => statement.query.includes('INSERT INTO message_campaign_deliveries'))).toBe(true);
    expect(statements.some((statement) => statement.query.includes('UPDATE message_campaign_deliveries'))).toBe(true);
  });

  it('updates an existing draft row and reselects the canonical record', async () => {
    const draftQuery = normalizeQuery('SELECT * FROM message_drafts WHERE id = ?');
    const { db, statements } = createMockDb({
      firstByQuery: {
        [draftQuery]: {
          id: 'draft-1',
          thread_id: 'thread-1',
          status: 'under_review',
          source: 'staff',
          content: 'Updated staff reply',
          kind: 'draft',
          audience: 'thread',
          links_json: null,
          attachments_json: null,
          cards_json: null,
          quality_json: null,
          interpret_json: null,
          created_by_uid: 'staff-1',
          reviewer_uid: 'staff-1',
          suppression_reason: null,
          sent_message_id: null,
          created_at: 120,
          updated_at: 150,
        },
      },
    });

    const draft = await updatePrimeMessageDraft(db, {
      draftId: 'draft-1',
      status: 'under_review',
      content: 'Updated staff reply',
      createdByUid: 'staff-1',
      reviewerUid: 'staff-1',
      updatedAt: 150,
    });

    expect(draft).toEqual(expect.objectContaining({
      id: 'draft-1',
      status: 'under_review',
      content: 'Updated staff reply',
      reviewer_uid: 'staff-1',
      updated_at: 150,
    }));
    expect(statements).toHaveLength(2);
    expect(statements[0].query).toContain('UPDATE message_drafts');
    expect(statements[0].binds).toEqual([
      'under_review',
      'Updated staff reply',
      'draft',
      'thread',
      null,
      null,
      null,
      null,
      null,
      'staff-1',
      'staff-1',
      null,
      null,
      150,
      'draft-1',
    ]);
    expect(statements[1].query).toBe(draftQuery);
    expect(statements[1].binds).toEqual(['draft-1']);
  });

  it('upserts and fetches a thread row for canonical shadow-write updates', async () => {
    const threadQuery = normalizeQuery('SELECT * FROM message_threads WHERE id = ?');
    const { db, statements } = createMockDb({
      firstByQuery: {
        [threadQuery]: {
          id: 'thread-1',
          booking_id: 'BOOK123',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_a","occ_b"]',
          title: null,
          latest_message_at: 200,
          latest_inbound_message_at: 200,
          last_staff_reply_at: 150,
          takeover_state: 'staff_active',
          review_status: 'review_later',
          suppression_reason: 'staff_reply_present',
          metadata_json: '{"shadowWriteTransport":"firebase"}',
          created_at: 100,
          updated_at: 200,
        },
      },
    });

    await upsertPrimeMessageThread(db, {
      id: 'thread-1',
      bookingId: 'BOOK123',
      channelType: 'direct',
      memberUids: ['occ_a', 'occ_b'],
      latestMessageAt: 250,
      latestInboundMessageAt: 250,
      lastStaffReplyAt: 150,
      takeoverState: 'staff_active',
      suppressionReason: 'staff_reply_present',
      metadata: { shadowWriteTransport: 'firebase', lastSenderId: 'occ_a' },
      createdAt: 100,
      updatedAt: 250,
    });

    const thread = await getPrimeMessageThread(db, 'thread-1');

    expect(thread?.takeover_state).toBe('staff_active');
    expect(thread?.review_status).toBe('review_later');
    expect(thread?.suppression_reason).toBe('staff_reply_present');
    expect(statements[0].query).toContain('INSERT INTO message_threads');
    expect(statements[0].query).toContain('ON CONFLICT(id) DO UPDATE SET');
    expect(statements[1]).toEqual(expect.objectContaining({
      query: threadQuery,
      binds: ['thread-1'],
    }));
  });

  it('lists pending projection jobs in oldest-first order', async () => {
    const query = normalizeQuery(
      `SELECT * FROM message_projection_jobs
       WHERE status = 'pending'
       ORDER BY updated_at ASC, created_at ASC
       LIMIT ?`
    );

    const { db, statements } = createMockDb({
      allByQuery: {
        [query]: [
          {
            id: 'proj-1',
            thread_id: 'thread-1',
            entity_type: 'message',
            entity_id: 'msg-1',
            projection_target: 'firebase',
            status: 'pending',
            attempt_count: 0,
            last_attempt_at: null,
            last_error: null,
            created_at: 100,
            updated_at: 100,
          },
        ],
      },
    });

    const jobs = await listPrimePendingProjectionJobs(db, 25);

    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('proj-1');
    expect(statements[0].binds).toEqual([25]);
  });

  it('updates projection job status with attempt metadata and reselects the canonical record', async () => {
    const projectionJobQuery = normalizeQuery('SELECT * FROM message_projection_jobs WHERE id = ?');
    const { db, statements } = createMockDb({
      firstByQuery: {
        [projectionJobQuery]: {
          id: 'proj-1',
          thread_id: 'thread-1',
          entity_type: 'message',
          entity_id: 'msg-1',
          projection_target: 'firebase',
          status: 'failed',
          attempt_count: 2,
          last_attempt_at: 200,
          last_error: 'Firebase SET failed: 500 Internal Server Error',
          created_at: 100,
          updated_at: 200,
        },
      },
    });

    const job = await updatePrimeProjectionJob(db, {
      jobId: 'proj-1',
      status: 'failed',
      attemptCount: 2,
      lastAttemptAt: 200,
      lastError: 'Firebase SET failed: 500 Internal Server Error',
      updatedAt: 200,
    });

    expect(job?.status).toBe('failed');
    expect(job?.attempt_count).toBe(2);
    expect(statements[0].query).toContain('UPDATE message_projection_jobs');
    expect(statements[0].binds).toEqual([
      'failed',
      2,
      200,
      'Firebase SET failed: 500 Internal Server Error',
      200,
      'proj-1',
    ]);
    expect(statements[1].query).toBe(projectionJobQuery);
  });

  it('loads a projection job by id', async () => {
    const projectionJobQuery = normalizeQuery('SELECT * FROM message_projection_jobs WHERE id = ?');
    const { db, statements } = createMockDb({
      firstByQuery: {
        [projectionJobQuery]: {
          id: 'proj-1',
          thread_id: 'thread-1',
          entity_type: 'message',
          entity_id: 'msg-1',
          projection_target: 'firebase',
          status: 'pending',
          attempt_count: 0,
          last_attempt_at: null,
          last_error: null,
          created_at: 100,
          updated_at: 100,
        },
      },
    });

    const job = await getPrimeProjectionJob(db, 'proj-1');

    expect(job?.id).toBe('proj-1');
    expect(statements[0]).toEqual(expect.objectContaining({
      query: projectionJobQuery,
      binds: ['proj-1'],
    }));
  });

  it('lists review threads with latest message and admission context', async () => {
    const query = normalizeQuery(
      `SELECT
         t.*,
         latest_message.content AS latest_message_content,
         latest_message.kind AS latest_message_kind,
         latest_admission.decision AS latest_admission_decision,
         latest_admission.reason AS latest_admission_reason,
         latest_admission.source AS latest_admission_source,
         latest_admission.created_at AS latest_admission_created_at
       FROM message_threads t
       LEFT JOIN message_records latest_message
         ON latest_message.id = (
           SELECT mr.id
           FROM message_records mr
           WHERE mr.thread_id = t.id
           ORDER BY mr.created_at DESC, mr.id DESC
           LIMIT 1
         )
       LEFT JOIN message_admissions latest_admission
         ON latest_admission.id = (
           SELECT ma.id
           FROM message_admissions ma
           WHERE ma.thread_id = t.id
           ORDER BY ma.created_at DESC, ma.id DESC
           LIMIT 1
         )
       WHERE t.review_status NOT IN ('resolved', 'sent', 'auto_archived')
       ORDER BY t.updated_at DESC, t.created_at DESC
       LIMIT ?`
    );

    const { db, statements } = createMockDb({
      allByQuery: {
        [query]: [
          {
            id: 'thread-1',
            booking_id: 'BOOK123',
            channel_type: 'direct',
            audience: 'thread',
            member_uids_json: '["occ_a","occ_b"]',
            title: null,
            latest_message_at: 200,
            latest_inbound_message_at: 200,
            last_staff_reply_at: null,
            takeover_state: 'automated',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: null,
            created_at: 100,
            updated_at: 200,
            latest_message_content: 'Hello',
            latest_message_kind: 'support',
            latest_admission_decision: 'queued',
            latest_admission_reason: null,
            latest_admission_source: 'guest_direct_message',
            latest_admission_created_at: 200,
          },
        ],
      },
    });

    const rows = await listPrimeReviewThreads(db, 10);

    expect(rows[0].latest_message_content).toBe('Hello');
    expect(rows[0].latest_admission_decision).toBe('queued');
    expect(statements[0].binds).toEqual([10]);
  });

  it('updates Prime thread review status without changing takeover state', async () => {
    const threadQuery = normalizeQuery('SELECT * FROM message_threads WHERE id = ?');
    const { db, statements } = createMockDb({
      firstByQuery: {
        [threadQuery]: {
          id: 'thread-1',
          booking_id: 'BOOK123',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_a","occ_b"]',
          title: null,
          latest_message_at: 200,
          latest_inbound_message_at: 200,
          last_staff_reply_at: null,
          takeover_state: 'automated',
          review_status: 'resolved',
          suppression_reason: null,
          metadata_json: null,
          created_at: 100,
          updated_at: 300,
        },
      },
    });

    const thread = await updatePrimeMessageThreadReviewStatus(db, {
      threadId: 'thread-1',
      reviewStatus: 'resolved',
      updatedAt: 300,
    });

    expect(thread?.review_status).toBe('resolved');
    expect(thread?.takeover_state).toBe('automated');
    expect(statements[0].query).toContain('UPDATE message_threads');
    expect(statements[0].binds).toEqual(['resolved', 300, 'thread-1']);
  });
});
