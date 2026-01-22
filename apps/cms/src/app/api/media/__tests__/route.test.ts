const listMedia = jest.fn();
const uploadMedia = jest.fn();
const deleteMediaAction = jest.fn();
const updateMediaMetadataAction = jest.fn();
const getMediaOverview = jest.fn();

jest.mock("@cms/actions/media.server", () => ({
  listMedia,
  uploadMedia,
  deleteMedia: deleteMediaAction,
  updateMediaMetadata: updateMediaMetadataAction,
  getMediaOverview,
}));

// Mock auth - tests run with CMS_TEST_ASSUME_ADMIN=1, but we mock to avoid
// pulling in the full auth chain which has module resolution issues in tests
jest.mock("@cms/actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  ensureCanRead: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  ensureShopAccess: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  ensureShopReadAccess: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;
let DELETE: typeof import("../route").DELETE;
let PATCH: typeof import("../route").PATCH;
let PUT: typeof import("../route").PUT;

beforeAll(async () => {
  ({ GET, POST, DELETE, PATCH, PUT } = await import("../route"));
});

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("media route", () => {
  describe("GET", () => {
    it("returns 400 when shop is missing", async () => {
      const res = await GET(new Request("http://test.local/api/media"));
      expect(res.status).toBe(400);
      expect(listMedia).not.toHaveBeenCalled();
    });

    it("lists media files", async () => {
      const files = [{ name: "a.jpg" }];
      listMedia.mockResolvedValue(files);
      const res = await GET(new Request("http://test.local/api/media?shop=s1"));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(files);
      expect(listMedia).toHaveBeenCalledWith("s1");
    });

    it("returns overview when summary is requested", async () => {
      const overview = {
        files: [],
        totalBytes: 10,
        imageCount: 1,
        videoCount: 0,
        recentUploads: [],
      };
      getMediaOverview.mockResolvedValue(overview);
      listMedia.mockImplementation(() => {
        throw new Error("listMedia should not be called when summary is requested");
      });
      const res = await GET(
        new Request("http://test.local/api/media?shop=s1&summary=true")
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(overview);
      expect(getMediaOverview).toHaveBeenCalledWith("s1");
      expect(listMedia).not.toHaveBeenCalled();
    });

    it("ignores false-like summary values", async () => {
      const files = [{ name: "keep" }];
      listMedia.mockResolvedValue(files);
      const res = await GET(
        new Request("http://test.local/api/media?shop=s1&summary=0")
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(files);
      expect(listMedia).toHaveBeenCalledWith("s1");
      expect(getMediaOverview).not.toHaveBeenCalled();
    });

    it("returns 500 when listMedia throws", async () => {
      listMedia.mockRejectedValue(new Error("fail"));
      const res = await GET(new Request("http://test.local/api/media?shop=s1"));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "fail" });
    });
  });

  describe("POST", () => {
    it("returns 400 when shop is missing", async () => {
      const res = await POST(new Request("http://test.local/api/media", { method: "POST" }));
      expect(res.status).toBe(400);
      expect(uploadMedia).not.toHaveBeenCalled();
    });

    it("uploads media", async () => {
      const fd = new FormData();
      const req = new Request("http://test.local/api/media?shop=s1", { method: "POST" });
      (req as any).formData = jest.fn().mockResolvedValue(fd);
      const item = { id: "1" };
      uploadMedia.mockResolvedValue(item);
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(item);
      expect(uploadMedia).toHaveBeenCalledWith("s1", fd, "landscape");
    });

    it("returns 400 when uploadMedia throws", async () => {
      const fd = new FormData();
      const req = new Request("http://test.local/api/media?shop=s1", { method: "POST" });
      (req as any).formData = jest.fn().mockResolvedValue(fd);
      uploadMedia.mockRejectedValue(new Error("upload fail"));
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "upload fail" });
    });
  });

  describe("DELETE", () => {
    it("returns 400 when parameters are missing", async () => {
      const res1 = await DELETE(
        new Request("http://test.local/api/media?file=f1", { method: "DELETE" })
      );
      expect(res1.status).toBe(400);
      const res2 = await DELETE(
        new Request("http://test.local/api/media?shop=s1", { method: "DELETE" })
      );
      expect(res2.status).toBe(400);
      expect(deleteMediaAction).not.toHaveBeenCalled();
    });

    it("deletes media file", async () => {
      const res = await DELETE(
        new Request("http://test.local/api/media?shop=s1&file=f1", { method: "DELETE" })
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
      expect(deleteMediaAction).toHaveBeenCalledWith("s1", "f1");
    });

    it("returns 400 when deleteMedia throws", async () => {
      deleteMediaAction.mockRejectedValue(new Error("del fail"));
      const res = await DELETE(
        new Request("http://test.local/api/media?shop=s1&file=f1", { method: "DELETE" })
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "del fail" });
    });
  });

  describe("PATCH", () => {
    it("returns 400 when shop is missing", async () => {
      const res = await PATCH(
        new Request("http://test.local/api/media", { method: "PATCH" })
      );
      expect(res.status).toBe(400);
      expect(updateMediaMetadataAction).not.toHaveBeenCalled();
    });

    it("returns 400 when file is missing", async () => {
      const res = await PATCH(
        new Request("http://test.local/api/media?shop=s1", {
          method: "PATCH",
          body: JSON.stringify({ title: "a" }),
        })
      );
      expect(res.status).toBe(400);
      expect(updateMediaMetadataAction).not.toHaveBeenCalled();
    });

    it("returns 400 when body is invalid JSON", async () => {
      const res = await PATCH(
        new Request("http://test.local/api/media?shop=s1", {
          method: "PATCH",
          body: "{",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid JSON" });
      expect(updateMediaMetadataAction).not.toHaveBeenCalled();
    });

    it("updates metadata", async () => {
      const item = { url: "/uploads/s1/a.jpg" };
      updateMediaMetadataAction.mockResolvedValue(item);
      const res = await PATCH(
        new Request("http://test.local/api/media?shop=s1", {
          method: "PATCH",
          body: JSON.stringify({
            file: "/uploads/s1/a.jpg",
            title: "New",
            tags: ["hero", "primary"],
          }),
        })
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(item);
      expect(updateMediaMetadataAction).toHaveBeenCalledWith("s1", "/uploads/s1/a.jpg", {
        title: "New",
        tags: ["hero", "primary"],
      });
    });

    it("rejects invalid tags payload", async () => {
      const res = await PATCH(
        new Request("http://test.local/api/media?shop=s1", {
          method: "PATCH",
          body: JSON.stringify({
            file: "/uploads/s1/a.jpg",
            tags: { bad: true },
          }),
        })
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid tags" });
      expect(updateMediaMetadataAction).not.toHaveBeenCalled();
    });

    it("rejects numeric tags payloads", async () => {
      const res = await PATCH(
        new Request("http://test.local/api/media?shop=s1", {
          method: "PATCH",
          body: JSON.stringify({
            file: "/uploads/s1/a.jpg",
            tags: 123,
          }),
        })
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid tags" });
      expect(updateMediaMetadataAction).not.toHaveBeenCalled();
    });

    it("returns 400 when update fails", async () => {
      updateMediaMetadataAction.mockRejectedValue(new Error("update fail"));
      const res = await PATCH(
        new Request("http://test.local/api/media?shop=s1", {
          method: "PATCH",
          body: JSON.stringify({ file: "/uploads/s1/a.jpg" }),
        })
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "update fail" });
    });

    it("supports PUT alias", async () => {
      const item = { url: "/uploads/s1/b.jpg" };
      updateMediaMetadataAction.mockResolvedValue(item);
      const req = new Request("http://test.local/api/media?shop=s1", {
        method: "PUT",
        body: JSON.stringify({ file: "/uploads/s1/b.jpg", altText: "alt" }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(item);
      expect(updateMediaMetadataAction).toHaveBeenCalledWith("s1", "/uploads/s1/b.jpg", {
        altText: "alt",
      });
    });
  });
});

export {};
