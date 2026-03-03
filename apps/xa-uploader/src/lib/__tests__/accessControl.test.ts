import { getRequesterIpFromHeaders, isUploaderIpAllowedByHeaders } from "../accessControl";

describe("accessControl", () => {
  const originalAllowedIps = process.env.XA_UPLOADER_ALLOWED_IPS;

  afterEach(() => {
    process.env.XA_UPLOADER_ALLOWED_IPS = originalAllowedIps;
  });

  it("prefers cf-connecting-ip when available", () => {
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.10",
      "x-forwarded-for": "203.0.113.10",
    });
    expect(getRequesterIpFromHeaders(headers)).toBe("198.51.100.10");
  });

  it("uses x-forwarded-for fallback", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 203.0.113.11",
    });
    expect(getRequesterIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("allows all requests when allowlist is not configured", () => {
    delete process.env.XA_UPLOADER_ALLOWED_IPS;
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isUploaderIpAllowedByHeaders(headers)).toBe(true);
  });

  it("denies requests from non-allowlisted IPs", () => {
    process.env.XA_UPLOADER_ALLOWED_IPS = "198.51.100.10";
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isUploaderIpAllowedByHeaders(headers)).toBe(false);
  });

  it("allows requests from allowlisted IPs", () => {
    process.env.XA_UPLOADER_ALLOWED_IPS = "198.51.100.10,203.0.113.10";
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });
    expect(isUploaderIpAllowedByHeaders(headers)).toBe(true);
  });
});
