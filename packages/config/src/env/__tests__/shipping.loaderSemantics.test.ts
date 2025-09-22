import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { resetShippingEnv, setShippingEnv } from "./shipping.test-helpers";

afterEach(() => {
  resetShippingEnv();
  jest.clearAllMocks();
});

describe("loader vs eager parse semantics", () => {
  it("does not reparse shippingEnv after import", async () => {
    setShippingEnv({ DEFAULT_COUNTRY: "us" } as NodeJS.ProcessEnv);
    const mod = await import("../shipping.ts");
    expect(mod.shippingEnv.DEFAULT_COUNTRY).toBe("US");

    process.env.DEFAULT_COUNTRY = "ca";
    expect(mod.shippingEnv.DEFAULT_COUNTRY).toBe("US");
    expect(mod.loadShippingEnv(process.env).DEFAULT_COUNTRY).toBe("CA");
  });
});
