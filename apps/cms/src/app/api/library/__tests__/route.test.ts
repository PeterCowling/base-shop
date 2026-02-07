// Mock auth to avoid pulling in the full auth chain
jest.mock("@cms/actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  ensureShopAccess: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  ensureShopReadAccess: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

const listLibrary = jest.fn();
const saveLibraryItem = jest.fn();
const updateLibraryItem = jest.fn();
const removeLibraryItem = jest.fn();
const clearUserLibrary = jest.fn();

jest.mock("@cms/actions/library.server", () => ({
  listLibrary,
  saveLibraryItem,
  updateLibraryItem,
  removeLibraryItem,
  clearUserLibrary,
}));

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;
let PATCH: typeof import("../route").PATCH;
let DELETE: typeof import("../route").DELETE;

beforeAll(async () => {
  ({ GET, POST, PATCH, DELETE } = await import("../route"));
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("library route", () => {
  describe("GET", () => {
    it("400 when shop missing", async () => {
      const res = await GET(new Request("http://test/api/library"));
      expect(res.status).toBe(400);
      expect(listLibrary).not.toHaveBeenCalled();
    });
    it("200 with items", async () => {
      const items = [{ id: "1", label: "A", createdAt: 1 }];
      listLibrary.mockResolvedValue(items);
      const res = await GET(new Request("http://test/api/library?shop=s1"));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual(items);
      expect(listLibrary).toHaveBeenCalledWith("s1");
    });
  });

  describe("POST", () => {
    it("400 when shop missing", async () => {
      const res = await POST(new Request("http://test/api/library", { method: "POST" }));
      expect(res.status).toBe(400);
      expect(saveLibraryItem).not.toHaveBeenCalled();
    });
    it("400 invalid json", async () => {
      const res = await POST(new Request("http://test/api/library?shop=s1", { method: "POST", body: "{" }));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Invalid JSON" });
    });
    it("400 invalid item", async () => {
      const res = await POST(new Request("http://test/api/library?shop=s1", { method: "POST", body: JSON.stringify({ bad: true }) }));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Invalid item" });
    });
    it("200 saves item", async () => {
      const item = { id: "1", label: "X", createdAt: Date.now() };
      const res = await POST(new Request("http://test/api/library?shop=s1", { method: "POST", body: JSON.stringify({ item }) }));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(saveLibraryItem).toHaveBeenCalled();
    });
    it("200 saves multiple items", async () => {
      const items = [
        { id: "1", label: "A", createdAt: 1 },
        { id: "2", label: "B", createdAt: 2 },
      ];
      const res = await POST(new Request("http://test/api/library?shop=s1", { method: "POST", body: JSON.stringify({ items }) }));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(saveLibraryItem).toHaveBeenCalledTimes(2);
      expect(saveLibraryItem).toHaveBeenCalledWith("s1", items[0]);
      expect(saveLibraryItem).toHaveBeenCalledWith("s1", items[1]);
    });

    it("400 includes validation issues payload", async () => {
      (saveLibraryItem as unknown as jest.Mock).mockImplementationOnce(() => {
        const err: any = new Error("Component validation failed: oops");
        err.code = "VALIDATION";
        err.issues = [{ path: [0, "widthMobile"], message: "Avoid 100vw" }];
        throw err;
      });
      const item = { id: "1", label: "X", createdAt: Date.now() };
      const res = await POST(new Request("http://test/api/library?shop=s1", { method: "POST", body: JSON.stringify({ item }) }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Component validation failed");
      expect(Array.isArray(json.issues)).toBe(true);
      expect(json.issues[0].path).toBeDefined();
    });
  });

  describe("PATCH", () => {
    it("400 when shop missing", async () => {
      const res = await PATCH(new Request("http://test/api/library", { method: "PATCH" }));
      expect(res.status).toBe(400);
      expect(updateLibraryItem).not.toHaveBeenCalled();
    });
    it("400 invalid json", async () => {
      const res = await PATCH(new Request("http://test/api/library?shop=s1", { method: "PATCH", body: "{" }));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Invalid JSON" });
    });
    it("400 invalid patch", async () => {
      const res = await PATCH(new Request("http://test/api/library?shop=s1", { method: "PATCH", body: JSON.stringify({}) }));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Invalid patch" });
    });
    it("200 updates", async () => {
      const res = await PATCH(new Request("http://test/api/library?shop=s1", { method: "PATCH", body: JSON.stringify({ id: "1", patch: { shared: true } }) }));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(updateLibraryItem).toHaveBeenCalledWith("s1", "1", { shared: true });
    });
  });

  describe("DELETE", () => {
    it("400 when shop missing", async () => {
      const res = await DELETE(new Request("http://test/api/library", { method: "DELETE" }));
      expect(res.status).toBe(400);
    });
    it("200 removes by id", async () => {
      const res = await DELETE(new Request("http://test/api/library?shop=s1&id=x", { method: "DELETE" }));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(removeLibraryItem).toHaveBeenCalledWith("s1", "x");
    });
    it("200 clears all for user", async () => {
      const res = await DELETE(new Request("http://test/api/library?shop=s1&all=1", { method: "DELETE" }));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(clearUserLibrary).toHaveBeenCalledWith("s1");
    });
  });
});

export {};
