import { createUserDelegate } from "../src/db/stubs/user";

describe("createUserDelegate", () => {
  it("findUnique returns a user when found", async () => {
    const delegate = createUserDelegate();
    const user = await delegate.findUnique({ where: { id: "user1" } });
    expect(user).toEqual({ id: "user1", email: "u1@test.com" });
  });

  it("findUnique returns null when user is missing", async () => {
    const delegate = createUserDelegate();
    const user = await delegate.findUnique({ where: { id: "missing" } });
    expect(user).toBeNull();
  });

  it("findFirst returns a user when found", async () => {
    const delegate = createUserDelegate();
    const user = await delegate.findFirst({ where: { id: "user2" } });
    expect(user).toEqual({ id: "user2", email: "u2@test.com" });
  });

  it("findFirst returns null for a non-matching where", async () => {
    const delegate = createUserDelegate();
    const user = await delegate.findFirst({
      where: { email: "u1@test.com", NOT: { id: "user1" } },
    });
    expect(user).toBeNull();
  });

  it("updates users and throws when the user is missing", async () => {
    const delegate = createUserDelegate();
    await expect(
      delegate.update({ where: { id: "user1" }, data: { email: "new@test.com" } })
    ).resolves.toEqual({ id: "user1", email: "new@test.com" });
    await expect(
      delegate.findUnique({ where: { id: "user1" } })
    ).resolves.toEqual({ id: "user1", email: "new@test.com" });
    await expect(
      delegate.update({ where: { id: "missing" }, data: { email: "nope" } })
    ).rejects.toThrow("User not found");
  });
});

