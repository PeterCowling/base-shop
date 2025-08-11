// apps/shop-abc/__tests__/register.test.ts
import { POST } from "../src/app/register/route";
import { createUser, getUserById, getUserByEmail } from "@platform-core/users";
import { validateCsrfToken } from "@auth";

jest.mock("@platform-core/users", () => ({
  __esModule: true,
  createUser: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
}));

jest.mock("@auth", () => ({
  __esModule: true,
  validateCsrfToken: jest.fn(),
}));

describe("/register POST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function makeReq(body: any, token = "token") {
    return {
      json: async () => body,
      headers: new Headers({ "x-csrf-token": token }),
    } as any;
  }

  it("registers a new user", async () => {
    (getUserById as jest.Mock).mockResolvedValue(null);
    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);

    const res = await POST(
      makeReq({
        customerId: "c1",
        email: "a@b.com",
        password: "Password1",
      })
    );
    expect(res.status).toBe(200);
    expect(createUser).toHaveBeenCalled();
  });

  it("rejects weak passwords", async () => {
    (getUserById as jest.Mock).mockResolvedValue(null);
    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);

    const res = await POST(
      makeReq({
        customerId: "c1",
        email: "a@b.com",
        password: "short",
      })
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid CSRF token", async () => {
    (getUserById as jest.Mock).mockResolvedValue(null);
    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (validateCsrfToken as jest.Mock).mockResolvedValue(false);

    const res = await POST(
      makeReq({
        customerId: "c1",
        email: "a@b.com",
        password: "Password1",
      }, "bad")
    );
    expect(res.status).toBe(403);
  });
});

