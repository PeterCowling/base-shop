const ensureAuthorized = jest.fn();
const getMediaOverview = jest.fn();
const listMedia = jest.fn();
const uploadMedia = jest.fn();
const deleteMedia = jest.fn();
const updateMediaMetadata = jest.fn();

jest.mock("@cms/actions/common/auth", () => ({ ensureAuthorized }));
jest.mock("@cms/actions/media.server", () => ({
  getMediaOverview: (...args: unknown[]) => getMediaOverview(...args),
  listMedia: (...args: unknown[]) => listMedia(...args),
  uploadMedia: (...args: unknown[]) => uploadMedia(...args),
  deleteMedia: (...args: unknown[]) => deleteMedia(...args),
  updateMediaMetadata: (...args: unknown[]) => updateMediaMetadata(...args),
}));

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;
let DELETE: typeof import("../route").DELETE;
let PATCH: typeof import("../route").PATCH;

describe("media route auth", () => {
  beforeAll(async () => {
    ({ GET, POST, DELETE, PATCH } = await import("../route"));
  });

  beforeEach(() => {
    ensureAuthorized.mockReset();
    getMediaOverview.mockReset();
    listMedia.mockReset();
    uploadMedia.mockReset();
    deleteMedia.mockReset();
    updateMediaMetadata.mockReset();
  });

  it("returns 403 when unauthorized for all methods", async () => {
    ensureAuthorized.mockRejectedValue(new Error("Forbidden"));

    const getRes = await GET(new Request("http://test.local/api/media?shop=demo"));
    expect(getRes.status).toBe(403);

    const postRes = await POST(
      new Request("http://test.local/api/media?shop=demo", { method: "POST" })
    );
    expect(postRes.status).toBe(403);

    const deleteRes = await DELETE(
      new Request("http://test.local/api/media?shop=demo&file=f1", { method: "DELETE" })
    );
    expect(deleteRes.status).toBe(403);

    const patchRes = await PATCH(
      new Request("http://test.local/api/media?shop=demo", { method: "PATCH" })
    );
    expect(patchRes.status).toBe(403);

    expect(getMediaOverview).not.toHaveBeenCalled();
    expect(listMedia).not.toHaveBeenCalled();
    expect(uploadMedia).not.toHaveBeenCalled();
    expect(deleteMedia).not.toHaveBeenCalled();
    expect(updateMediaMetadata).not.toHaveBeenCalled();
  });

  it("returns media list when authorized", async () => {
    ensureAuthorized.mockResolvedValue({ user: { role: "admin" } });
    listMedia.mockResolvedValue([{ id: "1" }]);

    const res = await GET(new Request("http://test.local/api/media?shop=demo"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: "1" }]);
    expect(listMedia).toHaveBeenCalledWith("demo");
  });
});
