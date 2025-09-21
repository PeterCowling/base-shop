/** @jest-environment node */
import { historyStateSchema } from "@acme/types";
import { coreEnv as env } from "@acme/config/env/core";

const captureException = jest.fn();

jest.mock("../actions/common/auth", () => ({
  ensureAuthorized: jest
    .fn()
    .mockResolvedValue({ user: { email: "user@example.com" } }),
}));

jest.mock("../actions/pages/service", () => ({
  getPages: jest.fn(),
  savePage: jest.fn(),
  updatePage: jest.fn(),
  deletePage: jest.fn(),
}));

jest.mock("@acme/config/env/core", () => ({ coreEnv: { NODE_ENV: "test" } }));

jest.mock("@/utils/sentry.server", () => ({ captureException }));

import { createPage } from "../actions/pages/create";
import { savePageDraft } from "../actions/pages/draft";
import { updatePage } from "../actions/pages/update";
import { deletePage } from "../actions/pages/delete";
import * as service from "../actions/pages/service";

describe("pages.server", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    env.NODE_ENV = "test";
  });

  describe("createPage", () => {
    it("returns errors on validation failure", async () => {
      const fd = new FormData();
      fd.set("slug", "home");
      fd.set("components", "not-json");

      const result = await createPage("shop", fd);
      expect(result.errors).toBeDefined();
      expect(service.savePage).not.toHaveBeenCalled();
    });

    it("saves page on success", async () => {
      const saved = { id: "p1", slug: "home" } as any;
      (service.getPages as jest.Mock).mockResolvedValue([]);
      (service.savePage as jest.Mock).mockResolvedValue(saved);

      const fd = new FormData();
      fd.set("id", "p1");
      fd.set("slug", "home");
      fd.set("components", "[]");

      const result = await createPage("shop", fd);
      expect(result.page).toBe(saved);
      expect(service.savePage).toHaveBeenCalledWith(
        "shop",
        expect.objectContaining({ id: "p1", slug: "home" }),
        undefined,
      );
    });

    it("logs warning in development on validation failure", async () => {
      env.NODE_ENV = "development";
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

      const fd = new FormData();
      fd.set("slug", "home");
      fd.set("components", "not-json");

      const result = await createPage("shop", fd);
      expect(warn).toHaveBeenCalled();
      expect(captureException).toHaveBeenCalled();
      expect(result.errors).toBeDefined();
      expect(service.savePage).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it("captures and rethrows service errors", async () => {
      (service.getPages as jest.Mock).mockResolvedValue([]);
      const err = new Error("boom");
      (service.savePage as jest.Mock).mockRejectedValue(err);

      const fd = new FormData();
      fd.set("id", "p1");
      fd.set("slug", "home");
      fd.set("components", "[]");

      await expect(createPage("shop", fd)).rejects.toThrow("boom");
      expect(captureException).toHaveBeenCalledWith(err);
    });
  });

  describe("savePageDraft", () => {
    it("returns error for invalid components", async () => {
      const fd = new FormData();
      fd.set("components", "oops");

      const result = await savePageDraft("shop", fd);
      expect(result.errors?.components[0]).toBe("Invalid components");
      expect(service.savePage).not.toHaveBeenCalled();
    });

    it("creates new page with default history when absent and history invalid", async () => {
      (service.getPages as jest.Mock).mockResolvedValue([]);
      (service.savePage as jest.Mock).mockImplementation((_s, p) => p);

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
        undefined,
      );
      spy.mockRestore();
    });

    it("updates existing page when found", async () => {
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
      (service.savePage as jest.Mock).mockImplementation((_s, p) => p);

      const fd = new FormData();
      fd.set("id", "p1");
      fd.set("components", "[]");

      const result = await savePageDraft("shop", fd);
      expect(result.page?.id).toBe("p1");
      expect(service.savePage).toHaveBeenCalledWith(
        "shop",
        expect.objectContaining({ id: "p1" }),
        existing,
      );
    });

    it("captures and rethrows service errors", async () => {
      (service.getPages as jest.Mock).mockResolvedValue([]);
      const err = new Error("boom");
      (service.savePage as jest.Mock).mockRejectedValue(err);

      const fd = new FormData();
      fd.set("components", "[]");

      await expect(savePageDraft("shop", fd)).rejects.toThrow("boom");
      expect(captureException).toHaveBeenCalledWith(err);
    });
  });

  describe("updatePage", () => {
    it("returns errors on validation failure (publishing without slug)", async () => {
      const fd = new FormData();
      fd.set("id", "p1");
      fd.set("updatedAt", "now");
      fd.set("slug", "");
      fd.set("status", "published");
      fd.set("components", "[]");

      const result = await updatePage("shop", fd);
      expect(result.errors?.slug[0]).toBe("Slug required to publish");
      expect(service.updatePage).not.toHaveBeenCalled();
    });

    it("throws when page is missing", async () => {
      (service.getPages as jest.Mock).mockResolvedValue([]);

      const fd = new FormData();
      fd.set("id", "p1");
      fd.set("updatedAt", "now");
      fd.set("slug", "home");
      fd.set("status", "draft");
      fd.set("components", "[]");

      await expect(updatePage("shop", fd)).rejects.toThrow(
        "Page p1 not found",
      );
    });

    it("parses history and merges patch", async () => {
      const existing = {
        id: "p1",
        slug: "old",
        status: "draft",
        components: [],
        seo: { title: {}, description: {}, image: {} },
        createdAt: "now",
        updatedAt: "now",
        createdBy: "user",
      } as any;
      (service.getPages as jest.Mock).mockResolvedValue([existing]);
      const saved = { ...existing, slug: "new" };
      (service.updatePage as jest.Mock).mockResolvedValue(saved);

      const history = historyStateSchema.parse(undefined);
      const fd = new FormData();
      fd.set("id", "p1");
      fd.set("updatedAt", "now");
      fd.set("slug", "new");
      fd.set("status", "draft");
      fd.set("components", "[]");
      fd.set("history", JSON.stringify(history));

      const result = await updatePage("shop", fd);
      expect(result.page).toBe(saved);
      expect(service.updatePage).toHaveBeenCalledWith(
        "shop",
        expect.objectContaining({ id: "p1", slug: "new", history }),
        existing,
      );
    });

    it("captures and rethrows service errors", async () => {
      const existing = {
        id: "p1",
        slug: "old",
        status: "draft",
        components: [],
        seo: { title: {}, description: {}, image: {} },
        createdAt: "now",
        updatedAt: "now",
        createdBy: "user",
      } as any;
      (service.getPages as jest.Mock).mockResolvedValue([existing]);
      const err = new Error("boom");
      (service.updatePage as jest.Mock).mockRejectedValue(err);

      const fd = new FormData();
      fd.set("id", "p1");
      fd.set("updatedAt", "now");
      fd.set("slug", "home");
      fd.set("status", "draft");
      fd.set("components", "[]");

      await expect(updatePage("shop", fd)).rejects.toThrow("boom");
      expect(captureException).toHaveBeenCalledWith(err);
    });
  });

  describe("deletePage", () => {
    it("calls service on success", async () => {
      (service.deletePage as jest.Mock).mockResolvedValue(undefined);

      await deletePage("shop", "p1");
      expect(service.deletePage).toHaveBeenCalledWith("shop", "p1");
    });

    it("captures and rethrows service errors", async () => {
      const err = new Error("boom");
      (service.deletePage as jest.Mock).mockRejectedValue(err);

      await expect(deletePage("shop", "p1")).rejects.toThrow("boom");
      expect(captureException).toHaveBeenCalledWith(err);
    });
  });
});
