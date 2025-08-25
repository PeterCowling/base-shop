import { render, screen } from "@testing-library/react";
import BlogListing from "../src/components/cms/blocks/BlogListing";

describe("BlogListing", () => {
  it("renders post titles and excerpts", () => {
    render(
      <BlogListing
        posts={[
          { title: "A", excerpt: "first", url: "/a" },
          { title: "B", excerpt: "second" },
        ]}
      />
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    const excerpt = screen.getByText("first");
    expect(excerpt).toBeInTheDocument();
    expect(excerpt).toHaveAttribute("data-token", "--color-muted");
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
