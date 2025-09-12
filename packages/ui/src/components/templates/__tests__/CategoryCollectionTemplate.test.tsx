import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CategoryCollectionTemplate } from "../CategoryCollectionTemplate";
import { CategoryCard, type Category } from "../../organisms/CategoryCard";
import "../../../../../../test/resetNextMocks";

jest.mock("../../organisms/CategoryCard", () => ({
  CategoryCard: jest.fn(({ category }: { category: Category }) => (
    <div>{category.title}</div>
  )),
}));

describe("CategoryCollectionTemplate", () => {
  it("applies grid columns and renders a CategoryCard for each category", () => {
    const categories: Category[] = [
      { id: "1", title: "Category 1", image: "/img1.jpg" },
      { id: "2", title: "Category 2", image: "/img2.jpg" },
    ];

    const { container } = render(
      <CategoryCollectionTemplate categories={categories} columns={4} />
    );

    const wrapper = container.firstChild as HTMLDivElement;
    expect(wrapper.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );

    expect(CategoryCard as jest.Mock).toHaveBeenCalledTimes(categories.length);
    categories.forEach((c) => {
      expect(screen.getByText(c.title)).toBeInTheDocument();
    });
  });
});

