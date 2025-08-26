/** @jest-environment node */
import { historyStateSchema } from "@acme/types";

const captureException = jest.fn();

jest.mock("./common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue({ user: { email: "user@example.com" } }),
}));

jest.mock("./pages/service", () => ({
  getPages: jest.fn(),
  savePage: jest.fn(),
  updatePage: jest.fn(),
  deletePage: jest.fn(),
}));

jest.mock("@acme/config", () => ({ env: { NODE_ENV: "test" } }));

jest.mock("@sentry/node", () => ({ captureException }));

import { createPage, savePageDraft, updatePage, deletePage } from "./pages.server";
import * as auth from "./common/auth";
import * as service from "./pages/service";
import * as Sentry from "@sentry/node";

describe("pages.server actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createPage happy path", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);
    const saved = { id: "p1", slug: "home" };
    (service.savePage as jest.Mock).mockResolvedValue(saved);

    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("slug", "home");
    fd.set("components", "[]");

    const result = await createPage("shop", fd);
    expect(result.page).toBe(saved);
    expect(auth.ensureAuthorized).toHaveBeenCalled();
    expect(service.getPages).toHaveBeenCalledWith("shop");
    expect(service.savePage).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({ id: "p1", slug: "home" }),
      undefined
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("createPage validation error", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);

    const fd = new FormData();
    fd.set("slug", "home");
    fd.set("components", "not-json");

    const result = await createPage("shop", fd);
    expect(result.errors?.components[0]).toBe("Invalid components");
    expect(service.savePage).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it("savePageDraft updates existing page", async () => {
    const existing = {
      id: "p1",
      slug: "",
      status: "draft",
      components: [],
      seo: { title: {}, description: {}, image: {} },
      createdAt: "now",
      updatedAt: "now",
      createdBy: "user",
    } as any;
    (service.getPages as jest.Mock).mockResolvedValue([existing]);
    (service.savePage as jest.Mock).mockImplementation((_shop, page) => Promise.resolve(page));

    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("components", "[]");

    const result = await savePageDraft("shop", fd);
    expect(result.page?.id).toBe("p1");
    expect(service.savePage).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({ id: "p1" }),
      existing
    );
  });

  it("savePageDraft creates new page ignoring invalid history", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);
    (service.savePage as jest.Mock).mockImplementation((_shop, page) => Promise.resolve(page));

    const fd = new FormData();
    fd.set("id", "p2");
    fd.set("components", "[]");
    fd.set("history", "not-json");

    const defaultHistory = historyStateSchema.parse(undefined);
    const spy = jest
      .spyOn(historyStateSchema, "parse")
      .mockImplementation(() => defaultHistory);

    const result = await savePageDraft("shop", fd);
    expect(result.page?.id).toBe("p2");
    expect(result.page?.history).toEqual(defaultHistory);
    expect(service.savePage).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({ id: "p2", history: defaultHistory }),
      undefined
    );
    spy.mockRestore();
  });

  it("savePageDraft returns error for invalid components", async () => {
    const fd = new FormData();
    fd.set("components", "not-json");

    const result = await savePageDraft("shop", fd);
    expect(result.errors?.components[0]).toBe("Invalid components");
    expect(service.savePage).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("updatePage calls service with authorization", async () => {
    const prev = {
      id: "p1",
      slug: "s",
      status: "draft",
      components: [],
      seo: { title: {}, description: {}, image: {} },
      createdAt: "now",
      updatedAt: "now",
      createdBy: "user",
    } as any;
    (service.getPages as jest.Mock).mockResolvedValue([prev]);
    const saved = { ...prev, slug: "new" };
    (service.updatePage as jest.Mock).mockResolvedValue(saved);

    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("updatedAt", "now");
    fd.set("slug", "new");
    fd.set("status", "draft");
    fd.set("components", "[]");

    const result = await updatePage("shop", fd);
    expect(result.page).toBe(saved);
    expect(auth.ensureAuthorized).toHaveBeenCalled();
    expect(service.updatePage).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({ id: "p1", slug: "new" }),
      prev
    );
  });

  it("updatePage propagates errors and captures Sentry", async () => {
    const prev = {
      id: "p1",
      slug: "s",
      status: "draft",
      components: [],
      seo: { title: {}, description: {}, image: {} },
      createdAt: "now",
      updatedAt: "now",
      createdBy: "user",
    } as any;
    const err = new Error("boom");
    (service.getPages as jest.Mock).mockResolvedValue([prev]);
    (service.updatePage as jest.Mock).mockRejectedValue(err);

    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("updatedAt", "now");
    fd.set("slug", "s");
    fd.set("status", "draft");
    fd.set("components", "[]");

    await expect(updatePage("shop", fd)).rejects.toThrow("boom");
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it("deletePage calls service with authorization", async () => {
    (service.deletePage as jest.Mock).mockResolvedValue(undefined);

    await deletePage("shop", "p1");
    expect(auth.ensureAuthorized).toHaveBeenCalled();
    expect(service.deletePage).toHaveBeenCalledWith("shop", "p1");
  });

  it("deletePage propagates errors and captures Sentry", async () => {
    const err = new Error("boom");
    (service.deletePage as jest.Mock).mockRejectedValue(err);

    await expect(deletePage("shop", "p1")).rejects.toThrow("boom");
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });
});

