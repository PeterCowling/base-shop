import { jest } from '@jest/globals';

const mockJson = {
  listEvents: jest.fn(),
  readAggregates: jest.fn(),
};

const mockPrisma = {
  listEvents: jest.fn(),
  readAggregates: jest.fn(),
};

let prismaImportCount = 0;

jest.mock('../analytics.json.server', () => ({
  jsonAnalyticsRepository: mockJson,
}));

jest.mock('../analytics.prisma.server', () => {
  prismaImportCount++;
  return { prismaAnalyticsRepository: mockPrisma };
});

jest.mock('../../db', () => ({ prisma: { analyticsEvent: {} } }));

jest.mock('../repoResolver', () => ({
  resolveRepo: async (
    _prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any,
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === 'json') {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe('analytics repository backend selection', () => {
  const origBackend = process.env.ANALYTICS_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = 'postgres://test';
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.ANALYTICS_BACKEND;
    } else {
      process.env.ANALYTICS_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when ANALYTICS_BACKEND="json"', async () => {
    process.env.ANALYTICS_BACKEND = 'json';
    const { listEvents, readAggregates } = await import('../analytics.server');

    await listEvents('shop');
    await readAggregates('shop');

    expect(mockJson.listEvents).toHaveBeenCalledWith('shop');
    expect(mockJson.readAggregates).toHaveBeenCalledWith('shop');
    expect(mockPrisma.listEvents).not.toHaveBeenCalled();
  });

  it('defaults to Prisma repository when ANALYTICS_BACKEND is not set', async () => {
    delete process.env.ANALYTICS_BACKEND;
    const { listEvents, readAggregates } = await import('../analytics.server');

    await listEvents('shop');
    await readAggregates('shop');

    expect(mockPrisma.listEvents).toHaveBeenCalledWith('shop');
    expect(mockPrisma.readAggregates).toHaveBeenCalledWith('shop');
    expect(mockJson.listEvents).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});
