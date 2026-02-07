import { execFileSync } from "node:child_process";

import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { commandExists } from "./command-exists";

jest.mock("node:child_process", () => ({
  execFileSync: jest.fn(),
}));

const mockedExecFileSync = execFileSync as jest.MockedFunction<typeof execFileSync>;

describe("agent-runner/command-exists", () => {
  afterEach(() => {
    mockedExecFileSync.mockReset();
  });

  it("returns true when execFileSync succeeds", () => {
    mockedExecFileSync.mockReturnValue(Buffer.from(""));
    expect(commandExists("claude")).toBe(true);
  });

  it("returns false when execFileSync throws", () => {
    mockedExecFileSync.mockImplementation(() => {
      throw new Error("nope");
    });
    expect(commandExists("missing")).toBe(false);
  });
});
