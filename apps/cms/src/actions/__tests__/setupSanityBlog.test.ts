/** @jest-environment node */

jest.mock("../common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@acme/config", () => ({ env: {} }));

import { setupSanityBlog } from "../setupSanityBlog";
import { ensureAuthorized } from "../common/auth";

describe("setupSanityBlog", () => {
  const creds = { projectId: "proj", dataset: "blog", token: "tok" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns early success when editorial disabled", async () => {
    const fetchSpy = jest.spyOn(global, "fetch" as any);

    const res = await setupSanityBlog(creds, { enabled: false });

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res).toEqual({ success: true });

    fetchSpy.mockRestore();
  });

  it("schedules promotion when promoteSchedule provided", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({ ok: true }) // schedule
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: [{ name: "blog" }] }),
      }) // list
      .mockResolvedValueOnce({ ok: true }) // schema
      .mockResolvedValueOnce({ ok: true }); // category

    const res = await setupSanityBlog(
      creds,
      { enabled: true, promoteSchedule: "2024-01-01T00:00:00Z" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/editorial/promote",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(res).toEqual({ success: true });

    fetchSpy.mockRestore();
  });

  it("skips dataset creation when dataset already exists", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: [{ name: "blog" }] }),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    const res = await setupSanityBlog(creds, { enabled: true });

    expect(res).toEqual({ success: true });
    expect(
      fetchSpy.mock.calls.some(([, opts]) => opts?.method === "PUT"),
    ).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    fetchSpy.mockRestore();
  });

  it("creates dataset when missing", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: [] }),
      }) // list
      .mockResolvedValueOnce({ ok: true }) // create
      .mockResolvedValueOnce({ ok: true }) // schema
      .mockResolvedValueOnce({ ok: true }); // category

    const res = await setupSanityBlog(creds, { enabled: true });

    expect(fetchSpy.mock.calls[1][0]).toBe(
      "https://api.sanity.io/v1/projects/proj/datasets/blog",
    );
    expect(fetchSpy.mock.calls[1][1]?.method).toBe("PUT");
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(res).toEqual({ success: true });

    fetchSpy.mockRestore();
  });

  it("returns DATASET_LIST_ERROR when listing fails", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({ ok: false });

    const res = await setupSanityBlog(creds, { enabled: true });

    expect(res).toEqual({
      success: false,
      error: "Failed to list datasets",
      code: "DATASET_LIST_ERROR",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });

  it("returns DATASET_CREATE_ERROR when creation fails", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: [] }),
      })
      .mockResolvedValueOnce({ ok: false });

    const res = await setupSanityBlog(creds, { enabled: true });

    expect(res).toEqual({
      success: false,
      error: "Failed to create dataset",
      code: "DATASET_CREATE_ERROR",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it("returns SCHEMA_UPLOAD_ERROR when schema upload fails", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: [{ name: "blog" }] }),
      })
      .mockResolvedValueOnce({ ok: false });

    const res = await setupSanityBlog(creds, { enabled: true });

    expect(res).toEqual({
      success: false,
      error: "Failed to upload schema",
      code: "SCHEMA_UPLOAD_ERROR",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it("returns CATEGORY_SEED_ERROR when category seed fails", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: [{ name: "blog" }] }),
      }) // list
      .mockResolvedValueOnce({ ok: true }) // schema
      .mockResolvedValueOnce({ ok: false }); // category

    const res = await setupSanityBlog(creds, { enabled: true });

    expect(res).toEqual({
      success: false,
      error: "Failed to seed category",
      code: "CATEGORY_SEED_ERROR",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    fetchSpy.mockRestore();
  });

  it("logs error when promotion scheduling fails and still succeeds", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockRejectedValueOnce(new Error("net")) // schedule
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: [{ name: "blog" }] }),
      }) // list
      .mockResolvedValueOnce({ ok: true }) // schema
      .mockResolvedValueOnce({ ok: true }); // category

    const res = await setupSanityBlog(
      creds,
      { enabled: true, promoteSchedule: "2024-01-01T00:00:00Z" },
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[setupSanityBlog] failed to schedule promotion",
      expect.any(Error),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(res).toEqual({ success: true });

    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("returns DATASET_LIST_ERROR when list request rejects", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockRejectedValueOnce(new Error("fail"));

    const res = await setupSanityBlog(creds, { enabled: true });

    expect(res).toEqual({
      success: false,
      error: "Failed to list datasets",
      code: "DATASET_LIST_ERROR",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("returns UNKNOWN_ERROR when listRes.json throws", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const fetchSpy = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("json fail");
        },
      });

    const res = await setupSanityBlog(creds, { enabled: true });

    expect(res).toEqual({
      success: false,
      error: "json fail",
      code: "UNKNOWN_ERROR",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[setupSanityBlog]",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});

