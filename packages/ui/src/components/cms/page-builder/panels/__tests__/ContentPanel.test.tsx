import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";
import ContentPanel from "../ContentPanel";

jest.mock("../../editorRegistry", () => ({
  __esModule: true,
  default: {
    Fancy: (props: any) => <div data-testid="fancy">fancy-{props.component.id}</div>,
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

  test("renders conditional controls and patches maxItems", () => {
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
    expect(baseHandlers.onChange).toHaveBeenCalledWith({
      minItems: 5,
      maxItems: 5,
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

