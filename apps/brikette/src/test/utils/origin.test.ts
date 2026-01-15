import { describe, expect, it } from "vitest";
import { normaliseBrowserOrigin } from "@/utils/origin";

describe("normaliseBrowserOrigin", () => {
  it("returns the origin unchanged when no port is present", () => {
    expect(normaliseBrowserOrigin("https://hostel-positano.com")).toBe(
      "https://hostel-positano.com",
    );
  });

  it("returns empty input verbatim", () => {
    expect(normaliseBrowserOrigin("")).toBe("");
  });

  it("drops common dev-server ports when running on localhost", () => {
    expect(normaliseBrowserOrigin("http://localhost:3000")).toBe("http://localhost");
    expect(normaliseBrowserOrigin("https://127.0.0.1:5173")).toBe("https://127.0.0.1");
    expect(normaliseBrowserOrigin("http://0.0.0.0:4173")).toBe("http://0.0.0.0");
  });

  it("removes default ports when they are specified explicitly", () => {
    expect(normaliseBrowserOrigin("http://example.com:80")).toBe("http://example.com");
    expect(normaliseBrowserOrigin("https://example.com:443")).toBe("https://example.com");
  });

  it("keeps non-default ports on production hosts", () => {
    expect(normaliseBrowserOrigin("https://staging.example:8443")).toBe(
      "https://staging.example:8443",
    );
  });

  it("returns the original value when parsing fails", () => {
    expect(normaliseBrowserOrigin("//relative-path" as unknown as string)).toBe("//relative-path");
  });
});