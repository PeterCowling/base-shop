import { render, screen } from "@testing-library/react";
import BlogListing from "../components/cms/blocks/BlogListing";

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
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
