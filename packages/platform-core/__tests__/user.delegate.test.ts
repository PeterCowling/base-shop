import { createUserDelegate } from "../src/db/stubs/user";

describe("createUserDelegate", () => {
  it("returns the second user with findFirst", async () => {
    const delegate = createUserDelegate();
    const user = await delegate.findFirst({ where: { id: "user2" } });
    expect(user).toEqual({ id: "user2", email: "u2@test.com" });
  });

  it("throws when updating a missing user", async () => {
    const delegate = createUserDelegate();
    await expect(
      delegate.update({ where: { id: "missing" }, data: { email: "nope" } })
    ).rejects.toThrow("User not found");
  });
});
