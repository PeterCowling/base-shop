/** @jest-environment node */
import { expect } from "@jest/globals";

const resolveMock = jest.fn();

jest.mock("node:module", () => ({
  createRequire: jest.fn(() => ({ resolve: resolveMock })),
}));
// ensure TypeScript execution via ts-node like the script's CLI usage
import "ts-node/register";

describe("check-tailwind-preset script", () => {
  beforeEach(() => {
    jest.resetModules();
    resolveMock.mockReset();
  });

  it("logs resolved path when preset resolves", async () => {
    resolveMock.mockReturnValue("/mocked/path.js");
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await import("../check-tailwind-preset.ts");

    expect(logSpy).toHaveBeenCalledWith(
      "[tailwind.config] ✅  @acme/tailwind-config resolved → /mocked/path.js"
    );
    expect(logSpy).toHaveBeenCalledWith(
      "[tailwind.config] ℹ️  preset keys:",
      expect.any(Array)
    );
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("could NOT be resolved"),
      expect.anything()
    );
  });

  it("logs error when preset cannot be resolved", async () => {
    const err = Object.assign(new Error("Cannot find module"), {
      code: "MODULE_NOT_FOUND",
    });
    resolveMock.mockImplementation(() => {
      throw err;
    });

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await import("../check-tailwind-preset.ts");

    expect(errorSpy).toHaveBeenCalledWith(
      "[tailwind.config] ❌  @acme/tailwind-config could NOT be resolved.\n" +
        "Is the package in pnpm-workspace.yaml? Did you run `pnpm install`?",
      err
    );
    expect(logSpy).toHaveBeenCalledWith(
      "[tailwind.config] ℹ️  preset keys:",
      expect.any(Array)
    );
  });
});

