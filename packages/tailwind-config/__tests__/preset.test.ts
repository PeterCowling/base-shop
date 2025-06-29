import { jest } from "@jest/globals";

it("exports preset and prints diagnostic message", () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const preset = require("../src/index.ts").default;

  expect(preset.theme?.extend?.colors?.bg).toBe("hsl(var(--color-bg))");
  expect(logSpy).toHaveBeenCalledWith(
    `[@acme/tailwind-config] ✅  preset imported (cwd: ${process.cwd()})`
  );
  logSpy.mockRestore();
});
