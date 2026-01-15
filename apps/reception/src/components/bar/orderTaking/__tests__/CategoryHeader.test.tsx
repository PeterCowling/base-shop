import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import CategoryHeader from "../CategoryHeader";
import { CategoryType } from "../../../../types/bar/BarTypes";

describe("CategoryHeader", () => {
  it("applies contrasting text colours in light and dark mode", () => {
    const categories: CategoryType[] = ["Sweet", "Beer"];
    const handleSelect = vi.fn();
    render(
      <CategoryHeader
        categories={categories}
        selectedCategory="Sweet"
        onSelectCategory={handleSelect}
      />
    );

    const sweetBtn = screen.getByRole("tab", { name: "Sweet" });
    expect(sweetBtn.className).toContain("text-black");
    expect(sweetBtn.className).toContain("dark:text-darkAccentGreen");

    const beerBtn = screen.getByRole("tab", { name: "Beer" });
    expect(beerBtn.className).toContain("text-white");
    expect(beerBtn.className).toContain("dark:text-white");
  });
});
