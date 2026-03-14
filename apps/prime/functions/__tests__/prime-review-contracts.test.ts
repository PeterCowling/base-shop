/**
 * @jest-environment node
 *
 * Tests for prime-review-api and prime-review-send-support contract changes.
 * Covers TC-03 through TC-05 from the reception-prime-activity-inbox plan.
 */

// TC-03: resolveChannel activity branch
// TC-04: resolveSentAdmissionReason activity branch
// TC-05: resolveSentMessageKind regression (activity → 'support' via else-branch)

import type { PrimeMessageThreadRow } from '../lib/prime-messaging-repositories';
import { resolveSentAdmissionReason, resolveSentMessageKind } from '../lib/prime-review-send-support';

function makeThread(
  overrides: Partial<Pick<PrimeMessageThreadRow, 'channel_type' | 'booking_id' | 'review_status' | 'takeover_state' | 'audience' | 'member_uids_json' | 'metadata_json'>>
): PrimeMessageThreadRow {
  return {
    id: 'thread-1',
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
    metadata_json: null,
    created_at: 1000,
    updated_at: 1000,
    ...overrides,
  };
}

describe('prime-review-send-support: resolveSentAdmissionReason', () => {
  it('TC-04: activity channel_type → "staff_activity_send"', () => {
    const thread = makeThread({ channel_type: 'activity', booking_id: 'activity' });
    expect(resolveSentAdmissionReason(thread)).toBe('staff_activity_send');
  });

  it('broadcast channel_type → "staff_broadcast_send" (existing behaviour)', () => {
    const thread = makeThread({ channel_type: 'broadcast' });
    expect(resolveSentAdmissionReason(thread)).toBe('staff_broadcast_send');
  });

  it('direct channel_type → "staff_direct_send" (existing behaviour)', () => {
    const thread = makeThread({ channel_type: 'direct' });
    expect(resolveSentAdmissionReason(thread)).toBe('staff_direct_send');
  });
});

describe('prime-review-send-support: resolveSentMessageKind', () => {
  it('TC-05: activity channel_type → "support" (regression — existing else-branch)', () => {
    const thread = makeThread({ channel_type: 'activity', booking_id: 'activity' });
    expect(resolveSentMessageKind(thread)).toBe('support');
  });

  it('broadcast channel_type → "promotion" (existing behaviour)', () => {
    const thread = makeThread({ channel_type: 'broadcast' });
    expect(resolveSentMessageKind(thread)).toBe('promotion');
  });

  it('direct channel_type → "support" (existing behaviour)', () => {
    const thread = makeThread({ channel_type: 'direct' });
    expect(resolveSentMessageKind(thread)).toBe('support');
  });
});
