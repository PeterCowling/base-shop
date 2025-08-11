// apps/shop-abc/__tests__/registerValidation.test.ts
jest.mock("@platform-core/users", () => ({
  createUser: jest.fn().mockResolvedValue(undefined),
  getUserById: jest.fn().mockResolvedValue(null),
  getUserByEmail: jest.fn().mockResolvedValue(null),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed"),
}));

let POST: typeof import("../src/app/api/register/route").POST;

beforeAll(async () => {
  ({ POST } = await import("../src/app/api/register/route"));
});

function makeRequest(body: any) {
  return { json: async () => body } as any;
}

describe("/api/register password validation", () => {
  it("rejects weak passwords", async () => {
    const res = await POST(
      makeRequest({
        customerId: "weak",
        email: "weak@example.com",
        password: "short",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts strong passwords", async () => {
    const res = await POST(
      makeRequest({
        customerId: "strong",
        email: "strong@example.com",
        password: "Str0ngPass!",
      }),
    );
    expect(res.status).toBe(200);
  });
});
