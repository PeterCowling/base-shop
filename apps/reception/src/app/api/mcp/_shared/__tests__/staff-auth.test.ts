import { requireStaffAuth } from "../staff-auth";

describe("requireStaffAuth", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const originalDbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-api-key";
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = "https://example.firebaseio.com";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = originalApiKey;
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = originalDbUrl;
  });

  it("returns 401 when bearer token is missing", async () => {
    const request = new Request("http://localhost/api/mcp/booking-email", {
      method: "POST",
    });

    const result = await requireStaffAuth(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected auth failure");
    }
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({
      success: false,
      error: "Missing bearer token",
    });
  });

  it("returns 401 when id token cannot be verified", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const request = new Request("http://localhost/api/mcp/booking-email", {
      method: "POST",
      headers: { Authorization: "Bearer invalid-token" },
    });

    const result = await requireStaffAuth(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected auth failure");
    }
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({
      success: false,
      error: "Invalid auth token",
    });
  });

  it("returns 403 when authenticated user lacks staff role", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ localId: "uid-1", email: "viewer@example.com" }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          roles: ["viewer"],
        }),
      } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const request = new Request("http://localhost/api/mcp/booking-email", {
      method: "POST",
      headers: { Authorization: "Bearer valid-viewer-token" },
    });

    const result = await requireStaffAuth(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected auth failure");
    }
    expect(result.response.status).toBe(403);
    expect(await result.response.json()).toEqual({
      success: false,
      error: "Insufficient role",
    });
  });

  it("returns uid and roles for authenticated staff user", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ localId: "uid-1", email: "staff@example.com" }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          roles: ["staff"],
        }),
      } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const request = new Request("http://localhost/api/mcp/booking-email", {
      method: "POST",
      headers: { Authorization: "Bearer valid-staff-token" },
    });

    const result = await requireStaffAuth(request);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected auth success");
    }
    expect(result.uid).toBe("uid-1");
    expect(result.roles).toEqual(["staff"]);
    expect(result.email).toBe("staff@example.com");
  });
});

