import { getPages, savePage, updatePage, deletePage } from "./service";
import type { Page } from "@types";

jest.mock("@platform-core/repositories/pages/index.server", () => ({
  getPages: jest.fn().mockResolvedValue([]),
  savePage: jest.fn().mockImplementation((_s, p) => Promise.resolve(p)),
  updatePage: jest
    .fn()
    .mockImplementation((_s, p) => Promise.resolve({ ...(p as any) })),
  deletePage: jest.fn().mockResolvedValue(undefined),
}));

const repo = jest.requireMock(
  "@platform-core/repositories/pages/index.server"
);

describe("pages service", () => {
  it("calls repository getPages", async () => {
    await getPages("shop1");
    expect(repo.getPages).toHaveBeenCalledWith("shop1");
  });

  it("calls repository savePage", async () => {
    const page = { id: "p1" } as unknown as Page;
    await savePage("shop1", page);
    expect(repo.savePage).toHaveBeenCalledWith("shop1", page);
  });

  it("calls repository updatePage", async () => {
    const patch = { id: "p1", updatedAt: "now" };
    await updatePage("shop1", patch);
    expect(repo.updatePage).toHaveBeenCalledWith("shop1", patch);
  });

  it("calls repository deletePage", async () => {
    await deletePage("shop1", "p1");
    expect(repo.deletePage).toHaveBeenCalledWith("shop1", "p1");
  });
});
