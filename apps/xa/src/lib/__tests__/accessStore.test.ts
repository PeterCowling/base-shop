import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createAccessRequest,
  createInvite,
  findValidInvite,
  generateInviteCode,
  hashInviteCode,
  isInviteActive,
  listAccessRequests,
  listInvites,
  registerInviteUse,
  revokeInvite,
  updateAccessRequest,
} from "../accessStore";

const ORIGINAL_ENV = { ...process.env };
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

beforeEach(async () => {
  process.env.XA_ACCESS_STORE_PATH = STORE_PATH;
  process.env.XA_INVITE_HASH_SECRET = "invite-secret";
  delete globalThis.__xaAccessStore;
  delete globalThis.__xaAccessStoreMode;
  await cleanupStoreFile();
});

afterEach(async () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
  delete globalThis.__xaAccessStore;
  delete globalThis.__xaAccessStoreMode;
  await cleanupStoreFile();
});

describe("accessStore", () => {
  it("generates invite codes and hashes them", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    const hash = hashInviteCode(code);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("creates, lists, and revokes invites", async () => {
    const created = await createInvite({ label: "VIP", maxUses: 1 });
    expect(created.invite.label).toBe("VIP");

    const list = await listInvites();
    expect(list.invites).toHaveLength(1);

    const valid = await findValidInvite(created.code);
    expect(valid.invite?.id).toBe(created.invite.id);
    expect(isInviteActive(created.invite)).toBe(true);

    await revokeInvite(created.invite.id);
    const revoked = await findValidInvite(created.code);
    expect(revoked.invite).toBeNull();
  });

  it("tracks invite usage limits", async () => {
    const created = await createInvite({ maxUses: 1 });
    await registerInviteUse(created.invite.id);
    const overLimit = await findValidInvite(created.code);
    expect(overLimit.invite).toBeNull();
  });

  it("creates and updates access requests", async () => {
    const created = await createAccessRequest({
      handle: "jane",
      referredBy: "instagram",
      note: "hello",
      userAgent: "agent",
      requestIp: "127.0.0.1",
    });
    expect(created.request.status).toBe("pending");

    const updated = await updateAccessRequest({
      requestId: created.request.id,
      status: "approved",
      inviteId: "inv-1",
    });
    expect(updated.request?.status).toBe("approved");
    expect(updated.request?.inviteId).toBe("inv-1");

    const list = await listAccessRequests();
    expect(list.requests).toHaveLength(1);
  });
});
