import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../Avatar";

describe("Avatar", () => {
  it("renders an image when src is provided", () => {
    render(<Avatar src="/avatar.jpg" alt="User avatar" />);
    const img = screen.getByAltText("User avatar");
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "/avatar.jpg");
  });

  it("renders fallback content when no src is provided", () => {
    render(<Avatar alt="Jane" fallback="FB" />);
    expect(screen.getByText("FB")).toBeInTheDocument();
  });

  it("displays first initial from alt when no fallback is provided", () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("applies size and shape classes", () => {
    render(
      <Avatar
        src="/avatar.jpg"
        alt="User avatar"
        size={64}
        className="rounded-none"
      />
    );
    const img = screen.getByAltText("User avatar");
    expect(img).toHaveStyle({ width: "64px", height: "64px" });
    expect(img).toHaveClass("rounded-full");
    expect(img).toHaveClass("rounded-none");
  });

  it("parses string dimensions and applies spacing", () => {
    const nextImage = require("next/image");
    const spy = jest.spyOn(nextImage, "default");

    render(
      <Avatar
        src="/avatar.jpg"
        alt="User avatar"
        width="48"
        height="64"
        padding="p-4"
        margin="m-2"
      />
    );

    expect(spy.mock.calls[0][0]).toMatchObject({ width: 48, height: 64 });

    const img = screen.getByAltText("User avatar");
    expect(img).toHaveStyle({ width: "48", height: "64" });
    expect(img).toHaveClass("p-4");
    expect(img).toHaveClass("m-2");
  });
});
