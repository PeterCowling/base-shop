// apps/shop-abc/__tests__/registerProfile.test.ts
jest.mock("@platform-core/users", () => ({
  __esModule: true,
  createUser: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
}));

let profile: any;
const updateCustomerProfile = jest.fn(async (id: string, data: any) => {
  profile = { customerId: id, ...data };
  return profile;
});
const getCustomerProfile = jest.fn(async () => profile);

jest.mock("@acme/platform-core/customerProfiles", () => ({
  __esModule: true,
  updateCustomerProfile,
  getCustomerProfile,
}));

jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

import { getCustomerSession } from "@auth";
import { getUserByEmail, getUserById } from "@platform-core/users";
import { POST as register } from "../src/app/register/route";
import { GET as getProfile } from "../src/app/api/account/profile/route";

function createRequest(body: any): any {
  return { json: async () => body } as any;
}

describe("registration initializes profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profile = null;
  });

  it("creates default profile and fetches it", async () => {
    (getUserById as jest.Mock).mockResolvedValue(null);
    (getUserByEmail as jest.Mock).mockResolvedValue(null);

    const res = await register(
      createRequest({
        customerId: "cust1",
        email: "new@example.com",
        password: "pw",
      })
    );
    expect(res.status).toBe(200);
    expect(updateCustomerProfile).toHaveBeenCalledWith("cust1", {
      name: "",
      email: "new@example.com",
    });

    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    const profileRes = await getProfile();
    expect(profileRes.status).toBe(200);
    expect(await profileRes.json()).toEqual({
      ok: true,
      profile: { customerId: "cust1", name: "", email: "new@example.com" },
    });
  });
});
