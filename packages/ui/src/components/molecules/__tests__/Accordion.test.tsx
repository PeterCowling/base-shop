import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "../Accordion";
import type { AccordionItem } from "../Accordion";

describe("Accordion", () => {
  const items: AccordionItem[] = [
    { title: "Section 1", content: "Content 1" },
    { title: "Section 2", content: "Content 2" },
  ];

  it("renders items closed by default", () => {
    render(<Accordion items={items} />);

    items.forEach(({ content, title }) => {
      const header = screen.getByRole("button", {
        name: new RegExp(`^${title as string}`),
      });
      expect(header).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(content as string)).not.toBeInTheDocument();
    });
  });

  it("allows toggling items via click", async () => {
    render(<Accordion items={items} />);
    const header = screen.getByRole("button", { name: /^Section 1/ });

    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("supports keyboard interaction on headers", async () => {
    render(<Accordion items={items} />);
    const header = screen.getByRole("button", { name: /^Section 2/ });
    header.focus();

    await userEvent.keyboard("{Enter}");
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Content 2")).toBeInTheDocument();

    await userEvent.keyboard("{Enter}");
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
  });
});
