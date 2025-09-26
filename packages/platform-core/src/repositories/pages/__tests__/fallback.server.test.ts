import { jest } from "@jest/globals";

const mockPrisma = {
  getPages: jest.fn().mockRejectedValue(new Error("boom")),
};
const mockJson = {
  getPages: jest.fn().mockResolvedValue([{ id: "1" }]),
};

jest.mock("../pages.prisma.server", () => mockPrisma);
jest.mock("../pages.json.server", () => mockJson);
jest.mock("../../../db", () => ({ prisma: { page: {} } }));

// resolveRepo just returns prisma first
jest.mock("../../repoResolver", () => ({
  resolveRepo: async (_d: any, prisma: any) => prisma(),
}));

describe("pages index.server fallback to JSON", () => {
  it("falls back to JSON when prisma throws", async () => {
    const repo = await import("../index.server");
    const res = await repo.getPages("shop");
    expect(res).toEqual([{ id: "1" }]);
    expect(mockPrisma.getPages).toHaveBeenCalled();
    expect(mockJson.getPages).toHaveBeenCalled();
  });
});

