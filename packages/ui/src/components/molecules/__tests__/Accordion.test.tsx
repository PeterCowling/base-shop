import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "../Accordion";
import type { AccordionItem } from "../Accordion";

describe("Accordion", () => {
  const items: AccordionItem[] = [
    { title: "Section 1", content: "Content 1" },
    { title: "Section 2", content: "Content 2" },
    { title: "Section 3", content: "Content 3" },
  ];

  it("renders items closed by default", () => {
    render(<Accordion items={items} />);

    items.forEach(({ content, title }) => {
      const header = screen.getByRole("button", {
        name: (name) => name.startsWith(String(title)),
      });
      expect(header).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(content as string)).not.toBeInTheDocument();
    });
  });

  it("renders no sections when items array is empty", () => {
    render(<Accordion items={[]} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });


  it("switches header icon on mouse click", async () => {
    render(<Accordion items={items} />);
    const header = screen.getByRole("button", { name: /^Section 1/ });
    expect(header).toHaveTextContent("Section 1+");

    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(header).toHaveTextContent("Section 1-");
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(header).toHaveTextContent("Section 1+");
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("switches header icon on keyboard Enter and Space", async () => {
    render(<Accordion items={items} />);
    const header = screen.getByRole("button", { name: /^Section 1/ });
    header.focus();
    expect(header).toHaveTextContent("Section 1+");

    await userEvent.keyboard("{Enter}");
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(header).toHaveTextContent("Section 1-");

    await userEvent.keyboard("{Space}");
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(header).toHaveTextContent("Section 1+");
  });

  it("opens multiple sections via mouse without affecting others", async () => {
    render(<Accordion items={items} />);
    const first = screen.getByRole("button", { name: /^Section 1/ });
    const third = screen.getByRole("button", { name: /^Section 3/ });

    await userEvent.click(first);
    await userEvent.click(third);

    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(third).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.getByText("Content 3")).toBeInTheDocument();

    await userEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    expect(third).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Content 3")).toBeInTheDocument();
  });

  it("opens multiple sections via keyboard without affecting others", async () => {
    render(<Accordion items={items} />);
    const first = screen.getByRole("button", { name: /^Section 1/ });
    const third = screen.getByRole("button", { name: /^Section 3/ });

    first.focus();
    await userEvent.keyboard("{Enter}");
    third.focus();
    await userEvent.keyboard("{Space}");

    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(third).toHaveAttribute("aria-expanded", "true");

    first.focus();
    await userEvent.keyboard("{Enter}");

    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(third).toHaveAttribute("aria-expanded", "true");
  });
});
