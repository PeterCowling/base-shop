import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { webcrypto } from "node:crypto";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

import { createInvite, createAccessRequest } from "../../../lib/accessStore";
import { issueAdminSession } from "../../../lib/accessAdmin";

import { POST as accessLogin } from "../access-admin/login/route";
import { POST as accessLogout } from "../access-admin/logout/route";
import { GET as accessSession } from "../access-admin/session/route";
import { GET as invitesGet, POST as invitesPost } from "../access-admin/invites/route";
import { POST as invitesRevoke } from "../access-admin/invites/[inviteId]/revoke/route";
import { GET as requestsGet } from "../access-admin/requests/route";
import { POST as requestIssue } from "../access-admin/requests/[requestId]/issue/route";
import { POST as requestDismiss } from "../access-admin/requests/[requestId]/dismiss/route";
import { POST as accessRequest } from "../access-request/route";
import { POST as accessCode } from "../access/route";
import { GET as searchSync } from "../search/sync/route";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_CRYPTO = globalThis.crypto;
const STORE_PATH = path.join(
  os.tmpdir(),
  `xa-access-store-${process.pid}-${Date.now()}.json`,
);

async function cleanupStoreFile() {
  try {
    await fs.rm(STORE_PATH, { force: true });
  } catch {
    // ignore
  }
}

function adminRequest(url: string) {
  return issueAdminSession(process.env.XA_ACCESS_COOKIE_SECRET ?? "").then((token) => {
    return new Request(url, {
      headers: {
        cookie: `xa_access_admin=${token}`,
      },
    });
  });
}

beforeEach(async () => {
  process.env.XA_ACCESS_STORE_PATH = STORE_PATH;
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";
  process.env.XA_ACCESS_ADMIN_TOKEN = "token";
  process.env.NODE_ENV = "test";
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
  delete globalThis.__xaRateLimitStore;
  await cleanupStoreFile();
});

afterEach(async () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
  Object.defineProperty(globalThis, "crypto", {
    value: ORIGINAL_CRYPTO,
    configurable: true,
  });
  delete globalThis.__xaRateLimitStore;
  jest.restoreAllMocks();
  await cleanupStoreFile();
});

describe("access admin auth routes", () => {
  it("returns errors for invalid login payloads", async () => {
    const missingReq = new Request("https://example.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const missingRes = await accessLogin(missingReq);
    expect(missingRes.status).toBe(400);

    const invalidReq = new Request("https://example.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "nope" }),
    });
    const invalidRes = await accessLogin(invalidReq);
    expect(invalidRes.status).toBe(401);
  });

  it("sets admin cookie on valid login", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "token" }),
    });
    const res = await accessLogin(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("xa_access_admin=");
  });

  it("clears admin cookie on logout", async () => {
    const res = await accessLogout();
    expect(res.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("returns session info when authenticated", async () => {
    const req = await adminRequest("https://example.com");
    const res = await accessSession(req);
    const json = await res.json();
    expect(json.authenticated).toBe(true);
    expect(json.storeMode).toBeTruthy();
  });
});

describe("access admin invites + requests routes", () => {
  it("creates and lists invites", async () => {
    const req = await adminRequest("https://example.com");
    const postReq = new Request(req.url, {
      method: "POST",
      headers: {
        cookie: req.headers.get("cookie") ?? "",
        "content-type": "application/json",
      },
      body: JSON.stringify({ label: "VIP", maxUses: 2 }),
    });
    const created = await invitesPost(postReq);
    const createdJson = await created.json();
    expect(createdJson.ok).toBe(true);

    const list = await invitesGet(req);
    const listJson = await list.json();
    expect(listJson.invites.length).toBeGreaterThan(0);
  });

  it("revokes invites", async () => {
    const { invite } = await createInvite({ label: "VIP" });
    const req = await adminRequest("https://example.com");
    const res = await invitesRevoke(req, {
      params: Promise.resolve({ inviteId: invite.id }),
    });
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("lists access requests and updates status", async () => {
    const reqEntry = await createAccessRequest({
      handle: "jane",
      referredBy: "friend",
      note: "hello",
      userAgent: "agent",
      requestIp: "127.0.0.1",
    });
    const req = await adminRequest("https://example.com");
    const listRes = await requestsGet(req);
    const listJson = await listRes.json();
    expect(listJson.requests.length).toBeGreaterThan(0);

    const issueRes = await requestIssue(req, {
      params: Promise.resolve({ requestId: reqEntry.request.id }),
    });
    const issueJson = await issueRes.json();
    expect(issueJson.ok).toBe(true);

    const dismissRes = await requestDismiss(req, {
      params: Promise.resolve({ requestId: reqEntry.request.id }),
    });
    const dismissJson = await dismissRes.json();
    expect(dismissJson.ok).toBe(true);
  });
});

describe("access request + access code routes", () => {
  it("accepts access requests", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        handle: "jane",
        referredBy: "friend",
        note: "hello",
      }),
    });
    const res = await accessRequest(req);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("handles access code submissions", async () => {
    process.env.XA_STEALTH_INVITE_CODES = "alpha";
    const form = new FormData();
    form.set("code", "alpha");
    const req = new Request("https://example.com/access", {
      method: "POST",
      body: form,
    }) as Request & { formData?: () => Promise<FormData> };
    req.formData = async () => form;
    const res = await accessCode(req);
    expect(res.status).toBe(303);
    expect(res.headers.get("set-cookie")).toContain("xa_access=");
  });

  it("redirects when code is missing", async () => {
    const form = new FormData();
    form.set("code", "");
    form.set("next", "/checkout");
    const req = new Request("https://example.com/access", {
      method: "POST",
      body: form,
    }) as Request & { formData?: () => Promise<FormData> };
    req.formData = async () => form;

    const res = await accessCode(req);
    expect(res.status).toBe(303);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("error=missing");
    expect(location).toContain("next=%2Fcheckout");
  });

  it("returns an error when the cookie secret is missing", async () => {
    process.env.XA_ACCESS_COOKIE_SECRET = "";
    const form = new FormData();
    form.set("code", "alpha");
    const req = new Request("https://example.com/access", {
      method: "POST",
      body: form,
    }) as Request & { formData?: () => Promise<FormData> };
    req.formData = async () => form;

    const res = await accessCode(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("missing_secret");
  });

  it("marks access as invalid when active invites exist", async () => {
    await createInvite({ label: "VIP", maxUses: 1 });
    const form = new FormData();
    form.set("code", "wrong");
    const req = new Request("https://example.com/access", {
      method: "POST",
      body: form,
    }) as Request & { formData?: () => Promise<FormData> };
    req.formData = async () => form;

    const res = await accessCode(req);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("error=invalid");
  });

  it("marks access as closed when no invites exist", async () => {
    const form = new FormData();
    form.set("code", "wrong");
    const req = new Request("https://example.com/access", {
      method: "POST",
      body: form,
    }) as Request & { formData?: () => Promise<FormData> };
    req.formData = async () => form;

    const res = await accessCode(req);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("error=closed");
  });
});

describe("search sync route", () => {
  it("returns 200 and 304 responses", async () => {
    const req = new Request("https://example.com");
    const res = await searchSync(req);
    expect(res.status).toBe(200);
    const etag = res.headers.get("etag");

    const cachedReq = new Request("https://example.com", {
      headers: { "if-none-match": etag ?? "" },
    });
    const cachedRes = await searchSync(cachedReq);
    expect(cachedRes.status).toBe(304);
  });
});
