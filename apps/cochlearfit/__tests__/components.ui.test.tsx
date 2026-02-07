import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import PageHeader from "@/components/PageHeader";
import QuantityStepper from "@/components/QuantityStepper";
import Section from "@/components/Section";

describe("ui components", () => {
  it("renders container with base and custom classes", () => {
    const { container } = render(
      <Container className="custom">
        <div>Child</div>
      </Container>
    );

    const root = container.querySelector("div");
    expect(root).toHaveClass("max-w-md");
    expect(root).toHaveClass("custom");
  });

  it("renders grid layout with class names", () => {
    const { container } = render(<Grid className="gap-2" data-cy="grid" />);
    const grid = container.querySelector("[data-cy='grid']");
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("gap-2");
  });

  it("renders sections with container classes", () => {
    const { container } = render(
      <Section className="pt-0" containerClassName="gap-4">
        <div>Content</div>
      </Section>
    );

    const section = container.querySelector("section");
    expect(section).toHaveClass("pt-0");
    const wrapper = container.querySelector("section > div");
    expect(wrapper).toHaveClass("gap-4");
  });

  it("renders page headers with optional copy", () => {
    render(
      <PageHeader eyebrow="Eyebrow" title="Title" description="Description" />
    );

    expect(screen.getByText("Eyebrow")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders page headers without optional copy", () => {
    render(<PageHeader title="Title only" />);
    expect(screen.getByRole("heading", { name: "Title only" })).toBeInTheDocument();
    expect(screen.queryByText("Eyebrow")).not.toBeInTheDocument();
  });

  it("handles quantity stepper limits", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <QuantityStepper quantity={1} onChange={onChange} label="Quantity" />
    );

    expect(screen.getByRole("button", { name: "Quantity -" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Quantity +" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("prevents increments beyond max", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <QuantityStepper quantity={10} onChange={onChange} label="Quantity" />
    );

    const plus = screen.getByRole("button", { name: "Quantity +" });
    expect(plus).toBeDisabled();
    await user.click(plus);
    expect(onChange).not.toHaveBeenCalled();
  });
});
