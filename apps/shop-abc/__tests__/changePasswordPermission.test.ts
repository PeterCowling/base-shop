// apps/shop-abc/__tests__/changePasswordPermission.test.ts
import { POST } from "../src/app/api/account/change-password/route";
import bcrypt from "bcryptjs";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@auth", () => ({
  requirePermission: jest.fn(),
  validateCsrfToken: jest.fn(),
}));

jest.mock("@acme/platform-core/users", () => ({
  getUserById: jest.fn(),
  updatePassword: jest.fn(),
}));

import { requirePermission, validateCsrfToken } from "@auth";
import { getUserById, updatePassword } from "@acme/platform-core/users";

function createRequest(body: any, token = "tok"): Parameters<typeof POST>[0] {
  return { json: async () => body, headers: new Headers({ "x-csrf-token": token }) } as any;
}

afterEach(() => {
  jest.clearAllMocks();
});

test("denies change without permission", async () => {
  (requirePermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
  const res = await POST(createRequest({ currentPassword: "OldPass1", newPassword: "NewPass1" }));
  expect(res.status).toBe(401);
});

test("allows change with permission", async () => {
  (requirePermission as jest.Mock).mockResolvedValue({ customerId: "c1" });
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const hash = await bcrypt.hash("OldPass1", 10);
  (getUserById as jest.Mock).mockResolvedValue({
    id: "c1",
    passwordHash: hash,
    emailVerified: true,
  });
  const res = await POST(createRequest({ currentPassword: "OldPass1", newPassword: "NewPass1A" }));
  expect(res.status).toBe(200);
  expect(updatePassword).toHaveBeenCalled();
});
