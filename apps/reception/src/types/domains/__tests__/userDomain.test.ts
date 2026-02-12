import { normalizeRoles, userProfileSchema } from "../userDomain";

describe("userDomain role normalization", () => {
  it("keeps array-based roles", () => {
    const parsed = userProfileSchema.parse({
      uid: "user-1",
      email: "user1@test.com",
      user_name: "user1",
      roles: ["staff", "manager"],
    });

    expect(normalizeRoles(parsed.roles)).toEqual(["staff", "manager"]);
  });

  it("converts map-based roles", () => {
    const parsed = userProfileSchema.parse({
      uid: "user-2",
      email: "user2@test.com",
      user_name: "user2",
      roles: {
        owner: true,
        staff: true,
      },
    });

    expect(normalizeRoles(parsed.roles)).toEqual(["owner", "staff"]);
  });

  it("converts legacy index role objects", () => {
    const parsed = userProfileSchema.parse({
      uid: "user-3",
      email: "user3@test.com",
      user_name: "user3",
      roles: {
        0: "staff",
        1: "manager",
      },
    });

    expect(normalizeRoles(parsed.roles)).toEqual(["staff", "manager"]);
  });
});
