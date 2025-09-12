import { setupSegmentTest, emptySegments } from './segmentTestHelpers';

afterAll(() => { jest.resetModules(); jest.clearAllMocks(); });

describe('resolveSegment', () => {
  describe('filters', () => {
    let mockReadFile: jest.Mock, mockStat: jest.Mock, mockListEvents: jest.Mock;
    beforeEach(() => {
      ({ mockReadFile, mockStat, mockListEvents } = setupSegmentTest());
    });

    it('returns events matching all filters', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          {
            id: 'vips',
            filters: [
              { field: 'plan', value: 'gold' },
              { field: 'region', value: 'us' },
            ],
          },
        ])
      );
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 'a@example.com', plan: 'gold', region: 'us' },
        { email: 'b@example.com', plan: 'gold', region: 'eu' },
        { email: 'c@example.com', plan: 'silver', region: 'us' },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'vips');
      expect(result).toEqual(['a@example.com']);
    });

    it('ignores events without matching filter fields', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          { id: 'vips', filters: [{ field: 'plan', value: 'gold' }] },
        ])
      );
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 'a@example.com', plan: 'silver' },
        { email: 'b@example.com' },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'vips');
      expect(result).toEqual([]);
    });

    it('deduplicates emails from events', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          { id: 'vips', filters: [{ field: 'plan', value: 'gold' }] },
        ])
      );
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 'a@example.com', plan: 'gold' },
        { email: 'a@example.com', plan: 'gold' },
        { email: 'b@example.com', plan: 'gold' },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'vips');
      expect(result.sort()).toEqual(['a@example.com', 'b@example.com'].sort());
    });

    it('skips events with non-string emails', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([{ id: 'seg', filters: [] }])
      );
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 123 },
        { email: { value: 'a@example.com' } },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'seg');
      expect(result).toEqual([]);
    });
  });

  describe('events', () => {
    let mockReadFile: jest.Mock, mockStat: jest.Mock, mockListEvents: jest.Mock;
    beforeEach(() => {
      ({ mockReadFile, mockStat, mockListEvents } = setupSegmentTest());
    });
    afterEach(() => {
      delete process.env.SEGMENT_CACHE_TTL;
    });

    it('deduplicates emails from segment events when no definition exists', async () => {
      mockReadFile.mockResolvedValue(emptySegments);
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 'a@example.com', type: 'segment', segment: 'vip' },
        { email: 'a@example.com', type: 'segment:vip' },
        { email: 'b@example.com', type: 'segment:vip' },
        { email: 'b@example.com', type: 'segment', segment: 'vip' },
        { email: 'c@example.com', type: 'segment', segment: 'other' },
        { email: 'd@example.com', type: 'segment:other' },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'vip');
      expect(result.sort()).toEqual(['a@example.com', 'b@example.com'].sort());
    });

    it('caches resolved emails for segment events', async () => {
      const { mockReadFile, mockStat, mockListEvents } = setupSegmentTest();
      process.env.SEGMENT_CACHE_TTL = '1000';
      mockReadFile.mockResolvedValue(emptySegments);
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 'a@example.com', type: 'segment:vip' },
      ]);
      const { resolveSegment } = await import('../segments');
      const r1 = await resolveSegment('shop1', 'vip');
      const r2 = await resolveSegment('shop1', 'vip');
      expect(r1).toEqual(['a@example.com']);
      expect(r2).toEqual(['a@example.com']);
      expect(mockListEvents).toHaveBeenCalledTimes(1);
    });

    it('ignores events without string emails', async () => {
      mockReadFile.mockResolvedValue(emptySegments);
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 'a@example.com', type: 'segment:vip' },
        { email: undefined, type: 'segment:vip' },
        { type: 'segment:vip' },
        { email: 123, type: 'segment:vip' },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'vip');
      expect(result).toEqual(['a@example.com']);
    });
  });

  describe('errors', () => {
    let mockReadFile: jest.Mock, mockStat: jest.Mock, mockListEvents: jest.Mock;
    beforeEach(() => {
      ({ mockReadFile, mockStat, mockListEvents } = setupSegmentTest());
    });

    it('returns empty array when listEvents fails', async () => {
      mockReadFile.mockResolvedValue(emptySegments);
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      const err = new Error('listEvents error');
      mockListEvents.mockRejectedValue(err);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { resolveSegment } = await import('../segments');
      await expect(resolveSegment('shop1', 'vip')).resolves.toEqual([]);
      expect(spy).toHaveBeenCalledWith('Failed to list analytics events', err);
      spy.mockRestore();
    });
  });

  describe('filter logic', () => {
    let mockReadFile: jest.Mock, mockStat: jest.Mock, mockListEvents: jest.Mock;
    beforeEach(() => {
      ({ mockReadFile, mockStat, mockListEvents } = setupSegmentTest());
    });

    it('handles numeric thresholds', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          {
            id: 'nums',
            filters: { and: [{ field: 'count', op: 'gte', value: '5' }] },
          },
        ])
      );
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 'below@example.com', count: 4 },
        { email: 'at@example.com', count: 5 },
        { email: 'above@example.com', count: 6 },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'nums');
      expect(result.sort()).toEqual(
        ['at@example.com', 'above@example.com'].sort()
      );
    });

    it('handles ISO date comparisons', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          {
            id: 'dates',
            filters: {
              and: [
                { field: 'last', op: 'lt', value: '2024-01-01T00:00:00.000Z' },
              ],
            },
          },
        ])
      );
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        {
          email: 'before@example.com',
          last: '2023-12-31T23:59:59.000Z',
        },
        { email: 'exact@example.com', last: '2024-01-01T00:00:00.000Z' },
        { email: 'after@example.com', last: '2024-01-01T00:00:01.000Z' },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'dates');
      expect(result).toEqual(['before@example.com']);
    });

    it('matches all when rule set is empty', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([{ id: 'all', filters: { and: [] } }])
      );
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      mockListEvents.mockResolvedValue([
        { email: 'a@example.com' },
        { email: 'b@example.com' },
      ]);
      const { resolveSegment } = await import('../segments');
      const result = await resolveSegment('shop1', 'all');
      expect(result.sort()).toEqual(['a@example.com', 'b@example.com'].sort());
    });

    it('supports AND and OR groups', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          {
            id: 'andSeg',
            filters: {
              and: [
                { field: 'purchases', op: 'gte', value: '5' },
                {
                  field: 'last',
                  op: 'gte',
                  value: '2024-01-01T00:00:00.000Z',
                },
              ],
            },
          },
          {
            id: 'orSeg',
            filters: {
              or: [
                { field: 'purchases', op: 'gte', value: '5' },
                {
                  field: 'last',
                  op: 'gte',
                  value: '2024-01-01T00:00:00.000Z',
                },
              ],
            },
          },
        ])
      );
      mockStat.mockResolvedValue({ mtimeMs: 1 });
      const events = [
        {
          email: 'both@example.com',
          purchases: 6,
          last: '2024-02-01T00:00:00.000Z',
        },
        {
          email: 'purchases@example.com',
          purchases: 6,
          last: '2023-12-01T00:00:00.000Z',
        },
        {
          email: 'date@example.com',
          purchases: 1,
          last: '2024-02-01T00:00:00.000Z',
        },
        {
          email: 'none@example.com',
          purchases: 1,
          last: '2023-12-01T00:00:00.000Z',
        },
      ];
      mockListEvents.mockResolvedValue(events);
      const { resolveSegment } = await import('../segments');
      const rAnd = await resolveSegment('shop1', 'andSeg');
      const rOr = await resolveSegment('shop1', 'orSeg');
      expect(rAnd).toEqual(['both@example.com']);
      expect(rOr.sort()).toEqual(
        ['both@example.com', 'purchases@example.com', 'date@example.com'].sort()
      );
    });
  });
});
