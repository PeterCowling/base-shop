import { fetchJson } from "./fetchJson";
import { z } from "zod";

describe("fetchJson", () => {
  beforeEach(() => {
    // @ts-expect-error - mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns parsed data when response is 200 and matches schema", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ msg: "hi" })),
    });

    const schema = z.object({ msg: z.string() });

    await expect(
      fetchJson("https://example.com", undefined, schema)
    ).resolves.toEqual({ msg: "hi" });
  });

  it("returns undefined when JSON parsing fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue("not-json"),
    });

    await expect(fetchJson("https://example.com")).resolves.toBeUndefined();
  });

  it("throws body error message on HTTP 500", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: "msg" })),
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow("msg");
  });

  it("uses status text when body is not JSON on HTTP 404", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: jest.fn().mockResolvedValue(""),
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow("Not Found");
  });
});
