import { logger as coreLogger } from "../logger";
import { logger as sharedLogger } from "@acme/shared-utils";

describe("logger re-export", () => {
  it("matches shared utils logger", () => {
    expect(coreLogger).toBe(sharedLogger);
  });
});
