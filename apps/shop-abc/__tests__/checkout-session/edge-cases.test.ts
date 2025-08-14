import {
  encodeCartCookie,
  PRODUCTS,
  stripeCreate,
  findCouponMock,
  getTaxRateMock,
  convertCurrencyMock,
  createRequest,
  setMockCart,
  POST,
} from "./fixtures";

test("omits deposit line when deposit is zero", async () => {
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

  const sku = { ...PRODUCTS[0], deposit: 0 };
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "2025-01-02" }, cookie);

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(1);
  expect(args.metadata.depositTotal).toBe("0");
  expect(args.payment_intent_data.metadata.depositTotal).toBe("0");
});

test("applies coupon discount and sets metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue({ code: "SAVE10", discountPercent: 10 });
  getTaxRateMock.mockResolvedValue(0);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest(
    { returnDate: "2025-01-02", coupon: "SAVE10" },
    cookie
  );

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.metadata.subtotal).toBe("9");
  expect(args.metadata.discount).toBe("1");
  expect(args.payment_intent_data.metadata.subtotal).toBe("9");
  expect(args.payment_intent_data.metadata.discount).toBe("1");
});

test("adds tax line item and metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0.2);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest(
    { returnDate: "2025-01-02", taxRegion: "EU" },
    cookie
  );

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(3);
  const taxItem = args.line_items[2];
  expect(taxItem.price_data.unit_amount).toBe(200);
  expect(args.metadata.taxAmount).toBe("2");
  expect(args.metadata.taxRate).toBe("0.2");
  expect(args.payment_intent_data.metadata.taxAmount).toBe("2");
});

test("handles fractional tax rates", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0.0775);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest(
    { returnDate: "2025-01-02", taxRegion: "EU" },
    cookie
  );

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(3);
  const taxItem = args.line_items[2];
  expect(taxItem.price_data.unit_amount).toBe(78);
  expect(args.metadata.taxAmount).toBe("0.78");
  expect(args.metadata.taxRate).toBe("0.0775");
  expect(args.payment_intent_data.metadata.taxAmount).toBe("0.78");
});

test("rounds unit amounts before sending to Stripe", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  convertCurrencyMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0);
  convertCurrencyMock
    .mockImplementationOnce(async () => 10.345)
    .mockImplementationOnce(async () => 20.265)
    .mockImplementation(async (n: number) => n);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "2025-01-02" }, cookie);

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items[0].price_data.unit_amount).toBe(
    Math.round(10.345 * 100)
  );
  expect(args.line_items[1].price_data.unit_amount).toBe(
    Math.round(20.265 * 100)
  );
  expect(Number.isInteger(args.line_items[0].price_data.unit_amount)).toBe(
    true
  );
  expect(Number.isInteger(args.line_items[1].price_data.unit_amount)).toBe(
    true
  );
});
