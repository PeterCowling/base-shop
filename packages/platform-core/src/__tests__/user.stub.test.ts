/** @jest-environment node */

import { createUserDelegate } from "../db/stubs/user";

describe("createUserDelegate", () => {
  it("create adds users", async () => {
    const user = createUserDelegate();
    const data = { id: "1", email: "a@example.com" };
    await user.create({ data });

    await expect(user.findUnique({ where: { id: "1" } })).resolves.toEqual(data);
  });

  it("findUnique / findFirst locate records", async () => {
    const user = createUserDelegate();
    const data = { id: "1", email: "b@example.com" };
    await user.create({ data });

    await expect(user.findUnique({ where: { id: "1" } })).resolves.toEqual(data);
    await expect(user.findFirst({ where: { email: "b@example.com" } })).resolves.toEqual(data);
  });

  it("update succeeds and throws on missing user", async () => {
    const user = createUserDelegate();
    const data = { id: "1", email: "c@example.com" };
    await user.create({ data });

    await expect(
      user.update({ where: { id: "1" }, data: { email: "d@example.com" } }),
    ).resolves.toEqual({ id: "1", email: "d@example.com" });

    await expect(
      user.update({ where: { id: "missing" }, data: { email: "e@example.com" } }),
    ).rejects.toThrow("User not found");
  });
});

