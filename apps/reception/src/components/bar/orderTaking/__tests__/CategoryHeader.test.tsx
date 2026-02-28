import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import { type CategoryType } from "../../../../types/bar/BarTypes";
import CategoryHeader from "../CategoryHeader";

describe("CategoryHeader", () => {
  it("applies contrasting text colours via token classes", () => {
    const categories: CategoryType[] = ["Sweet", "Beer"];
    const handleSelect = jest.fn();
    render(
      <CategoryHeader
        categories={categories}
        selectedCategory="Sweet"
        onSelectCategory={handleSelect}
      />
    );

    // Selected tab uses primary-fg (white on forest green background)
    const sweetBtn = screen.getByRole("tab", { name: "Sweet" });
    expect(sweetBtn.className).toContain("text-primary-fg");

    // Unselected tab uses muted-foreground on dark surface
    const beerBtn = screen.getByRole("tab", { name: "Beer" });
    expect(beerBtn.className).toContain("text-muted-foreground");
  });
});
