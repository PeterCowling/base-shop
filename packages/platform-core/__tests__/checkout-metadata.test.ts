import { buildCheckoutMetadata } from "../src/checkout/metadata";

describe("buildCheckoutMetadata", () => {
  const base = {
    shopId: "shop",
    cartId: "cart_123",
    orderId: "order_123",
    orderNumber: "A-1001",
    internalCustomerId: "cust_internal",
    stripeCustomerId: "cus_123",
    subtotal: 100,
    depositTotal: 50,
    returnDate: "2025-01-01",
    rentalDays: 3,
    discount: 5,
    coupon: "WELCOME",
    currency: "USD",
    taxRate: 0.2,
    taxAmount: 20,
    taxMode: "static_rates",
    environment: "test",
    inventoryReservationId: "hold_123",
    clientIp: "203.0.113.1",
    sizes: "M,L",
    extra: { foo: "bar" },
  } as const;

  test("populates strings and optional fields", () => {
    const result = buildCheckoutMetadata(base);

    expect(result).toMatchObject({
      shop_id: "shop",
      cart_id: "cart_123",
      order_id: "order_123",
      order_number: "A-1001",
      internal_customer_id: "cust_internal",
      stripe_customer_id: "cus_123",
      subtotal: "100",
      depositTotal: "50",
      returnDate: "2025-01-01",
      rentalDays: "3",
      discount: "5",
      coupon: "WELCOME",
      currency: "USD",
      taxRate: "0.2",
      taxAmount: "20",
      tax_mode: "static_rates",
      environment: "test",
      inventory_reservation_id: "hold_123",
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
      shopId: "shop",
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
