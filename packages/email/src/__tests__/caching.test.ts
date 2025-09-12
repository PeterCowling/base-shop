import { setupSegmentTest, vipsSegment } from './segmentTestHelpers';

afterAll(() => { jest.resetModules(); jest.clearAllMocks(); });

describe('cacheTtl', () => {
  const originalTtl = process.env.SEGMENT_CACHE_TTL;

  afterEach(() => {
    if (originalTtl === undefined) delete process.env.SEGMENT_CACHE_TTL;
    else process.env.SEGMENT_CACHE_TTL = originalTtl;
  });

  it('returns custom ttl when set', async () => {
    setupSegmentTest();
    process.env.SEGMENT_CACHE_TTL = '5000';
    const { cacheTtl } = await import('../segments');
    expect(cacheTtl()).toBe(5000);
  });

  it('returns default when ttl is negative', async () => {
    setupSegmentTest();
    process.env.SEGMENT_CACHE_TTL = '-1';
    const { cacheTtl } = await import('../segments');
    expect(cacheTtl()).toBe(60_000);
  });

  it('returns default when ttl is zero', async () => {
    setupSegmentTest();
    process.env.SEGMENT_CACHE_TTL = '0';
    const { cacheTtl } = await import('../segments');
    expect(cacheTtl()).toBe(60_000);
  });

  it('returns default when ttl is non-numeric', async () => {
    setupSegmentTest();
    process.env.SEGMENT_CACHE_TTL = 'abc';
    const { cacheTtl } = await import('../segments');
    expect(cacheTtl()).toBe(60_000);
  });
});

describe('resolveSegment caching', () => {
  afterEach(() => {
    delete process.env.SEGMENT_CACHE_TTL;
    jest.useRealTimers();
  });

  it('returns cached result on repeated calls', async () => {
    const { mockReadFile, mockListEvents, mockStat } = setupSegmentTest();
    process.env.SEGMENT_CACHE_TTL = '1000';
    mockReadFile.mockResolvedValue(vipsSegment);
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents.mockResolvedValue([{ email: 'a@example.com' }]);
    const { resolveSegment } = await import('../segments');
    const r1 = await resolveSegment('shop1', 'vips');
    const r2 = await resolveSegment('shop1', 'vips');
    expect(r1).toEqual(['a@example.com']);
    expect(r2).toEqual(['a@example.com']);
    expect(mockListEvents).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache when analytics events change', async () => {
    jest.useFakeTimers();
    const { mockReadFile, mockListEvents, mockStat } = setupSegmentTest();
    process.env.SEGMENT_CACHE_TTL = '1000';
    mockReadFile.mockResolvedValue(vipsSegment);
    mockStat
      .mockResolvedValueOnce({ mtimeMs: 1 })
      .mockResolvedValueOnce({ mtimeMs: 2 });
    mockListEvents
      .mockResolvedValueOnce([{ email: 'a@example.com' }])
      .mockResolvedValueOnce([{ email: 'b@example.com' }]);
    const { resolveSegment } = await import('../segments');
    const r1 = await resolveSegment('shop1', 'vips');
    jest.advanceTimersByTime(500);
    const r2 = await resolveSegment('shop1', 'vips');
    expect(r1).toEqual(['a@example.com']);
    expect(r2).toEqual(['b@example.com']);
    expect(mockListEvents).toHaveBeenCalledTimes(2);
  });
});
