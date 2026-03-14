/**
 * @jest-environment node
 *
 * Tests for prime-thread-projection ensureActivityChannelMeta via
 * projectPrimeThreadMessageToFirebase.
 * Covers TC-13, TC-14, TC-15 from the reception-prime-activity-inbox plan.
 */

import { FirebaseRest } from '../lib/firebase-rest';
import type { PrimeMessageRecordRow, PrimeMessageThreadRow } from '../lib/prime-messaging-repositories';
import { projectPrimeThreadMessageToFirebase } from '../lib/prime-thread-projection';

function makeActivityThread(
  overrides: Partial<Pick<PrimeMessageThreadRow, 'id' | 'booking_id' | 'audience' | 'member_uids_json' | 'title'>> = {}
): PrimeMessageThreadRow {
  return {
    id: 'act-uuid-projection',
    booking_id: 'activity',
    channel_type: 'activity',
    audience: 'whole_hostel',
    member_uids_json: '[]',
    title: null,
    latest_message_at: 2000,
    latest_inbound_message_at: 2000,
    last_staff_reply_at: null,
    takeover_state: 'automated',
    review_status: 'pending',
    suppression_reason: null,
    metadata_json: null,
    created_at: 1000,
    updated_at: 2000,
    ...overrides,
  };
}

function makeStaffMessage(threadId: string): PrimeMessageRecordRow {
  return {
    id: 'msg-staff-001',
    thread_id: threadId,
    sender_id: 'staff-uid-001',
    sender_role: 'staff',
    sender_name: 'Host',
    content: 'Staff reply to activity',
    kind: 'support',
    audience: 'whole_hostel',
    links_json: null,
    attachments_json: null,
    cards_json: null,
    campaign_id: null,
    draft_id: null,
    deleted: 0,
    created_at: 2001,
  };
}

describe('projectPrimeThreadMessageToFirebase: ensureActivityChannelMeta', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
  const setSpy = jest.spyOn(FirebaseRest.prototype, 'set');
  const updateSpy = jest.spyOn(FirebaseRest.prototype, 'update');

  const mockEnv = {
    CF_FIREBASE_DATABASE_URL: 'https://example.firebaseio.com',
    CF_FIREBASE_API_KEY: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setSpy.mockResolvedValue(undefined);
    updateSpy.mockResolvedValue(undefined);
  });

  afterAll(() => {
    getSpy.mockRestore();
    setSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('TC-13: no existing meta → Firebase set called with activity shape', async () => {
    const thread = makeActivityThread();
    const message = makeStaffMessage(thread.id);

    getSpy.mockResolvedValue(null); // no existing meta

    await projectPrimeThreadMessageToFirebase(mockEnv, {
      thread,
      message,
      occurredAt: 3000,
    });

    expect(setSpy).toHaveBeenCalledWith(
      `messaging/channels/${thread.id}/meta`,
      expect.objectContaining({
        channelType: 'activity',
        bookingId: 'activity',
        audience: 'whole_hostel',
        createdAt: 3000,
        updatedAt: 3000,
      }),
    );

    // Message also written
    expect(setSpy).toHaveBeenCalledWith(
      `messaging/channels/${thread.id}/messages/${message.id}`,
      expect.objectContaining({
        content: 'Staff reply to activity',
        senderRole: 'staff',
      }),
    );
  });

  it('TC-14: existing activity meta → Firebase update called with updatedAt only', async () => {
    const thread = makeActivityThread();
    const message = makeStaffMessage(thread.id);

    getSpy.mockResolvedValue({
      channelType: 'activity',
      bookingId: 'activity',
      audience: 'whole_hostel',
      createdAt: 1000,
    });

    await projectPrimeThreadMessageToFirebase(mockEnv, {
      thread,
      message,
      occurredAt: 4000,
    });

    // set should only be called for the message, not the meta
    const metaSetCall = setSpy.mock.calls.find(([path]) =>
      typeof path === 'string' && path.endsWith('/meta'),
    );
    expect(metaSetCall).toBeUndefined();

    expect(updateSpy).toHaveBeenCalledWith(
      `messaging/channels/${thread.id}/meta`,
      { updatedAt: 4000 },
    );
  });

  it('TC-15: existing meta with channelType "direct" → throws Error', async () => {
    const thread = makeActivityThread();
    const message = makeStaffMessage(thread.id);

    getSpy.mockResolvedValue({
      channelType: 'direct',
      bookingId: 'BOOK123',
      audience: 'thread',
    });

    await expect(
      projectPrimeThreadMessageToFirebase(mockEnv, { thread, message }),
    ).rejects.toThrow('Activity channel metadata failed validation');
  });
});
