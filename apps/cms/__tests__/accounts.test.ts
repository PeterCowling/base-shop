// apps/cms/__tests__/accounts.test.ts
/* eslint-env jest */

import fs from "node:fs/promises";
import path from "node:path";

import argon2 from "argon2";

import { withTempRepo } from "@acme/test-utils";

// Account action tests spin up temporary repos and hash passwords; give them
// extra time in CI environments where startup can be slow.
jest.setTimeout(120_000);

/* --------------------------------------------------------------------
 *  Ensure the stripe env vars that `@config/env` insists on are present
 * ------------------------------------------------------------------ */
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";

/* ────────────────────────────────────────────────────────────────────
 * helpers
 * ────────────────────────────────────────────────────────────────── */
function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
}

const withRepo = (cb: () => Promise<void>) =>
  withTempRepo(async () => {
    await cb();
  }, { prefix: 'rbac-', createShopDir: false });

afterEach(() => jest.resetAllMocks());

/* ────────────────────────────────────────────────────────────────────
 * tests
 * ────────────────────────────────────────────────────────────────── */
describe("account actions", () => {
  it("requestAccount hashes passwords and stores pending user", async () => {
    await withRepo(async () => {
      const actions = await import("../src/actions/accounts.server");

      await actions.requestAccount(
        fd({ name: "Alice", email: "a@example.com", password: "secret" })
      );

      const pending = await actions.listPendingUsers();
      expect(pending).toHaveLength(1);

      const stored = pending[0];
      expect(stored.password).not.toBe("secret");
      await expect(argon2.verify(stored.password, "secret")).resolves.toBe(
        true
      );
    });
  });

  it("listPendingUsers returns pending users", async () => {
    await withRepo(async () => {
      const actions = await import("../src/actions/accounts.server");

      await actions.requestAccount(
        fd({ name: "A", email: "a@e", password: "x" })
      );
      await actions.requestAccount(
        fd({ name: "B", email: "b@e", password: "y" })
      );

      const list = await actions.listPendingUsers();
      expect(list).toHaveLength(2);
      expect(list.map((u) => u.name)).toEqual(
        expect.arrayContaining(["A", "B"])
      );
    });
  });

  it("approveAccount transfers user and sends email", async () => {
    await withRepo(async () => {
      /* stub email sending so the test doesn't talk to SMTP */
      const sendEmail = jest.fn();
      jest.doMock("@acme/email", () => ({
        __esModule: true,
        sendEmail,
      }));

      const actions = await import("../src/actions/accounts.server");
      const { readRbac } = await import("../src/lib/server/rbacStore");

      await actions.requestAccount(
        fd({ name: "C", email: "c@example.com", password: "pw" })
      );

      const [pending] = await actions.listPendingUsers();
      const approve = fd({ id: pending.id, roles: "admin" });

      await actions.approveAccount(approve);

      const db = await readRbac();
      expect(db.users[pending.id].email).toBe("c@example.com");
      expect(db.roles[pending.id]).toBe("admin");
      expect(await actions.listPendingUsers()).toHaveLength(0);
      expect(sendEmail).toHaveBeenCalled();
    });
  });

  it("approveAccount throws for unknown ID", async () => {
    await withRepo(async () => {
      const sendEmail = jest.fn();
      jest.doMock("@acme/email", () => ({
        __esModule: true,
        sendEmail,
      }));

      const actions = await import("../src/actions/accounts.server");

      const bogus = fd({ id: "missing", roles: "viewer" });
      await expect(actions.approveAccount(bogus)).rejects.toThrow(
        "pending user not found"
      );
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });
});
