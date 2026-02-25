import { getRequestIp } from "../rateLimit";

const ENV_KEYS = ["XA_TRUST_PROXY_IP_HEADERS"] as const;

const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

it("ignores proxy headers unless explicitly trusted", () => {
  delete process.env.XA_TRUST_PROXY_IP_HEADERS;
  const request = new Request("https://xa-uploader.example/api/uploader/login", {
    headers: {
      "cf-connecting-ip": "198.51.100.7",
      "x-forwarded-for": "203.0.113.2",
      "x-real-ip": "203.0.113.3",
    },
  });
  expect(getRequestIp(request)).toBe("");
});

it("prefers cf-connecting-ip when proxy headers are trusted", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-uploader.example/api/uploader/login", {
    headers: {
      "cf-connecting-ip": "198.51.100.7",
      "x-forwarded-for": "203.0.113.2",
      "x-real-ip": "203.0.113.3",
    },
  });
  expect(getRequestIp(request)).toBe("198.51.100.7");
});

it("falls back to x-forwarded-for and strips ports", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-uploader.example/api/uploader/login", {
    headers: {
      "x-forwarded-for": "203.0.113.2:443, 203.0.113.9",
      "x-real-ip": "203.0.113.3",
    },
  });
  expect(getRequestIp(request)).toBe("203.0.113.2");
});

it("ignores malformed ip values", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-uploader.example/api/uploader/login", {
    headers: {
      "cf-connecting-ip": "malformed-ip",
      "x-forwarded-for": "still-bad",
    },
  });
  expect(getRequestIp(request)).toBe("");
});
