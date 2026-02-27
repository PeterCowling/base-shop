// packages/axerve/src/index.test.ts
// Spike-level validation: import and mock mode only
// Full TC-03 suite added in IMPLEMENT-03

describe("axerve/index (spike)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("TC-S1-01: exports callPayment function", async () => {
    const { callPayment } = await import("./index");
    expect(typeof callPayment).toBe("function");
  });

  it("TC-S1-02: AXERVE_USE_MOCK=true returns hardcoded success without SOAP call", async () => {
    process.env.AXERVE_USE_MOCK = "true";
    const { callPayment } = await import("./index");
    const result = await callPayment({
      shopLogin: "TEST_SHOP",
      apiKey: "TEST_API_KEY",
      uicCode: "978",
      amount: "10.00",
      shopTransactionId: "test-txn-001",
      cardNumber: "4111111111111111",
      expiryMonth: "12",
      expiryYear: "2027",
      cvv: "123",
    });
    expect(result.success).toBe(true);
    expect(result.transactionId).toBe("test-txn-001");
    expect(result.bankTransactionId).toBe("mock-bank-txn-001");
  });
});
