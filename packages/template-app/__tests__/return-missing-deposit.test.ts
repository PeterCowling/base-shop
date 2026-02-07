import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { type SessionSubset,setupReturnMocks } from "./helpers/return";

afterEach(() => jest.resetModules());

describe("/api/return missing deposit", () => {
  test("returns ok false when deposit missing", async () => {
    const session: SessionSubset = { metadata: {} } as SessionSubset;
    const { refundCreate } = setupReturnMocks({ session });

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as unknown as NextRequest);

    expect(refundCreate).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({
      ok: false,
      message: "No deposit found",
    });
  });
});
