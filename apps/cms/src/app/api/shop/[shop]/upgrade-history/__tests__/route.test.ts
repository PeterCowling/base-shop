import fs from "fs/promises";
import { NextResponse } from "next/server";
import { logger } from "@acme/shared-utils";

const requirePermission = jest.fn();
jest.mock("@auth", () => ({ requirePermission }));

jest.mock("@acme/platform-core/shops", () => ({
  validateShopName: (val: string) => val,
}));

jest.mock("@acme/shared-utils", () => ({
  logger: { error: jest.fn() },
}));

let GET: typeof import("../route").GET;

describe("GET /api/shop/:id/upgrade-history", () => {
  beforeAll(async () => {
    ({ GET } = await import("../route"));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns parsed history entries", async () => {
    requirePermission.mockResolvedValue(undefined);
    jest.spyOn(fs, "readFile").mockResolvedValueOnce(
      JSON.stringify([
        {
          id: "job-1",
          status: "success",
          timestamp: "2025-01-01T00:00:00Z",
          components: ["a", "b"],
          user: "alex",
        },
      ])
    );

    const res = (await GET({} as any, { params: Promise.resolve({ shop: "s1" }) })) as NextResponse;
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([
      {
        id: "job-1",
        shopId: "s1",
        status: "success",
        timestamp: "2025-01-01T00:00:00Z",
        components: ["a", "b"],
        user: "alex",
      },
    ]);
  });

  it("returns empty array when history file missing", async () => {
    requirePermission.mockResolvedValue(undefined);
    jest
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));

    const res = (await GET({} as any, { params: Promise.resolve({ shop: "s1" }) })) as NextResponse;
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([]);
  });

  it("returns 401 when unauthorized", async () => {
    requirePermission.mockRejectedValueOnce(new Error("nope"));
    const res = (await GET({} as any, { params: Promise.resolve({ shop: "s1" }) })) as NextResponse;
    expect(res.status).toBe(401);
  });

  it("logs and returns 500 on unexpected error", async () => {
    requirePermission.mockResolvedValue(undefined);
    const err = new Error("boom");
    jest.spyOn(fs, "readFile").mockRejectedValueOnce(err);

    const res = (await GET({} as any, { params: Promise.resolve({ shop: "s1" }) })) as NextResponse;
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "boom" });
    expect(logger.error).toHaveBeenCalled();
  });
});
