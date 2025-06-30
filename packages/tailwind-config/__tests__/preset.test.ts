import { jest } from "@jest/globals";

it("exports preset and prints diagnostic message", async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const { default: preset } = await import("../src/index.ts");

  expect((preset.theme?.extend?.colors as Record<string, string>)["bg"]).toBe(
    "hsl(var(--color-bg))"
  );
  expect(logSpy).toHaveBeenCalledWith(
    `[@acme/tailwind-config] ✅  preset imported (cwd: ${process.cwd()})`
  );
  logSpy.mockRestore();
});
