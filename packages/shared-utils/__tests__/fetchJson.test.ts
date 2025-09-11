import { fetchJson } from "../src/fetchJson";
import { z } from "zod";

describe("fetchJson", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("resolves parsed data when response is ok and schema provided", async () => {
    const body = { message: "ok" };
    const schema = z.object({ message: z.string() });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    });

    await expect(
      fetchJson("https://example.com", undefined, schema),
    ).resolves.toEqual(body);
  });

  it("throws error message from JSON payload when response not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: jest.fn().mockResolvedValue(
        JSON.stringify({ error: "Bad Request" }),
      ),
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "Bad Request",
    );
  });

  it("throws statusText when non-OK response lacks error message", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: jest.fn().mockResolvedValue("<html></html>"),
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "Server Error",
    );
  });

  it("rejects when fetch rejects", async () => {
    const error = new Error("network");
    (global.fetch as jest.Mock).mockRejectedValue(error);

    await expect(fetchJson("https://example.com")).rejects.toBe(error);
  });

  it("throws parsing error when JSON invalid and schema provided", async () => {
    const schema = z.object({ message: z.string() });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue("not json"),
    });

    await expect(
      fetchJson("https://example.com", undefined, schema),
    ).rejects.toBeInstanceOf(z.ZodError);
  });

  it("resolves undefined when JSON is invalid and no schema provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue("not json"),
    });

    await expect(fetchJson("https://example.com")).resolves.toBeUndefined();
  });
});

