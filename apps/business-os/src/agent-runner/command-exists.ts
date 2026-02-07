import * as childProcess from "node:child_process";

export function commandExists(command: string): boolean {
  try {
    childProcess.execFileSync("/usr/bin/env", ["bash", "-lc", `command -v ${command}`], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}
