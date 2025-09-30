import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../Avatar";

describe("Avatar", () => {
  it("renders an image when src is provided", () => {
    render(<Avatar src="/avatar.jpg" alt="User avatar" />);
    const img = screen.getByAltText("User avatar");
    // In tests, next/image is mocked to render an <input type="image"> stub
    // for compatibility with lint rules; verify that element is present.
    expect(img.tagName).toBe("INPUT");
    expect(img).toHaveAttribute("src", "/avatar.jpg");
  });

  it("renders fallback content when no src is provided", () => {
    render(<Avatar alt="Jane" fallback="FB" />);
    const fallbackEl = screen.getByText("FB");
    expect(fallbackEl).toBeInTheDocument();
    expect(fallbackEl).toHaveClass("bg-muted");
    expect(fallbackEl).toHaveClass("flex");
    expect(fallbackEl).toHaveClass("items-center");
    expect(fallbackEl).toHaveClass("justify-center");
    expect(fallbackEl).toHaveClass("rounded-full");
    expect(fallbackEl).toHaveClass("text-sm");
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
    expect(img.className).toContain("w-[64px]");
    expect(img.className).toContain("h-[64px]");
    expect(img).toHaveClass("rounded-full");
    expect(img).toHaveClass("rounded-none");
  });

  it("parses string dimensions into numbers and applies spacing", () => {
    const nextImage = require("next/image");
    const spy = jest.spyOn(nextImage, "default");

    render(
      <Avatar
        src="/avatar.jpg"
        alt="User avatar"
        width="64"
        height="64"
        padding="p-4"
        margin="m-2"
      />
    );
    const props = spy.mock.calls[0][0];
    expect(props.width).toBe(64);
    expect(props.height).toBe(64);
    expect(typeof props.width).toBe("number");
    expect(typeof props.height).toBe("number");

    const img = screen.getByAltText("User avatar");
    expect(img).toHaveClass("p-4");
    expect(img).toHaveClass("m-2");
  });
});
