/*
  eslint-disable security/detect-non-literal-fs-filename -- SEC-TEST-001: Tests construct temp file paths under os.tmpdir with controlled inputs; no user input involved.
*/
import { NextRequest } from "next/server";
import { __setMockSession } from "next-auth";
import fs, { promises as fsp } from "fs";
import os from "os";
import path from "path";

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const resolveDataRoot = jest.fn();
jest.mock("@acme/platform-core/dataRoot", () => ({ resolveDataRoot }));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

let tmpDir: string;

beforeEach(async () => {
  jest.clearAllMocks();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "discounts-"));
  resolveDataRoot.mockReturnValue(tmpDir);
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true, force: true });
});

function req(body: any, shop = "s1") {
  return new NextRequest(`http://test.local/api?shop=${shop}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST", () => {
  it("creates new discount", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const res = await POST(req({
      code: "SAVE10",
      description: "10% off",
      discountPercent: 10,
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    const file = path.join(tmpDir, "s1", "discounts.json");
    const contents = JSON.parse(await fsp.readFile(file, "utf8"));
    expect(contents).toEqual([
      {
        code: "SAVE10",
        description: "10% off",
        discountPercent: 10,
        active: true,
      },
    ]);
  });

  it("updates existing discount when code duplicates", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const file = path.join(tmpDir, "s1", "discounts.json");
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.writeFile(
      file,
      JSON.stringify([
        { code: "save10", description: "old", discountPercent: 5, active: true },
      ]),
      "utf8",
    );

    const res = await POST(
      req({ code: "SAVE10", description: "new", discountPercent: 20 })
    );
    expect(res.status).toBe(200);
    const contents = JSON.parse(await fsp.readFile(file, "utf8"));
    expect(contents).toHaveLength(1);
    expect(contents[0]).toEqual({
      code: "SAVE10",
      description: "new",
      discountPercent: 20,
      active: true,
    });
  });

  it("returns 403 without admin session", async () => {
    __setMockSession(null as any);
    const res = await POST(
      req({ code: "SAVE10", description: "10% off", discountPercent: 10 })
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
    await expect(
      fsp.readFile(path.join(tmpDir, "s1", "discounts.json"), "utf8")
    ).rejects.toBeTruthy();
  });
});
