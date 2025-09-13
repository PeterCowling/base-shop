import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import FAQBlock from "../FAQBlock";

describe("FAQBlock", () => {
  const items: any[] = [
    { question: "Q1", answer: "A1" },
    { question: "Q2", answer: "A2" },
    // Item missing an answer should be ignored
    { question: "Q3" },
  ];

  it("renders multiple entries, skipping those without answers", () => {
    render(<FAQBlock items={items} />);
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("Q2")).toBeInTheDocument();
    // Q3 has no answer and should be skipped
    expect(screen.queryByText("Q3")).not.toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Q1/ });
    fireEvent.click(btn, { detail: 1 });
    expect(screen.getByText("A1")).toBeInTheDocument();
  });

  it("respects maxItems", () => {
    render(<FAQBlock items={items} maxItems={1} />);
    expect(screen.queryByText("Q2")).not.toBeInTheDocument();
  });

  it("returns null when below minItems", () => {
    const { container } = render(<FAQBlock items={[items[0]]} minItems={2} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null with no items", () => {
    const { container } = render(<FAQBlock items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
