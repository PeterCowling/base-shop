import { render } from "@testing-library/react";

import CmsValueProps from "../ValueProps";

jest.mock("@acme/ui/home/ValueProps", () => {
  const React = require("react");
  return {
    __esModule: true,
    ValueProps: jest.fn(({ items }: { items: any[] }) => (
      <div data-cy="value-props">{items.length}</div>
    )),
  };
});

const { ValueProps: MockValueProps } = require("@acme/ui/home/ValueProps") as {
  ValueProps: jest.Mock;
};

describe("CmsValueProps", () => {
  afterEach(() => {
    MockValueProps.mockClear();
  });

  it("renders ValueProps with sliced items respecting maxItems", () => {
    const items = [
      { icon: "1", title: "One", desc: "A" },
      { icon: "2", title: "Two", desc: "B" },
      { icon: "3", title: "Three", desc: "C" },
    ];

    const { getByTestId } = render(
      <CmsValueProps items={items} maxItems={2} />
    );

    expect(getByTestId("value-props")).toBeInTheDocument();
    expect(MockValueProps).toHaveBeenCalledTimes(1);
    const passed = MockValueProps.mock.calls[0][0].items;
    expect(passed).toHaveLength(2);
    expect(passed).toEqual(items.slice(0, 2));
  });

  it("returns null when items array is empty", () => {
    const { container } = render(<CmsValueProps items={[]} />);
    expect(container.firstChild).toBeNull();
    expect(MockValueProps).not.toHaveBeenCalled();
  });

  it("returns null when items.length < minItems", () => {
    const items = [{ icon: "1", title: "One", desc: "A" }];
    const { container } = render(
      <CmsValueProps items={items} minItems={2} />
    );
    expect(container.firstChild).toBeNull();
    expect(MockValueProps).not.toHaveBeenCalled();
  });
});

