import { describe, expect, it } from "@jest/globals";

import {
  inferXaImageRoleFromText,
  normalizeXaImageRole,
  requiredImageRolesByCategory,
  roleFallbackSequenceByCategory,
  sortXaMediaByRole,
} from "../catalogImageRoles";

describe("catalogImageRoles", () => {
  it("normalizes known roles and rejects unsupported values", () => {
    expect(normalizeXaImageRole(" FRONT ")).toBe("front");
    expect(normalizeXaImageRole("back")).toBe("back");
    expect(normalizeXaImageRole("unknown")).toBeUndefined();
    expect(normalizeXaImageRole("")).toBeUndefined();
  });

  it("returns category-required roles", () => {
    expect(requiredImageRolesByCategory("bags")).toEqual(["front", "side", "top"]);
    expect(requiredImageRolesByCategory("clothing")).toEqual(["front", "side"]);
    expect(requiredImageRolesByCategory("jewelry")).toEqual(["front", "side", "detail"]);
  });

  it("returns deterministic fallback sequence per category", () => {
    expect(roleFallbackSequenceByCategory("bags")).toEqual([
      "front",
      "side",
      "top",
      "back",
      "detail",
      "interior",
      "scale",
    ]);
    expect(roleFallbackSequenceByCategory("jewelry")).toEqual([
      "front",
      "side",
      "detail",
      "top",
      "back",
      "interior",
      "scale",
    ]);
  });

  it("infers roles from legacy path or copy tokens", () => {
    expect(
      inferXaImageRoleFromText("images/hermes-kelly-28-black/1709578800-front.jpg"),
    ).toBe("front");
    expect(inferXaImageRoleFromText("BACK VIEW")).toBe("back");
    expect(inferXaImageRoleFromText("studio detail crop")).toBe("detail");
    expect(inferXaImageRoleFromText("hero shot")).toBeUndefined();
  });

  it("sorts media by perspective priority and preserves order within the same role", () => {
    const input = [
      { path: "detail-1.jpg", role: "detail" },
      { path: "top-1.jpg", role: "top" },
      { path: "front-1.jpg", role: "front" },
      { path: "back-1.jpg", role: "back" },
      { path: "detail-2.jpg", role: "detail" },
      { path: "other.jpg" },
    ];

    expect(sortXaMediaByRole(input).map((item) => item.path)).toEqual([
      "front-1.jpg",
      "back-1.jpg",
      "top-1.jpg",
      "detail-1.jpg",
      "detail-2.jpg",
      "other.jpg",
    ]);
  });
});
