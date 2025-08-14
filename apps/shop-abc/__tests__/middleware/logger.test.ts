import { warn } from "../../src/middleware/logger";

describe("logger", () => {
  it("prefixes scope", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    warn("login", "locked");
    expect(spy).toHaveBeenCalledWith("[login] locked");
    spy.mockRestore();
  });
});
