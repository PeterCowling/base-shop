import { render } from "@testing-library/react";
import { Button } from "../components/atoms-shadcn";

describe("Button snapshots", () => {
  it("renders default", () => {
    const { container } = render(<Button>click</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders destructive", () => {
    const { container } = render(<Button variant="destructive">delete</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
