import React from "react";
import { render } from "@testing-library/react";
import { Avatar } from "../src/components/atoms/Avatar";
import Image from "next/image";

jest.mock("next/image", () => ({
  __esModule: true,
  default: jest.fn((props: any) => <img {...props} />),
}));

const MockImage = Image as unknown as jest.Mock;

describe("Avatar", () => {
  it("renders alt initial when no src provided", () => {
    const { getByText } = render(<Avatar alt="Alice" />);
    expect(getByText("A")).toBeInTheDocument();
  });

  it("uses explicit fallback prop when provided", () => {
    const { getByText } = render(<Avatar alt="Alice" fallback="AL" />);
    expect(getByText("AL")).toBeInTheDocument();
  });

  it("converts width/height strings to numbers for Next Image", () => {
    render(<Avatar src="/a.png" alt="A" width="40" height="50" />);
    expect(MockImage).toHaveBeenCalled();
    const props = MockImage.mock.calls[0][0];
    expect(props.width).toBe(40);
    expect(props.height).toBe(50);
  });
});
