/**
 * @jest-environment node
 */

import { onRequestGet as getReviewCampaign } from '../api/review-campaign';
import { onRequestPost as replayReviewCampaignDelivery } from '../api/review-campaign-replay';
import { onRequestPost as sendReviewCampaign } from '../api/review-campaign-send';
import { onRequestPost as replayProjectionJob } from '../api/review-projection-replay';
import { onRequestGet as getReviewThread } from '../api/review-thread';
import { onRequestPost as dismissReviewThread } from '../api/review-thread-dismiss';
import { onRequestPut as saveReviewThreadDraft } from '../api/review-thread-draft';
import { onRequestPost as resolveReviewThread } from '../api/review-thread-resolve';
import { onRequestPost as sendReviewThread } from '../api/review-thread-send';
import { onRequestGet as getReviewThreads } from '../api/review-threads';

import {
  createMockD1Database,
  createMockEnv,
  createPagesContext,
  normalizeD1Query,
  signTestActorClaims,
} from './helpers';

describe('/api/review-threads and /api/review-thread', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TC-01: production list route requires the Prime access token gate', async () => {
    const response = await getReviewThreads(
      createPagesContext({
        url: 'https://prime.example.com/api/review-threads',
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
        }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it('TC-02: review list returns canonical Prime thread summaries (excludes terminal threads by default)', async () => {
    const listQuery = normalizeD1Query(
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
    const { db } = createMockD1Database({
      allByQuery: {
        [listQuery]: [
          {
            id: 'dm_occ_aaa_occ_bbb',
            booking_id: 'BOOK123',
            channel_type: 'direct',
            audience: 'thread',
            member_uids_json: '["occ_aaa","occ_bbb"]',
            title: null,
            latest_message_at: 1000,
            latest_inbound_message_at: 1000,
            last_staff_reply_at: null,
            takeover_state: 'automated',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1000,
            latest_message_content: 'Hello from Prime',
            latest_message_kind: 'support',
            latest_admission_decision: 'queued',
            latest_admission_reason: null,
            latest_admission_source: 'guest_direct_message',
            latest_admission_created_at: 1000,
          },
        ],
      },
    });

    const response = await getReviewThreads(
      createPagesContext({
        url: 'https://prime.example.com/api/review-threads?limit=10',
        headers: {
          'x-prime-access-token': 'prime-access',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: Array<{
        id: string;
        channel: string;
        reviewStatus: string;
        latestAdmissionDecision: string | null;
        bookingId: string;
      }>;
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual([
      expect.objectContaining({
        id: 'dm_occ_aaa_occ_bbb',
        channel: 'prime_direct',
        reviewStatus: 'pending',
        latestAdmissionDecision: 'queued',
        bookingId: 'BOOK123',
      }),
    ]);
  });

  it('TC-02b: invalid status param returns 400', async () => {
    const { db } = createMockD1Database({ allByQuery: {} });

    const response = await getReviewThreads(
      createPagesContext({
        url: 'https://prime.example.com/api/review-threads?status=invalid_status',
        headers: { 'x-prime-access-token': 'prime-access' },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it('TC-02c: explicit status=resolved param returns only resolved threads', async () => {
    const resolvedQuery = normalizeD1Query(
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
       WHERE t.review_status = ?
       ORDER BY t.updated_at DESC, t.created_at DESC
       LIMIT ?`
    );
    const { db } = createMockD1Database({
      allByQuery: {
        [resolvedQuery]: [
          {
            id: 'dm_resolved_thread',
            booking_id: 'BOOK456',
            channel_type: 'direct',
            audience: 'thread',
            member_uids_json: '["occ_ccc"]',
            title: null,
            latest_message_at: 2000,
            latest_inbound_message_at: 2000,
            last_staff_reply_at: 2000,
            takeover_state: 'automated',
            review_status: 'resolved',
            suppression_reason: null,
            metadata_json: null,
            created_at: 1500,
            updated_at: 2000,
            latest_message_content: 'Resolved thread',
            latest_message_kind: 'support',
            latest_admission_decision: 'resolved',
            latest_admission_reason: null,
            latest_admission_source: 'staff',
            latest_admission_created_at: 2000,
          },
        ],
      },
    });

    const response = await getReviewThreads(
      createPagesContext({
        url: 'https://prime.example.com/api/review-threads?status=resolved',
        headers: { 'x-prime-access-token': 'prime-access' },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as { success: boolean; data: Array<{ id: string; reviewStatus: string }> };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual([
      expect.objectContaining({ id: 'dm_resolved_thread', reviewStatus: 'resolved' }),
    ]);
  });

  it('TC-03: review detail returns canonical Prime messages and admissions', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const { db } = createMockD1Database({
      firstByQuery: {
        [threadQuery]: {
          id: 'dm_occ_aaa_occ_bbb',
          booking_id: 'BOOK123',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_aaa","occ_bbb"]',
          title: null,
          latest_message_at: 1000,
          latest_inbound_message_at: 1000,
          last_staff_reply_at: null,
          takeover_state: 'automated',
          review_status: 'pending',
          suppression_reason: null,
          metadata_json: '{"shadowWriteTransport":"firebase"}',
          created_at: 900,
          updated_at: 1000,
        },
      },
      allByQuery: {
        [messageQuery]: [
          {
            id: 'msg-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            sender_id: 'occ_aaa',
            sender_role: 'guest',
            sender_name: 'Jane',
            content: 'Hello from Prime',
            kind: 'support',
            audience: 'thread',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            campaign_id: null,
            draft_id: null,
            deleted: 0,
            created_at: 1000,
          },
        ],
        [draftQuery]: [],
        [admissionQuery]: [
          {
            id: 1,
            thread_id: 'dm_occ_aaa_occ_bbb',
            draft_id: null,
            decision: 'queued',
            reason: null,
            source: 'guest_direct_message',
            classifier_version: null,
            source_metadata_json: '{"messageId":"msg-1"}',
            created_at: 1000,
          },
        ],
        [projectionQuery]: [],
      },
    });

    const response = await getReviewThread(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread?threadId=dm_occ_aaa_occ_bbb',
        headers: {
          'x-prime-access-token': 'prime-access',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        thread: { id: string; channel: string; reviewStatus: string };
        messages: Array<{ id: string; direction: string; content: string }>;
        admissions: Array<{ decision: string }>;
        currentDraft: null;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.thread).toEqual(expect.objectContaining({
      id: 'dm_occ_aaa_occ_bbb',
      channel: 'prime_direct',
      reviewStatus: 'pending',
    }));
    expect(payload.data.messages).toEqual([
      expect.objectContaining({
        id: 'msg-1',
        direction: 'inbound',
        content: 'Hello from Prime',
      }),
    ]);
    expect(payload.data.admissions[0].decision).toBe('queued');
    expect(payload.data.currentDraft).toBeNull();
  });

  it('TC-03-rich: review detail serializes rich message fields from DB columns', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const { db } = createMockD1Database({
      firstByQuery: {
        [threadQuery]: {
          id: 'dm_rich_thread',
          booking_id: 'BOOK-RICH',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_aaa"]',
          title: null,
          latest_message_at: 1000,
          latest_inbound_message_at: 1000,
          last_staff_reply_at: null,
          takeover_state: 'automated',
          review_status: 'pending',
          suppression_reason: null,
          metadata_json: null,
          created_at: 900,
          updated_at: 1000,
        },
      },
      allByQuery: {
        [messageQuery]: [
          {
            id: 'msg-rich',
            thread_id: 'dm_rich_thread',
            sender_id: 'occ_aaa',
            sender_role: 'guest',
            sender_name: 'Rich User',
            content: 'Message with rich fields',
            kind: 'promotion',
            audience: 'booking',
            links_json: '[{"label":"View offer","url":"https://example.com"}]',
            attachments_json: null,
            cards_json: null,
            campaign_id: 'camp-001',
            draft_id: null,
            deleted: 0,
            created_at: 1000,
          },
        ],
        [draftQuery]: [],
        [admissionQuery]: [],
        [projectionQuery]: [],
      },
    });

    const response = await getReviewThread(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread?threadId=dm_rich_thread',
        headers: { 'x-prime-access-token': 'prime-access' },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        messages: Array<{
          id: string;
          links: Array<{ label: string; url: string }> | null;
          attachments: null;
          audience: string;
          campaignId: string | null;
        }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    const msg = payload.data.messages[0];
    expect(msg.links).toEqual([{ label: 'View offer', url: 'https://example.com' }]);
    expect(msg.attachments).toBeNull();
    expect(msg.audience).toBe('booking');
    expect(msg.campaignId).toBe('camp-001');
  });

  it('TC-03B: review detail includes the current non-dismissed Prime draft', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const { db } = createMockD1Database({
      firstByQuery: {
        [threadQuery]: {
          id: 'dm_occ_aaa_occ_bbb',
          booking_id: 'BOOK123',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_aaa","occ_bbb"]',
          title: null,
          latest_message_at: 1000,
          latest_inbound_message_at: 1000,
          last_staff_reply_at: null,
          takeover_state: 'automated',
          review_status: 'pending',
          suppression_reason: null,
          metadata_json: '{"shadowWriteTransport":"firebase"}',
          created_at: 900,
          updated_at: 1000,
        },
      },
      allByQuery: {
        [messageQuery]: [],
        [draftQuery]: [
          {
            id: 'draft-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            status: 'under_review',
            source: 'staff',
            content: 'Manual reply draft',
            kind: 'draft',
            audience: 'thread',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            quality_json: '{"passed":true}',
            interpret_json: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            suppression_reason: null,
            sent_message_id: null,
            created_at: 1100,
            updated_at: 1200,
          },
          {
            id: 'draft-dismissed',
            thread_id: 'dm_occ_aaa_occ_bbb',
            status: 'dismissed',
            source: 'staff',
            content: 'Old dismissed draft',
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
            created_at: 1000,
            updated_at: 1100,
          },
        ],
        [admissionQuery]: [],
        [projectionQuery]: [],
      },
    });

    const response = await getReviewThread(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread?threadId=dm_occ_aaa_occ_bbb',
        headers: {
          'x-prime-access-token': 'prime-access',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        currentDraft: null | {
          id: string;
          status: string;
          content: string;
          createdByUid: string | null;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.currentDraft).toEqual(expect.objectContaining({
      id: 'draft-1',
      status: 'under_review',
      content: 'Manual reply draft',
      audience: 'thread',
      createdByUid: 'staff-1',
    }));
  });

  it('TC-03C: campaign detail returns canonical target and delivery summaries', async () => {
    const campaignByIdQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE id = ?');
    const snapshotQuery = normalizeD1Query(
      `SELECT * FROM message_campaign_target_snapshots
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`
    );
    const deliveryQuery = normalizeD1Query(
      `SELECT * FROM message_campaign_deliveries
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`
    );
    const { db } = createMockD1Database({
      firstByQuery: {
        [campaignByIdQuery]: {
          id: 'camp-2',
          thread_id: 'broadcast_whole_hostel',
          campaign_type: 'broadcast',
          audience: 'whole_hostel',
          status: 'sent',
          title: 'Whole hostel updates',
          metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread"}',
          latest_draft_id: 'draft-2',
          sent_message_id: 'msg-2',
          target_count: 1,
          sent_count: 1,
          projected_count: 1,
          failed_count: 0,
          last_error: null,
          created_by_uid: 'staff-1',
          reviewer_uid: 'staff-1',
          created_at: 1000,
          updated_at: 1200,
        },
      },
      allByQuery: {
        [snapshotQuery]: [
          {
            id: 'camp-2_target_whole_hostel',
            campaign_id: 'camp-2',
            target_kind: 'whole_hostel',
            target_key: 'whole_hostel',
            thread_id: 'broadcast_whole_hostel',
            booking_id: 'WHOLE_HOSTEL',
            room_key: null,
            guest_uuid: null,
            external_contact_key: null,
            target_metadata_json: '{"audience":"whole_hostel"}',
            eligibility_context_json: '{"channelType":"broadcast"}',
            created_at: 1100,
            updated_at: 1200,
          },
        ],
        [deliveryQuery]: [
          {
            id: 'camp-2_delivery_whole_hostel',
            campaign_id: 'camp-2',
            target_snapshot_id: 'camp-2_target_whole_hostel',
            delivery_status: 'projected',
            thread_id: 'broadcast_whole_hostel',
            draft_id: 'draft-2',
            message_id: 'msg-2',
            projection_job_id: 'proj_message_msg-2',
            attempt_count: 1,
            last_attempt_at: 1200,
            last_error: null,
            sent_at: 1200,
            projected_at: 1200,
            delivery_metadata_json: '{"projectionTarget":"firebase"}',
            created_at: 1200,
            updated_at: 1200,
          },
        ],
      },
    });

    const response = await getReviewCampaign(
      createPagesContext({
        url: 'https://prime.example.com/api/review-campaign?campaignId=camp-2',
        headers: {
          'x-prime-access-token': 'prime-access',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        id: string;
        targetSummary: { total: number; byKind: Array<{ kind: string; count: number }> };
        deliverySummary: { projected: number; replayableCount: number };
        deliveries: Array<{ id: string; targetKind: string | null; projectionJobId: string | null }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe('camp-2');
    expect(payload.data.targetSummary).toEqual({
      total: 1,
      byKind: [{ kind: 'whole_hostel', count: 1 }],
    });
    expect(payload.data.deliverySummary).toEqual(expect.objectContaining({
      projected: 1,
      replayableCount: 0,
    }));
    expect(payload.data.deliveries).toEqual([
      expect.objectContaining({
        id: 'camp-2_delivery_whole_hostel',
        targetKind: 'whole_hostel',
        projectionJobId: 'proj_message_msg-2',
      }),
    ]);
  });

  it('TC-03D: booking campaign send expands into the stable booking broadcast thread and records canonical delivery state', async () => {
    const campaignByIdQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE id = ?');
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionThreadQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const campaignsForThreadQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC');
    const snapshotByIdQuery = normalizeD1Query('SELECT * FROM message_campaign_target_snapshots WHERE id = ?');
    const snapshotListQuery = normalizeD1Query(
      `SELECT * FROM message_campaign_target_snapshots
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`,
    );
    const deliveryByIdQuery = normalizeD1Query('SELECT * FROM message_campaign_deliveries WHERE id = ?');
    const deliveryListQuery = normalizeD1Query(
      `SELECT * FROM message_campaign_deliveries
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`,
    );
    const projectionJobByIdQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE id = ?');
    const { db, statements } = createMockD1Database({
      firstByQuerySequence: {
        [campaignByIdQuery]: [
          {
            id: 'camp-booking-1',
            thread_id: 'broadcast_booking_BOOK123',
            campaign_type: 'broadcast',
            audience: 'booking',
            status: 'under_review',
            title: 'Booking promo',
            metadata_json: '{"bookingId":"BOOK123"}',
            latest_draft_id: 'draft-booking-1',
            sent_message_id: null,
            target_count: 0,
            sent_count: 0,
            projected_count: 0,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 900,
          },
          {
            id: 'camp-booking-1',
            thread_id: 'broadcast_booking_BOOK123',
            campaign_type: 'broadcast',
            audience: 'booking',
            status: 'under_review',
            title: 'Booking promo',
            metadata_json: '{"bookingId":"BOOK123"}',
            latest_draft_id: 'draft-booking-1',
            sent_message_id: null,
            target_count: 0,
            sent_count: 0,
            projected_count: 0,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 900,
          },
          {
            id: 'camp-booking-1',
            thread_id: 'broadcast_booking_BOOK123',
            campaign_type: 'broadcast',
            audience: 'booking',
            status: 'sent',
            title: 'Booking promo',
            metadata_json: '{"bookingId":"BOOK123"}',
            latest_draft_id: 'draft-booking-1',
            sent_message_id: 'msg_1400_abcdef123456',
            target_count: 1,
            sent_count: 1,
            projected_count: 1,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 1400,
          },
          {
            id: 'camp-booking-1',
            thread_id: 'broadcast_booking_BOOK123',
            campaign_type: 'broadcast',
            audience: 'booking',
            status: 'sent',
            title: 'Booking promo',
            metadata_json: '{"bookingId":"BOOK123"}',
            latest_draft_id: 'draft-booking-1',
            sent_message_id: 'msg_1400_abcdef123456',
            target_count: 1,
            sent_count: 1,
            projected_count: 1,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 1400,
          },
        ],
        [threadQuery]: [
          {
            id: 'broadcast_booking_BOOK123',
            booking_id: 'BOOK123',
            channel_type: 'broadcast',
            audience: 'booking',
            member_uids_json: '["occ_aaa"]',
            title: 'Prime booking BOOK123',
            latest_message_at: 1000,
            latest_inbound_message_at: null,
            last_staff_reply_at: null,
            takeover_state: 'staff_active',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{"channelScope":"booking_broadcast"}',
            created_at: 800,
            updated_at: 1000,
          },
        ],
        [snapshotByIdQuery]: [
          {
            id: 'camp-booking-1_target_booking_BOOK123',
            campaign_id: 'camp-booking-1',
            target_kind: 'booking',
            target_key: 'BOOK123',
            thread_id: 'broadcast_booking_BOOK123',
            booking_id: 'BOOK123',
            room_key: null,
            guest_uuid: null,
            external_contact_key: null,
            target_metadata_json: '{"sourceAudience":"booking","bookingId":"BOOK123","deliveryModel":"booking_broadcast_thread"}',
            eligibility_context_json: '{"sourceAudience":"booking","sourceThreadId":"broadcast_booking_BOOK123"}',
            created_at: 1400,
            updated_at: 1400,
          },
        ],
        [deliveryByIdQuery]: [
          {
            id: 'camp-booking-1_delivery_camp-booking-1_target_booking_BOOK123',
            campaign_id: 'camp-booking-1',
            target_snapshot_id: 'camp-booking-1_target_booking_BOOK123',
            delivery_status: 'sent',
            thread_id: 'broadcast_booking_BOOK123',
            draft_id: 'draft-booking-1',
            message_id: 'msg_1400_abcdef123456',
            projection_job_id: 'proj_message_msg_1400_abcdef123456',
            attempt_count: 0,
            last_attempt_at: null,
            last_error: null,
            sent_at: 1400,
            projected_at: null,
            delivery_metadata_json: '{"sourceThreadId":"broadcast_booking_BOOK123","sourceAudience":"booking","matchedOccupantUids":["occ_aaa"]}',
            created_at: 1400,
            updated_at: 1400,
          },
          {
            id: 'camp-booking-1_delivery_camp-booking-1_target_booking_BOOK123',
            campaign_id: 'camp-booking-1',
            target_snapshot_id: 'camp-booking-1_target_booking_BOOK123',
            delivery_status: 'projected',
            thread_id: 'broadcast_booking_BOOK123',
            draft_id: 'draft-booking-1',
            message_id: 'msg_1400_abcdef123456',
            projection_job_id: 'proj_message_msg_1400_abcdef123456',
            attempt_count: 1,
            last_attempt_at: 1400,
            last_error: null,
            sent_at: 1400,
            projected_at: 1400,
            delivery_metadata_json: '{"sourceThreadId":"broadcast_booking_BOOK123","sourceAudience":"booking","matchedOccupantUids":["occ_aaa"]}',
            created_at: 1400,
            updated_at: 1400,
          },
        ],
        [projectionJobByIdQuery]: [
          {
            id: 'proj_message_msg_1400_abcdef123456',
            thread_id: 'broadcast_booking_BOOK123',
            entity_type: 'message',
            entity_id: 'msg_1400_abcdef123456',
            projection_target: 'firebase',
            status: 'projected',
            attempt_count: 1,
            last_attempt_at: 1400,
            last_error: null,
            created_at: 1400,
            updated_at: 1400,
          },
        ],
      },
      allByQuerySequence: {
        [messageQuery]: [[]],
        [draftQuery]: [[
          {
            id: 'draft-booking-1',
            thread_id: 'broadcast_booking_BOOK123',
            status: 'under_review',
            source: 'staff',
            content: 'Special offer for your booking.',
            kind: 'promotion',
            audience: 'booking',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            quality_json: '{"passed":true}',
            interpret_json: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            suppression_reason: null,
            sent_message_id: null,
            created_at: 1000,
            updated_at: 1000,
          },
        ]],
        [admissionQuery]: [[]],
        [projectionThreadQuery]: [[]],
        [campaignsForThreadQuery]: [[
          {
            id: 'camp-booking-1',
            thread_id: 'broadcast_booking_BOOK123',
            campaign_type: 'broadcast',
            audience: 'booking',
            status: 'under_review',
            title: 'Booking promo',
            metadata_json: '{"bookingId":"BOOK123"}',
            latest_draft_id: 'draft-booking-1',
            sent_message_id: null,
            target_count: 0,
            sent_count: 0,
            projected_count: 0,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 900,
          },
        ]],
        [snapshotListQuery]: [
          [],
          [
            {
              id: 'camp-booking-1_target_booking_BOOK123',
              campaign_id: 'camp-booking-1',
              target_kind: 'booking',
              target_key: 'BOOK123',
              thread_id: 'broadcast_booking_BOOK123',
              booking_id: 'BOOK123',
              room_key: null,
              guest_uuid: null,
              external_contact_key: null,
              target_metadata_json: '{"sourceAudience":"booking","bookingId":"BOOK123","deliveryModel":"booking_broadcast_thread"}',
              eligibility_context_json: '{"sourceAudience":"booking","sourceThreadId":"broadcast_booking_BOOK123"}',
              created_at: 1400,
              updated_at: 1400,
            },
          ],
        ],
        [deliveryListQuery]: [
          [],
          [
            {
              id: 'camp-booking-1_delivery_camp-booking-1_target_booking_BOOK123',
              campaign_id: 'camp-booking-1',
              target_snapshot_id: 'camp-booking-1_target_booking_BOOK123',
              delivery_status: 'projected',
              thread_id: 'broadcast_booking_BOOK123',
              draft_id: 'draft-booking-1',
              message_id: 'msg_1400_abcdef123456',
              projection_job_id: 'proj_message_msg_1400_abcdef123456',
              attempt_count: 1,
              last_attempt_at: 1400,
              last_error: null,
              sent_at: 1400,
              projected_at: 1400,
              delivery_metadata_json: '{"sourceThreadId":"broadcast_booking_BOOK123","sourceAudience":"booking","matchedOccupantUids":["occ_aaa"]}',
              created_at: 1400,
              updated_at: 1400,
            },
          ],
        ],
      },
    });

    jest.spyOn(Date, 'now').mockReturnValue(1400);
    jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('abcdef123456abcdef123456abcdef12');
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : String(input);

      if (url.includes('/bookings/BOOK123.json') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify({
          occ_aaa: {
            checkInDate: '2026-03-08',
            checkOutDate: '2026-03-10',
            roomNumbers: ['12'],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (
        url.includes('/messaging/channels/broadcast_booking_BOOK123/meta.json')
        && (!init?.method || init.method === 'GET')
      ) {
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (
        url.includes('/messaging/channels/broadcast_booking_BOOK123/meta.json')
        && init?.method === 'PUT'
      ) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (
        url.includes('/messaging/channels/broadcast_booking_BOOK123/messages/msg_1400_abcdef123456.json')
        && init?.method === 'PUT'
      ) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
    });

    const response = await sendReviewCampaign(
      createPagesContext({
        url: 'https://prime.example.com/api/review-campaign-send?campaignId=camp-booking-1',
        method: 'POST',
        headers: {
          'x-prime-access-token': 'prime-access',
          'x-prime-actor-uid': 'staff-1',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        campaign: {
          id: string;
          status: string;
          targetSummary: { total: number };
          deliverySummary: { projected: number; failed: number };
        };
        sentMessageId: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.sentMessageId).toBe('msg_1400_abcdef123456');
    expect(payload.data.campaign).toEqual(expect.objectContaining({
      id: 'camp-booking-1',
      status: 'sent',
      targetSummary: expect.objectContaining({ total: 1 }),
      deliverySummary: expect.objectContaining({
        projected: 1,
        failed: 0,
      }),
    }));
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_campaign_target_snapshots')
      && statement.binds[0] === 'camp-booking-1_target_booking_BOOK123'
      && statement.binds[2] === 'booking'
      && statement.binds[4] === 'broadcast_booking_BOOK123')).toBe(true);
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_campaign_deliveries')
      && statement.binds[0] === 'camp-booking-1_delivery_camp-booking-1_target_booking_BOOK123'
      && statement.binds[3] === 'sent')).toBe(true);
    expect(statements.some((statement) =>
      statement.query.includes('UPDATE message_campaign_deliveries')
      && statement.binds[0] === 'projected')).toBe(true);
  });

  it('TC-03E: room campaign send keeps operator state sent while recording partial delivery failure', async () => {
    const campaignByIdQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE id = ?');
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionThreadQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const campaignsForThreadQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC');
    const snapshotByIdQuery = normalizeD1Query('SELECT * FROM message_campaign_target_snapshots WHERE id = ?');
    const snapshotListQuery = normalizeD1Query(
      `SELECT * FROM message_campaign_target_snapshots
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`,
    );
    const deliveryByIdQuery = normalizeD1Query('SELECT * FROM message_campaign_deliveries WHERE id = ?');
    const deliveryListQuery = normalizeD1Query(
      `SELECT * FROM message_campaign_deliveries
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`,
    );
    const projectionJobByIdQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE id = ?');
    const { db } = createMockD1Database({
      firstByQuerySequence: {
        [campaignByIdQuery]: [
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'under_review',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: null,
            target_count: 0,
            sent_count: 0,
            projected_count: 0,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 900,
          },
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'under_review',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: null,
            target_count: 0,
            sent_count: 0,
            projected_count: 0,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 900,
          },
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'sent',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: 'msg_1500_abcdef123456',
            target_count: 2,
            sent_count: 2,
            projected_count: 1,
            failed_count: 1,
            last_error: 'Firebase SET failed: 500 Internal Server Error',
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 1500,
          },
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'sent',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: 'msg_1500_abcdef123456',
            target_count: 2,
            sent_count: 2,
            projected_count: 1,
            failed_count: 1,
            last_error: 'Firebase SET failed: 500 Internal Server Error',
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 1500,
          },
        ],
        [threadQuery]: [
          {
            id: 'broadcast_room_101',
            booking_id: 'ROOM-101',
            channel_type: 'broadcast',
            audience: 'room',
            member_uids_json: null,
            title: 'Room 101 staff review',
            latest_message_at: 1000,
            latest_inbound_message_at: null,
            last_staff_reply_at: null,
            takeover_state: 'staff_active',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{"roomKey":"101"}',
            created_at: 800,
            updated_at: 1000,
          },
        ],
        [snapshotByIdQuery]: [
          {
            id: 'camp-room-1_target_room_101_BOOK123',
            campaign_id: 'camp-room-1',
            target_kind: 'room',
            target_key: '101:BOOK123',
            thread_id: 'broadcast_booking_BOOK123',
            booking_id: 'BOOK123',
            room_key: '101',
            guest_uuid: null,
            external_contact_key: null,
            target_metadata_json: '{"sourceAudience":"room","bookingId":"BOOK123","roomKey":"101","deliveryModel":"booking_broadcast_thread_from_room_lens"}',
            eligibility_context_json: '{"sourceAudience":"room","roomKey":"101","matchedOccupantUids":["occ_aaa"],"sourceThreadId":"broadcast_room_101"}',
            created_at: 1500,
            updated_at: 1500,
          },
          {
            id: 'camp-room-1_target_room_101_BOOK456',
            campaign_id: 'camp-room-1',
            target_kind: 'room',
            target_key: '101:BOOK456',
            thread_id: 'broadcast_booking_BOOK456',
            booking_id: 'BOOK456',
            room_key: '101',
            guest_uuid: null,
            external_contact_key: null,
            target_metadata_json: '{"sourceAudience":"room","bookingId":"BOOK456","roomKey":"101","deliveryModel":"booking_broadcast_thread_from_room_lens"}',
            eligibility_context_json: '{"sourceAudience":"room","roomKey":"101","matchedOccupantUids":["occ_bbb"],"sourceThreadId":"broadcast_room_101"}',
            created_at: 1500,
            updated_at: 1500,
          },
        ],
        [deliveryByIdQuery]: [
          {
            id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK123',
            campaign_id: 'camp-room-1',
            target_snapshot_id: 'camp-room-1_target_room_101_BOOK123',
            delivery_status: 'sent',
            thread_id: 'broadcast_booking_BOOK123',
            draft_id: 'draft-room-1',
            message_id: 'msg_1500_bbbbbbbbbbbb',
            projection_job_id: 'proj_message_msg_1500_bbbbbbbbbbbb',
            attempt_count: 0,
            last_attempt_at: null,
            last_error: null,
            sent_at: 1500,
            projected_at: null,
            delivery_metadata_json: '{"matchedOccupantUids":["occ_aaa"]}',
            created_at: 1500,
            updated_at: 1500,
          },
          {
            id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK123',
            campaign_id: 'camp-room-1',
            target_snapshot_id: 'camp-room-1_target_room_101_BOOK123',
            delivery_status: 'projected',
            thread_id: 'broadcast_booking_BOOK123',
            draft_id: 'draft-room-1',
            message_id: 'msg_1500_bbbbbbbbbbbb',
            projection_job_id: 'proj_message_msg_1500_bbbbbbbbbbbb',
            attempt_count: 1,
            last_attempt_at: 1500,
            last_error: null,
            sent_at: 1500,
            projected_at: 1500,
            delivery_metadata_json: '{"matchedOccupantUids":["occ_aaa"]}',
            created_at: 1500,
            updated_at: 1500,
          },
          {
            id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK456',
            campaign_id: 'camp-room-1',
            target_snapshot_id: 'camp-room-1_target_room_101_BOOK456',
            delivery_status: 'sent',
            thread_id: 'broadcast_booking_BOOK456',
            draft_id: 'draft-room-1',
            message_id: 'msg_1500_cccccccccccc',
            projection_job_id: 'proj_message_msg_1500_cccccccccccc',
            attempt_count: 0,
            last_attempt_at: null,
            last_error: null,
            sent_at: 1500,
            projected_at: null,
            delivery_metadata_json: '{"matchedOccupantUids":["occ_bbb"]}',
            created_at: 1500,
            updated_at: 1500,
          },
          {
            id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK456',
            campaign_id: 'camp-room-1',
            target_snapshot_id: 'camp-room-1_target_room_101_BOOK456',
            delivery_status: 'failed',
            thread_id: 'broadcast_booking_BOOK456',
            draft_id: 'draft-room-1',
            message_id: 'msg_1500_cccccccccccc',
            projection_job_id: 'proj_message_msg_1500_cccccccccccc',
            attempt_count: 1,
            last_attempt_at: 1500,
            last_error: 'Firebase SET failed: 500 Internal Server Error',
            sent_at: 1500,
            projected_at: null,
            delivery_metadata_json: '{"matchedOccupantUids":["occ_bbb"]}',
            created_at: 1500,
            updated_at: 1500,
          },
        ],
        [projectionJobByIdQuery]: [
          {
            id: 'proj_message_msg_1500_bbbbbbbbbbbb',
            thread_id: 'broadcast_booking_BOOK123',
            entity_type: 'message',
            entity_id: 'msg_1500_bbbbbbbbbbbb',
            projection_target: 'firebase',
            status: 'projected',
            attempt_count: 1,
            last_attempt_at: 1500,
            last_error: null,
            created_at: 1500,
            updated_at: 1500,
          },
          {
            id: 'proj_message_msg_1500_cccccccccccc',
            thread_id: 'broadcast_booking_BOOK456',
            entity_type: 'message',
            entity_id: 'msg_1500_cccccccccccc',
            projection_target: 'firebase',
            status: 'failed',
            attempt_count: 1,
            last_attempt_at: 1500,
            last_error: 'Firebase SET failed: 500 Internal Server Error',
            created_at: 1500,
            updated_at: 1500,
          },
        ],
      },
      allByQuerySequence: {
        [messageQuery]: [[]],
        [draftQuery]: [[
          {
            id: 'draft-room-1',
            thread_id: 'broadcast_room_101',
            status: 'under_review',
            source: 'staff',
            content: 'Meet in the courtyard at 8pm.',
            kind: 'promotion',
            audience: 'room',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            quality_json: null,
            interpret_json: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            suppression_reason: null,
            sent_message_id: null,
            created_at: 1000,
            updated_at: 1000,
          },
        ]],
        [admissionQuery]: [[]],
        [projectionThreadQuery]: [[]],
        [campaignsForThreadQuery]: [[
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'under_review',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: null,
            target_count: 0,
            sent_count: 0,
            projected_count: 0,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 900,
          },
        ]],
        [snapshotListQuery]: [
          [],
          [
            {
              id: 'camp-room-1_target_room_101_BOOK123',
              campaign_id: 'camp-room-1',
              target_kind: 'room',
              target_key: '101:BOOK123',
              thread_id: 'broadcast_booking_BOOK123',
              booking_id: 'BOOK123',
              room_key: '101',
              guest_uuid: null,
              external_contact_key: null,
              target_metadata_json: '{"sourceAudience":"room","bookingId":"BOOK123","roomKey":"101","deliveryModel":"booking_broadcast_thread_from_room_lens"}',
              eligibility_context_json: '{"sourceAudience":"room","roomKey":"101","matchedOccupantUids":["occ_aaa"],"sourceThreadId":"broadcast_room_101"}',
              created_at: 1500,
              updated_at: 1500,
            },
            {
              id: 'camp-room-1_target_room_101_BOOK456',
              campaign_id: 'camp-room-1',
              target_kind: 'room',
              target_key: '101:BOOK456',
              thread_id: 'broadcast_booking_BOOK456',
              booking_id: 'BOOK456',
              room_key: '101',
              guest_uuid: null,
              external_contact_key: null,
              target_metadata_json: '{"sourceAudience":"room","bookingId":"BOOK456","roomKey":"101","deliveryModel":"booking_broadcast_thread_from_room_lens"}',
              eligibility_context_json: '{"sourceAudience":"room","roomKey":"101","matchedOccupantUids":["occ_bbb"],"sourceThreadId":"broadcast_room_101"}',
              created_at: 1500,
              updated_at: 1500,
            },
          ],
        ],
        [deliveryListQuery]: [
          [],
          [
            {
              id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK123',
              campaign_id: 'camp-room-1',
              target_snapshot_id: 'camp-room-1_target_room_101_BOOK123',
              delivery_status: 'projected',
              thread_id: 'broadcast_booking_BOOK123',
              draft_id: 'draft-room-1',
              message_id: 'msg_1500_bbbbbbbbbbbb',
              projection_job_id: 'proj_message_msg_1500_bbbbbbbbbbbb',
              attempt_count: 1,
              last_attempt_at: 1500,
              last_error: null,
              sent_at: 1500,
              projected_at: 1500,
              delivery_metadata_json: '{"matchedOccupantUids":["occ_aaa"]}',
              created_at: 1500,
              updated_at: 1500,
            },
            {
              id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK456',
              campaign_id: 'camp-room-1',
              target_snapshot_id: 'camp-room-1_target_room_101_BOOK456',
              delivery_status: 'failed',
              thread_id: 'broadcast_booking_BOOK456',
              draft_id: 'draft-room-1',
              message_id: 'msg_1500_cccccccccccc',
              projection_job_id: 'proj_message_msg_1500_cccccccccccc',
              attempt_count: 1,
              last_attempt_at: 1500,
              last_error: 'Firebase SET failed: 500 Internal Server Error',
              sent_at: 1500,
              projected_at: null,
              delivery_metadata_json: '{"matchedOccupantUids":["occ_bbb"]}',
              created_at: 1500,
              updated_at: 1500,
            },
          ],
        ],
      },
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T12:00:00.000Z'));
    jest.spyOn(Date, 'now').mockReturnValue(1500);
    jest.spyOn(global.crypto, 'randomUUID')
      .mockReturnValueOnce('abcdef123456abcdef123456abcdef12')
      .mockReturnValueOnce('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .mockReturnValueOnce('cccccccccccccccccccccccccccccccc');

    try {
      fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input instanceof URL ? input.toString() : String(input);

        if (url.includes('/bookings.json') && (!init?.method || init.method === 'GET')) {
          return new Response(JSON.stringify({
            BOOK123: {
              occ_aaa: {
                checkInDate: '2026-03-08',
                checkOutDate: '2026-03-10',
                roomNumbers: ['101'],
              },
            },
            BOOK456: {
              occ_bbb: {
                checkInDate: '2026-03-08',
                checkOutDate: '2026-03-10',
                roomNumbers: ['101'],
              },
            },
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.includes('/guestByRoom.json') && (!init?.method || init.method === 'GET')) {
          return new Response(JSON.stringify({
            occ_aaa: { allocated: '101' },
            occ_bbb: { allocated: '101' },
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (
          (url.includes('/messaging/channels/broadcast_booking_BOOK123/meta.json')
            || url.includes('/messaging/channels/broadcast_booking_BOOK456/meta.json'))
          && (!init?.method || init.method === 'GET')
        ) {
          return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (
          (url.includes('/messaging/channels/broadcast_booking_BOOK123/meta.json')
            || url.includes('/messaging/channels/broadcast_booking_BOOK456/meta.json'))
          && init?.method === 'PUT'
        ) {
          return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.includes('/messaging/channels/broadcast_booking_BOOK123/messages/') && init?.method === 'PUT') {
          return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.includes('/messaging/channels/broadcast_booking_BOOK456/messages/') && init?.method === 'PUT') {
          return new Response('boom', { status: 500, statusText: 'Internal Server Error' });
        }

        throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
      });

      const response = await sendReviewCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign-send?campaignId=camp-room-1',
          method: 'POST',
          headers: {
            'x-prime-access-token': 'prime-access',
            'x-prime-actor-uid': 'staff-1',
          },
          env: createMockEnv({
            NODE_ENV: 'production',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
            PRIME_MESSAGING_DB: db,
          }),
        }),
      );
      const payload = await response.json() as {
        success: boolean;
        data: {
          campaign: {
            status: string;
            targetSummary: { total: number };
            deliverySummary: { projected: number; failed: number; replayableCount: number; lastError: string | null };
          };
        };
      };

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data.campaign.status).toBe('sent');
      expect(payload.data.campaign.targetSummary.total).toBe(2);
      expect(payload.data.campaign.deliverySummary).toEqual(expect.objectContaining({
        projected: 1,
        failed: 1,
        replayableCount: 1,
        lastError: 'Firebase SET failed: 500 Internal Server Error',
      }));
    } finally {
      jest.useRealTimers();
    }
  });

  it('TC-03F: campaign replay route reprojects a failed booking delivery and clears the campaign failure summary', async () => {
    const campaignByIdQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE id = ?');
    const snapshotListQuery = normalizeD1Query(
      `SELECT * FROM message_campaign_target_snapshots
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`,
    );
    const deliveryListQuery = normalizeD1Query(
      `SELECT * FROM message_campaign_deliveries
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`,
    );
    const deliveryByIdQuery = normalizeD1Query('SELECT * FROM message_campaign_deliveries WHERE id = ?');
    const projectionJobByIdQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE id = ?');
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageByIdQuery = normalizeD1Query('SELECT * FROM message_records WHERE id = ?');
    const draftByIdQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE id = ?');
    const { db, statements } = createMockD1Database({
      firstByQuerySequence: {
        [campaignByIdQuery]: [
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'sent',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: 'msg_1500_abcdef123456',
            target_count: 2,
            sent_count: 2,
            projected_count: 1,
            failed_count: 1,
            last_error: 'Firebase SET failed: 500 Internal Server Error',
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 1500,
          },
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'sent',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: 'msg_1500_abcdef123456',
            target_count: 2,
            sent_count: 2,
            projected_count: 1,
            failed_count: 1,
            last_error: 'Firebase SET failed: 500 Internal Server Error',
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 1500,
          },
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'sent',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: 'msg_1500_abcdef123456',
            target_count: 2,
            sent_count: 2,
            projected_count: 2,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 1600,
          },
          {
            id: 'camp-room-1',
            thread_id: 'broadcast_room_101',
            campaign_type: 'event_invite',
            audience: 'room',
            status: 'sent',
            title: 'Room 101 invite',
            metadata_json: '{"roomKey":"101"}',
            latest_draft_id: 'draft-room-1',
            sent_message_id: 'msg_1500_abcdef123456',
            target_count: 2,
            sent_count: 2,
            projected_count: 2,
            failed_count: 0,
            last_error: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 900,
            updated_at: 1600,
          },
        ],
        [deliveryByIdQuery]: [
          {
            id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK456',
            campaign_id: 'camp-room-1',
            target_snapshot_id: 'camp-room-1_target_room_101_BOOK456',
            delivery_status: 'projected',
            thread_id: 'broadcast_booking_BOOK456',
            draft_id: 'draft-room-1',
            message_id: 'msg_1500_cccccccccccc',
            projection_job_id: 'proj_message_msg_1500_cccccccccccc',
            attempt_count: 2,
            last_attempt_at: 1600,
            last_error: null,
            sent_at: 1500,
            projected_at: 1600,
            delivery_metadata_json: '{"matchedOccupantUids":["occ_bbb"]}',
            created_at: 1500,
            updated_at: 1600,
          },
        ],
        [projectionJobByIdQuery]: [
          {
            id: 'proj_message_msg_1500_cccccccccccc',
            thread_id: 'broadcast_booking_BOOK456',
            entity_type: 'message',
            entity_id: 'msg_1500_cccccccccccc',
            projection_target: 'firebase',
            status: 'projected',
            attempt_count: 2,
            last_attempt_at: 1600,
            last_error: null,
            created_at: 1500,
            updated_at: 1600,
          },
        ],
        [threadQuery]: [
          {
            id: 'broadcast_booking_BOOK456',
            booking_id: 'BOOK456',
            channel_type: 'broadcast',
            audience: 'booking',
            member_uids_json: '["occ_bbb"]',
            title: 'Prime booking BOOK456',
            latest_message_at: 1500,
            latest_inbound_message_at: null,
            last_staff_reply_at: 1500,
            takeover_state: 'staff_active',
            review_status: 'sent',
            suppression_reason: null,
            metadata_json: '{"channelScope":"booking_broadcast"}',
            created_at: 1500,
            updated_at: 1500,
          },
        ],
        [messageByIdQuery]: [
          {
            id: 'msg_1500_cccccccccccc',
            thread_id: 'broadcast_booking_BOOK456',
            sender_id: 'staff-1',
            sender_role: 'staff',
            sender_name: 'Reception',
            content: 'Meet in the courtyard at 8pm.',
            kind: 'promotion',
            audience: 'room',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            campaign_id: 'camp-room-1',
            draft_id: 'draft-room-1',
            deleted: 0,
            created_at: 1500,
          },
        ],
        [draftByIdQuery]: [
          {
            id: 'draft-room-1',
            thread_id: 'broadcast_room_101',
            status: 'sent',
            source: 'staff',
            content: 'Meet in the courtyard at 8pm.',
            kind: 'promotion',
            audience: 'room',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            quality_json: null,
            interpret_json: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            suppression_reason: null,
            sent_message_id: 'msg_1500_abcdef123456',
            created_at: 1000,
            updated_at: 1500,
          },
        ],
      },
      allByQuerySequence: {
        [snapshotListQuery]: [
          [
            {
              id: 'camp-room-1_target_room_101_BOOK123',
              campaign_id: 'camp-room-1',
              target_kind: 'room',
              target_key: '101:BOOK123',
              thread_id: 'broadcast_booking_BOOK123',
              booking_id: 'BOOK123',
              room_key: '101',
              guest_uuid: null,
              external_contact_key: null,
              target_metadata_json: '{"sourceAudience":"room","bookingId":"BOOK123"}',
              eligibility_context_json: '{"matchedOccupantUids":["occ_aaa"]}',
              created_at: 1500,
              updated_at: 1500,
            },
            {
              id: 'camp-room-1_target_room_101_BOOK456',
              campaign_id: 'camp-room-1',
              target_kind: 'room',
              target_key: '101:BOOK456',
              thread_id: 'broadcast_booking_BOOK456',
              booking_id: 'BOOK456',
              room_key: '101',
              guest_uuid: null,
              external_contact_key: null,
              target_metadata_json: '{"sourceAudience":"room","bookingId":"BOOK456"}',
              eligibility_context_json: '{"matchedOccupantUids":["occ_bbb"]}',
              created_at: 1500,
              updated_at: 1500,
            },
          ],
          [
            {
              id: 'camp-room-1_target_room_101_BOOK123',
              campaign_id: 'camp-room-1',
              target_kind: 'room',
              target_key: '101:BOOK123',
              thread_id: 'broadcast_booking_BOOK123',
              booking_id: 'BOOK123',
              room_key: '101',
              guest_uuid: null,
              external_contact_key: null,
              target_metadata_json: '{"sourceAudience":"room","bookingId":"BOOK123"}',
              eligibility_context_json: '{"matchedOccupantUids":["occ_aaa"]}',
              created_at: 1500,
              updated_at: 1500,
            },
            {
              id: 'camp-room-1_target_room_101_BOOK456',
              campaign_id: 'camp-room-1',
              target_kind: 'room',
              target_key: '101:BOOK456',
              thread_id: 'broadcast_booking_BOOK456',
              booking_id: 'BOOK456',
              room_key: '101',
              guest_uuid: null,
              external_contact_key: null,
              target_metadata_json: '{"sourceAudience":"room","bookingId":"BOOK456"}',
              eligibility_context_json: '{"matchedOccupantUids":["occ_bbb"]}',
              created_at: 1500,
              updated_at: 1500,
            },
          ],
        ],
        [deliveryListQuery]: [
          [
            {
              id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK123',
              campaign_id: 'camp-room-1',
              target_snapshot_id: 'camp-room-1_target_room_101_BOOK123',
              delivery_status: 'projected',
              thread_id: 'broadcast_booking_BOOK123',
              draft_id: 'draft-room-1',
              message_id: 'msg_1500_bbbbbbbbbbbb',
              projection_job_id: 'proj_message_msg_1500_bbbbbbbbbbbb',
              attempt_count: 1,
              last_attempt_at: 1500,
              last_error: null,
              sent_at: 1500,
              projected_at: 1500,
              delivery_metadata_json: '{"matchedOccupantUids":["occ_aaa"]}',
              created_at: 1500,
              updated_at: 1500,
            },
            {
              id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK456',
              campaign_id: 'camp-room-1',
              target_snapshot_id: 'camp-room-1_target_room_101_BOOK456',
              delivery_status: 'failed',
              thread_id: 'broadcast_booking_BOOK456',
              draft_id: 'draft-room-1',
              message_id: 'msg_1500_cccccccccccc',
              projection_job_id: 'proj_message_msg_1500_cccccccccccc',
              attempt_count: 1,
              last_attempt_at: 1500,
              last_error: 'Firebase SET failed: 500 Internal Server Error',
              sent_at: 1500,
              projected_at: null,
              delivery_metadata_json: '{"matchedOccupantUids":["occ_bbb"]}',
              created_at: 1500,
              updated_at: 1500,
            },
          ],
          [
            {
              id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK123',
              campaign_id: 'camp-room-1',
              target_snapshot_id: 'camp-room-1_target_room_101_BOOK123',
              delivery_status: 'projected',
              thread_id: 'broadcast_booking_BOOK123',
              draft_id: 'draft-room-1',
              message_id: 'msg_1500_bbbbbbbbbbbb',
              projection_job_id: 'proj_message_msg_1500_bbbbbbbbbbbb',
              attempt_count: 1,
              last_attempt_at: 1500,
              last_error: null,
              sent_at: 1500,
              projected_at: 1500,
              delivery_metadata_json: '{"matchedOccupantUids":["occ_aaa"]}',
              created_at: 1500,
              updated_at: 1500,
            },
            {
              id: 'camp-room-1_delivery_camp-room-1_target_room_101_BOOK456',
              campaign_id: 'camp-room-1',
              target_snapshot_id: 'camp-room-1_target_room_101_BOOK456',
              delivery_status: 'projected',
              thread_id: 'broadcast_booking_BOOK456',
              draft_id: 'draft-room-1',
              message_id: 'msg_1500_cccccccccccc',
              projection_job_id: 'proj_message_msg_1500_cccccccccccc',
              attempt_count: 2,
              last_attempt_at: 1600,
              last_error: null,
              sent_at: 1500,
              projected_at: 1600,
              delivery_metadata_json: '{"matchedOccupantUids":["occ_bbb"]}',
              created_at: 1500,
              updated_at: 1600,
            },
          ],
        ],
      },
    });

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : String(input);

      if (url.includes('/messaging/channels/broadcast_booking_BOOK456/meta.json') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify({
          channelType: 'broadcast',
          bookingId: 'BOOK456',
          audience: 'booking',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/messaging/channels/broadcast_booking_BOOK456/meta.json') && init?.method === 'PATCH') {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/messaging/channels/broadcast_booking_BOOK456/messages/msg_1500_cccccccccccc.json') && init?.method === 'PUT') {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
    });

    const response = await replayReviewCampaignDelivery(
      createPagesContext({
        url: 'https://prime.example.com/api/review-campaign-replay?campaignId=camp-room-1&deliveryId=camp-room-1_delivery_camp-room-1_target_room_101_BOOK456',
        method: 'POST',
        headers: {
          'x-prime-access-token': 'prime-access',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        campaign: {
          deliverySummary: { projected: number; failed: number; replayableCount: number };
        };
        deliveryId: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.deliveryId).toBe('camp-room-1_delivery_camp-room-1_target_room_101_BOOK456');
    expect(payload.data.campaign.deliverySummary).toEqual(expect.objectContaining({
      projected: 2,
      failed: 0,
      replayableCount: 0,
    }));
    expect(statements.some((statement) =>
      statement.query.includes('UPDATE message_projection_jobs')
      && statement.binds[0] === 'projected'
      && statement.binds[5] === 'proj_message_msg_1500_cccccccccccc')).toBe(true);
  });

  it('TC-03C: draft save route updates the active staff draft and returns refreshed detail', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftThreadQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const draftByIdQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE id = ?');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const { db, statements } = createMockD1Database({
      firstByQuery: {
        [threadQuery]: {
          id: 'dm_occ_aaa_occ_bbb',
          booking_id: 'BOOK123',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_aaa","occ_bbb"]',
          title: null,
          latest_message_at: 1000,
          latest_inbound_message_at: 1000,
          last_staff_reply_at: null,
          takeover_state: 'automated',
          review_status: 'pending',
          suppression_reason: null,
          metadata_json: '{"shadowWriteTransport":"firebase"}',
          created_at: 900,
          updated_at: 1000,
        },
        [draftByIdQuery]: {
          id: 'draft-1',
          thread_id: 'dm_occ_aaa_occ_bbb',
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
          created_at: 1100,
          updated_at: 1200,
        },
      },
      allByQuery: {
        [messageQuery]: [],
        [draftThreadQuery]: [
          {
            id: 'draft-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
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
            created_at: 1100,
            updated_at: 1200,
          },
        ],
        [admissionQuery]: [],
        [projectionQuery]: [],
      },
    });

    const response = await saveReviewThreadDraft(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread-draft?threadId=dm_occ_aaa_occ_bbb',
        method: 'PUT',
        body: {
          plainText: 'Updated staff reply',
        },
        headers: {
          'x-prime-access-token': 'prime-access',
          'x-prime-actor-uid': 'staff-1',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        detail: {
          currentDraft: null | { id: string; status: string; content: string };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.detail.currentDraft).toEqual(expect.objectContaining({
      id: 'draft-1',
      status: 'under_review',
      content: 'Updated staff reply',
      source: 'staff',
      kind: 'draft',
      audience: 'thread',
      createdByUid: 'staff-1',
      reviewerUid: 'staff-1',
    }));
    expect(
      statements.some((statement) =>
        statement.query.includes('UPDATE message_drafts')
        && statement.binds[0] === 'under_review'
        && statement.binds[1] === 'Updated staff reply'
        && statement.binds[9] === 'staff-1'
        && statement.binds[10] === 'staff-1'
        && statement.binds[14] === 'draft-1'),
    ).toBe(true);
  });

  it('TC-03D: whole-hostel draft save reopens the shared lane and creates canonical campaign state', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const latestCampaignQuery = normalizeD1Query(
      `SELECT * FROM message_campaigns
       WHERE thread_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC
       LIMIT 1`
    );
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftThreadQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const campaignQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC');
    const { db, statements } = createMockD1Database({
      firstByQuerySequence: {
        [threadQuery]: [
          {
            id: 'broadcast_whole_hostel',
            booking_id: 'HOSTEL',
            channel_type: 'broadcast',
            audience: 'whole_hostel',
            member_uids_json: null,
            title: null,
            latest_message_at: 1000,
            latest_inbound_message_at: null,
            last_staff_reply_at: 1000,
            takeover_state: 'staff_active',
            review_status: 'sent',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1000,
          },
          {
            id: 'broadcast_whole_hostel',
            booking_id: 'HOSTEL',
            channel_type: 'broadcast',
            audience: 'whole_hostel',
            member_uids_json: null,
            title: null,
            latest_message_at: 1000,
            latest_inbound_message_at: null,
            last_staff_reply_at: 1000,
            takeover_state: 'staff_active',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1500,
          },
        ],
        [latestCampaignQuery]: [null],
      },
      allByQuerySequence: {
        [messageQuery]: [[], []],
        [draftThreadQuery]: [
          [],
          [
            {
              id: 'draft_1500_abcdef123456',
              thread_id: 'broadcast_whole_hostel',
              status: 'under_review',
              source: 'staff',
              content: 'Tonight in the courtyard at 8pm.',
              kind: 'draft',
              audience: 'whole_hostel',
              links_json: null,
              attachments_json: null,
              cards_json: null,
              quality_json: null,
              interpret_json: null,
              created_by_uid: 'staff-1',
              reviewer_uid: 'staff-1',
              suppression_reason: null,
              sent_message_id: null,
              created_at: 1500,
              updated_at: 1500,
            },
          ],
        ],
        [admissionQuery]: [
          [],
          [
            {
              id: 10,
              thread_id: 'broadcast_whole_hostel',
              draft_id: 'draft_1500_abcdef123456',
              decision: 'draft_created',
              reason: 'staff_manual_draft',
              source: 'staff_review',
              classifier_version: null,
              source_metadata_json: '{"actorUid":"staff-1","draftSource":"staff"}',
              created_at: 1500,
            },
          ],
        ],
        [projectionQuery]: [[], []],
        [campaignQuery]: [
          [],
          [
            {
              id: 'camp_1500_abcdef123456',
              thread_id: 'broadcast_whole_hostel',
              campaign_type: 'broadcast',
              audience: 'whole_hostel',
              status: 'under_review',
              title: 'Whole-hostel broadcast',
              metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread","audience":"whole_hostel"}',
              latest_draft_id: 'draft_1500_abcdef123456',
              sent_message_id: null,
              created_by_uid: 'staff-1',
              reviewer_uid: 'staff-1',
              created_at: 1500,
              updated_at: 1500,
            },
          ],
        ],
      },
    });

    jest.spyOn(Date, 'now').mockReturnValue(1500);
    jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('abcdef123456abcdef123456abcdef12');

    const response = await saveReviewThreadDraft(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread-draft?threadId=broadcast_whole_hostel',
        method: 'PUT',
        body: {
          plainText: 'Tonight in the courtyard at 8pm.',
        },
        headers: {
          'x-prime-access-token': 'prime-access',
          'x-prime-actor-uid': 'staff-1',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        detail: {
          thread: { reviewStatus: string };
          currentDraft: null | { id: string; status: string; content: string };
          currentCampaign: null | { id: string; status: string; latestDraftId: string | null };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.detail.thread.reviewStatus).toBe('pending');
    expect(payload.data.detail.currentDraft).toEqual(expect.objectContaining({
      id: 'draft_1500_abcdef123456',
      status: 'under_review',
      content: 'Tonight in the courtyard at 8pm.',
      source: 'staff',
      kind: 'draft',
      audience: 'whole_hostel',
      createdByUid: 'staff-1',
      reviewerUid: 'staff-1',
    }));
    expect(payload.data.detail.currentCampaign).toEqual(expect.objectContaining({
      id: 'camp_1500_abcdef123456',
      status: 'under_review',
      latestDraftId: 'draft_1500_abcdef123456',
      audience: 'whole_hostel',
      threadId: 'broadcast_whole_hostel',
      type: 'broadcast',
      metadata: {
        audience: 'whole_hostel',
        deliveryModel: 'shared_whole_hostel_broadcast_thread',
      },
      targetSummary: {
        total: 0,
        byKind: [],
      },
      deliverySummary: {
        total: 0,
        pending: 0,
        ready: 0,
        sent: 0,
        projected: 0,
        failed: 0,
        cancelled: 0,
        replayableCount: 0,
        lastError: null,
      },
      targets: [],
      deliveries: [],
    }));
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_campaigns')
      && statement.binds[0] === 'camp_1500_abcdef123456'
      && statement.binds[3] === 'whole_hostel'
      && statement.binds[4] === 'under_review')).toBe(true);
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_threads')
      && statement.query.includes('ON CONFLICT(id) DO UPDATE SET')
      && statement.binds[10] === 'pending')).toBe(true);
  });

  it('TC-04: resolve route updates review status and records a resolved admission', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const { db, statements } = createMockD1Database({
      firstByQuery: {
        [threadQuery]: {
          id: 'dm_occ_aaa_occ_bbb',
          booking_id: 'BOOK123',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_aaa","occ_bbb"]',
          title: null,
          latest_message_at: 1000,
          latest_inbound_message_at: 1000,
          last_staff_reply_at: null,
          takeover_state: 'automated',
          review_status: 'pending',
          suppression_reason: null,
          metadata_json: '{"shadowWriteTransport":"firebase"}',
          created_at: 900,
          updated_at: 1100,
        },
      },
      allByQuery: {
        [messageQuery]: [],
        [draftQuery]: [],
        [admissionQuery]: [
          {
            id: 2,
            thread_id: 'dm_occ_aaa_occ_bbb',
            draft_id: null,
            decision: 'queued',
            reason: null,
            source: 'guest_direct_message',
            classifier_version: null,
            source_metadata_json: '{"messageId":"msg-inbound"}',
            created_at: 1100,
          },
        ],
        [projectionQuery]: [],
      },
    });

    const response = await resolveReviewThread(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread-resolve?threadId=dm_occ_aaa_occ_bbb',
        method: 'POST',
        headers: {
          'x-prime-access-token': 'prime-access',
          'x-prime-actor-uid': 'staff-1',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: { thread: { reviewStatus: string } };
    };

    expect(response.status).toBe(200);
    expect(payload.data.thread.reviewStatus).toBe('resolved');
    expect(statements.some((statement) => statement.query.includes('UPDATE message_threads'))).toBe(true);
    expect(statements.some((statement) => statement.query.includes('INSERT INTO message_admissions'))).toBe(true);
  });

  it('TC-04B: whole-hostel resolve also marks the current campaign resolved', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const latestCampaignQuery = normalizeD1Query(
      `SELECT * FROM message_campaigns
       WHERE thread_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC
       LIMIT 1`
    );
    const campaignByIdQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const campaignQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC');
    const { db, statements } = createMockD1Database({
      firstByQuerySequence: {
        [threadQuery]: [
          {
            id: 'broadcast_whole_hostel',
            booking_id: 'HOSTEL',
            channel_type: 'broadcast',
            audience: 'whole_hostel',
            member_uids_json: null,
            title: null,
            latest_message_at: 1400,
            latest_inbound_message_at: null,
            last_staff_reply_at: 1400,
            takeover_state: 'staff_active',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1400,
          },
          {
            id: 'broadcast_whole_hostel',
            booking_id: 'HOSTEL',
            channel_type: 'broadcast',
            audience: 'whole_hostel',
            member_uids_json: null,
            title: null,
            latest_message_at: 1400,
            latest_inbound_message_at: null,
            last_staff_reply_at: 1400,
            takeover_state: 'staff_active',
            review_status: 'resolved',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1500,
          },
        ],
        [latestCampaignQuery]: [
          {
            id: 'camp-1',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'under_review',
            title: 'Whole-hostel broadcast',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread","audience":"whole_hostel"}',
            latest_draft_id: 'draft-1',
            sent_message_id: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 1300,
            updated_at: 1400,
          },
        ],
        [campaignByIdQuery]: [
          {
            id: 'camp-1',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'resolved',
            title: 'Whole-hostel broadcast',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread","audience":"whole_hostel"}',
            latest_draft_id: 'draft-1',
            sent_message_id: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 1300,
            updated_at: 1500,
          },
        ],
      },
      allByQuery: {
        [messageQuery]: [],
        [draftQuery]: [],
        [admissionQuery]: [
          {
            id: 20,
            thread_id: 'broadcast_whole_hostel',
            draft_id: null,
            decision: 'resolved',
            reason: 'staff_resolved',
            source: 'staff_review',
            classifier_version: null,
            source_metadata_json: '{"actorUid":"staff-1"}',
            created_at: 1500,
          },
        ],
        [projectionQuery]: [],
        [campaignQuery]: [
          {
            id: 'camp-1',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'resolved',
            title: 'Whole-hostel broadcast',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread","audience":"whole_hostel"}',
            latest_draft_id: 'draft-1',
            sent_message_id: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 1300,
            updated_at: 1500,
          },
        ],
      },
    });

    const response = await resolveReviewThread(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread-resolve?threadId=broadcast_whole_hostel',
        method: 'POST',
        headers: {
          'x-prime-access-token': 'prime-access',
          'x-prime-actor-uid': 'staff-1',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: { thread: { reviewStatus: string } };
    };

    expect(response.status).toBe(200);
    expect(payload.data.thread.reviewStatus).toBe('resolved');
    expect(statements.some((statement) =>
      statement.query.includes('UPDATE message_campaigns')
      && statement.binds[0] === 'resolved'
      && statement.binds[13] === 'camp-1')).toBe(true);
  });

  it('TC-05: dismiss route rejects already archived threads with 409', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const { db } = createMockD1Database({
      firstByQuery: {
        [threadQuery]: {
          id: 'dm_occ_aaa_occ_bbb',
          booking_id: 'BOOK123',
          channel_type: 'direct',
          audience: 'thread',
          member_uids_json: '["occ_aaa","occ_bbb"]',
          title: null,
          latest_message_at: 1000,
          latest_inbound_message_at: 1000,
          last_staff_reply_at: null,
          takeover_state: 'automated',
          review_status: 'auto_archived',
          suppression_reason: null,
          metadata_json: '{"shadowWriteTransport":"firebase"}',
          created_at: 900,
          updated_at: 1000,
        },
      },
    });

    const response = await dismissReviewThread(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread-dismiss?threadId=dm_occ_aaa_occ_bbb',
        method: 'POST',
        headers: {
          'x-prime-access-token': 'prime-access',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );

    expect(response.status).toBe(409);
  });

  it('TC-06: send route projects a direct-thread reply and records canonical send state', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftThreadQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const draftByIdQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE id = ?');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const { db, statements } = createMockD1Database({
      firstByQuerySequence: {
        [threadQuery]: [
          {
            id: 'dm_occ_aaa_occ_bbb',
            booking_id: 'BOOK123',
            channel_type: 'direct',
            audience: 'thread',
            member_uids_json: '["occ_aaa","occ_bbb"]',
            title: null,
            latest_message_at: 1000,
            latest_inbound_message_at: 1000,
            last_staff_reply_at: null,
            takeover_state: 'automated',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1000,
          },
          {
            id: 'dm_occ_aaa_occ_bbb',
            booking_id: 'BOOK123',
            channel_type: 'direct',
            audience: 'thread',
            member_uids_json: '["occ_aaa","occ_bbb"]',
            title: null,
            latest_message_at: 1300,
            latest_inbound_message_at: 1000,
            last_staff_reply_at: 1300,
            takeover_state: 'staff_active',
            review_status: 'sent',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1300,
          },
        ],
        [draftByIdQuery]: [
          {
            id: 'draft-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            status: 'sent',
            source: 'staff',
            content: 'Prime support reply',
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
            sent_message_id: 'msg_1300_abcdef123456',
            created_at: 1100,
            updated_at: 1300,
          },
        ],
      },
      allByQuerySequence: {
        [messageQuery]: [
          [
            {
              id: 'msg-inbound',
              thread_id: 'dm_occ_aaa_occ_bbb',
              sender_id: 'occ_aaa',
              sender_role: 'guest',
              sender_name: 'Jane',
              content: 'Hello from Prime',
              kind: 'support',
              audience: 'thread',
              links_json: null,
              attachments_json: null,
              cards_json: null,
              campaign_id: null,
              draft_id: null,
              deleted: 0,
              created_at: 1000,
            },
          ],
          [
            {
              id: 'msg-inbound',
              thread_id: 'dm_occ_aaa_occ_bbb',
              sender_id: 'occ_aaa',
              sender_role: 'guest',
              sender_name: 'Jane',
              content: 'Hello from Prime',
              kind: 'support',
              audience: 'thread',
              links_json: null,
              attachments_json: null,
              cards_json: null,
              campaign_id: null,
              draft_id: null,
              deleted: 0,
              created_at: 1000,
            },
            {
              id: 'msg_1300_abcdef123456',
              thread_id: 'dm_occ_aaa_occ_bbb',
              sender_id: 'staff-1',
              sender_role: 'staff',
              sender_name: 'Reception',
              content: 'Prime support reply',
              kind: 'support',
              audience: 'thread',
              links_json: null,
              attachments_json: null,
              cards_json: null,
              campaign_id: null,
              draft_id: 'draft-1',
              deleted: 0,
              created_at: 1300,
            },
          ],
        ],
        [draftThreadQuery]: [
          [
            {
              id: 'draft-1',
              thread_id: 'dm_occ_aaa_occ_bbb',
              status: 'under_review',
              source: 'staff',
              content: 'Prime support reply',
              kind: 'draft',
              audience: 'thread',
              links_json: null,
              attachments_json: null,
              cards_json: null,
              quality_json: null,
              interpret_json: null,
              created_by_uid: 'staff-1',
              reviewer_uid: null,
              suppression_reason: null,
              sent_message_id: null,
              created_at: 1100,
              updated_at: 1200,
            },
          ],
          [
            {
              id: 'draft-1',
              thread_id: 'dm_occ_aaa_occ_bbb',
              status: 'sent',
              source: 'staff',
              content: 'Prime support reply',
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
              sent_message_id: 'msg_1300_abcdef123456',
              created_at: 1100,
              updated_at: 1300,
            },
          ],
        ],
        [admissionQuery]: [
          [
            {
              id: 1,
              thread_id: 'dm_occ_aaa_occ_bbb',
              draft_id: null,
              decision: 'queued',
              reason: null,
              source: 'guest_direct_message',
              classifier_version: null,
              source_metadata_json: '{"messageId":"msg-inbound"}',
              created_at: 1000,
            },
          ],
          [
            {
              id: 2,
              thread_id: 'dm_occ_aaa_occ_bbb',
              draft_id: 'draft-1',
              decision: 'sent',
              reason: 'staff_direct_send',
              source: 'staff_review',
              classifier_version: null,
              source_metadata_json: '{"actorUid":"staff-1","actorSource":"reception_proxy","messageId":"msg_1300_abcdef123456","projectionTarget":"firebase"}',
              created_at: 1300,
            },
          ],
        ],
        [projectionQuery]: [
          [],
          [
            {
              id: 'proj_message_msg_1300_abcdef123456',
              thread_id: 'dm_occ_aaa_occ_bbb',
              entity_type: 'message',
              entity_id: 'msg_1300_abcdef123456',
              projection_target: 'firebase',
              status: 'projected',
              attempt_count: 1,
              last_attempt_at: 1300,
              last_error: null,
              created_at: 1300,
              updated_at: 1300,
            },
          ],
        ],
      },
    });

    jest.spyOn(Date, 'now').mockReturnValue(1300);
    jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('abcdef123456abcdef123456abcdef12');
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : String(input);

      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/meta.json')
        && (!init?.method || init.method === 'GET')
      ) {
        return new Response(JSON.stringify({
          bookingId: 'BOOK123',
          channelType: 'direct',
          memberUids: {
            occ_aaa: true,
            occ_bbb: true,
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/meta.json')
        && init?.method === 'PATCH'
      ) {
        return new Response(JSON.stringify({ updatedAt: 1300 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/messages/msg_1300_abcdef123456.json')
        && init?.method === 'PUT'
      ) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
    });

    const response = await sendReviewThread(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread-send?threadId=dm_occ_aaa_occ_bbb',
        method: 'POST',
        headers: {
          'x-prime-access-token': 'prime-access',
          'x-prime-actor-uid': 'staff-1',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        thread: { reviewStatus: string };
        draft: { status: string; reviewerUid: string | null };
        sentMessageId: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.thread.reviewStatus).toBe('sent');
    expect(payload.data.draft.status).toBe('sent');
    expect(payload.data.draft.reviewerUid).toBe('staff-1');
    expect(payload.data.sentMessageId).toBe('msg_1300_abcdef123456');
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_records')
      && statement.binds[0] === 'msg_1300_abcdef123456'
      && statement.binds[3] === 'staff'
      && statement.binds[12] === 'draft-1')).toBe(true);
    expect(statements.some((statement) =>
      statement.query.includes('UPDATE message_drafts')
      && statement.binds[0] === 'sent'
      && statement.binds[12] === 'msg_1300_abcdef123456')).toBe(true);
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_projection_jobs')
      && statement.binds[3] === 'msg_1300_abcdef123456'
      && statement.binds[5] === 'projected')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('TC-06B: send route projects a broadcast-thread reply and records canonical send state', async () => {
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const latestCampaignQuery = normalizeD1Query(
      `SELECT * FROM message_campaigns
       WHERE thread_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC
       LIMIT 1`
    );
    const campaignByIdQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE id = ?');
    const messageQuery = normalizeD1Query('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const draftThreadQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC');
    const draftByIdQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE id = ?');
    const admissionQuery = normalizeD1Query('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC');
    const projectionQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC');
    const campaignQuery = normalizeD1Query('SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC');
    const { db, statements } = createMockD1Database({
      firstByQuerySequence: {
        [threadQuery]: [
          {
            id: 'broadcast_whole_hostel',
            booking_id: 'BOOK123',
            channel_type: 'broadcast',
            audience: 'whole_hostel',
            member_uids_json: null,
            title: 'Whole hostel updates',
            latest_message_at: 1200,
            latest_inbound_message_at: null,
            last_staff_reply_at: null,
            takeover_state: 'automated',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{"source":"campaign_review"}',
            created_at: 900,
            updated_at: 1200,
          },
          {
            id: 'broadcast_whole_hostel',
            booking_id: 'BOOK123',
            channel_type: 'broadcast',
            audience: 'whole_hostel',
            member_uids_json: null,
            title: 'Whole hostel updates',
            latest_message_at: 1300,
            latest_inbound_message_at: null,
            last_staff_reply_at: 1300,
            takeover_state: 'staff_active',
            review_status: 'sent',
            suppression_reason: null,
            metadata_json: '{"source":"campaign_review"}',
            created_at: 900,
            updated_at: 1300,
          },
        ],
        [latestCampaignQuery]: [
          {
            id: 'camp-2',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'under_review',
            title: 'Whole hostel updates',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread","audience":"whole_hostel"}',
            latest_draft_id: 'draft-2',
            sent_message_id: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 1100,
            updated_at: 1200,
          },
        ],
        [campaignByIdQuery]: [
          {
            id: 'camp-2',
            thread_id: 'broadcast_whole_hostel',
            campaign_type: 'broadcast',
            audience: 'whole_hostel',
            status: 'sent',
            title: 'Whole hostel updates',
            metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread","audience":"whole_hostel"}',
            latest_draft_id: 'draft-2',
            sent_message_id: 'msg_1300_abcdef123456',
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            created_at: 1100,
            updated_at: 1300,
          },
        ],
        [draftByIdQuery]: [
          {
            id: 'draft-2',
            thread_id: 'broadcast_whole_hostel',
            status: 'sent',
            source: 'staff',
            content: 'Tonight: sunset drinks on the terrace.',
            kind: 'draft',
            audience: 'whole_hostel',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            quality_json: null,
            interpret_json: null,
            created_by_uid: 'staff-1',
            reviewer_uid: 'staff-1',
            suppression_reason: null,
            sent_message_id: 'msg_1300_abcdef123456',
            created_at: 1100,
            updated_at: 1300,
          },
        ],
      },
      allByQuerySequence: {
        [messageQuery]: [
          [],
          [
            {
              id: 'msg_1300_abcdef123456',
              thread_id: 'broadcast_whole_hostel',
              sender_id: 'staff-1',
              sender_role: 'staff',
              sender_name: 'Reception',
              content: 'Tonight: sunset drinks on the terrace.',
              kind: 'promotion',
              audience: 'whole_hostel',
              links_json: null,
              attachments_json: null,
              cards_json: null,
              campaign_id: 'camp-2',
              draft_id: 'draft-2',
              deleted: 0,
              created_at: 1300,
            },
          ],
        ],
        [draftThreadQuery]: [
          [
            {
              id: 'draft-2',
              thread_id: 'broadcast_whole_hostel',
              status: 'under_review',
              source: 'staff',
              content: 'Tonight: sunset drinks on the terrace.',
              kind: 'draft',
              audience: 'whole_hostel',
              links_json: null,
              attachments_json: null,
              cards_json: null,
              quality_json: null,
              interpret_json: null,
              created_by_uid: 'staff-1',
              reviewer_uid: null,
              suppression_reason: null,
              sent_message_id: null,
              created_at: 1100,
              updated_at: 1200,
            },
          ],
          [
            {
              id: 'draft-2',
              thread_id: 'broadcast_whole_hostel',
              status: 'sent',
              source: 'staff',
              content: 'Tonight: sunset drinks on the terrace.',
              kind: 'draft',
              audience: 'whole_hostel',
              links_json: null,
              attachments_json: null,
              cards_json: null,
              quality_json: null,
              interpret_json: null,
              created_by_uid: 'staff-1',
              reviewer_uid: 'staff-1',
              suppression_reason: null,
              sent_message_id: 'msg_1300_abcdef123456',
              created_at: 1100,
              updated_at: 1300,
            },
          ],
        ],
        [admissionQuery]: [
          [],
          [
            {
              id: 5,
              thread_id: 'broadcast_whole_hostel',
              draft_id: 'draft-2',
              decision: 'sent',
              reason: 'staff_broadcast_send',
              source: 'staff_review',
              classifier_version: null,
              source_metadata_json: '{"actorUid":"staff-1","actorSource":"reception_proxy","messageId":"msg_1300_abcdef123456","projectionTarget":"firebase"}',
              created_at: 1300,
            },
          ],
        ],
        [projectionQuery]: [
          [],
          [
            {
              id: 'proj_message_msg_1300_abcdef123456',
              thread_id: 'broadcast_whole_hostel',
              entity_type: 'message',
              entity_id: 'msg_1300_abcdef123456',
              projection_target: 'firebase',
              status: 'projected',
              attempt_count: 1,
              last_attempt_at: 1300,
              last_error: null,
              created_at: 1300,
              updated_at: 1300,
            },
          ],
        ],
        [campaignQuery]: [
          [
            {
              id: 'camp-2',
              thread_id: 'broadcast_whole_hostel',
              campaign_type: 'broadcast',
              audience: 'whole_hostel',
              status: 'sent',
              title: 'Whole hostel updates',
              metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread","audience":"whole_hostel"}',
              latest_draft_id: 'draft-2',
              sent_message_id: 'msg_1300_abcdef123456',
              created_by_uid: 'staff-1',
              reviewer_uid: 'staff-1',
              created_at: 1100,
              updated_at: 1300,
            },
          ],
          [
            {
              id: 'camp-2',
              thread_id: 'broadcast_whole_hostel',
              campaign_type: 'broadcast',
              audience: 'whole_hostel',
              status: 'sent',
              title: 'Whole hostel updates',
              metadata_json: '{"deliveryModel":"shared_whole_hostel_broadcast_thread","audience":"whole_hostel"}',
              latest_draft_id: 'draft-2',
              sent_message_id: 'msg_1300_abcdef123456',
              created_by_uid: 'staff-1',
              reviewer_uid: 'staff-1',
              created_at: 1100,
              updated_at: 1300,
            },
          ],
        ],
      },
    });

    jest.spyOn(Date, 'now').mockReturnValue(1300);
    jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('abcdef123456abcdef123456abcdef12');
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : String(input);

      if (
        url.includes('/messaging/channels/broadcast_whole_hostel/meta.json')
        && (!init?.method || init.method === 'GET')
      ) {
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (
        url.includes('/messaging/channels/broadcast_whole_hostel/meta.json')
        && init?.method === 'PUT'
      ) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (
        url.includes('/messaging/channels/broadcast_whole_hostel/messages/msg_1300_abcdef123456.json')
        && init?.method === 'PUT'
      ) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
    });

    const response = await sendReviewThread(
      createPagesContext({
        url: 'https://prime.example.com/api/review-thread-send?threadId=broadcast_whole_hostel',
        method: 'POST',
        headers: {
          'x-prime-access-token': 'prime-access',
          'x-prime-actor-uid': 'staff-1',
        },
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
          PRIME_MESSAGING_DB: db,
        }),
      }),
    );
    const payload = await response.json() as {
      success: boolean;
      data: {
        thread: { channel: string; reviewStatus: string };
        draft: { status: string; reviewerUid: string | null };
        campaign: null | { id: string; status: string; sentMessageId: string | null };
        sentMessageId: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.thread.channel).toBe('prime_broadcast');
    expect(payload.data.thread.reviewStatus).toBe('sent');
    expect(payload.data.draft.status).toBe('sent');
    expect(payload.data.draft.reviewerUid).toBe('staff-1');
    expect(payload.data.campaign).toEqual(expect.objectContaining({
      id: 'camp-2',
      status: 'sent',
      sentMessageId: 'msg_1300_abcdef123456',
      targetCount: 1,
      projectedCount: 1,
    }));
    expect(payload.data.sentMessageId).toBe('msg_1300_abcdef123456');
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_records')
      && statement.binds[0] === 'msg_1300_abcdef123456'
      && statement.binds[6] === 'promotion'
      && statement.binds[7] === 'whole_hostel'
      && statement.binds[11] === 'camp-2')).toBe(true);
    expect(statements.some((statement) =>
      statement.query.includes('UPDATE message_campaigns')
      && statement.binds[0] === 'sent'
      && statement.binds[4] === 'msg_1300_abcdef123456'
      && statement.binds[13] === 'camp-2')).toBe(true);
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_admissions')
      && statement.binds[3] === 'staff_broadcast_send')).toBe(true);
    expect(statements.some((statement) =>
      statement.query.includes('INSERT INTO message_projection_jobs')
      && statement.binds[3] === 'msg_1300_abcdef123456'
      && statement.binds[5] === 'projected')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('TC-07: replay route reprojects a failed direct-thread message job and marks it projected', async () => {
    const jobQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE id = ?');
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageByIdQuery = normalizeD1Query('SELECT * FROM message_records WHERE id = ?');
    const draftByIdQuery = normalizeD1Query('SELECT * FROM message_drafts WHERE id = ?');
    const { db, statements } = createMockD1Database({
      firstByQuerySequence: {
        [jobQuery]: [
          {
            id: 'proj_message_msg-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            entity_type: 'message',
            entity_id: 'msg-1',
            projection_target: 'firebase',
            status: 'failed',
            attempt_count: 1,
            last_attempt_at: 1200,
            last_error: 'Firebase SET failed: 500 Internal Server Error',
            created_at: 1100,
            updated_at: 1200,
          },
          {
            id: 'proj_message_msg-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            entity_type: 'message',
            entity_id: 'msg-1',
            projection_target: 'firebase',
            status: 'projected',
            attempt_count: 2,
            last_attempt_at: 1300,
            last_error: null,
            created_at: 1100,
            updated_at: 1300,
          },
        ],
        [threadQuery]: [
          {
            id: 'dm_occ_aaa_occ_bbb',
            booking_id: 'BOOK123',
            channel_type: 'direct',
            audience: 'thread',
            member_uids_json: '["occ_aaa","occ_bbb"]',
            title: null,
            latest_message_at: 1250,
            latest_inbound_message_at: 1000,
            last_staff_reply_at: 1250,
            takeover_state: 'staff_active',
            review_status: 'sent',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1250,
          },
        ],
        [messageByIdQuery]: [
          {
            id: 'msg-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            sender_id: 'staff-1',
            sender_role: 'staff',
            sender_name: 'Reception',
            content: 'Prime support reply',
            kind: 'support',
            audience: 'thread',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            campaign_id: null,
            draft_id: 'draft-1',
            deleted: 0,
            created_at: 1250,
          },
        ],
        [draftByIdQuery]: [
          {
            id: 'draft-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            status: 'sent',
            source: 'staff',
            content: 'Prime support reply',
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
            sent_message_id: 'msg-1',
            created_at: 1100,
            updated_at: 1250,
          },
        ],
      },
    });

    jest.spyOn(Date, 'now').mockReturnValue(1300);
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : String(input);

      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/meta.json')
        && (!init?.method || init.method === 'GET')
      ) {
        return new Response(JSON.stringify({
          bookingId: 'BOOK123',
          channelType: 'direct',
          memberUids: {
            occ_aaa: true,
            occ_bbb: true,
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/meta.json')
        && init?.method === 'PATCH'
      ) {
        return new Response(JSON.stringify({ updatedAt: 1300 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/messages/msg-1.json')
        && init?.method === 'PUT'
      ) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
    });

    const originalConsoleError = console.error;
    const consoleErrorStub = jest.fn();
    Object.defineProperty(console, 'error', {
      configurable: true,
      value: consoleErrorStub,
    });

    try {
      const response = await replayProjectionJob(
        createPagesContext({
          url: 'https://prime.example.com/api/review-projection-replay?jobId=proj_message_msg-1',
          method: 'POST',
          headers: {
            'x-prime-access-token': 'prime-access',
          },
          env: createMockEnv({
            NODE_ENV: 'production',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
            PRIME_MESSAGING_DB: db,
          }),
        }),
      );
      const payload = await response.json() as {
        success: boolean;
        data: {
          job: { status: string; attempt_count: number; last_attempt_at: number | null };
        };
      };

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data.job.status).toBe('projected');
      expect(payload.data.job.attempt_count).toBe(2);
      expect(payload.data.job.last_attempt_at).toBe(1300);
      expect(statements.some((statement) =>
        statement.query.includes('UPDATE message_projection_jobs')
        && statement.binds[0] === 'projected'
        && statement.binds[1] === 2
        && statement.binds[5] === 'proj_message_msg-1')).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      Object.defineProperty(console, 'error', {
        configurable: true,
        value: originalConsoleError,
      });
    }
  });

  it('TC-08: replay route marks the projection job failed again when Firebase projection throws', async () => {
    const jobQuery = normalizeD1Query('SELECT * FROM message_projection_jobs WHERE id = ?');
    const threadQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const messageByIdQuery = normalizeD1Query('SELECT * FROM message_records WHERE id = ?');
    const { db, statements } = createMockD1Database({
      firstByQuerySequence: {
        [jobQuery]: [
          {
            id: 'proj_message_msg-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            entity_type: 'message',
            entity_id: 'msg-1',
            projection_target: 'firebase',
            status: 'pending',
            attempt_count: 0,
            last_attempt_at: null,
            last_error: null,
            created_at: 1100,
            updated_at: 1100,
          },
          {
            id: 'proj_message_msg-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            entity_type: 'message',
            entity_id: 'msg-1',
            projection_target: 'firebase',
            status: 'failed',
            attempt_count: 1,
            last_attempt_at: 1300,
            last_error: 'Firebase SET failed: 500 Internal Server Error',
            created_at: 1100,
            updated_at: 1300,
          },
        ],
        [threadQuery]: [
          {
            id: 'dm_occ_aaa_occ_bbb',
            booking_id: 'BOOK123',
            channel_type: 'direct',
            audience: 'thread',
            member_uids_json: '["occ_aaa","occ_bbb"]',
            title: null,
            latest_message_at: 1250,
            latest_inbound_message_at: 1000,
            last_staff_reply_at: 1250,
            takeover_state: 'staff_active',
            review_status: 'sent',
            suppression_reason: null,
            metadata_json: '{"shadowWriteTransport":"firebase"}',
            created_at: 900,
            updated_at: 1250,
          },
        ],
        [messageByIdQuery]: [
          {
            id: 'msg-1',
            thread_id: 'dm_occ_aaa_occ_bbb',
            sender_id: 'occ_aaa',
            sender_role: 'guest',
            sender_name: 'Jane',
            content: 'Hello from Prime',
            kind: 'support',
            audience: 'thread',
            links_json: null,
            attachments_json: null,
            cards_json: null,
            campaign_id: null,
            draft_id: null,
            deleted: 0,
            created_at: 1000,
          },
        ],
      },
    });

    jest.spyOn(Date, 'now').mockReturnValue(1300);
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : String(input);

      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/meta.json')
        && (!init?.method || init.method === 'GET')
      ) {
        return new Response(JSON.stringify({
          bookingId: 'BOOK123',
          channelType: 'direct',
          memberUids: {
            occ_aaa: true,
            occ_bbb: true,
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/meta.json')
        && init?.method === 'PATCH'
      ) {
        return new Response(JSON.stringify({ updatedAt: 1300 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (
        url.includes('/messaging/channels/dm_occ_aaa_occ_bbb/messages/msg-1.json')
        && init?.method === 'PUT'
      ) {
        return new Response('boom', { status: 500, statusText: 'Internal Server Error' });
      }

      throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
    });

    const originalConsoleError = console.error;
    const consoleErrorStub = jest.fn();
    Object.defineProperty(console, 'error', {
      configurable: true,
      value: consoleErrorStub,
    });

    try {
      const response = await replayProjectionJob(
        createPagesContext({
          url: 'https://prime.example.com/api/review-projection-replay?jobId=proj_message_msg-1',
          method: 'POST',
          headers: {
            'x-prime-access-token': 'prime-access',
          },
          env: createMockEnv({
            NODE_ENV: 'production',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'prime-access',
            PRIME_MESSAGING_DB: db,
          }),
        }),
      );
      const payload = await response.json() as { error: string };

      expect(response.status).toBe(500);
      expect(payload.error).toBe('Failed to replay Prime projection job');
      expect(statements.some((statement) =>
        statement.query.includes('UPDATE message_projection_jobs')
        && statement.binds[0] === 'failed'
        && statement.binds[1] === 1
        && statement.binds[3] === 'Firebase SET failed: 500 Internal Server Error'
        && statement.binds[5] === 'proj_message_msg-1')).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      Object.defineProperty(console, 'error', {
        configurable: true,
        value: originalConsoleError,
      });
    }
  });
});

/**
 * prime-outbound-auth-hardening: TASK-05
 * Actor-claims auth and role-gate coverage for mutation endpoints.
 *
 * Non-broadcast endpoints (draft, resolve, dismiss) use resolveActorClaimsWithCompat:
 *   - Valid signed claims → proceeds
 *   - Invalid sig → 401
 *   - Missing claims + secret set → compat fallback (proceeds as prime-owner)
 *   - Missing secret → 503
 *
 * Broadcast paths in review-thread-send use conditional gate:
 *   - Whole-hostel broadcast thread + staff role → 403
 *   - Whole-hostel broadcast thread + owner role → proceeds
 *   - DM thread + staff role → proceeds (no role gate)
 */
describe('actor-claims auth coverage (prime-outbound-auth-hardening)', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // review-thread-draft (non-broadcast, compat)
  describe('review-thread-draft auth', () => {
    it('TC-A01: invalid x-prime-actor-claims → 401', async () => {
      const { db } = createMockD1Database();
      const response = await saveReviewThreadDraft(
        createPagesContext({
          url: 'https://prime.example.com/api/review-thread-draft?threadId=thread-1',
          method: 'PUT',
          headers: {
            'x-prime-actor-claims': 'dGVzdA.aW52YWxpZA',
            Authorization: 'Bearer test-token',
          },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
          }),
          body: { plainText: 'Draft content' },
        }),
      );
      expect(response.status).toBe(401);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('invalid-sig');
    });

    it('TC-A02: PRIME_ACTOR_CLAIMS_SECRET absent → 503', async () => {
      const { db } = createMockD1Database();
      const response = await saveReviewThreadDraft(
        createPagesContext({
          url: 'https://prime.example.com/api/review-thread-draft?threadId=thread-1',
          method: 'PUT',
          headers: { Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
            PRIME_ACTOR_CLAIMS_SECRET: undefined,
          }),
          body: { plainText: 'Draft content' },
        }),
      );
      expect(response.status).toBe(503);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('claims-secret-not-configured');
    });

    it('TC-A03: missing claims with secret set → compat fallback (reaches business layer)', async () => {
      const { db } = createMockD1Database();
      const response = await saveReviewThreadDraft(
        createPagesContext({
          url: 'https://prime.example.com/api/review-thread-draft?threadId=thread-1',
          method: 'PUT',
          headers: { Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
          }),
          body: { plainText: 'Draft content' },
        }),
      );
      // Compat fallback → reaches D1 layer; 404 (thread not found) or 200
      expect([200, 404, 409]).toContain(response.status);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(503);
    });

    it('TC-A04: valid signed claims → proceeds', async () => {
      const { db } = createMockD1Database();
      const claimsHeader = await signTestActorClaims('staff-uid', ['staff']);
      const response = await saveReviewThreadDraft(
        createPagesContext({
          url: 'https://prime.example.com/api/review-thread-draft?threadId=thread-1',
          method: 'PUT',
          headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
          }),
          body: { plainText: 'Draft content' },
        }),
      );
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(503);
    });
  });

  // review-thread-send: DM regression + broadcast role gate
  describe('review-thread-send — DM regression and broadcast role gate', () => {
    it('TC-B01: DM thread + staff role → 200 (no role gate on direct messages)', async () => {
      // Set up a DM thread record in mock DB
      const dmThreadId = 'dm_occ_aaa_occ_bbb';
      const { db } = createMockD1Database({
        firstByQuery: {
          [normalizeD1Query('SELECT * FROM message_threads WHERE id = ?')]: {
            id: dmThreadId,
            booking_id: 'booking-1',
            channel_type: 'direct',
            audience: 'individual',
            member_uids_json: '[]',
            title: null,
            latest_message_at: null,
            latest_inbound_message_at: null,
            last_staff_reply_at: null,
            takeover_state: 'none',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{}',
            created_at: 1000,
            updated_at: 1000,
          },
        },
      });

      const claimsHeader = await signTestActorClaims('staff-uid', ['staff']);
      const response = await sendReviewThread(
        createPagesContext({
          url: `https://prime.example.com/api/review-thread-send?threadId=${dmThreadId}`,
          method: 'POST',
          headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
            CF_FIREBASE_DATABASE_URL: 'https://example.firebaseio.com',
            CF_FIREBASE_API_KEY: 'test-api-key',
          }),
        }),
      );

      // Should NOT be 403 (DM sends bypass role gate)
      expect(response.status).not.toBe(403);
      // May be 409 (no draft) or other business logic response — not a role block
    });

    it('TC-B02: whole-hostel broadcast thread + staff role → 403', async () => {
      const broadcastThreadId = 'broadcast_whole_hostel';
      const { db } = createMockD1Database({
        firstByQuery: {
          [normalizeD1Query('SELECT * FROM message_threads WHERE id = ?')]: {
            id: broadcastThreadId,
            booking_id: '',
            channel_type: 'broadcast',
            audience: 'whole_hostel',
            member_uids_json: '[]',
            title: null,
            latest_message_at: null,
            latest_inbound_message_at: null,
            last_staff_reply_at: null,
            takeover_state: 'none',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{}',
            created_at: 1000,
            updated_at: 1000,
          },
        },
      });

      const claimsHeader = await signTestActorClaims('staff-uid', ['staff']);
      const response = await sendReviewThread(
        createPagesContext({
          url: `https://prime.example.com/api/review-thread-send?threadId=${broadcastThreadId}`,
          method: 'POST',
          headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
            CF_FIREBASE_DATABASE_URL: 'https://example.firebaseio.com',
            CF_FIREBASE_API_KEY: 'test-api-key',
          }),
        }),
      );

      expect(response.status).toBe(403);
      const body = await response.json() as { error: string };
      expect(body.error).toMatch(/insufficient role/i);
    });

    it('TC-B03: whole-hostel broadcast thread + owner role → proceeds (not 403)', async () => {
      const broadcastThreadId = 'broadcast_whole_hostel';
      const { db } = createMockD1Database({
        firstByQuery: {
          [normalizeD1Query('SELECT * FROM message_threads WHERE id = ?')]: {
            id: broadcastThreadId,
            booking_id: '',
            channel_type: 'broadcast',
            audience: 'whole_hostel',
            member_uids_json: '[]',
            title: null,
            latest_message_at: null,
            latest_inbound_message_at: null,
            last_staff_reply_at: null,
            takeover_state: 'none',
            review_status: 'pending',
            suppression_reason: null,
            metadata_json: '{}',
            created_at: 1000,
            updated_at: 1000,
          },
        },
      });

      const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
      const response = await sendReviewThread(
        createPagesContext({
          url: `https://prime.example.com/api/review-thread-send?threadId=${broadcastThreadId}`,
          method: 'POST',
          headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
            CF_FIREBASE_DATABASE_URL: 'https://example.firebaseio.com',
            CF_FIREBASE_API_KEY: 'test-api-key',
          }),
        }),
      );

      // Role gate passes; may fail at business logic (409 no draft) — but NOT 403
      expect(response.status).not.toBe(403);
    });
  });
});
