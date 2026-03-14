import {
  _resetCoherenceWarningForTest,
  getRequesterIpFromHeaders,
  isInventoryIpAllowed,
} from "../accessControl";

// Mock inventoryLog to verify coherence warning calls.
const mockInventoryLog = jest.fn();
jest.mock("../inventoryLog", () => ({
  inventoryLog: (...args: unknown[]) => mockInventoryLog(...args),
}));

describe("accessControl", () => {
  const originalAllowedIps = process.env.INVENTORY_ALLOWED_IPS;
  const originalTrustProxyHeaders = process.env.INVENTORY_TRUST_PROXY_IP_HEADERS;

  afterEach(() => {
    process.env.INVENTORY_ALLOWED_IPS = originalAllowedIps;
    process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = originalTrustProxyHeaders;
    _resetCoherenceWarningForTest();
    mockInventoryLog.mockClear();
  });

  it("prefers cf-connecting-ip when available", () => {
    process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = "true";
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.10",
      "x-forwarded-for": "203.0.113.10",
    });
    expect(getRequesterIpFromHeaders(headers)).toBe("198.51.100.10");
  });

  it("uses x-forwarded-for fallback", () => {
    process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = "true";
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 203.0.113.11",
    });
    expect(getRequesterIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("ignores forwarded headers when proxy trust is disabled", () => {
    delete process.env.INVENTORY_TRUST_PROXY_IP_HEADERS;
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.10",
      "x-forwarded-for": "203.0.113.10",
    });
    expect(getRequesterIpFromHeaders(headers)).toBe("");
  });

  it("denies all requests when allowlist is not configured (deny-all default)", () => {
    process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = "true";
    delete process.env.INVENTORY_ALLOWED_IPS;
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isInventoryIpAllowed(headers)).toBe(false);
  });

  it("denies all requests when allowlist is empty string", () => {
    process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = "true";
    process.env.INVENTORY_ALLOWED_IPS = "";
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isInventoryIpAllowed(headers)).toBe(false);
  });

  it("denies requests from non-allowlisted IPs", () => {
    process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = "true";
    process.env.INVENTORY_ALLOWED_IPS = "198.51.100.10";
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isInventoryIpAllowed(headers)).toBe(false);
  });

  it("allows requests from allowlisted IPs", () => {
    process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = "true";
    process.env.INVENTORY_ALLOWED_IPS = "198.51.100.10,203.0.113.10";
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isInventoryIpAllowed(headers)).toBe(true);
  });

  it("allows requests from allowlisted IPv6 IPs", () => {
    process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = "true";
    process.env.INVENTORY_ALLOWED_IPS = "2001:db8::1";
    const headers = new Headers({ "cf-connecting-ip": "2001:db8::1" });
    expect(isInventoryIpAllowed(headers)).toBe(true);
  });

  describe("coherence warning", () => {
    it("logs warning when allowlist is configured but proxy trust is disabled", () => {
      delete process.env.INVENTORY_TRUST_PROXY_IP_HEADERS;
      process.env.INVENTORY_ALLOWED_IPS = "198.51.100.10";
      const headers = new Headers({ "cf-connecting-ip": "198.51.100.10" });

      isInventoryIpAllowed(headers);

      expect(mockInventoryLog).toHaveBeenCalledWith(
        "warn",
        "security_coherence_mismatch",
        expect.objectContaining({
          allowlistSize: 1,
        }),
      );
    });

    it("does not log warning when proxy trust is enabled", () => {
      process.env.INVENTORY_TRUST_PROXY_IP_HEADERS = "1";
      process.env.INVENTORY_ALLOWED_IPS = "198.51.100.10";
      const headers = new Headers({ "cf-connecting-ip": "198.51.100.10" });

      isInventoryIpAllowed(headers);

      expect(mockInventoryLog).not.toHaveBeenCalledWith(
        "warn",
        "security_coherence_mismatch",
        expect.anything(),
      );
    });

    it("deduplicates coherence warning (fires only once per process)", () => {
      delete process.env.INVENTORY_TRUST_PROXY_IP_HEADERS;
      process.env.INVENTORY_ALLOWED_IPS = "198.51.100.10";
      const headers = new Headers({ "cf-connecting-ip": "198.51.100.10" });

      isInventoryIpAllowed(headers);
      isInventoryIpAllowed(headers);
      isInventoryIpAllowed(headers);

      const coherenceCalls = mockInventoryLog.mock.calls.filter(
        (call: unknown[]) => call[1] === "security_coherence_mismatch",
      );
      expect(coherenceCalls).toHaveLength(1);
    });

    it("does not log warning when allowlist is empty", () => {
      delete process.env.INVENTORY_TRUST_PROXY_IP_HEADERS;
      delete process.env.INVENTORY_ALLOWED_IPS;
      const headers = new Headers({ "cf-connecting-ip": "198.51.100.10" });

      isInventoryIpAllowed(headers);

      expect(mockInventoryLog).not.toHaveBeenCalled();
    });
  });
});
