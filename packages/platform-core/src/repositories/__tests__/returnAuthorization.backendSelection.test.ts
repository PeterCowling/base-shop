import { jest } from '@jest/globals';

const mockJson = {
  readReturnAuthorizations: jest.fn(),
  writeReturnAuthorizations: jest.fn(),
  addReturnAuthorization: jest.fn(),
  getReturnAuthorization: jest.fn(),
};

const mockPrisma = {
  readReturnAuthorizations: jest.fn(),
  writeReturnAuthorizations: jest.fn(),
  addReturnAuthorization: jest.fn(),
  getReturnAuthorization: jest.fn(),
};

let prismaImportCount = 0;

jest.mock('../returnAuthorization.json.server', () => ({
  jsonReturnAuthorizationRepository: mockJson,
}));

jest.mock('../returnAuthorization.prisma.server', () => {
  prismaImportCount++;
  return { prismaReturnAuthorizationRepository: mockPrisma };
});

jest.mock('../../db', () => ({ prisma: { returnAuthorization: {} } }));

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

describe('returnAuthorization repository backend selection', () => {
  const origBackend = process.env.RETURN_AUTH_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = 'postgres://test';
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.RETURN_AUTH_BACKEND;
    } else {
      process.env.RETURN_AUTH_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when RETURN_AUTH_BACKEND="json"', async () => {
    process.env.RETURN_AUTH_BACKEND = 'json';
    const {
      readReturnAuthorizations,
      writeReturnAuthorizations,
      addReturnAuthorization,
      getReturnAuthorization,
    } = await import('../returnAuthorization.server');

    await readReturnAuthorizations();
    await writeReturnAuthorizations([]);
    await addReturnAuthorization({} as any);
    await getReturnAuthorization('id');

    expect(mockJson.readReturnAuthorizations).toHaveBeenCalled();
    expect(mockJson.writeReturnAuthorizations).toHaveBeenCalled();
    expect(mockJson.addReturnAuthorization).toHaveBeenCalled();
    expect(mockJson.getReturnAuthorization).toHaveBeenCalled();
    expect(mockPrisma.readReturnAuthorizations).not.toHaveBeenCalled();
  });

  it('defaults to Prisma repository when RETURN_AUTH_BACKEND is not set', async () => {
    delete process.env.RETURN_AUTH_BACKEND;
    const {
      readReturnAuthorizations,
      writeReturnAuthorizations,
      addReturnAuthorization,
      getReturnAuthorization,
    } = await import('../returnAuthorization.server');

    await readReturnAuthorizations();
    await writeReturnAuthorizations([]);
    await addReturnAuthorization({} as any);
    await getReturnAuthorization('id');

    expect(mockPrisma.readReturnAuthorizations).toHaveBeenCalled();
    expect(mockPrisma.writeReturnAuthorizations).toHaveBeenCalled();
    expect(mockPrisma.addReturnAuthorization).toHaveBeenCalled();
    expect(mockPrisma.getReturnAuthorization).toHaveBeenCalled();
    expect(mockJson.readReturnAuthorizations).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});

