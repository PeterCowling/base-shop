/** @jest-environment node */

import { getCustomerProfile } from "../profile";

describe("profile", () => {
  it("returns null regardless of customer id", async () => {
    expect(await getCustomerProfile()).toBeNull();
    expect(await getCustomerProfile("abc")).toBeNull();
  });
});

