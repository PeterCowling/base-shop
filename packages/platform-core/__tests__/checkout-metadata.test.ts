import { buildCheckoutMetadata } from "../src/checkout/metadata";

describe("buildCheckoutMetadata", () => {
  const base = {
    subtotal: 100,
    depositTotal: 50,
    returnDate: "2025-01-01",
    rentalDays: 3,
    customerId: "cus_123",
    discount: 5,
    coupon: "WELCOME",
    currency: "USD",
    taxRate: 0.2,
    taxAmount: 20,
    clientIp: "203.0.113.1",
    sizes: "M,L",
    extra: { foo: "bar" },
  } as const;

  test("populates strings and optional fields", () => {
    const result = buildCheckoutMetadata(base);

    expect(result).toMatchObject({
      subtotal: "100",
      depositTotal: "50",
      returnDate: "2025-01-01",
      rentalDays: "3",
      customerId: "cus_123",
      discount: "5",
      coupon: "WELCOME",
      currency: "USD",
      taxRate: "0.2",
      taxAmount: "20",
      client_ip: "203.0.113.1",
      sizes: "M,L",
      foo: "bar",
    });

    Object.values(result).forEach((value) => {
      expect(typeof value).toBe("string");
    });
  });

  test("omits optional keys when absent", () => {
    const result = buildCheckoutMetadata({
      subtotal: 100,
      depositTotal: 50,
      rentalDays: 3,
      discount: 5,
      currency: "USD",
      taxRate: 0.2,
      taxAmount: 20,
    });

    expect(result).not.toHaveProperty("client_ip");
    expect(result).not.toHaveProperty("sizes");
    expect(result).not.toHaveProperty("foo");
  });

  test("allows extra to override defaults", () => {
    const result = buildCheckoutMetadata({
      ...base,
      extra: { coupon: "OVERRIDE" },
    });

    expect(result.coupon).toBe("OVERRIDE");
  });
});

