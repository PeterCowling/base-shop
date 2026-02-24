import {
  hasUploaderSession,
  issueUploaderSession,
  validateUploaderAdminToken,
} from "../uploaderAuth";

const ENV_KEYS = [
  "NODE_ENV",
  "XA_UPLOADER_MODE",
  "XA_UPLOADER_VENDOR_TOKEN",
  "XA_UPLOADER_ADMIN_TOKEN",
  "XA_UPLOADER_SESSION_SECRET",
] as const;

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

it("uses XA_UPLOADER_VENDOR_TOKEN in vendor mode", async () => {
  process.env.NODE_ENV = "production";
  process.env.XA_UPLOADER_MODE = "vendor";
  process.env.XA_UPLOADER_ADMIN_TOKEN = "admin-token";
  process.env.XA_UPLOADER_VENDOR_TOKEN = "vendor-token";
  process.env.XA_UPLOADER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  await expect(validateUploaderAdminToken("wrong-token")).resolves.toBe(false);
  await expect(validateUploaderAdminToken("admin-token")).resolves.toBe(false);
  await expect(validateUploaderAdminToken("vendor-token")).resolves.toBe(true);
});

it("always requires a valid session cookie", async () => {
  process.env.NODE_ENV = "development";
  process.env.XA_UPLOADER_MODE = "vendor";
  process.env.XA_UPLOADER_ADMIN_TOKEN = "admin-token";
  process.env.XA_UPLOADER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  await expect(
    hasUploaderSession(new Request("https://uploader.example/api/uploader/session")),
  ).resolves.toBe(false);

  const token = await issueUploaderSession();
  await expect(token.split(".")).toHaveLength(4);
  const requestWithCookie = new Request("https://uploader.example/api/uploader/session", {
    headers: { cookie: `xa_uploader_admin=${encodeURIComponent(token)}` },
  });
  await expect(hasUploaderSession(requestWithCookie)).resolves.toBe(true);
});
