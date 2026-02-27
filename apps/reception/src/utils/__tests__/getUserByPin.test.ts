import { type User, usersRecordSchema } from "../../types/domains/userDomain";

function loadUtil(usersJson?: string): (pin: string) => User | null {
  let fn: (pin: string) => User | null = () => null;
  const prev = process.env.NEXT_PUBLIC_USERS_JSON;
  if (usersJson !== undefined) {
    process.env.NEXT_PUBLIC_USERS_JSON = usersJson;
  } else {
    delete process.env.NEXT_PUBLIC_USERS_JSON;
  }
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fn = require("../getUserByPin").getUserByPin;
  });
  if (prev !== undefined) {
    process.env.NEXT_PUBLIC_USERS_JSON = prev;
  } else {
    delete process.env.NEXT_PUBLIC_USERS_JSON;
  }
  return fn;
}

describe("getUserByPin", () => {
  it("returns the matching user", () => {
    const json = JSON.stringify({
      "111111": { email: "one@example.com", user_name: "one" },
    });
    const getUserByPin = loadUtil(json);
    expect(getUserByPin("111111")).toMatchObject({
      email: "one@example.com",
      user_name: "one",
    });
  });

  it("returns null for unknown PIN", () => {
    const json = JSON.stringify({
      "111111": { email: "one@example.com", user_name: "one" },
    });
    const getUserByPin = loadUtil(json);
    expect(getUserByPin("999999")).toBeNull();
  });

  it("returns null when JSON parsing fails", () => {
    const getUserByPin = loadUtil("{invalid");
    expect(getUserByPin("111111")).toBeNull();
  });
});

describe("usersRecordSchema roles round-trip", () => {
  it("passes roles through parse", () => {
    const result = usersRecordSchema.parse({
      "123": { email: "a@b.com", user_name: "X", roles: ["owner"] },
    });
    expect(result["123"].roles).toEqual(["owner"]);
  });
  it("parses entry with no roles without error", () => {
    const result = usersRecordSchema.parse({
      "456": { email: "b@c.com", user_name: "Y" },
    });
    expect(result["456"].roles).toBeUndefined();
  });
});
