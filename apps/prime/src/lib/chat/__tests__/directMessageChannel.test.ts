import {
  buildBroadcastChannelId,
  buildDirectMessageChannelId,
  buildStaffThreadChannelId,
  directMessageChannelIncludesGuest,
  getPrimeMessageChannelKind,
  isBroadcastChannelId,
  isDirectMessageChannelId,
  isStaffThreadChannelId,
  WHOLE_HOSTEL_BROADCAST_CHANNEL_ID,
} from '../directMessageChannel';


describe('directMessageChannel', () => {
  it('builds deterministic channel IDs regardless of input order', () => {
    const first = buildDirectMessageChannelId('guest_xyz', 'guest_abc');
    const second = buildDirectMessageChannelId('guest_abc', 'guest_xyz');

    expect(first).toBe('dm_guest_abc_guest_xyz');
    expect(second).toBe('dm_guest_abc_guest_xyz');
  });

  it('detects direct-message channel IDs', () => {
    expect(isDirectMessageChannelId('dm_guest_abc_guest_xyz')).toBe(true);
    expect(isDirectMessageChannelId('activity_123')).toBe(false);
    expect(isDirectMessageChannelId(null)).toBe(false);
  });

  it('builds and detects staff-thread channel IDs', () => {
    const channelId = buildStaffThreadChannelId('thread_123');

    expect(channelId).toBe('staff_thread_thread_123');
    expect(isStaffThreadChannelId(channelId)).toBe(true);
    expect(getPrimeMessageChannelKind(channelId)).toBe('staff_thread');
  });

  it('builds and detects broadcast channel IDs', () => {
    const channelId = buildBroadcastChannelId('whole_hostel');

    expect(channelId).toBe('broadcast_whole_hostel');
    expect(isBroadcastChannelId(channelId)).toBe(true);
    expect(getPrimeMessageChannelKind(channelId)).toBe('broadcast');
  });

  it('exports WHOLE_HOSTEL_BROADCAST_CHANNEL_ID with the correct stable value', () => {
    // TC-01: exported constant must equal 'broadcast_whole_hostel'
    expect(WHOLE_HOSTEL_BROADCAST_CHANNEL_ID).toBe('broadcast_whole_hostel');
    // Must be consistent with buildBroadcastChannelId helper
    expect(WHOLE_HOSTEL_BROADCAST_CHANNEL_ID).toBe(buildBroadcastChannelId('whole_hostel'));
    // Must be detected as a broadcast channel
    expect(isBroadcastChannelId(WHOLE_HOSTEL_BROADCAST_CHANNEL_ID)).toBe(true);
    expect(getPrimeMessageChannelKind(WHOLE_HOSTEL_BROADCAST_CHANNEL_ID)).toBe('broadcast');
  });

  it('checks whether a direct channel includes a specific guest UUID', () => {
    const channelId = 'dm_guest_abc_guest_xyz';

    expect(directMessageChannelIncludesGuest(channelId, 'guest_abc')).toBe(true);
    expect(directMessageChannelIncludesGuest(channelId, 'guest_xyz')).toBe(true);
    expect(directMessageChannelIncludesGuest(channelId, 'guest_other')).toBe(false);
    expect(directMessageChannelIncludesGuest('activity_123', 'guest_abc')).toBe(false);
    expect(directMessageChannelIncludesGuest(channelId, null)).toBe(false);
  });
});
