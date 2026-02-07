import { fireEvent, render, screen } from "@testing-library/react";

import PricingTableEditor from "../PricingTableEditor";

describe("PricingTableEditor", () => {
  const baseComponent = {
    type: "PricingTable",
    plans: [
      {
        title: "",
        price: "",
        features: [],
        ctaLabel: "",
        ctaHref: "",
        featured: false,
      },
    ],
    minItems: 1,
    maxItems: 2,
  } as const;

  it("adds and removes plans respecting min and max", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <PricingTableEditor component={baseComponent as any} onChange={onChange} />,
    );

    const addButton = screen.getByText("Add Plan");
    expect(addButton).not.toBeDisabled();

    fireEvent.click(addButton);
    const addedPlans = onChange.mock.calls[0][0].plans;
    expect(addedPlans).toEqual([
      {
        title: "",
        price: "",
        features: [],
        ctaLabel: "",
        ctaHref: "",
        featured: false,
      },
      {
        title: "",
        price: "",
        features: [],
        ctaLabel: "",
        ctaHref: "",
      },
    ]);

    rerender(
      <PricingTableEditor
        component={{ ...baseComponent, plans: addedPlans } as any}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Add Plan")).toBeDisabled();

    onChange.mockClear();
    const removeButtons = screen.getAllByText("Remove Plan");
    fireEvent.click(removeButtons[0]);
    const remainingPlans = onChange.mock.calls[0][0].plans;
    expect(remainingPlans).toEqual([
      {
        title: "",
        price: "",
        features: [],
        ctaLabel: "",
        ctaHref: "",
      },
    ]);

    rerender(
      <PricingTableEditor
        component={{ ...baseComponent, plans: remainingPlans } as any}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Add Plan")).not.toBeDisabled();
    expect(screen.getByText("Remove Plan")).toBeDisabled();
  });

  it("updates plan fields and triggers onChange", () => {
    const onChange = jest.fn();
    render(<PricingTableEditor component={baseComponent as any} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("title"), {
      target: { value: "Pro" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      plans: [
        {
          title: "Pro",
          price: "",
          features: [],
          ctaLabel: "",
          ctaHref: "",
          featured: false,
        },
      ],
    });

    onChange.mockClear();
    fireEvent.change(screen.getByPlaceholderText("price"), {
      target: { value: "10" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      plans: [
        {
          title: "",
          price: "10",
          features: [],
          ctaLabel: "",
          ctaHref: "",
          featured: false,
        },
      ],
    });

    onChange.mockClear();
    fireEvent.change(screen.getByPlaceholderText("one feature per line"), {
      target: { value: "a\nb\n\n c " },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      plans: [
        {
          title: "",
          price: "",
          features: ["a", "b", "c"],
          ctaLabel: "",
          ctaHref: "",
          featured: false,
        },
      ],
    });

    onChange.mockClear();
    fireEvent.change(screen.getByPlaceholderText("CTA label"), {
      target: { value: "Buy" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      plans: [
        {
          title: "",
          price: "",
          features: [],
          ctaLabel: "Buy",
          ctaHref: "",
          featured: false,
        },
      ],
    });

    onChange.mockClear();
    fireEvent.change(screen.getByPlaceholderText("CTA href"), {
      target: { value: "/buy" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      plans: [
        {
          title: "",
          price: "",
          features: [],
          ctaLabel: "",
          ctaHref: "/buy",
          featured: false,
        },
      ],
    });

    onChange.mockClear();
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenLastCalledWith({
      plans: [
        {
          title: "",
          price: "",
          features: [],
          ctaLabel: "",
          ctaHref: "",
          featured: true,
        },
      ],
    });
  });
});

