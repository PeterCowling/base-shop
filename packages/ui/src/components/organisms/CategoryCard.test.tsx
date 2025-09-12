import { render, screen, within } from "@testing-library/react";
import { CategoryCard } from "./CategoryCard";
import "../../../../../test/resetNextMocks";

describe("CategoryCard", () => {
  const category = {
    id: "1",
    title: "Shoes",
    image: "/shoe.jpg",
  };

  it("renders image, title, and link", () => {
    render(
      <a href="/categories/1">
        <CategoryCard category={category} />
      </a>
    );

    const link = screen.getByRole("link", { name: /shoes/i });
    expect(link).toHaveAttribute("href", "/categories/1");
    expect(within(link).getByAltText("Shoes")).toBeInTheDocument();
    expect(within(link).getByText("Shoes")).toBeInTheDocument();
  });
});
