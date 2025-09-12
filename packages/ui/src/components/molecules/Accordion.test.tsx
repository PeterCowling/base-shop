import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./Accordion";
import type { AccordionItem } from "./Accordion";

describe("Accordion", () => {
  const items: AccordionItem[] = [{ title: "Section 1", content: "Content 1" }];

  it("renders collapsed by default", () => {
    render(<Accordion items={items} />);
    const button = screen.getByRole("button", { name: /^Section 1/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("expands on click and fires callback", async () => {
    render(<Accordion items={items} />);
    const button = screen.getByRole("button", { name: /^Section 1/ });
    const callback = jest.fn();
    button.addEventListener("click", callback);

    await userEvent.click(button);

    expect(callback).toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });
});
