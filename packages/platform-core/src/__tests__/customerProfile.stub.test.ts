/** @jest-environment node */

import { createCustomerProfileDelegate } from "../db/stubs";

describe("createCustomerProfileDelegate", () => {
  it("findUnique returns the profile by customerId", async () => {
    const delegate = createCustomerProfileDelegate();
    const profile = {
      customerId: "c1",
      name: "Alice",
      email: "alice@example.com",
    };
    await delegate.upsert({
      where: { customerId: "c1" },
      create: profile,
      update: { name: "ignored" },
    });

    await expect(delegate.findUnique({ where: { customerId: "c1" } })).resolves.toEqual(profile);
  });

  it("findFirst respects email and NOT.customerId filters", async () => {
    const delegate = createCustomerProfileDelegate();
    await delegate.upsert({
      where: { customerId: "c1" },
      create: { customerId: "c1", name: "Alice", email: "a@example.com" },
      update: {},
    });
    await delegate.upsert({
      where: { customerId: "c2" },
      create: { customerId: "c2", name: "Bob", email: "a@example.com" },
      update: {},
    });

    await expect(
      delegate.findFirst({ where: { email: "a@example.com", NOT: { customerId: "c1" } } }),
    ).resolves.toEqual({ customerId: "c2", name: "Bob", email: "a@example.com" });
  });

  it("findFirst returns null when no profile matches the email", async () => {
    const delegate = createCustomerProfileDelegate();
    await delegate.upsert({
      where: { customerId: "c1" },
      create: { customerId: "c1", name: "Alice", email: "alice@example.com" },
      update: {},
    });

    await expect(
      delegate.findFirst({ where: { email: "bob@example.com" } }),
    ).resolves.toBeNull();
  });

  it("upsert creates a new profile when customerId does not exist", async () => {
    const delegate = createCustomerProfileDelegate();
    const profile = { customerId: "c1", name: "Alice", email: "alice@example.com" };

    await expect(
      delegate.upsert({
        where: { customerId: "c1" },
        create: profile,
        update: { name: "ignored" },
      }),
    ).resolves.toEqual(profile);
  });

  it("upsert updates an existing profile", async () => {
    const delegate = createCustomerProfileDelegate();

    await delegate.upsert({
      where: { customerId: "c1" },
      create: { customerId: "c1", name: "Alice", email: "a@example.com" },
      update: {},
    });

    await expect(
      delegate.upsert({
        where: { customerId: "c1" },
        create: { customerId: "c1", name: "Alice", email: "a@example.com" },
        update: { name: "Alice Updated", email: "alice.updated@example.com" },
      }),
    ).resolves.toEqual({
      customerId: "c1",
      name: "Alice Updated",
      email: "alice.updated@example.com",
    });
  });
});

