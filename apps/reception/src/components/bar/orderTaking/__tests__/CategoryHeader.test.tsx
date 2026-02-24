import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import { type CategoryType } from "../../../../types/bar/BarTypes";
import CategoryHeader from "../CategoryHeader";

describe("CategoryHeader", () => {
  it("applies contrasting text colours in light and dark mode", () => {
    const categories: CategoryType[] = ["Sweet", "Beer"];
    const handleSelect = jest.fn();
    render(
      <CategoryHeader
        categories={categories}
        selectedCategory="Sweet"
        onSelectCategory={handleSelect}
      />
    );

    const sweetBtn = screen.getByRole("tab", { name: "Sweet" });
    expect(sweetBtn.className).toContain("text-foreground");
    expect(sweetBtn.className).toContain("dark:text-darkAccentGreen");

    const beerBtn = screen.getByRole("tab", { name: "Beer" });
    expect(beerBtn.className).toContain("text-primary-fg");
    expect(beerBtn.className).toContain("dark:text-primary-fg");
  });
});
