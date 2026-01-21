import { promises as fs } from "fs";

import { POST } from "../src/app/api/publish/route";

jest.mock("fs", () => ({ promises: { readFile: jest.fn() } }));
const readFile = fs.readFile as unknown as jest.Mock;

jest.mock("@auth", () => ({ requirePermission: jest.fn() }));
const requirePermission = jest.requireMock("@auth").requirePermission as jest.Mock;

jest.mock("child_process", () => ({ spawnSync: jest.fn() }));
const spawnSync = jest.requireMock("child_process").spawnSync as jest.Mock;

describe("api publish route", () => {
  beforeEach(() => {
    readFile.mockReset();
    requirePermission.mockReset();
    spawnSync.mockReset();
  });

  it("returns 401 when unauthorized", async () => {
    requirePermission.mockRejectedValue(new Error("no"));
    const res = await POST();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("validates shop id", async () => {
    requirePermission.mockResolvedValue(undefined);
    readFile.mockResolvedValue(JSON.stringify({ id: "invalid!" }));
    const res = await POST();
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid shop ID");
  });

  it("returns 500 on publish failure", async () => {
    requirePermission.mockResolvedValue(undefined);
    readFile.mockResolvedValue(JSON.stringify({ id: "shop" }));
    spawnSync.mockReturnValue({ status: 1 });
    const res = await POST();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Publish failed");
  });

  it("returns ok on success", async () => {
    requirePermission.mockResolvedValue(undefined);
    readFile.mockResolvedValue(JSON.stringify({ id: "shop" }));
    spawnSync.mockReturnValue({ status: 0 });
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ status: "ok" });
  });
});

