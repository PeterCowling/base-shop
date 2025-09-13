import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";
import ContentPanel from "../ContentPanel";

jest.mock("../../editorRegistry", () => ({
  __esModule: true,
  default: {
    Fancy: (props: any) => <div data-cy="fancy">fancy-{props.component.id}</div>,
  },
}));

describe("ContentPanel", () => {
  const baseHandlers = {
    onChange: jest.fn(),
    handleInput: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders controls and auto-adjusts min/max items", () => {
    render(
      <ContentPanel
        component={{
          id: "c1",
          type: "Widget",
          minItems: 1,
          maxItems: 2,
          desktopItems: 3,
          tabletItems: 2,
          mobileItems: 1,
          columns: 2,
        } as any}
        {...baseHandlers}
      />
    );
    expect(screen.getByLabelText("Min Items")).toBeInTheDocument();
    expect(screen.getByLabelText("Max Items")).toBeInTheDocument();
    expect(screen.getByLabelText("Desktop Items")).toBeInTheDocument();
    expect(screen.getByLabelText("Tablet Items")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile Items")).toBeInTheDocument();
    expect(screen.getByLabelText("Columns")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Min Items"), {
      target: { value: "5" },
    });
    expect(baseHandlers.onChange).toHaveBeenNthCalledWith(1, {
      minItems: 5,
      maxItems: 5,
    });

    fireEvent.change(screen.getByLabelText("Max Items"), {
      target: { value: "0" },
    });
    expect(baseHandlers.onChange).toHaveBeenNthCalledWith(2, {
      maxItems: 0,
      minItems: 0,
    });
  });

  const initialComponent = {
    id: "cNeg",
    type: "Widget",
    minItems: 1,
    maxItems: 3,
    desktopItems: 3,
    tabletItems: 2,
    mobileItems: 1,
    columns: 2,
  } as any;

  test.each([
    "Min Items",
    "Max Items",
    "Desktop Items",
    "Tablet Items",
    "Mobile Items",
    "Columns",
  ])("shows error for negative %s", (label) => {
    let component = { ...initialComponent };
    const handlers = {
      onChange: (patch: any) => {
        component = { ...component, ...patch };
      },
      handleInput: (field: any, value: any) => {
        component = { ...component, [field]: value };
      },
    };
    const { rerender } = render(
      <ContentPanel component={component} {...handlers} />
    );
    fireEvent.change(screen.getByLabelText(label as string), {
      target: { value: "-1" },
    });
    rerender(<ContentPanel component={component} {...handlers} />);
    expect(screen.getAllByText("Must be ≥ 0").length).toBeGreaterThan(0);
  });

  test("shows error when columns are outside min/max range", () => {
    let component = { ...initialComponent };
    const handlers = {
      onChange: (patch: any) => {
        component = { ...component, ...patch };
      },
      handleInput: (field: any, value: any) => {
        component = { ...component, [field]: value };
      },
    };
    const { rerender } = render(
      <ContentPanel component={component} {...handlers} />
    );
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "5" },
    });
    rerender(<ContentPanel component={component} {...handlers} />);
    expect(
      screen.getByText("Columns must be between min and max items")
    ).toBeInTheDocument();
  });

  test("passes undefined to handleInput when clearing fields", () => {
    const handlers = {
      onChange: jest.fn(),
      handleInput: jest.fn(),
    };
    render(
      <ContentPanel
        component={{
          id: "cClear",
          type: "Widget",
          minItems: 1,
          maxItems: 2,
          desktopItems: 3,
          columns: 2,
        } as any}
        {...handlers}
      />
    );

    fireEvent.change(screen.getByLabelText("Min Items"), {
      target: { value: "" },
    });
    expect(handlers.handleInput).toHaveBeenCalledWith("minItems", undefined);

    fireEvent.change(screen.getByLabelText("Desktop Items"), {
      target: { value: "" },
    });
    expect(handlers.handleInput).toHaveBeenCalledWith(
      "desktopItems",
      undefined
    );
  });

  test("forwards undefined to onChange when clearing numeric field", () => {
    const handlers = {
      onChange: jest.fn(),
      handleInput: (field: any, value: any) => {
        handlers.onChange({ [field]: value });
      },
    };

    render(
      <ContentPanel
        component={{
          id: "cClear2",
          type: "Widget",
          minItems: 1,
          maxItems: 2,
        } as any}
        {...handlers}
      />
    );

    fireEvent.change(screen.getByLabelText("Min Items"), {
      target: { value: "abc" },
    });
    fireEvent.change(screen.getByLabelText("Min Items"), {
      target: { value: "" },
    });

    expect(handlers.onChange).toHaveBeenLastCalledWith({
      minItems: undefined,
    });
  });

  test("loads specific editor or fallback", async () => {
    const { rerender } = render(
      <ContentPanel
        component={{ id: "c2", type: "Fancy" } as any}
        {...baseHandlers}
      />
    );
    expect(await screen.findByTestId("fancy")).toHaveTextContent("fancy-c2");

    rerender(
      <ContentPanel
        component={{ id: "c3", type: "Unknown" } as any}
        {...baseHandlers}
      />
    );
    expect(
      await screen.findByText("No editable props")
    ).toBeInTheDocument();
  });
});

