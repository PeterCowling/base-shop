jest.mock("../../repoResolver", () => ({
  resolveRepo: jest.fn(),
}));

import { resolveRepo } from "../../repoResolver";
import type { Page } from "@acme/types";

describe("pages repository wrapper", () => {
  const repo = {
    getPages: jest.fn(),
    savePage: jest.fn(),
    deletePage: jest.fn(),
    updatePage: jest.fn(),
    diffHistory: jest.fn(),
  };

  beforeEach(() => {
    (resolveRepo as jest.Mock).mockResolvedValue(repo);
  });

  it("delegates getPages", async () => {
    const { getPages } = await import("../index.server");
    await getPages("shop1");
    expect(repo.getPages).toHaveBeenCalledWith("shop1");
  });

  it("delegates savePage", async () => {
    const { savePage } = await import("../index.server");
    const page = { id: "1" } as Page;
    await savePage("shop1", page);
    expect(repo.savePage).toHaveBeenCalledWith("shop1", page, undefined);
  });

  it("delegates deletePage", async () => {
    const { deletePage } = await import("../index.server");
    await deletePage("shop1", "p1");
    expect(repo.deletePage).toHaveBeenCalledWith("shop1", "p1");
  });

  it("delegates updatePage", async () => {
    const { updatePage } = await import("../index.server");
    const page = { id: "1", updatedAt: "now" } as any;
    await updatePage("shop1", page, page as Page);
    expect(repo.updatePage).toHaveBeenCalledWith("shop1", page, page);
  });

  it("delegates diffHistory", async () => {
    const { diffHistory } = await import("../index.server");
    await diffHistory("shop1");
    expect(repo.diffHistory).toHaveBeenCalledWith("shop1");
  });
});
