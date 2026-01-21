import { File } from "node:buffer";

import { NextRequest } from "next/server";

const parseDsPackage = jest.fn();
jest.mock("@acme/theme", () => ({ parseDsPackage }));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

async function reqFromFile(file: File, raw = false) {
  const text = await file.text();
  const body = raw ? text : JSON.stringify({ json: JSON.parse(text) });
  return new NextRequest("http://test.local", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("POST", () => {
  it("imports design system from JSON file", async () => {
    const file = new File([JSON.stringify({ tokens: { color: "#fff" } })], "ds.json", {
      type: "application/json",
    });
    parseDsPackage.mockReturnValue({ ok: true });
    const res = await POST(await reqFromFile(file));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(parseDsPackage).toHaveBeenCalledWith({ tokens: { color: "#fff" } });
  });

  it("returns 400 for invalid JSON file", async () => {
    const file = new File(["{ invalid"], "ds.json", { type: "application/json" });
    const res = await POST(await reqFromFile(file, true));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON" });
    expect(parseDsPackage).not.toHaveBeenCalled();
  });
});

