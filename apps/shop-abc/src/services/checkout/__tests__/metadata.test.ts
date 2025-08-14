import { buildCheckoutMetadata } from "../metadata";

describe("buildCheckoutMetadata", () => {
  it("builds metadata with optional fields", () => {
    const result = buildCheckoutMetadata({
      subtotal: 100,
      depositTotal: 50,
      returnDate: "2025-01-01",
      rentalDays: 5,
      customerId: "c1",
      discount: 10,
      coupon: "SAVE",
      currency: "EUR",
      taxRate: 0.2,
      taxAmount: 20,
      clientIp: "127.0.0.1",
      sizes: '{"p1":"M"}',
    });

    expect(result).toEqual({
      subtotal: "100",
      depositTotal: "50",
      returnDate: "2025-01-01",
      rentalDays: "5",
      sizes: '{"p1":"M"}',
      customerId: "c1",
      discount: "10",
      coupon: "SAVE",
      currency: "EUR",
      taxRate: "0.2",
      taxAmount: "20",
      client_ip: "127.0.0.1",
    });
  });

  it("omits optional fields when absent", () => {
    const result = buildCheckoutMetadata({
      subtotal: 0,
      depositTotal: 0,
      rentalDays: 3,
      discount: 0,
      currency: "USD",
      taxRate: 0,
      taxAmount: 0,
    });

    expect(result).toEqual({
      subtotal: "0",
      depositTotal: "0",
      returnDate: "",
      rentalDays: "3",
      customerId: "",
      discount: "0",
      coupon: "",
      currency: "USD",
      taxRate: "0",
      taxAmount: "0",
    });
    expect(result).not.toHaveProperty("client_ip");
    expect(result).not.toHaveProperty("sizes");
  });
});
