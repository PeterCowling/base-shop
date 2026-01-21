import { render, screen } from "@testing-library/react";

import { HelloTemplate } from "../HelloTemplate";

describe("HelloTemplate", () => {
  it("renders title and body", () => {
    const { container } = render(
      <HelloTemplate title="Welcome" body="Hello world" />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Welcome"
    );
    expect(container).toMatchSnapshot();
  });
});
