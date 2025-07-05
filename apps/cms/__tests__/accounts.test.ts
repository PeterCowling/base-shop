// apps/cms/__tests__/accounts.test.ts

import bcrypt from "bcryptjs";

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
}

afterEach(() => jest.resetModules());

describe("account actions", () => {
  it("requestAccount hashes passwords and stores pending user", async () => {
    const actions = await import("../src/actions/accounts.server");

    const form = fd({
      name: "Alice",
      email: "a@example.com",
      password: "secret",
    });
    await actions.requestAccount(form);

    const pending = await actions.listPendingUsers();
    expect(pending).toHaveLength(1);
    const stored = pending[0];
    expect(stored.password).not.toBe("secret");
    await expect(bcrypt.compare("secret", stored.password)).resolves.toBe(true);
  });

  it("listPendingUsers returns pending users", async () => {
    const actions = await import("../src/actions/accounts.server");

    await actions.requestAccount(
      fd({
        name: "A",
        email: "a@e",
        password: "x",
      })
    );
    await actions.requestAccount(
      fd({
        name: "B",
        email: "b@e",
        password: "y",
      })
    );

    const list = await actions.listPendingUsers();
    expect(list).toHaveLength(2);
    const names = list.map((u) => u.name);
    expect(names).toEqual(expect.arrayContaining(["A", "B"]));
  });

  it("approveAccount transfers user and sends email", async () => {
    const sendEmail = jest.fn();
    jest.doMock("../src/lib/email", () => ({
      __esModule: true,
      sendEmail,
    }));
    const actions = await import("../src/actions/accounts.server");
    const { readRbac } = await import("../src/lib/rbacStore");

    await actions.requestAccount(
      fd({
        name: "C",
        email: "c@example.com",
        password: "pw",
      })
    );

    const [user] = await actions.listPendingUsers();
    const approve = new FormData();
    approve.append("id", user.id);
    approve.append("roles", "admin");

    await actions.approveAccount(approve);

    const db = await readRbac();
    expect(db.users[user.id].email).toBe("c@example.com");
    expect(db.roles[user.id]).toBe("admin");
    expect(await actions.listPendingUsers()).toHaveLength(0);
    expect(sendEmail).toHaveBeenCalled();
  });

  it("approveAccount throws for unknown ID", async () => {
    const sendEmail = jest.fn();
    jest.doMock("../src/lib/email", () => ({
      __esModule: true,
      sendEmail,
    }));
    const actions = await import("../src/actions/accounts.server");
    const fdUnknown = fd({ id: "missing" });
    fdUnknown.append("roles", "viewer");
    await expect(actions.approveAccount(fdUnknown)).rejects.toThrow(
      "pending user not found"
    );
  });
});
