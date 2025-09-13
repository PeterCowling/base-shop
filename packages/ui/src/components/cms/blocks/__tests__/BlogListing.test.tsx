import "../../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import BlogListing from "../BlogListing";

describe("BlogListing", () => {
  it("renders blog posts", () => {
    render(
      <BlogListing
        posts={[
          {
            title: "Post",
            url: "/post",
            excerpt: "Excerpt",
            shopUrl: "/shop",
          },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Post" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Post" })).toHaveAttribute(
      "href",
      "/post",
    );
    expect(screen.getByText("Excerpt")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop the story" })).toHaveAttribute(
      "href",
      "/shop",
    );
  });

  it("returns null without posts", () => {
    const { container } = render(<BlogListing posts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders plain heading without url", () => {
    render(<BlogListing posts={[{ title: "No Link" }]} />);
    const heading = screen.getByRole("heading", { name: "No Link" });
    expect(heading.tagName).toBe("H3");
    expect(screen.queryByRole("link", { name: "No Link" })).not.toBeInTheDocument();
  });
});
