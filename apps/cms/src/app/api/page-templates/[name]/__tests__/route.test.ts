/*
  eslint-disable security/detect-non-literal-fs-filename -- SEC-TEST-002: Test builds file paths inside a temp directory with known names; no user input or traversal risk.
*/
import { NextRequest } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";

let route: typeof import("../route");

beforeAll(async () => {
  route = await import("../route");
});

afterEach(() => {
  jest.restoreAllMocks();
});

function req(name: string) {
  return new NextRequest(`http://test.local/${name}`);
}

describe("GET", () => {
  it("reads and returns existing template", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tpl-"));
    fs.writeFileSync(path.join(dir, "home.json"), JSON.stringify({ ok: true }));
    jest.spyOn(route, "resolveTemplatesRoot").mockReturnValue(dir);

    const res = await route.GET(req("home"), {
      params: Promise.resolve({ name: "home" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("returns 404 for missing template", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tpl-"));
    jest.spyOn(route, "resolveTemplatesRoot").mockReturnValue(dir);

    const res = await route.GET(req("missing"), {
      params: Promise.resolve({ name: "missing" }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not found" });
  });

  it("returns 404 when templates root resolution fails", async () => {
    jest
      .spyOn(route, "resolveTemplatesRoot")
      .mockImplementation(() => {
        throw new Error("fail");
      });

    const res = await route.GET(req("any"), {
      params: Promise.resolve({ name: "any" }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not found" });
  });
});
