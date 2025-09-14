import { getCustomerProfile } from "../src/profile";

describe("getCustomerProfile", () => {
  it("always resolves to null", async () => {
    await expect(getCustomerProfile()).resolves.toBeNull();
    await expect(getCustomerProfile("bcd")).resolves.toBeNull();
  });
});
