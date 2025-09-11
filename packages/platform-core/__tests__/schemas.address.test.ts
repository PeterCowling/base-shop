import { billingSchema } from "../src/schemas/address";

describe("billingSchema", () => {
  const validAddress = {
    line1: "123 Main St",
    city: "Springfield",
    postal_code: "12345",
    country: "US",
  };

  it("requires name, email, and address", () => {
    const result = billingSchema.safeParse({} as any);
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["name", "email", "address"]));
  });

  it("allows optional phone", () => {
    const result = billingSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      address: validAddress,
      // phone omitted
    });
    expect(result.success).toBe(true);
  });

  it("validates email format", () => {
    const result = billingSchema.safeParse({
      name: "John Doe",
      email: "not-an-email",
      address: validAddress,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["email"]);
    expect(result.error?.issues[0]?.message).toBe("Invalid email");
  });
});
