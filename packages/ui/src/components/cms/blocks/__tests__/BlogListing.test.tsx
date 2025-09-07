import "../../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import BlogListing from "../BlogListing";

describe("BlogListing", () => {
  it("renders blog posts", () => {
    render(<BlogListing posts={[{ title: "Post", url: "/post" }]} />);
    expect(screen.getByRole("heading", { name: "Post" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Post" })).toHaveAttribute(
      "href",
      "/post",
    );
  });

  it("returns null without posts", () => {
    const { container } = render(<BlogListing posts={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
