// apps/shop-abc/__tests__/mfaApi.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
  enrollMfa: jest.fn(),
  verifyMfa: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@acme/platform-core/users", () => ({
  getUserById: jest.fn().mockResolvedValue({ role: "customer" }),
}));

import {
  getCustomerSession,
  validateCsrfToken,
  enrollMfa,
  verifyMfa,
} from "@auth";
import { POST as enrollPost } from "../src/app/api/mfa/enroll/route";
import { POST as verifyPost } from "../src/app/api/mfa/verify/route";

describe("/api/mfa/enroll POST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 401 for unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const req = { headers: new Headers({ "x-csrf-token": "tok" }) } as any;
    const res = await enrollPost(req);
    expect(res.status).toBe(401);
  });

  it("rejects requests without valid CSRF token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (validateCsrfToken as jest.Mock).mockResolvedValue(false);
    const req = { headers: new Headers() } as any;
    const res = await enrollPost(req);
    expect(res.status).toBe(403);
  });

  it("returns enrollment data", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    const enrollment = { secret: "abc", otpauth: "otpauth://..." };
    (enrollMfa as jest.Mock).mockResolvedValue(enrollment);
    const req = { headers: new Headers({ "x-csrf-token": "tok" }) } as any;
    const res = await enrollPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(enrollment);
  });
});

describe("/api/mfa/verify POST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 401 for unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({ token: "123" }),
    } as any;
    const res = await verifyPost(req);
    expect(res.status).toBe(401);
  });

  it("rejects requests without valid CSRF token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (validateCsrfToken as jest.Mock).mockResolvedValue(false);
    const req = {
      headers: new Headers(),
      json: async () => ({ token: "123" }),
    } as any;
    const res = await verifyPost(req);
    expect(res.status).toBe(403);
  });

  it("requires a token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({ }),
    } as any;
    const res = await verifyPost(req);
    expect(res.status).toBe(400);
  });

  it("returns verification result", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    (verifyMfa as jest.Mock).mockResolvedValue(true);
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({ token: "123" }),
    } as any;
    const res = await verifyPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verified: true });
  });

  it("returns false for invalid token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    (verifyMfa as jest.Mock).mockResolvedValue(false);
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({ token: "123" }),
    } as any;
    const res = await verifyPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verified: false });
  });
});
