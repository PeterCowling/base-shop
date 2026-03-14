/**
 * TC-11-01: Caryina /admin/api/refunds — proxy to Payment Manager
 * TC-11-02: 503 when PAYMENT_MANAGER_URL or CARYINA_PM_TOKEN unset
 * TC-11-03: 502 when PM is unreachable
 * TC-11-04: PM error responses forwarded verbatim
 */

import { POST } from "../route";

const ORIGINAL_ENV = { ...process.env };

// Mock global fetch
const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch;

beforeEach(() => {
  process.env.PAYMENT_MANAGER_URL = "https://pm.example.workers.dev";
  process.env.CARYINA_PM_TOKEN = "test-pm-bearer-token-32chars-xxxx";
  mockFetch.mockReset();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/admin/api/refunds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// TC-11-01: proxies request to PM and forwards success response
it("proxies to PM and returns success", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, refundId: "re_test_123" }),
  });

  const req = makeRequest({ orderId: "order-001", amountCents: 1000 });
  const res = await POST(req);
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body).toEqual({ ok: true, refundId: "re_test_123" });

  expect(mockFetch).toHaveBeenCalledWith(
    "https://pm.example.workers.dev/api/refunds",
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer test-pm-bearer-token-32chars-xxxx",
        "Content-Type": "application/json",
      }),
    }),
  );
});

// TC-11-02: 503 when integration not configured
it("returns 503 when PAYMENT_MANAGER_URL is unset", async () => {
  delete process.env.PAYMENT_MANAGER_URL;

  const res = await POST(makeRequest({ orderId: "order-001", amountCents: 1000 }));
  const body = await res.json();

  expect(res.status).toBe(503);
  expect(body.ok).toBe(false);
  expect(mockFetch).not.toHaveBeenCalled();
});

it("returns 503 when CARYINA_PM_TOKEN is unset", async () => {
  delete process.env.CARYINA_PM_TOKEN;

  const res = await POST(makeRequest({ orderId: "order-001", amountCents: 1000 }));
  const body = await res.json();

  expect(res.status).toBe(503);
  expect(body.ok).toBe(false);
  expect(mockFetch).not.toHaveBeenCalled();
});

// TC-11-03: 502 when fetch throws (PM unreachable)
it("returns 502 when PM is unreachable", async () => {
  mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

  const res = await POST(makeRequest({ orderId: "order-001", amountCents: 1000 }));
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body.ok).toBe(false);
});

// TC-11-04: PM error response forwarded verbatim (404 not found)
it("forwards PM 404 not_found verbatim", async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 404,
    json: async () => ({ ok: false, error: "not_found" }),
  });

  const res = await POST(makeRequest({ orderId: "nonexistent-order", amountCents: 500 }));
  const body = await res.json();

  expect(res.status).toBe(404);
  expect(body).toEqual({ ok: false, error: "not_found" });
});
