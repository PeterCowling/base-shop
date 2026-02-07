/**
 * Tests for /api/healthz health check endpoint.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { getDb } from "@/lib/d1.server";

import { GET } from "./route";

jest.mock("@/lib/d1.server", () => ({
  getDb: jest.fn(),
}));

const mockFirst = jest.fn();
const mockPrepare = jest.fn(() => ({ first: mockFirst }));

describe("/api/healthz", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.MockedFunction<typeof getDb>).mockReturnValue({
      prepare: mockPrepare,
    } as ReturnType<typeof getDb>);
    mockPrepare.mockReturnValue({ first: mockFirst });
    mockFirst.mockResolvedValue({ ok: 1 });
  });

  it("returns ok status when D1 query succeeds", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.d1).toBe("ok");
    expect(typeof data.timestamp).toBe("string");
  });

  it("checks D1 with SELECT 1", async () => {
    await GET();
    expect(mockPrepare).toHaveBeenCalledWith("SELECT 1 as ok");
    expect(mockFirst).toHaveBeenCalled();
  });

  it("returns degraded payload when D1 fails", async () => {
    mockFirst.mockRejectedValueOnce(new Error("db unavailable"));

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("degraded");
    expect(data.d1).toBe("error");
    expect(data.error).toContain("db unavailable");
    expect(typeof data.timestamp).toBe("string");
  });
});
