/* i18n-exempt file -- tests use literal copy for assertions */
import { render, screen } from "@testing-library/react";
import { CategoryCard } from "../CategoryCard";
import "../../../../../../test/resetNextMocks";

describe("CategoryCard", () => {
  const category = {
    id: "1",
    title: "Shoes",
    image: "/shoe.jpg",
    description: "Great footwear",
  };

  it("renders category details and padding", () => {
    const { container } = render(
      <CategoryCard category={category} padding="p-8" className="extra" />
    );

    expect(screen.getByAltText("Shoes")).toBeInTheDocument();
    expect(screen.getByText("Shoes")).toBeInTheDocument();
    expect(screen.getByText("Great footwear")).toBeInTheDocument();

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("p-8", "extra");
  });

  it("omits description when absent", () => {
    render(
      <CategoryCard
        category={{ id: "1", title: "Shoes", image: "/shoe.jpg" }}
      />
    );
    expect(screen.queryByText("Great footwear")).toBeNull();
  });
});
