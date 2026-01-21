import MainImageField from "@cms/app/cms/blog/posts/MainImageField";
import { render, screen } from "@testing-library/react";

jest.mock("@acme/ui", () => ({
  Button: ({ children }: any) => <button>{children}</button>,
  ImagePicker: ({ children }: any) => <div>{children}</div>,
}));

describe("MainImageField", () => {
  it("shows select label when empty", () => {
    render(<MainImageField value="" onChange={() => {}} />);
    expect(screen.getByText("Select image")).toBeInTheDocument();
  });
  it("shows preview when value present", () => {
    render(<MainImageField value="/test.png" onChange={() => {}} />);
    expect(screen.getByAltText("Main image")).toHaveAttribute("src", "/test.png");
    expect(screen.getByText("Change image")).toBeInTheDocument();
  });
});
