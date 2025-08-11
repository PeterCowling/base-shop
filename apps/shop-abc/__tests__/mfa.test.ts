// apps/shop-abc/__tests__/mfa.test.ts
import { POST as enrollPOST } from "../src/app/api/mfa/enroll/route";
import { POST as verifyPOST } from "../src/app/api/mfa/verify/route";
import { getCustomerSession, enrollMfa, verifyMfa } from "@auth";

jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  enrollMfa: jest.fn(),
  verifyMfa: jest.fn(),
}));

describe("MFA enroll", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("requires authentication", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const res = await enrollPOST({} as any);
    expect(res.status).toBe(401);
  });

  it("returns enrollment when authenticated", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1" });
    (enrollMfa as jest.Mock).mockResolvedValue({ secret: "s" });
    const res = await enrollPOST({} as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ secret: "s" });
  });
});

describe("MFA verify", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function makeReq(body: any) {
    return {
      json: async () => body,
      headers: new Headers(),
    } as any;
  }

  it("requires authentication", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const res = await verifyPOST(makeReq({ token: "123" }));
    expect(res.status).toBe(401);
  });

  it("rejects missing token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1" });
    const res = await verifyPOST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("verifies token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1" });
    (verifyMfa as jest.Mock).mockResolvedValue(true);
    const res = await verifyPOST(makeReq({ token: "123" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verified: true });
  });

  it("returns false for invalid token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1" });
    (verifyMfa as jest.Mock).mockResolvedValue(false);
    const res = await verifyPOST(makeReq({ token: "bad" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verified: false });
  });
});
