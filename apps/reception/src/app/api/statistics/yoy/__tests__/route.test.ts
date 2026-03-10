import { requireStaffAuth } from "../../../mcp/_shared/staff-auth";
import { GET } from "../route";

jest.mock("../../../mcp/_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

const requireStaffAuthMock = requireStaffAuth as jest.Mock;
const originalFetch = global.fetch;
const originalDbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const originalArchiveDbUrl = process.env.NEXT_PUBLIC_FIREBASE_ARCHIVE_DATABASE_URL;

function makeRequest(url = "http://localhost/api/statistics/yoy?year=2026&mode=room-only") {
  return new Request(url, {
    headers: {
      Authorization: "Bearer test-token",
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = "https://current.firebaseio.com";
  process.env.NEXT_PUBLIC_FIREBASE_ARCHIVE_DATABASE_URL = "https://archive.firebaseio.com";

  requireStaffAuthMock.mockResolvedValue({
    ok: true,
    uid: "manager-1",
    email: "manager@test.com",
    roles: ["manager"],
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = originalDbUrl;
  process.env.NEXT_PUBLIC_FIREBASE_ARCHIVE_DATABASE_URL = originalArchiveDbUrl;
});

describe("GET /api/statistics/yoy", () => {
  it("returns monthly and summary payload", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tx1: { timestamp: "2026-01-15T00:00:00.000Z", amount: 100, type: "roomPayment" },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tx2: { timestamp: "2025-01-15T00:00:00.000Z", amount: 80, type: "roomPayment" },
        }),
      } as Response) as unknown as typeof fetch;

    const response = await GET(makeRequest());
    const payload = (await response.json()) as {
      success: boolean;
      year: number;
      previousYear: number;
      monthly: Array<{ month: string; currentValue: number; previousValue: number }>;
      summary: { currentYtd: number; previousYtd: number };
      provenance: {
        rules: { timezone: string };
        previousSource: { fallbackUsed: boolean; sourceKind: string };
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.year).toBe(2026);
    expect(payload.previousYear).toBe(2025);
    expect(payload.monthly[0]).toMatchObject({ month: "01", currentValue: 100, previousValue: 80 });
    expect(payload.summary.currentYtd).toBe(100);
    expect(payload.provenance.rules.timezone).toBe("UTC");
    expect(payload.provenance.previousSource.sourceKind).toBe("dedicated-archive-db");
    expect(payload.provenance.previousSource.fallbackUsed).toBe(false);
  });

  it("publishes archive-mirror fallback metadata when dedicated archive DB is not configured", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_ARCHIVE_DATABASE_URL = "";

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tx1: { timestamp: "2026-01-15T00:00:00.000Z", amount: 100, type: "roomPayment" },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tx2: { timestamp: "2025-01-15T00:00:00.000Z", amount: 80, type: "roomPayment" },
        }),
      } as Response) as unknown as typeof fetch;

    const response = await GET(makeRequest());
    const payload = (await response.json()) as {
      source: { previous: string };
      provenance: { previousSource: { path: string; sourceKind: string; fallbackUsed: boolean } };
    };

    expect(response.status).toBe(200);
    expect(payload.source.previous).toBe("current-db:archive/allFinancialTransactions");
    expect(payload.provenance.previousSource.path).toBe("archive/allFinancialTransactions");
    expect(payload.provenance.previousSource.sourceKind).toBe("archive-mirror");
    expect(payload.provenance.previousSource.fallbackUsed).toBe(true);
  });

  it("returns 403 for users without statistics roles", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "staff-1",
      email: "staff@test.com",
      roles: ["staff"],
    });

    const response = await GET(makeRequest());
    const payload = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(payload.error).toMatch(/insufficient permissions/i);
  });

  it("fails closed when upstream transactions fetch is non-OK", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response) as unknown as typeof fetch;

    const response = await GET(makeRequest());
    const payload = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(502);
    expect(payload.success).toBe(false);
    expect(payload.error).toMatch(/Upstream fetch failed/i);
  });
});
