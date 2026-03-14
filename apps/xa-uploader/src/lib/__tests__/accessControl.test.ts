import {
  _resetCoherenceWarningForTest,
  getRequesterIpFromHeaders,
  isUploaderIpAllowedByHeaders,
} from "../accessControl";

// Mock uploaderLog to verify coherence warning calls.
const mockUploaderLog = jest.fn();
jest.mock("../uploaderLogger", () => ({
  uploaderLog: (...args: unknown[]) => mockUploaderLog(...args),
}));

describe("accessControl", () => {
  const originalAllowedIps = process.env.XA_UPLOADER_ALLOWED_IPS;
  const originalTrustProxyHeaders = process.env.XA_TRUST_PROXY_IP_HEADERS;

  afterEach(() => {
    process.env.XA_UPLOADER_ALLOWED_IPS = originalAllowedIps;
    process.env.XA_TRUST_PROXY_IP_HEADERS = originalTrustProxyHeaders;
    _resetCoherenceWarningForTest();
    mockUploaderLog.mockClear();
  });

  it("prefers cf-connecting-ip when available", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.10",
      "x-forwarded-for": "203.0.113.10",
    });
    expect(getRequesterIpFromHeaders(headers)).toBe("198.51.100.10");
  });

  it("uses x-forwarded-for fallback", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 203.0.113.11",
    });
    expect(getRequesterIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("ignores forwarded headers when proxy trust is disabled", () => {
    delete process.env.XA_TRUST_PROXY_IP_HEADERS;
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.10",
      "x-forwarded-for": "203.0.113.10",
    });
    expect(getRequesterIpFromHeaders(headers)).toBe("");
  });

  it("denies all requests when allowlist is not configured (deny-all default)", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    delete process.env.XA_UPLOADER_ALLOWED_IPS;
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isUploaderIpAllowedByHeaders(headers)).toBe(false);
  });

  it("denies all requests when allowlist is empty string", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    process.env.XA_UPLOADER_ALLOWED_IPS = "";
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isUploaderIpAllowedByHeaders(headers)).toBe(false);
  });

  it("denies requests from non-allowlisted IPs", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    process.env.XA_UPLOADER_ALLOWED_IPS = "198.51.100.10";
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isUploaderIpAllowedByHeaders(headers)).toBe(false);
  });

  it("allows requests from allowlisted IPs", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    process.env.XA_UPLOADER_ALLOWED_IPS = "198.51.100.10,203.0.113.10";
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isUploaderIpAllowedByHeaders(headers)).toBe(true);
  });

  describe("coherence warning", () => {
    it("logs warning when allowlist is configured but proxy trust is disabled", () => {
      delete process.env.XA_TRUST_PROXY_IP_HEADERS;
      process.env.XA_UPLOADER_ALLOWED_IPS = "198.51.100.10";
      const headers = new Headers({ "cf-connecting-ip": "198.51.100.10" });

      isUploaderIpAllowedByHeaders(headers);

      expect(mockUploaderLog).toHaveBeenCalledWith(
        "warn",
        "security_coherence_mismatch",
        expect.objectContaining({
          allowlistSize: 1,
        }),
      );
    });

    it("does not log warning when proxy trust is enabled", () => {
      process.env.XA_TRUST_PROXY_IP_HEADERS = "1";
      process.env.XA_UPLOADER_ALLOWED_IPS = "198.51.100.10";
      const headers = new Headers({ "cf-connecting-ip": "198.51.100.10" });

      isUploaderIpAllowedByHeaders(headers);

      expect(mockUploaderLog).not.toHaveBeenCalledWith(
        "warn",
        "security_coherence_mismatch",
        expect.anything(),
      );
    });

    it("deduplicates coherence warning (fires only once per process)", () => {
      delete process.env.XA_TRUST_PROXY_IP_HEADERS;
      process.env.XA_UPLOADER_ALLOWED_IPS = "198.51.100.10";
      const headers = new Headers({ "cf-connecting-ip": "198.51.100.10" });

      isUploaderIpAllowedByHeaders(headers);
      isUploaderIpAllowedByHeaders(headers);
      isUploaderIpAllowedByHeaders(headers);

      const coherenceCalls = mockUploaderLog.mock.calls.filter(
        (call: unknown[]) => call[1] === "security_coherence_mismatch",
      );
      expect(coherenceCalls).toHaveLength(1);
    });

    it("does not log warning when allowlist is empty", () => {
      delete process.env.XA_TRUST_PROXY_IP_HEADERS;
      delete process.env.XA_UPLOADER_ALLOWED_IPS;
      const headers = new Headers({ "cf-connecting-ip": "198.51.100.10" });

      isUploaderIpAllowedByHeaders(headers);

      expect(mockUploaderLog).not.toHaveBeenCalled();
    });
  });
});
