import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('@acme/date-utils', () => ({
  nowIso: () => '2024-01-01T00:00:00.000Z',
}));

const readShop = jest.fn();
const getShopSettings = jest.fn();
jest.mock('@acme/platform-core/repositories/shops.server', () => ({
  readShop: (...args: unknown[]) => readShop(...args),
  getShopSettings: (...args: unknown[]) => getShopSettings(...args),
}));

describe('analytics provider resolution', () => {
  const shop = 'test-shop';
  let tmp: string;

  beforeEach(async () => {
    jest.resetModules();
    readShop.mockReset();
    getShopSettings.mockReset();
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'analytics-'));
    process.env.DATA_ROOT = tmp;
    delete process.env.GA_API_SECRET;
    (globalThis.fetch as any) = jest.fn().mockResolvedValue({ ok: true });
  });

  test(
    'NoopProvider when analytics disabled',
    async () => {
      readShop.mockResolvedValue({ analyticsEnabled: false });
      getShopSettings.mockResolvedValue({});
      const { trackEvent } = await import('@acme/platform-core/analytics');
      await trackEvent(shop, { type: 'page_view', page: 'home' });
      await expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- QA-1234: Path built from test tmpdir and shop fixture
        fs.readFile(path.join(tmp, shop, 'analytics.jsonl'), 'utf8')
      ).rejects.toBeDefined();
    },
    10000,
  );

  test("provider 'none' returns cached NoopProvider", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: 'none' } });
    const { trackEvent } = await import('@acme/platform-core/analytics');
    await trackEvent(shop, { type: 'page_view', page: 'home' });
    await trackEvent(shop, { type: 'page_view', page: 'about' });
    expect(readShop).toHaveBeenCalledTimes(1);
    expect(getShopSettings).toHaveBeenCalledTimes(1);
    await expect(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- QA-1234: Path built from test tmpdir and shop fixture
      fs.readFile(path.join(tmp, shop, 'analytics.jsonl'), 'utf8')
    ).rejects.toBeDefined();
  });

  test("provider 'console' logs event", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: 'console', enabled: true },
    });
    const logSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const { trackEvent } = await import('@acme/platform-core/analytics');
    await trackEvent(shop, { type: 'page_view', page: 'home' });
    expect(logSpy).toHaveBeenCalledWith(
      'analytics',
      expect.objectContaining({ type: 'page_view', page: 'home' })
    );
    logSpy.mockRestore();
  });

  test('GA provider missing secret falls back to file provider', async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: 'ga', id: 'G-123' },
    });
    const { trackEvent } = await import('@acme/platform-core/analytics');
    await trackEvent(shop, { type: 'page_view', page: 'home' });
    expect((globalThis.fetch as jest.Mock)).not.toHaveBeenCalled();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- QA-1234: Path built from test tmpdir and shop fixture
    const content = await fs.readFile(
      path.join(tmp, shop, 'analytics.jsonl'),
      'utf8'
    );
    expect(content).toContain('"type":"page_view"');
  });

  test('GA provider sends events when configured', async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: 'ga', id: 'G-123' },
    });
    process.env.GA_API_SECRET = 'secret';
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis.fetch as any) = fetchMock;
    const { trackEvent } = await import('@acme/platform-core/analytics');
    await trackEvent(shop, { type: 'page_view', page: 'home' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://www.google-analytics.com/mp/collect?measurement_id=G-123&api_secret=secret'
    );
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body).toEqual({
      client_id: '555',
      events: [{ name: 'page_view', params: { page: 'home' } }],
    });
  });
});

describe('FileProvider appends events to JSONL', () => {
  test('uses fs.mkdir and fs.appendFile with correct path', async () => {
    jest.resetModules();
    const mkdir = jest.fn().mockResolvedValue(undefined);
    const appendFile = jest.fn().mockResolvedValue(undefined);
    const readFile = jest.fn().mockRejectedValue(new Error('missing'));
    const writeFile = jest.fn().mockResolvedValue(undefined);
    jest.doMock('fs', () => ({ promises: { mkdir, appendFile, readFile, writeFile } }));
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const tmp = path.join(os.tmpdir(), `file-${Date.now()}`);
    process.env.DATA_ROOT = tmp;
    const { trackEvent } = await import('@acme/platform-core/analytics');
    await trackEvent('file-shop', { type: 'page_view', page: 'home' });
    const expected = path.join(tmp, 'file-shop', 'analytics.jsonl');
    expect(mkdir).toHaveBeenCalledWith(path.dirname(expected), { recursive: true });
    expect(appendFile).toHaveBeenCalledWith(
      expected,
      expect.stringContaining('"type":"page_view"'),
      'utf8'
    );
  });
});

describe('GoogleAnalyticsProvider network errors', () => {
  const shop = 'ga-shop';
  let tmp: string;
  beforeEach(async () => {
    jest.resetModules();
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'analytics-'));
    process.env.DATA_ROOT = tmp;
    process.env.GA_API_SECRET = 'secret';
    readShop.mockReset();
    getShopSettings.mockReset();
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: 'ga', id: 'G-123' } });
  });

  test('swallows fetch rejections', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network'));
    (globalThis.fetch as any) = fetchMock;
    const { trackEvent } = await import('@acme/platform-core/analytics');
    await expect(
      trackEvent(shop, { type: 'page_view', page: 'home' })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('updateAggregates', () => {
  const shop = 'agg-shop';
  let tmp: string;
  beforeEach(async () => {
    jest.resetModules();
    jest.unmock('fs');
    readShop.mockReset();
    getShopSettings.mockReset();
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'analytics-'));
    process.env.DATA_ROOT = tmp;
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: 'console', enabled: true },
    });
    (globalThis.fetch as any) = jest.fn();
  });

  test('aggregates events per day', async () => {
    const { trackPageView, trackOrder, trackEvent } = await import(
      '@acme/platform-core/analytics'
    );
    await trackPageView(shop, 'home');
    await trackOrder(shop, 'o1', 5);
    await trackEvent(shop, { type: 'discount_redeemed', code: 'SAVE' });
    await trackEvent(shop, { type: 'ai_crawl' });
    const aggPath = path.join(tmp, shop, 'analytics-aggregates.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- QA-1234: Fixture path under test tmpdir
    const agg = JSON.parse(await fs.readFile(aggPath, 'utf8'));
    expect(agg.page_view['2024-01-01']).toBe(1);
    expect(agg.order['2024-01-01']).toEqual({ count: 1, amount: 5 });
    expect(agg.discount_redeemed['2024-01-01'].SAVE).toBe(1);
    expect(agg.ai_crawl['2024-01-01']).toBe(1);
  });

  test('unknown event type results in empty aggregates file', async () => {
    const { trackEvent } = await import('@acme/platform-core/analytics');
    await trackEvent(shop, { type: 'custom_event' } as any);
    const aggPath = path.join(tmp, shop, 'analytics-aggregates.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- QA-1234: Fixture path under test tmpdir
    const agg = JSON.parse(await fs.readFile(aggPath, 'utf8'));
    expect(agg).toEqual({
      page_view: {},
      order: {},
      discount_redeemed: {},
      ai_crawl: {},
    });
  });
});
