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

  // C5 — Image reorder and promote operations

  it("C5: reorders imageFiles and imageAltTexts in sync when the same index and direction are applied to both", () => {
    const files = "xa-b/p1/a.jpg|xa-b/p1/b.jpg|xa-b/p1/c.jpg";
    const alts = "alt-a|alt-b|alt-c";
    const newFiles = reorderPipeEntry(files, 1, "up");
    const newAlts = reorderPipeEntry(alts, 1, "up");
    expect(newFiles).toBe("xa-b/p1/b.jpg|xa-b/p1/a.jpg|xa-b/p1/c.jpg");
    expect(newAlts).toBe("alt-b|alt-a|alt-c");
    // tuple alignment is preserved: b.jpg is still paired with alt-b
    expect(newFiles.split("|")[0]).toContain("b.jpg");
    expect(newAlts.split("|")[0]).toBe("alt-b");
  });

  it("C5: promotes an image to main position via two sequential reorder steps", () => {
    // c at index 2 promoted to index 0 via two "up" moves
    const files = "xa-b/p1/a.jpg|xa-b/p1/b.jpg|xa-b/p1/c.jpg";
    const alts = "alt-a|alt-b|alt-c";
    const step1Files = reorderPipeEntry(files, 2, "up");
    const step1Alts = reorderPipeEntry(alts, 2, "up");
    // c is now at index 1
    expect(step1Files).toBe("xa-b/p1/a.jpg|xa-b/p1/c.jpg|xa-b/p1/b.jpg");
    const step2Files = reorderPipeEntry(step1Files, 1, "up");
    const step2Alts = reorderPipeEntry(step1Alts, 1, "up");
    // c is now at index 0 (promoted to main image)
    expect(step2Files).toBe("xa-b/p1/c.jpg|xa-b/p1/a.jpg|xa-b/p1/b.jpg");
    expect(step2Alts).toBe("alt-c|alt-a|alt-b");
    expect(step2Files.split("|")[0]).toContain("c.jpg");
    expect(step2Alts.split("|")[0]).toBe("alt-c");
  });
});
