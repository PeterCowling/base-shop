/** @jest-environment node */
const historyStateSchema = { parse: jest.fn((val: any) => val ?? {}) };
const captureException = jest.fn();
const mockUlid = jest.fn(() => "generated-ulid");
const mockedEnv: any = { NODE_ENV: "test" };
const now = "2024-01-01T00:00:00Z";
jest.mock("@acme/types", () => ({ historyStateSchema }), { virtual: true });
jest.mock("@acme/types/src/index", () => ({ historyStateSchema }), {
  virtual: true,
});
jest.mock("@acme/config/env/core", () => ({ coreEnv: mockedEnv }), {
  virtual: true,
});
jest.mock("../common/auth", () => ({
  ensureAuthorized: jest
    .fn()
    .mockResolvedValue({ user: { email: "user@example.com" } }),
}));
jest.mock("../pages/service", () => ({
  getPages: jest.fn(),
  savePage: jest.fn(),
  updatePage: jest.fn(),
  deletePage: jest.fn(),
}));
jest.mock("@/utils/sentry.server", () => ({ captureException }));
jest.mock("ulid", () => ({ ulid: mockUlid }));
jest.mock("@acme/date-utils", () => ({ nowIso: jest.fn(() => now) }));

import { createPage, savePageDraft, updatePage, deletePage } from "../pages.server";
import * as auth from "../common/auth";
import * as service from "../pages/service";
import * as Sentry from "@/utils/sentry.server";
import { createSchema, updateSchema, componentsField } from "../pages/validation";
import { LOCALES } from "@acme/i18n";

