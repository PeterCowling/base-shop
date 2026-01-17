// apps/cover-me-pretty/__tests__/api/accountProfile.test.ts

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

type CustomerProfile = {
  customerId: string;
  name: string;
  email: string;
};

const getCustomerSession = jest.fn();
let profile: CustomerProfile | null;
const updateCustomerProfile = jest.fn(
  async (_id: string, data: Partial<CustomerProfile>) => {
    profile = {
      customerId: _id,
      name: data.name ?? "",
      email: data.email ?? "",
    };
    return profile;
  },
);
const getCustomerProfile = jest.fn(async (_id: string) => profile);

jest.mock("@acme/auth", () => ({ __esModule: true, getCustomerSession }));
jest.mock("@acme/platform-core/customerProfiles", () => ({
  __esModule: true,
  getCustomerProfile,
  updateCustomerProfile,
}));

import { PUT } from "../../src/app/api/account/profile/route";
import { jsonRequest } from "@acme/test-utils";
const createRequest = (body: Record<string, unknown>) => jsonRequest(body);

beforeEach(() => {
  jest.clearAllMocks();
  profile = { customerId: "cust1", name: "Old", email: "old@example.com" };
});

test("returns 401 for unauthorized", async () => {
  getCustomerSession.mockResolvedValue(null);
  const res = await PUT(createRequest({ name: "New", email: "new@example.com" }));
  expect(res.status).toBe(401);
});

test("returns 400 with validation errors", async () => {
  getCustomerSession.mockResolvedValue({ customerId: "cust1" });
  const res = await PUT(createRequest({ name: "", email: "invalid" }));
  const body = await res.json();
  expect(res.status).toBe(400);
  expect(body.name).toBeDefined();
  expect(body.email).toBeDefined();
});

test("updates profile with valid payload", async () => {
  getCustomerSession.mockResolvedValue({ customerId: "cust1" });
  const res = await PUT(
    createRequest({ name: "New Name", email: "new@example.com" })
  );
  const body = await res.json();
  expect(updateCustomerProfile).toHaveBeenCalledWith("cust1", {
    name: "New Name",
    email: "new@example.com",
  });
  expect(body).toEqual({
    ok: true,
    profile: { customerId: "cust1", name: "New Name", email: "new@example.com" },
  });
});
