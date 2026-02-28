import { NextRequest } from "next/server";

import { POST } from "@/app/api/checkout-session/route";

// AxerveError is defined inside the factory so jest.mock hoisting works cleanly.
// We retrieve the constructor via jest.requireMock after registration.
jest.mock("@acme/axerve", () => {
  class MockAxerveError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AxerveError";
    }
  }
  return {
    callPayment: jest.fn(),
    AxerveError: MockAxerveError,
  };
});

jest.mock("@acme/platform-core/cartCookie", () => ({
  CART_COOKIE: "__Host-CART_ID",
  decodeCartCookie: jest.fn(),
}));

jest.mock("@acme/platform-core/cartStore", () => ({
  getCart: jest.fn(),
  deleteCart: jest.fn(),
}));

jest.mock("@acme/platform-core/email", () => ({
  sendSystemEmail: jest.fn(),
}));

const mockAxerve = jest.requireMock("@acme/axerve") as {
  callPayment: jest.Mock;
  AxerveError: new (message: string) => Error;
};
const { callPayment } = mockAxerve;
const MockAxerveError = mockAxerve.AxerveError;

const { decodeCartCookie } = jest.requireMock("@acme/platform-core/cartCookie") as {
  decodeCartCookie: jest.Mock;
};

const { getCart, deleteCart } = jest.requireMock("@acme/platform-core/cartStore") as {
  getCart: jest.Mock;
  deleteCart: jest.Mock;
};

const { sendSystemEmail } = jest.requireMock("@acme/platform-core/email") as {
  sendSystemEmail: jest.Mock;
};

const VALID_CARD_BODY = {
  lang: "en",
  cardNumber: "4111111111111111",
  expiryMonth: "12",
  expiryYear: "2027",
  cvv: "123",
  buyerName: "Jane Doe",
  buyerEmail: "jane@example.com",
};

const makeReq = (body?: unknown) =>
  new NextRequest("http://localhost/api/checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

const mockCartItem = {
  sku: {
    id: "sku-1",
    title: "Silver Ring",
    price: 4500,
    stock: 5,
    sizes: [],
    slug: "silver-ring",
    description: "",
    deposit: 0,
    media: [],
    status: "active",
  },
  qty: 1,
};

describe("POST /api/checkout-session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MERCHANT_NOTIFY_EMAIL = "merchant@test.com";
    // Suppress expected console.error calls (KO response, SOAP error)
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.MERCHANT_NOTIFY_EMAIL;
    jest.restoreAllMocks();
  });

  it("TC-04-01: populated cart + valid card data returns 200 with success result, deletes cart, and expires cookie", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    deleteCart.mockResolvedValue(undefined);
    sendSystemEmail.mockResolvedValue(undefined);
    callPayment.mockResolvedValue({
      success: true,
      transactionId: "txn-001",
      bankTransactionId: "bank-txn-001",
      authCode: "auth-456",
    });

    const res = await POST(makeReq(VALID_CARD_BODY) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      transactionId: string;
      amount: number;
      currency: string;
    };
    expect(body.success).toBe(true);
    expect(body.transactionId).toBe("txn-001");
    expect(body.amount).toBe(4500);
    expect(body.currency).toBe("eur");
    expect(deleteCart).toHaveBeenCalledWith("cart-abc");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("__Host-CART_ID=;");
    // Wait a tick for the fire-and-forget promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendSystemEmail).toHaveBeenCalledTimes(2);
    expect(sendSystemEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ to: "merchant@test.com" }),
    );
    expect(sendSystemEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ to: "jane@example.com" }),
    );
  });

  it("TC-04-02: empty cart returns 400", async () => {
    decodeCartCookie.mockReturnValue(null);

    const res = await POST(makeReq(VALID_CARD_BODY) as never);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Cart is empty");
  });

  it("TC-04-03: Axerve KO response returns 402", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    callPayment.mockResolvedValue({
      success: false,
      transactionId: "txn-002",
      bankTransactionId: "",
      errorCode: "01",
      errorDescription: "Card declined",
    });

    const res = await POST(makeReq(VALID_CARD_BODY) as never);
    expect(res.status).toBe(402);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe("Card declined");
  });

  it("TC-04-04: Axerve SOAP error returns 502", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    callPayment.mockRejectedValue(new MockAxerveError("SOAP connection failed"));

    const res = await POST(makeReq(VALID_CARD_BODY) as never);
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Payment service unavailable");
  });

  it("TC-04-05: missing card fields in body returns 400", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });

    const res = await POST(makeReq({ lang: "en" }) as never); // no card fields
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Missing required payment fields");
  });

  it("TC-04-06: sendSystemEmail throws → success response still returned", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    deleteCart.mockResolvedValue(undefined);
    callPayment.mockResolvedValue({
      success: true,
      transactionId: "txn-001",
      bankTransactionId: "bank-txn-001",
      authCode: "auth-456",
    });
    sendSystemEmail.mockRejectedValue(new Error("SMTP connection refused"));

    const res = await POST(makeReq(VALID_CARD_BODY) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("TC-04-07: Axerve KO response → sendSystemEmail not called", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    callPayment.mockResolvedValue({
      success: false,
      transactionId: "txn-002",
      bankTransactionId: "",
      errorCode: "01",
      errorDescription: "Card declined",
    });

    const res = await POST(makeReq(VALID_CARD_BODY) as never);
    expect(res.status).toBe(402);
    expect(sendSystemEmail).not.toHaveBeenCalled();
  });

  it("TC-04-08: success + empty buyerEmail → sendSystemEmail called once (merchant only)", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    deleteCart.mockResolvedValue(undefined);
    sendSystemEmail.mockResolvedValue(undefined);
    callPayment.mockResolvedValue({
      success: true,
      transactionId: "txn-001",
      bankTransactionId: "bank-txn-001",
      authCode: "auth-456",
    });

    const res = await POST(makeReq({ ...VALID_CARD_BODY, buyerEmail: "" }) as never);
    expect(res.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendSystemEmail).toHaveBeenCalledTimes(1);
    expect(sendSystemEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ to: "merchant@test.com" }),
    );
  });

  it("TC-04-09: customer email throws → success response still returned", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    deleteCart.mockResolvedValue(undefined);
    sendSystemEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("SMTP error"));
    callPayment.mockResolvedValue({
      success: true,
      transactionId: "txn-001",
      bankTransactionId: "bank-txn-001",
      authCode: "auth-456",
    });

    const res = await POST(makeReq(VALID_CARD_BODY) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("TC-04-10: whitespace-only buyerEmail → sendSystemEmail called once (merchant only)", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    deleteCart.mockResolvedValue(undefined);
    sendSystemEmail.mockResolvedValue(undefined);
    callPayment.mockResolvedValue({
      success: true,
      transactionId: "txn-001",
      bankTransactionId: "bank-txn-001",
      authCode: "auth-456",
    });

    const res = await POST(makeReq({ ...VALID_CARD_BODY, buyerEmail: "   " }) as never);
    expect(res.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendSystemEmail).toHaveBeenCalledTimes(1);
    expect(sendSystemEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ to: "merchant@test.com" }),
    );
  });
});
