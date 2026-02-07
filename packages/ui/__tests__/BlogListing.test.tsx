import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("navigates when shop link is clicked", async () => {
    render(
      <BlogListing posts={[{ title: "Shop post", shopUrl: "/shop/story" }]} />
    );
    const link = screen.getByRole("link", { name: "Shop the story" });
    expect(link).toHaveAttribute("href", "/shop/story");
    let clicked = false;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      clicked = true;
    });
    await userEvent.click(link);
    expect(clicked).toBe(true);
  });

  it("renders nothing when no posts provided", () => {
    const { container } = render(<BlogListing posts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
