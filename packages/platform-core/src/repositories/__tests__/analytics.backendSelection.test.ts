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
    const dbUrl = process.env.DATABASE_URL;
    if (backend === 'json') {
      return await jsonModule();
    }
    if (backend === 'prisma') {
      return dbUrl ? await prismaModule() : await jsonModule();
    }
    return dbUrl ? await prismaModule() : await jsonModule();
  },
}));

describe('analytics repository backend selection', () => {
  const origBackend = process.env.ANALYTICS_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    delete process.env.ANALYTICS_BACKEND;
    delete process.env.DATABASE_URL;
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
    expect(prismaImportCount).toBe(0);
  });

  it('uses prisma repository when ANALYTICS_BACKEND="prisma"', async () => {
    process.env.ANALYTICS_BACKEND = 'prisma';
    process.env.DATABASE_URL = 'postgres://test';
    const { listEvents, readAggregates } = await import('../analytics.server');

    await listEvents('shop');
    await readAggregates('shop');

    expect(mockPrisma.listEvents).toHaveBeenCalledWith('shop');
    expect(mockPrisma.readAggregates).toHaveBeenCalledWith('shop');
    expect(mockJson.listEvents).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });

  it('falls back to json when Prisma is requested but unavailable', async () => {
    process.env.ANALYTICS_BACKEND = 'prisma';
    const { listEvents, readAggregates } = await import('../analytics.server');

    await listEvents('shop');
    await readAggregates('shop');

    expect(mockJson.listEvents).toHaveBeenCalledWith('shop');
    expect(mockJson.readAggregates).toHaveBeenCalledWith('shop');
    expect(mockPrisma.listEvents).not.toHaveBeenCalled();
  });

  it('defaults to prisma when ANALYTICS_BACKEND is not set', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    const { listEvents, readAggregates } = await import('../analytics.server');

    await listEvents('shop');
    await readAggregates('shop');

    expect(mockPrisma.listEvents).toHaveBeenCalledWith('shop');
    expect(mockPrisma.readAggregates).toHaveBeenCalledWith('shop');
    expect(mockJson.listEvents).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});

