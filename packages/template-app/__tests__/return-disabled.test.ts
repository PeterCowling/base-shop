import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { setupReturnMocks } from "./helpers/return";

afterEach(() => jest.resetModules());

describe("/api/return disabled", () => {
  test("returns 403 when returns disabled", async () => {
    setupReturnMocks({ shop: { returnsEnabled: false } });

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as unknown as NextRequest);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Returns disabled" });
  });
});
