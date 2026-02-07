import * as telemetry from "@acme/telemetry";

describe("telemetry index", () => {
  it("exports track function", () => {
    // Verify the telemetry module exports the expected interface
    expect(typeof telemetry.track).toBe("function");
  });

  it("track can be called without error when telemetry disabled", () => {
    // When NEXT_PUBLIC_ENABLE_TELEMETRY is not set to "true",
    // track should silently no-op
    expect(() => {
      telemetry.track("test:event", { key: "value" });
    }).not.toThrow();
  });
});
