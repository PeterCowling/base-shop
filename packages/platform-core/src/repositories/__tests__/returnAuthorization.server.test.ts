import { jest } from "@jest/globals";

const mockJson = {
  readReturnAuthorizations: jest.fn(async () => []),
  writeReturnAuthorizations: jest.fn(async () => {}),
  addReturnAuthorization: jest.fn(async () => {}),
  getReturnAuthorization: jest.fn(async () => undefined),
};

const mockPrisma = {
  readReturnAuthorizations: jest.fn(async () => []),
  writeReturnAuthorizations: jest.fn(async () => {}),
  addReturnAuthorization: jest.fn(async () => {}),
  getReturnAuthorization: jest.fn(async () => undefined),
};

let prismaDelegate: unknown;

jest.mock("../returnAuthorization.json.server", () => ({
  jsonReturnAuthorizationRepository: mockJson,
}));

jest.mock("../returnAuthorization.prisma.server", () => ({
  prismaReturnAuthorizationRepository: mockPrisma,
}));

jest.mock("../../db", () => ({
  prisma: {
    get returnAuthorization() {
      return prismaDelegate;
    },
  },
}));

describe("returnAuthorization repository backend selection", () => {
  const origBackend = process.env.RETURN_AUTH_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  async function loadRepo() {
    return await import("../returnAuthorization.server");
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaDelegate = {};
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

  it("uses JSON repository when RETURN_AUTH_BACKEND='json'", async () => {
    process.env.RETURN_AUTH_BACKEND = "json";
    process.env.DATABASE_URL = "postgres://test";
    prismaDelegate = {};
    const {
      readReturnAuthorizations,
      writeReturnAuthorizations,
      addReturnAuthorization,
      getReturnAuthorization,
    } = await loadRepo();

    await readReturnAuthorizations();
    await writeReturnAuthorizations([]);
    await addReturnAuthorization({} as any);
    await getReturnAuthorization("id");

    expect(mockJson.readReturnAuthorizations).toHaveBeenCalled();
    expect(mockJson.writeReturnAuthorizations).toHaveBeenCalled();
    expect(mockJson.addReturnAuthorization).toHaveBeenCalled();
    expect(mockJson.getReturnAuthorization).toHaveBeenCalled();
    expect(mockPrisma.readReturnAuthorizations).not.toHaveBeenCalled();
  });

  it("uses Prisma repository when RETURN_AUTH_BACKEND='prisma'", async () => {
    process.env.RETURN_AUTH_BACKEND = "prisma";
    process.env.DATABASE_URL = "postgres://test";
    prismaDelegate = {};
    const {
      readReturnAuthorizations,
      writeReturnAuthorizations,
      addReturnAuthorization,
      getReturnAuthorization,
    } = await loadRepo();

    await readReturnAuthorizations();
    await writeReturnAuthorizations([]);
    await addReturnAuthorization({} as any);
    await getReturnAuthorization("id");

    expect(mockPrisma.readReturnAuthorizations).toHaveBeenCalled();
    expect(mockPrisma.writeReturnAuthorizations).toHaveBeenCalled();
    expect(mockPrisma.addReturnAuthorization).toHaveBeenCalled();
    expect(mockPrisma.getReturnAuthorization).toHaveBeenCalled();
    expect(mockJson.readReturnAuthorizations).not.toHaveBeenCalled();
  });

  it("defaults to Prisma repository when backend not set and delegate exists", async () => {
    delete process.env.RETURN_AUTH_BACKEND;
    process.env.DATABASE_URL = "postgres://test";
    prismaDelegate = {};
    const {
      readReturnAuthorizations,
      writeReturnAuthorizations,
      addReturnAuthorization,
      getReturnAuthorization,
    } = await loadRepo();

    await readReturnAuthorizations();
    await writeReturnAuthorizations([]);
    await addReturnAuthorization({} as any);
    await getReturnAuthorization("id");

    expect(mockPrisma.readReturnAuthorizations).toHaveBeenCalled();
    expect(mockPrisma.writeReturnAuthorizations).toHaveBeenCalled();
    expect(mockPrisma.addReturnAuthorization).toHaveBeenCalled();
    expect(mockPrisma.getReturnAuthorization).toHaveBeenCalled();
    expect(mockJson.readReturnAuthorizations).not.toHaveBeenCalled();
  });

  it("falls back to JSON repository when Prisma delegate missing", async () => {
    delete process.env.RETURN_AUTH_BACKEND;
    process.env.DATABASE_URL = "postgres://test";
    prismaDelegate = undefined;
    const {
      readReturnAuthorizations,
      writeReturnAuthorizations,
      addReturnAuthorization,
      getReturnAuthorization,
    } = await loadRepo();

    await readReturnAuthorizations();
    await writeReturnAuthorizations([]);
    await addReturnAuthorization({} as any);
    await getReturnAuthorization("id");

    expect(mockJson.readReturnAuthorizations).toHaveBeenCalled();
    expect(mockJson.writeReturnAuthorizations).toHaveBeenCalled();
    expect(mockJson.addReturnAuthorization).toHaveBeenCalled();
    expect(mockJson.getReturnAuthorization).toHaveBeenCalled();
    expect(mockPrisma.readReturnAuthorizations).not.toHaveBeenCalled();
  });
});

