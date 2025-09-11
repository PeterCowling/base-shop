import { jest } from '@jest/globals';

const mockJson = {
  readSeoAudits: jest.fn(),
  appendSeoAudit: jest.fn(),
};

const mockPrisma = {
  readSeoAudits: jest.fn(),
  appendSeoAudit: jest.fn(),
};

let prismaImportCount = 0;

jest.mock('../seoAudit.json.server', () => mockJson);

jest.mock('../seoAudit.prisma.server', () => {
  prismaImportCount++;
  return mockPrisma;
});

jest.mock('../../db', () => ({ prisma: { seoAudit: {} } }));

jest.mock('../repoResolver', () => ({
  resolveRepo: async (
    prismaDelegate: any,
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

describe('seoAudit repository backend selection', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = 'postgres://test';
  });

  afterEach(() => {
    delete process.env.SEO_AUDIT_BACKEND;
    delete process.env.DATABASE_URL;
  });

  it('uses json repository when SEO_AUDIT_BACKEND="json"', async () => {
    process.env.SEO_AUDIT_BACKEND = 'json';
    const { readSeoAudits, appendSeoAudit } = await import('../seoAudit.server');

    await readSeoAudits('shop');
    await appendSeoAudit('shop', { timestamp: '', score: 0 });

    expect(mockJson.readSeoAudits).toHaveBeenCalledWith('shop');
    expect(mockJson.appendSeoAudit).toHaveBeenCalledWith('shop', { timestamp: '', score: 0 });
    expect(mockPrisma.readSeoAudits).not.toHaveBeenCalled();
  });

  it('defaults to the Prisma repository when SEO_AUDIT_BACKEND is not set', async () => {
    delete process.env.SEO_AUDIT_BACKEND;
    const { readSeoAudits, appendSeoAudit } = await import('../seoAudit.server');

    await readSeoAudits('shop');
    await appendSeoAudit('shop', { timestamp: '', score: 0 });

    expect(mockPrisma.readSeoAudits).toHaveBeenCalledWith('shop');
    expect(mockPrisma.appendSeoAudit).toHaveBeenCalledWith('shop', { timestamp: '', score: 0 });
    expect(mockJson.readSeoAudits).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});
