/** @jest-environment node */
import type { ReturnLogistics } from "@acme/types";

describe("prisma return logistics repository", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  const sample: ReturnLogistics = {
    labelService: "ups",
    inStore: true,
    bagType: "reusable",
    returnCarrier: ["ups"],
    homePickupZipCodes: ["12345"],
    requireTags: true,
    allowWear: false,
  } as ReturnLogistics;

  it("reads and parses data from prisma", async () => {
    const delegate = {
      findUnique: jest.fn().mockResolvedValue({ id: 1, data: sample }),
      upsert: jest.fn(),
    };
    jest.doMock("../src/db", () => ({ prisma: { returnLogistics: delegate } }));
    const { readReturnLogistics } = await import(
      "../src/repositories/returnLogistics.prisma.server"
    );
    await expect(readReturnLogistics()).resolves.toEqual(sample);
    expect(delegate.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("writes data via upsert", async () => {
    const delegate = {
      findUnique: jest.fn(),
      upsert: jest.fn().mockResolvedValue(undefined),
    };
    jest.doMock("../src/db", () => ({ prisma: { returnLogistics: delegate } }));
    const { writeReturnLogistics } = await import(
      "../src/repositories/returnLogistics.prisma.server"
    );
    await writeReturnLogistics(sample);
    expect(delegate.upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      create: { id: 1, data: sample },
      update: { data: sample },
    });
  });
});
