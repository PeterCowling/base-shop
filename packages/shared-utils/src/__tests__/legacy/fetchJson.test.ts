import { fetchJson } from "../../fetchJson";
import { z } from "zod";

describe("fetchJson", () => {
  beforeEach(() => {
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

  it("throws ZodError when response JSON does not match schema", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ msg: "hi" })),
    });

    const schema = z.object({ msg: z.number() });

    await expect(
      fetchJson("https://example.com", undefined, schema)
    ).rejects.toBeInstanceOf(z.ZodError);
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

  it.each([204, 205])(
    "returns undefined for %s responses with empty body",
    async (status) => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status,
        text: jest.fn().mockResolvedValue(""),
      });

      const schema = z.undefined();

      await expect(
        fetchJson("https://example.com", undefined, schema)
      ).resolves.toBeUndefined();
    }
  );

  it("throws body error message on HTTP 400 with JSON error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: "bad" })),
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow("bad");
  });

  it("uses status text on HTTP 400 with non-JSON body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: jest.fn().mockResolvedValue("not-json"),
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "Bad Request"
    );
  });

  it("forwards fetch rejections", async () => {
    const err = new Error("network failure");
    (global.fetch as jest.Mock).mockRejectedValue(err);

    await expect(fetchJson("https://example.com")).rejects.toBe(err);
  });

  it("forwards AbortError rejections", async () => {
    const err = new DOMException("aborted", "AbortError");
    (global.fetch as jest.Mock).mockRejectedValue(err);

    await expect(fetchJson("https://example.com")).rejects.toBe(err);
  });

  it("defaults to GET when no init is provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(""),
    });

    await fetchJson("https://example.com");
    expect(global.fetch).toHaveBeenCalledWith("https://example.com", undefined);
  });

  it("supports POST with body and custom headers", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ ok: true })),
    });

    const schema = z.object({ ok: z.boolean() });

    await expect(
      fetchJson(
        "https://example.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Custom": "yes",
          },
          body: JSON.stringify({ hi: "there" }),
        },
        schema
      )
    ).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith("https://example.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Custom": "yes",
      },
      body: JSON.stringify({ hi: "there" }),
    });
  });
});
