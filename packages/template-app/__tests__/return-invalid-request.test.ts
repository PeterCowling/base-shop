import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { setupReturnMocks } from "./helpers/return";

afterEach(() => jest.resetModules());

describe("/api/return invalid", () => {
  test("returns 400 for invalid request", async () => {
    setupReturnMocks();

    const { POST } = await import("../src/api/return/route");
    const res = await POST({ json: async () => ({}) } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request" });
  });
});
