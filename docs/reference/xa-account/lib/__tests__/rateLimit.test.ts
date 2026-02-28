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

it("prefers cf-connecting-ip", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-b.example/access", {
    headers: {
      "cf-connecting-ip": "198.51.100.7",
      "x-forwarded-for": "203.0.113.2",
    },
  });
  expect(getRequestIp(request)).toBe("198.51.100.7");
});

it("ignores proxy headers unless explicitly trusted", () => {
  delete process.env.XA_TRUST_PROXY_IP_HEADERS;
  const request = new Request("https://xa-b.example/access", {
    headers: {
      "x-forwarded-for": "203.0.113.2",
      "x-real-ip": "203.0.113.3",
    },
  });
  expect(getRequestIp(request)).toBe("");
});

it("can trust proxy headers when enabled", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-b.example/access", {
    headers: {
      "x-forwarded-for": "203.0.113.2, 203.0.113.9",
      "x-real-ip": "203.0.113.3",
    },
  });
  expect(getRequestIp(request)).toBe("203.0.113.2");
});

it("ignores malformed ip headers", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-b.example/access", {
    headers: {
      "cf-connecting-ip": "not-an-ip",
      "x-forwarded-for": "198.51.100.8:443",
    },
  });
  expect(getRequestIp(request)).toBe("198.51.100.8");
});
