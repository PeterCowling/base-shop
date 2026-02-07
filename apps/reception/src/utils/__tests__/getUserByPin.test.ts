
async function loadUtil(usersJson?: string) {
  jest.resetModules();
  const env = import.meta.env as { VITE_USERS_JSON?: string };
  if (usersJson !== undefined) {
    env.VITE_USERS_JSON = usersJson;
  }
  const mod = await import("../getUserByPin");
  delete env.VITE_USERS_JSON;
  return mod.getUserByPin;
}

describe("getUserByPin", () => {
  it("returns the matching user", async () => {
    const json = JSON.stringify({
      "111111": { email: "one@example.com", user_name: "one" },
    });
    const getUserByPin = await loadUtil(json);
    expect(getUserByPin("111111")).toEqual({
      email: "one@example.com",
      user_name: "one",
    });
  });

  it("returns null for unknown PIN", async () => {
    const json = JSON.stringify({
      "111111": { email: "one@example.com", user_name: "one" },
    });
    const getUserByPin = await loadUtil(json);
    expect(getUserByPin("999999")).toBeNull();
  });

  it("returns null when JSON parsing fails", async () => {
    const getUserByPin = await loadUtil("{invalid");
    expect(getUserByPin("111111")).toBeNull();
  });
});
