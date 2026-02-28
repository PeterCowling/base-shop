/** @jest-environment node */
// packages/axerve/src/index.test.ts

import type { AxervePaymentParams } from "./types";

const VALID_PARAMS: AxervePaymentParams = {
  shopLogin: "TEST_SHOP",
  apiKey: "TEST_API_KEY",
  uicCode: "978",
  amount: "10.00",
  shopTransactionId: "test-txn-001",
  cardNumber: "4111111111111111",
  expiryMonth: "12",
  expiryYear: "2027",
  cvv: "123",
  buyerName: "John Doe",
  buyerEmail: "john@example.com",
};

const OK_SOAP_RESPONSE = [
  {
    callPagamS2SResult: {
      TransactionResult: "OK",
      ShopTransactionID: "test-txn-001",
      BankTransactionID: "bank-txn-001",
      AuthorizationCode: "auth-456",
    },
  },
];

const KO_SOAP_RESPONSE = [
  {
    callPagamS2SResult: {
      TransactionResult: "KO",
      ShopTransactionID: "test-txn-001",
      BankTransactionID: "",
      ErrorCode: "01",
      ErrorDescription: "Card declined",
    },
  },
];

describe("callPayment", () => {
  const originalEnv = process.env;
  let mockCallPagamS2SAsync: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockCallPagamS2SAsync = jest.fn();
    jest.doMock("soap", () => ({
      createClientAsync: jest
        .fn()
        .mockResolvedValue({ callPagamS2SAsync: mockCallPagamS2SAsync }),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it("TC-03-01: SOAP OK response returns success result", async () => {
    mockCallPagamS2SAsync.mockResolvedValue(OK_SOAP_RESPONSE);
    const { callPayment } = await import("./index");
    const result = await callPayment(VALID_PARAMS);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe("test-txn-001");
    expect(result.bankTransactionId).toBe("bank-txn-001");
    expect(result.authCode).toBe("auth-456");
    expect(result.errorCode).toBeUndefined();
  });

  it("TC-03-02: SOAP KO response returns failure result", async () => {
    mockCallPagamS2SAsync.mockResolvedValue(KO_SOAP_RESPONSE);
    const { callPayment } = await import("./index");
    const result = await callPayment(VALID_PARAMS);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("01");
    expect(result.errorDescription).toBe("Card declined");
    expect(result.authCode).toBeUndefined();
  });

  it("TC-03-03: SOAP network error throws AxerveError", async () => {
    mockCallPagamS2SAsync.mockRejectedValue(new Error("network timeout"));
    const { callPayment, AxerveError } = await import("./index");

    await expect(callPayment(VALID_PARAMS)).rejects.toBeInstanceOf(AxerveError);
    await expect(callPayment(VALID_PARAMS)).rejects.toThrow("network timeout");
  });

  it("TC-03-04: AXERVE_USE_MOCK=true returns hardcoded success without SOAP call", async () => {
    process.env.AXERVE_USE_MOCK = "true";
    const { callPayment } = await import("./index");
    const result = await callPayment(VALID_PARAMS);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe("test-txn-001");
    expect(result.bankTransactionId).toBe("mock-bank-txn-001");
    expect(mockCallPagamS2SAsync).not.toHaveBeenCalled();
  });
});