describe("pages.server actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEnv.NODE_ENV = "test";
    (historyStateSchema.parse as jest.Mock).mockImplementation(
      (val: any) => val ?? {}
    );
  });

  /* ---------------------------------------------------------------------- */
  /* createPage                                                             */
  /* ---------------------------------------------------------------------- */
  it("generates id when missing and uses provided id", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);
    const parsed = {
      slug: "home",
      status: "draft",
      components: [],
      image: "",
      title_en: "",
      title_de: "",
      desc_en: "",
      desc_de: "",
    };
    const safeParse = jest
      .spyOn(createSchema, "safeParse")
      .mockReturnValue({ success: true, data: parsed } as any);

    const fd1 = new FormData();
    await createPage("shop", fd1);
    expect(mockUlid).toHaveBeenCalled();
    expect(service.savePage).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({ id: "generated-ulid" }),
      undefined
    );

    mockUlid.mockClear();
    service.savePage.mockClear();

    const fd2 = new FormData();
    fd2.set("id", "  my-id  ");
    safeParse.mockReturnValue({ success: true, data: parsed } as any);
    await createPage("shop", fd2);
    expect(mockUlid).not.toHaveBeenCalled();
    const pageArg = (service.savePage as jest.Mock).mock.calls[0][1];
    expect(pageArg.id).toBe("my-id");
    safeParse.mockRestore();
  });

  it("returns errors and logs when validation fails", async () => {
    mockedEnv.NODE_ENV = "development";
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const error = { flatten: () => ({ fieldErrors: { slug: ["bad"] } }) };
    const safeParse = jest
      .spyOn(createSchema, "safeParse")
      .mockReturnValue({ success: false, error } as any);

    const result = await createPage("shop", new FormData());
    expect(warn).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.anything());
    expect(result.errors).toEqual({ slug: ["bad"] });
    expect(service.savePage).not.toHaveBeenCalled();
    warn.mockRestore();
    safeParse.mockRestore();
  });

  it("builds translations and passes existing page to service", async () => {
    const existing = {
      id: "p1",
      slug: "old",
      status: "draft",
      components: [],
      seo: { title: {}, description: {}, image: {} },
      createdAt: "old",
      updatedAt: "old",
      createdBy: "old",
    } as any;
    (service.getPages as jest.Mock).mockResolvedValue([existing]);
    const saved = { ...existing, slug: "home" };
    (service.savePage as jest.Mock).mockResolvedValue(saved);

    const parsed: any = {
      slug: "home",
      status: "draft",
      components: [],
      image: "https://img",
      title_en: "T1",
      title_de: "T2",
      desc_en: "D1",
      desc_de: "D2",
    };
    // ensure undefined fields for other locales
    LOCALES.forEach((l) => {
      if (!parsed[`title_${l}`]) parsed[`title_${l}`] = undefined;
      if (!parsed[`desc_${l}`]) parsed[`desc_${l}`] = undefined;
    });
    const safeParse = jest
      .spyOn(createSchema, "safeParse")
      .mockReturnValue({ success: true, data: parsed } as any);

    const fd = new FormData();
    fd.set("id", "p1");
    const result = await createPage("shop", fd);
    expect(result.page).toBe(saved);
    const pageArg = (service.savePage as jest.Mock).mock.calls[0][1];
    const expectedTitle: any = {};
    const expectedDesc: any = {};
    const expectedImg: any = {};
    LOCALES.forEach((l) => {
      expectedTitle[l] = l === "en" ? "T1" : l === "de" ? "T2" : undefined;
      expectedDesc[l] = l === "en" ? "D1" : l === "de" ? "D2" : undefined;
      expectedImg[l] = "https://img";
    });
    expect(pageArg).toEqual({
      id: "p1",
      slug: "home",
      status: "draft",
      components: [],
      seo: {
        title: expectedTitle,
        description: expectedDesc,
        image: expectedImg,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: "user@example.com",
    });
    expect(service.savePage).toHaveBeenCalledWith("shop", pageArg, existing);
    safeParse.mockRestore();
  });

  it("captures and rethrows create service errors", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);
    const err = new Error("boom");
    (service.savePage as jest.Mock).mockRejectedValue(err);
    const parsed: any = {
      slug: "home",
      status: "draft",
      components: [],
      image: "",
      title_en: "",
      title_de: "",
      desc_en: "",
      desc_de: "",
    };
    const safeParse = jest
      .spyOn(createSchema, "safeParse")
      .mockReturnValue({ success: true, data: parsed } as any);
    await expect(createPage("shop", new FormData())).rejects.toThrow("boom");
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    safeParse.mockRestore();
  });

  /* ---------------------------------------------------------------------- */
  /* savePageDraft                                                          */
  /* ---------------------------------------------------------------------- */
  it("validates components with componentsField", async () => {
    const safeParse = jest
      .spyOn(componentsField, "safeParse")
      .mockReturnValue({ success: false } as any);
    const result = await savePageDraft("shop", new FormData());
    expect(safeParse).toHaveBeenCalled();
    expect(result).toEqual({ errors: { components: ["Invalid components"] } });
    expect(service.savePage).not.toHaveBeenCalled();
    safeParse.mockRestore();
  });

  it("parses history and updates existing drafts", async () => {
    const existing = {
      id: "p1",
      slug: "",
      status: "draft",
      components: [],
      seo: { title: {}, description: {}, image: {} },
      createdAt: "old",
      updatedAt: "old",
      createdBy: "user",
    } as any;
    (service.getPages as jest.Mock).mockResolvedValue([existing]);
    (service.savePage as jest.Mock).mockImplementation((_s, p) => Promise.resolve(p));

    const history = { step: [] };
    (historyStateSchema.parse as jest.Mock).mockReturnValueOnce(history);

    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("components", "[]");
    fd.set("history", JSON.stringify(history));

    const result = await savePageDraft("shop", fd);
    expect(historyStateSchema.parse).toHaveBeenCalledWith(history);
    expect(result.page?.history).toEqual(history);
    expect(service.savePage).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({ id: "p1", history }),
      existing
    );
  });

  it("creates new draft with empty translations when page missing", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);
    (service.savePage as jest.Mock).mockImplementation((_s, p) => Promise.resolve(p));
    (historyStateSchema.parse as jest.Mock).mockReturnValueOnce({});

    const fd = new FormData();
    fd.set("components", "[]");

    const result = await savePageDraft("shop", fd);
    const emptyTrans = Object.fromEntries(LOCALES.map((l) => [l, ""]));
    expect(result.page).toEqual({
      id: "generated-ulid",
      slug: "",
      status: "draft",
      components: [],
      history: {},
      seo: {
        title: emptyTrans,
        description: emptyTrans,
        image: emptyTrans,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: "user@example.com",
    });
    expect(service.savePage).toHaveBeenCalledWith("shop", result.page, undefined);
  });

  it("ignores invalid history", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);
    (service.savePage as jest.Mock).mockImplementation((_s, p) => Promise.resolve(p));
    const fd = new FormData();
    fd.set("components", "[]");
    fd.set("history", "not-json");
    (historyStateSchema.parse as jest.Mock).mockReturnValueOnce({});

    const result = await savePageDraft("shop", fd);
    expect(historyStateSchema.parse).toHaveBeenCalledWith(undefined);
    expect(result.page?.history).toEqual({});
  });

  it("captures and rethrows service errors", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);
    const err = new Error("boom");
    (service.savePage as jest.Mock).mockRejectedValue(err);
    const fd = new FormData();
    fd.set("components", "[]");
    await expect(savePageDraft("shop", fd)).rejects.toThrow("boom");
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  /* ---------------------------------------------------------------------- */
  /* updatePage                                                             */
  /* ---------------------------------------------------------------------- */
  it("returns errors when updateSchema validation fails", async () => {
    mockedEnv.NODE_ENV = "development";
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const error = { flatten: () => ({ fieldErrors: { slug: ["bad"] } }) };
    const safeParse = jest
      .spyOn(updateSchema, "safeParse")
      .mockReturnValue({ success: false, error } as any);

    const fd = new FormData();
    fd.set("id", "p1");
    const result = await updatePage("shop", fd);
    expect(warn).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.anything());
    expect(result.errors).toEqual({ slug: ["bad"] });
    warn.mockRestore();
    safeParse.mockRestore();
  });

  it("parses history and throws when page not found", async () => {
    (service.getPages as jest.Mock).mockResolvedValue([]);
    const parsed: any = {
      id: "p1",
      updatedAt: "u",
      slug: "home",
      status: "draft",
      components: [],
      image: "https://img",
      title_en: "T1",
      title_de: "T2",
      desc_en: "D1",
      desc_de: "D2",
    };
    LOCALES.forEach((l) => {
      if (!parsed[`title_${l}`]) parsed[`title_${l}`] = undefined;
      if (!parsed[`desc_${l}`]) parsed[`desc_${l}`] = undefined;
    });
    const safeParse = jest
      .spyOn(updateSchema, "safeParse")
      .mockReturnValue({ success: true, data: parsed } as any);
    const history = { step: [] };
    (historyStateSchema.parse as jest.Mock).mockReturnValueOnce(history);

    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("history", JSON.stringify(history));

    await expect(updatePage("shop", fd)).rejects.toThrow("Page p1 not found");
    expect(historyStateSchema.parse).toHaveBeenCalledWith(history);
    safeParse.mockRestore();
  });

  it("sends patch to update service", async () => {
    const prev = {
      id: "p1",
      slug: "old",
      status: "draft",
      components: [],
      seo: { title: { en: "", de: "" }, description: { en: "", de: "" }, image: { en: "", de: "" } },
      createdAt: "old",
      updatedAt: "old",
      createdBy: "user",
    } as any;
    (service.getPages as jest.Mock).mockResolvedValue([prev]);
    const saved = { ...prev, slug: "home" };
    (service.updatePage as jest.Mock).mockResolvedValue(saved);

    const parsed: any = {
      id: "p1",
      updatedAt: "old",
      slug: "home",
      status: "draft",
      components: [],
      image: "https://img",
      title_en: "T1",
      title_de: "T2",
      desc_en: "D1",
      desc_de: "D2",
    };
    LOCALES.forEach((l) => {
      if (!parsed[`title_${l}`]) parsed[`title_${l}`] = undefined;
      if (!parsed[`desc_${l}`]) parsed[`desc_${l}`] = undefined;
    });
    const safeParse = jest
      .spyOn(updateSchema, "safeParse")
      .mockReturnValue({ success: true, data: parsed } as any);
    const history = { step: [] };
    (historyStateSchema.parse as jest.Mock).mockReturnValueOnce(history);

    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("history", JSON.stringify(history));

    const result = await updatePage("shop", fd);
    expect(result.page).toBe(saved);
    const patchArg = (service.updatePage as jest.Mock).mock.calls[0][1];
    const expectedTitle: any = {};
    const expectedDesc: any = {};
    const expectedImg: any = {};
    LOCALES.forEach((l) => {
      expectedTitle[l] = l === "en" ? "T1" : l === "de" ? "T2" : undefined;
      expectedDesc[l] = l === "en" ? "D1" : l === "de" ? "D2" : undefined;
      expectedImg[l] = "https://img";
    });
    expect(patchArg).toEqual({
      id: "p1",
      updatedAt: "old",
      slug: "home",
      status: "draft",
      components: [],
      seo: {
        title: expectedTitle,
        description: expectedDesc,
        image: expectedImg,
      },
      history,
    });
    expect(Object.keys(patchArg).sort()).toEqual(
      ["components", "history", "id", "seo", "slug", "status", "updatedAt"].sort()
    );
    expect(service.updatePage).toHaveBeenCalledWith("shop", patchArg, prev);
    safeParse.mockRestore();
  });

  it("captures and rethrows update service errors", async () => {
    const prev = {
      id: "p1",
      slug: "s",
      status: "draft",
      components: [],
      seo: { title: {}, description: {}, image: {} },
      createdAt: "old",
      updatedAt: "old",
      createdBy: "user",
    } as any;
    (service.getPages as jest.Mock).mockResolvedValue([prev]);
    const err = new Error("boom");
    (service.updatePage as jest.Mock).mockRejectedValue(err);
    const safeParse = jest
      .spyOn(updateSchema, "safeParse")
      .mockReturnValue({
        success: true,
        data: {
          id: "p1",
          updatedAt: "old",
          slug: "s",
          status: "draft",
          components: [],
          image: "",
          title_en: "",
          title_de: "",
          desc_en: "",
          desc_de: "",
        },
      } as any);

    const fd = new FormData();
    fd.set("id", "p1");
    await expect(updatePage("shop", fd)).rejects.toThrow("boom");
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    safeParse.mockRestore();
  });

  /* ---------------------------------------------------------------------- */
  /* deletePage                                                             */
  /* ---------------------------------------------------------------------- */
  it("deletes a page with authorization", async () => {
    (service.deletePage as jest.Mock).mockResolvedValue(undefined);
    await deletePage("shop", "p1");
    expect(auth.ensureAuthorized).toHaveBeenCalled();
    expect(service.deletePage).toHaveBeenCalledWith("shop", "p1");
  });

  it("captures and rethrows delete errors", async () => {
    const err = new Error("boom");
    (service.deletePage as jest.Mock).mockRejectedValue(err);
    await expect(deletePage("shop", "p1")).rejects.toThrow("boom");
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });
});

