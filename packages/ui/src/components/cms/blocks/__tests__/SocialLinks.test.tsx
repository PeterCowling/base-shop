import { render, screen } from "@testing-library/react";
import SocialLinks from "../SocialLinks";

describe("SocialLinks", () => {
  it("returns null when no links are provided", () => {
    const { container } = render(<SocialLinks />);
    expect(container.firstChild).toBeNull();
  });

  const cases = [
    ["facebook", "https://facebook.com/example"],
    ["instagram", "https://instagram.com/example"],
    ["x", "https://x.com/example"],
    ["youtube", "https://youtube.com/example"],
    ["linkedin", "https://linkedin.com/in/example"],
  ] as const;

  it.each(cases)("renders %s link", (name, url) => {
    render(<SocialLinks {...{ [name]: url }} />);
    const link = screen.getByRole("link", { name });
    expect(link).toHaveAttribute("href", url);
  });

  it("renders multiple links", () => {
    const links = {
      facebook: "https://facebook.com/example",
      instagram: "https://instagram.com/example",
      x: "https://x.com/example",
    } as const;

    render(<SocialLinks {...links} />);

    expect(screen.getAllByRole("link")).toHaveLength(3);
    Object.entries(links).forEach(([name, url]) => {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", url);
    });
  });

  it("opens links in a new window", () => {
    render(<SocialLinks facebook="https://facebook.com/example" />);
    expect(
      screen.getByRole("link", { name: "facebook" })
    ).toHaveAttribute("target", "_blank");
  });

  it("does not render links without URL", () => {
    render(
      <SocialLinks
        facebook="https://facebook.com/example"
        instagram=""
      />
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: "instagram" })
    ).not.toBeInTheDocument();
  });

  it("merges provided className", () => {
    const { container } = render(
      <SocialLinks facebook="https://facebook.com/example" className="custom" />
    );

    expect(container.firstChild).toHaveClass("flex");
    expect(container.firstChild).toHaveClass("gap-4");
    expect(container.firstChild).toHaveClass("custom");
  });
});
