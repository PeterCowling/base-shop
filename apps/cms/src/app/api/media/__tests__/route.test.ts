const listMedia = jest.fn();
const uploadMedia = jest.fn();
const deleteMediaAction = jest.fn();

jest.mock("@cms/actions/media.server", () => ({
  listMedia,
  uploadMedia,
  deleteMedia: deleteMediaAction,
}));

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;
let DELETE: typeof import("../route").DELETE;

beforeAll(async () => {
  ({ GET, POST, DELETE } = await import("../route"));
});

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.resetAllMocks();
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
});
