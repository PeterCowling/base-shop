import { render } from "@testing-library/react";
import { Input } from "../components/atoms-shadcn";

describe("Input snapshots", () => {
  it("renders basic", () => {
    const { container } = render(<Input placeholder="name" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
