import { render, screen } from "@testing-library/react";

import ConfirmationStep from "../src/app/cms/blog/sanity/connect/ConfirmationStep";

describe("ConfirmationStep", () => {
  it("shows message", () => {
    render(<ConfirmationStep message="connected" />);
    expect(screen.getByText(/connected/)).toBeInTheDocument();
  });
});
