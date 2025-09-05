import { fetchJson } from "../src/fetchJson";
import { z } from "zod";

describe("fetchJson", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("fetches and parses JSON on success", async () => {
    const data = { message: "ok" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });

    await expect(fetchJson<typeof data>("https://example.com")).resolves.toEqual(
      data,
    );
  });

  it("throws error message from JSON error payload", async () => {
    const errorPayload = { error: "Bad Request" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: jest.fn().mockResolvedValue(JSON.stringify(errorPayload)),
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "Bad Request",
    );
  });

  it("falls back to statusText when error payload lacks error field", async () => {
    const payload = { message: "fail" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "Server Error",
    );
  });

  it("returns undefined for invalid JSON bodies", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue("not json"),
    });

    await expect(fetchJson("https://example.com")).resolves.toBeUndefined();
  });

  it("validates data with an optional Zod schema", async () => {
    const data = { message: "ok" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });

    const schema = z.object({ message: z.string() }).strict();

    await expect(
      fetchJson("https://example.com", undefined, schema),
    ).resolves.toEqual(data);
  });
});
