import { handlers } from "./msw/handlers";

describe("msw handlers", () => {
  it("exports handlers array with expected shape", () => {
    // MSW v2 handlers don't expose resolver directly, so we just verify
    // the handlers array is properly exported with the expected structure
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);

    for (const handler of handlers) {
      // Verify handler has expected MSW v2 structure
      expect(handler).toHaveProperty("info");
      expect(handler.info).toHaveProperty("path");
    }
  });
});
