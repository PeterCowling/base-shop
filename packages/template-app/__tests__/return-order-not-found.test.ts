import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";
import { setupReturnMocks } from "./helpers/return";
import { asNextJson } from "@acme/test-utils";

afterEach(() => jest.resetModules());

describe("/api/return order not found", () => {
  test("returns 404 when order not found", async () => {
    const { markReturned } = setupReturnMocks();
    markReturned.mockResolvedValue(null);

    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson({ sessionId: "sess" }));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Order not found" });
  });
});
