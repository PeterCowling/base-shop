import { requireStaffAuth } from "../../../mcp/_shared/staff-auth";
import { POST } from "../route";

// Mock requireStaffAuth to isolate route logic from auth internals
jest.mock("../../../mcp/_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

const requireStaffAuthMock = requireStaffAuth as jest.Mock;

const OWNER_AUTH = {
  uid: "owner-uid",
  roles: ["owner"],
  email: "owner@test.com",
};

const STAFF_AUTH = {
  uid: "staff-uid",
  roles: ["staff"],
  email: "staff@test.com",
};

const originalFetch = global.fetch;
const originalApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const originalDbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

function makeRequest(body: unknown, bearer = "valid-owner-token"): Request {
  return new Request("http://localhost/api/users/provision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify(body),
  });
}

/** Build a fetch mock that succeeds for signUp, profileWrite, and auditWrite in order */
function makeSuccessFetchMock(localId = "new-uid-123") {
  return jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ localId }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-api-key";
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL =
    "https://example.firebaseio.com";
  requireStaffAuthMock.mockResolvedValue(OWNER_AUTH);
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = originalApiKey;
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = originalDbUrl;
});

describe("POST /api/users/provision", () => {
  // TC-04-01: Success path
  it("returns 200 with uid and email on success", async () => {
    global.fetch = makeSuccessFetchMock("new-uid-123") as unknown as typeof fetch;

    const request = makeRequest({
      email: "test@example.com",
      user_name: "Test User",
      displayName: "Test",
      role: "staff",
    });

    const response = await POST(request);
    const data = (await response.json()) as {
      success: boolean;
      uid: string;
      email: string;
    };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.uid).toBe("new-uid-123");
    expect(data.email).toBe("test@example.com");
  });

  // TC-04-02: Staff bearer returns 403
  it("returns 403 when caller has staff role only", async () => {
    requireStaffAuthMock.mockResolvedValue(STAFF_AUTH);

    const request = makeRequest({
      email: "new@example.com",
      user_name: "New User",
      role: "staff",
    });

    const response = await POST(request);
    const data = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Insufficient permissions");
  });

  // TC-04-03: Missing email returns 400
  it("returns 400 when email is missing", async () => {
    const request = makeRequest({ user_name: "Test User", role: "staff" });

    const response = await POST(request);
    const data = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/email/i);
  });

  // TC-04-04: Missing user_name returns 400
  it("returns 400 when user_name is missing", async () => {
    const request = makeRequest({ email: "test@example.com", role: "staff" });

    const response = await POST(request);
    const data = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/user_name/i);
  });

  // TC-04-05: Missing role returns 400
  it("returns 400 when role is missing", async () => {
    const request = makeRequest({
      email: "test@example.com",
      user_name: "Test User",
    });

    const response = await POST(request);
    const data = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/role/i);
  });

  // TC-04-06: accounts:signUp called with correct URL
  it("calls accounts:signUp with the correct Firebase API URL", async () => {
    const fetchMock = makeSuccessFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(
      makeRequest({
        email: "test@example.com",
        user_name: "Test",
        role: "staff",
      }),
    );

    const signUpCall = fetchMock.mock.calls[0] as [string, ...unknown[]];
    expect(signUpCall[0]).toBe(
      "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key",
    );
  });

  // TC-04-07: userProfiles PUT includes map-form roles
  it("writes userProfiles with map-form roles", async () => {
    const fetchMock = makeSuccessFetchMock("uid-abc");
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(
      makeRequest({
        email: "test@example.com",
        user_name: "Test User",
        role: "manager",
      }),
    );

    // Second fetch call is the userProfiles PUT
    const profileCall = fetchMock.mock.calls[1] as [string, RequestInit];
    const profileBody = JSON.parse(profileCall[1].body as string) as {
      roles: Record<string, boolean>;
    };

    expect(profileBody.roles).toEqual({ manager: true });
    expect(profileCall[0]).toContain("/userProfiles/uid-abc.json");
  });

  // TC-04-08: audit PUT includes action: "user_provisioned"
  it("writes audit record with action user_provisioned", async () => {
    const fetchMock = makeSuccessFetchMock("uid-abc");
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(
      makeRequest({
        email: "audit@example.com",
        user_name: "Audit User",
        role: "staff",
      }),
    );

    // Third fetch call is the audit PUT
    const auditCall = fetchMock.mock.calls[2] as [string, RequestInit];
    const auditBody = JSON.parse(auditCall[1].body as string) as {
      action: string;
      targetEmail: string;
      targetRole: string;
      createdBy: string;
    };

    expect(auditBody.action).toBe("user_provisioned");
    expect(auditBody.targetEmail).toBe("audit@example.com");
    expect(auditBody.targetRole).toBe("staff");
    expect(auditBody.createdBy).toBe("owner-uid");
    expect(auditCall[0]).toContain("/audit/settingChanges/");
  });

  // TC-04-09: EMAIL_EXISTS returns 409
  it("returns 409 when Firebase returns EMAIL_EXISTS", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "EMAIL_EXISTS" } }),
    } as Response) as unknown as typeof fetch;

    const request = makeRequest({
      email: "existing@example.com",
      user_name: "Existing User",
      role: "staff",
    });

    const response = await POST(request);
    const data = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/already exists/i);
  });

  // Additional: invalid role is rejected before auth
  it("returns 400 when role is not in allowed list", async () => {
    const request = makeRequest({
      email: "test@example.com",
      user_name: "Test User",
      role: "owner",
    });

    const response = await POST(request);
    const data = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/role must be one of/i);
  });
});
