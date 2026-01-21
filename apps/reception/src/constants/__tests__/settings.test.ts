
async function loadSettings(envVars: Record<string, string | undefined>) {
  jest.resetModules();
  const env = import.meta.env as Record<string, string | undefined>;
  Object.assign(env, envVars);
  const mod = await import("../settings");
  for (const key of Object.keys(envVars)) delete env[key];
  return mod.settings as typeof import("../settings").settings;
}

describe("settings", () => {
  it("parses boolean flags", async () => {
    const settings = await loadSettings({
      VITE_BLIND_OPEN: "true",
    });
    expect(settings.blindOpen).toBe(true);
  });

  it("parses numeric values", async () => {
    const settings = await loadSettings({
      VITE_CASH_DRAWER_LIMIT: "1500",
    });
    expect(settings.cashDrawerLimit).toBe(1500);
  });
});
