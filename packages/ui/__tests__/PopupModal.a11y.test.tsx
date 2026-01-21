import { render, screen } from "@testing-library/react";

import PopupModal from "../src/components/cms/blocks/PopupModal";

describe("PopupModal accessibility", () => {
  it("renders dialog role with accessible label", () => {
    render(<PopupModal content="<p>Hello</p>" />);
    const dialog = screen.getByRole("dialog", { name: /popup modal/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("does not render dialog without label", () => {
    render(<PopupModal content="<p>Hello</p>" />);
    expect(screen.queryByRole("dialog", { name: "" })).toBeNull();
  });
});
