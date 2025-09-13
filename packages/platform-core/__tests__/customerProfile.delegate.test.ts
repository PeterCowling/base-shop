import { createCustomerProfileDelegate } from "../src/db/stubs/customerProfile";

describe("createCustomerProfileDelegate", () => {
  it("findFirst respects NOT.customerId", async () => {
    const delegate = createCustomerProfileDelegate();
    await delegate.upsert({
      where: { customerId: "a" },
      update: {},
      create: { customerId: "a", name: "Alice", email: "a@example.com" },
    });

    const missing = await delegate.findFirst({
      where: { email: "a@example.com", NOT: { customerId: "a" } },
    });
    expect(missing).toBeNull();

    await delegate.upsert({
      where: { customerId: "b" },
      update: {},
      create: { customerId: "b", name: "Bob", email: "a@example.com" },
    });

    const found = await delegate.findFirst({
      where: { email: "a@example.com", NOT: { customerId: "a" } },
    });
    expect(found).toEqual({ customerId: "b", name: "Bob", email: "a@example.com" });
  });

  it("upsert merges updates when profile exists", async () => {
    const delegate = createCustomerProfileDelegate();
    await delegate.upsert({
      where: { customerId: "a" },
      update: {},
      create: { customerId: "a", name: "Alice", email: "a@example.com" },
    });

    const updated = await delegate.upsert({
      where: { customerId: "a" },
      update: { name: "Alicia" },
      create: { customerId: "a", name: "ignored", email: "ignored@example.com" },
    });

    expect(updated).toEqual({ customerId: "a", name: "Alicia", email: "a@example.com" });
  });

  it("upsert inserts new profiles when missing", async () => {
    const delegate = createCustomerProfileDelegate();
    const created = await delegate.upsert({
      where: { customerId: "c" },
      update: { name: "should not apply" },
      create: { customerId: "c", name: "Carol", email: "c@example.com" },
    });

    expect(created).toEqual({ customerId: "c", name: "Carol", email: "c@example.com" });
  });
});

