import {
  encodeCartCookie,
  PRODUCTS,
  calculateRentalDays,
  stripeCreate,
  findCouponMock,
  getTaxRateMock,
  createRequest,
  setMockCart,
  POST,
} from "./fixtures";

test("builds Stripe session with correct items and metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0);

  const sku = PRODUCTS[0];
  const size = "40";
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 2, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const returnDate = "2025-01-02";
  const expectedDays = calculateRentalDays(returnDate);
  const shipping = {
    name: "Jane Doe",
    address: {
      line1: "123 St",
      city: "Test",
      postal_code: "12345",
      country: "US",
    },
  };
  const billing = {
    name: "Jane Doe",
    email: "jane@example.com",
    address: shipping.address,
  };
  const req = createRequest(
    { returnDate, shipping, billing_details: billing },
    cookie,
    undefined,
    { "x-forwarded-for": "203.0.113.1" }
  );

  const res = await POST(req);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(2);
  expect(args.payment_intent_data.shipping.name).toBe("Jane Doe");
  expect(args.payment_intent_data.billing_details.email).toBe(
    "jane@example.com"
  );
  expect(
    args.payment_intent_data.payment_method_options.card.request_three_d_secure
  ).toBe("automatic");
  expect(args.payment_intent_data.metadata.client_ip).toBe("203.0.113.1");
  expect(args.metadata.client_ip).toBe("203.0.113.1");
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.sizes).toBe(JSON.stringify({ [sku.id]: size }));
  expect(args.metadata.subtotal).toBe("20");
  expect(body.clientSecret).toBe("cs_test");
});
