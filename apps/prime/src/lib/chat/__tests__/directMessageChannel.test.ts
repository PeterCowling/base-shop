import {
  buildDirectMessageChannelId,
  directMessageChannelIncludesGuest,
  isDirectMessageChannelId,
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

  it('checks whether a direct channel includes a specific guest UUID', () => {
    const channelId = 'dm_guest_abc_guest_xyz';

    expect(directMessageChannelIncludesGuest(channelId, 'guest_abc')).toBe(true);
    expect(directMessageChannelIncludesGuest(channelId, 'guest_xyz')).toBe(true);
    expect(directMessageChannelIncludesGuest(channelId, 'guest_other')).toBe(false);
    expect(directMessageChannelIncludesGuest('activity_123', 'guest_abc')).toBe(false);
    expect(directMessageChannelIncludesGuest(channelId, null)).toBe(false);
  });
});
