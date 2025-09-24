/** @jest-environment node */
import { createUserDelegate } from "../user";

describe("user delegate", () => {
  it("performs lookups and updates", async () => {
    const d = createUserDelegate();
    expect(await d.findUnique({ where: { id: "user1" } })).toHaveProperty(
      "email",
      "u1@test.com"
    );
    expect(
      await d.findUnique({
        where: { id: "user1", NOT: { email: "u1@test.com" } },
      })
    ).toBeNull();
    expect(await d.findFirst({ where: { email: "u2@test.com" } })).toHaveProperty(
      "id",
      "user2"
    );
    await d.create({ data: { id: "user3", email: "u3@test.com" } });
    const updated = await d.update({
      where: { id: "user3" },
      data: { email: "new@test.com" },
    });
    expect(updated.email).toBe("new@test.com");
    await expect(
      d.update({ where: { id: "missing" }, data: { email: "x" } })
    ).rejects.toThrow("User not found");
  });
});

