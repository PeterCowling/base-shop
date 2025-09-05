import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import FAQBlock from "../FAQBlock";

describe("FAQBlock", () => {
  const items = [
    { question: "Q1", answer: "A1" },
    { question: "Q2", answer: "A2" },
  ];

  it("renders accordion items and toggles answers", () => {
    render(<FAQBlock items={items} />);
    const btn = screen.getByRole("button", { name: /Q1/ });
    fireEvent.click(btn);
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
