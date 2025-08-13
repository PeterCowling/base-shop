// apps/shop-abc/__tests__/changePasswordApi.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
  hasPermission: jest.requireActual("@auth/permissions").hasPermission,
}));

jest.mock("@acme/platform-core/users", () => ({
  __esModule: true,
  getUserById: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { getCustomerSession, validateCsrfToken } from "@auth";
import { getUserById, updatePassword } from "@acme/platform-core/users";
import bcrypt from "bcryptjs";
import { POST } from "../src/app/api/account/change-password/route";

describe("/api/account/change-password POST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 403 when lacking change_password permission", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "viewer",
    });
    const req = { headers: new Headers(), json: async () => ({}) } as any;
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("changes password for authorized user", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    (getUserById as jest.Mock).mockResolvedValue({
      id: "cust1",
      passwordHash: "old",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue("newhash");
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({
        currentPassword: "Oldpass1",
        newPassword: "Newpass1",
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(updatePassword).toHaveBeenCalledWith("cust1", "newhash");
  });
});
