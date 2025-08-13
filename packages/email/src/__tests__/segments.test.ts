import { describe, expect, it, afterEach, jest } from '@jest/globals';

describe('resolveSegment caching', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('uses cache within TTL', async () => {
    const listEventsMock = jest.fn().mockResolvedValue([
      { type: 'segment:promo', email: 'a@example.com' },
    ]);
    const statMock = jest.fn().mockResolvedValue({ mtimeMs: 1 });
    jest.doMock('@platform-core/repositories/analytics.server', () => ({ listEvents: listEventsMock }));
    jest.doMock('node:fs/promises', () => ({ stat: statMock }));
    const { resolveSegment } = await import('../segments');
    const first = await resolveSegment('shop', 'promo', 1000);
    const second = await resolveSegment('shop', 'promo', 1000);
    expect(first).toEqual(['a@example.com']);
    expect(second).toEqual(['a@example.com']);
    expect(listEventsMock).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache when analytics file changes', async () => {
    const listEventsMock = jest
      .fn()
      .mockResolvedValueOnce([{ type: 'segment:promo', email: 'a@example.com' }])
      .mockResolvedValueOnce([
        { type: 'segment:promo', email: 'a@example.com' },
        { type: 'segment:promo', email: 'b@example.com' },
      ]);
    const statMock = jest
      .fn()
      .mockResolvedValueOnce({ mtimeMs: 1 })
      .mockResolvedValueOnce({ mtimeMs: 2 });
    jest.doMock('@platform-core/repositories/analytics.server', () => ({ listEvents: listEventsMock }));
    jest.doMock('node:fs/promises', () => ({ stat: statMock }));
    const { resolveSegment } = await import('../segments');
    const first = await resolveSegment('shop', 'promo', 1000);
    const second = await resolveSegment('shop', 'promo', 1000);
    expect(first).toEqual(['a@example.com']);
    expect(second).toEqual(['a@example.com', 'b@example.com']);
    expect(listEventsMock).toHaveBeenCalledTimes(2);
  });

  it('expires cache after TTL', async () => {
    jest.useFakeTimers();
    const listEventsMock = jest.fn().mockResolvedValue([
      { type: 'segment:promo', email: 'a@example.com' },
    ]);
    const statMock = jest.fn().mockResolvedValue({ mtimeMs: 1 });
    jest.doMock('@platform-core/repositories/analytics.server', () => ({ listEvents: listEventsMock }));
    jest.doMock('node:fs/promises', () => ({ stat: statMock }));
    const { resolveSegment } = await import('../segments');
    await resolveSegment('shop', 'promo', 50);
    jest.advanceTimersByTime(60);
    await resolveSegment('shop', 'promo', 50);
    expect(listEventsMock).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
