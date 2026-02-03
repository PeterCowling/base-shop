import * as childProcess from "node:child_process";

import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { commandExists } from "./command-exists";

describe("agent-runner/command-exists", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns true when execFileSync succeeds", () => {
    jest.spyOn(childProcess, "execFileSync").mockImplementation(() => undefined as never);
    expect(commandExists("claude")).toBe(true);
  });

  it("returns false when execFileSync throws", () => {
    jest.spyOn(childProcess, "execFileSync").mockImplementation(() => {
      throw new Error("nope");
    });
    expect(commandExists("missing")).toBe(false);
  });
});
