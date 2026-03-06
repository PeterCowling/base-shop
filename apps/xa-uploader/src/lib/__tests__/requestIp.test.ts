import { getTrustedRequestIpFromHeaders } from "../requestIp";

describe("requestIp", () => {
  const originalTrustProxyHeaders = process.env.XA_TRUST_PROXY_IP_HEADERS;

  afterEach(() => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = originalTrustProxyHeaders;
  });

  it("extracts ipv4 values from trusted proxy headers", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10:443, 198.51.100.15",
    });

    expect(getTrustedRequestIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("extracts bracketed ipv6 values from trusted proxy headers", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    const headers = new Headers({
      "cf-connecting-ip": "[2001:db8::10]",
    });

    expect(getTrustedRequestIpFromHeaders(headers)).toBe("2001:db8::10");
  });

  it("extracts plain ipv6 values from trusted proxy headers", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    const headers = new Headers({
      "x-real-ip": "2001:db8::20",
    });

    expect(getTrustedRequestIpFromHeaders(headers)).toBe("2001:db8::20");
  });

  it("ignores malformed proxy header values", () => {
    process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
    const headers = new Headers({
      "x-forwarded-for": "not-an-ip",
    });

    expect(getTrustedRequestIpFromHeaders(headers)).toBe("");
  });
});
