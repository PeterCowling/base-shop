import { describe, expect, it } from "@jest/globals";

import { reorderPipeEntry } from "../CatalogProductImagesFields.client";

describe("reorderPipeEntry", () => {
  it("moves index 1 up in a 3-item list", () => {
    expect(reorderPipeEntry("a|b|c", 1, "up")).toBe("b|a|c");
  });

  it("moves index 1 down in a 3-item list", () => {
    expect(reorderPipeEntry("a|b|c", 1, "down")).toBe("a|c|b");
  });

  it("is a no-op when moving the first item up", () => {
    expect(reorderPipeEntry("a|b|c", 0, "up")).toBe("a|b|c");
  });

  it("is a no-op when moving the last item down", () => {
    expect(reorderPipeEntry("a|b|c", 2, "down")).toBe("a|b|c");
  });

  it("is a no-op for a single-item list moving up", () => {
    expect(reorderPipeEntry("a", 0, "up")).toBe("a");
  });

  it("is a no-op for a single-item list moving down", () => {
    expect(reorderPipeEntry("a", 0, "down")).toBe("a");
  });

  it("returns empty string for an empty pipe string", () => {
    expect(reorderPipeEntry("", 0, "down")).toBe("");
  });

  it("moves the first item down", () => {
    expect(reorderPipeEntry("a|b|c", 0, "down")).toBe("b|a|c");
  });

  it("moves the last item up", () => {
    expect(reorderPipeEntry("a|b|c", 2, "up")).toBe("a|c|b");
  });

  it("trims whitespace from entries", () => {
    expect(reorderPipeEntry(" a | b | c ", 1, "up")).toBe("b|a|c");
  });
});
