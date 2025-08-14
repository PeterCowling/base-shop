import {
  encodeCartCookie,
  PRODUCTS,
  dateUtils,
  stripeCreate,
  findCouponMock,
  getTaxRateMock,
  createRequest,
  setMockCart,
  POST,
} from "./fixtures";

test("responds with 400 on invalid returnDate", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "not-a-date" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
});

test("responds with 400 on past or same-day returnDate", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const spy = jest.spyOn(dateUtils, "calculateRentalDays").mockReturnValue(0);
  const req = createRequest({ returnDate: "2025-01-01" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
  spy.mockRestore();
});

test("returns 400 for unsupported currency", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest(
    { returnDate: "2025-01-02", currency: "JPY" },
    cookie
  );
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.currency[0]).toMatch(/invalid/i);
});

test("returns 400 for unsupported tax region", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest(
    { returnDate: "2025-01-02", taxRegion: "DE" },
    cookie
  );
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.taxRegion[0]).toMatch(/invalid/i);
});

test("responds with 502 when Stripe session creation fails", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockRejectedValue(new Error("Stripe error"));
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0);
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  setMockCart(cart);
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "2025-01-02" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(502);
  const body = await res.json();
  expect(body.error).toBe("Checkout failed");
});
