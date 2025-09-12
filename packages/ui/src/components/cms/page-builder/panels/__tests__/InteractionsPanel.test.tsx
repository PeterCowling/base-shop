import { render, screen, fireEvent } from "@testing-library/react";
import React, { useState } from "react";
import InteractionsPanel from "../InteractionsPanel";
import type { PageComponent } from "@acme/types";

jest.mock("@acme/types", () => ({}));

jest.mock("../../../../atoms/shadcn", () => {
  let id = 0;
  return {
    __esModule: true,
    Input: ({ label, ...p }: any) => {
      const inputId = `in-${id++}`;
      return (
        <div>
          {label && <label htmlFor={inputId}>{label}</label>}
          <input id={inputId} {...p} />
        </div>
      );
    },
    Select: ({ children, value, onValueChange }: any) => {
      const content = React.Children.toArray(children).find(
        (c: any) => c.type === React.Fragment || c.type?.name === "SelectContent"
      ) as any;
      const options = content ? content.props.children : children;
      return (
        <select value={value} onChange={(e) => onValueChange(e.target.value)}>
          {options}
        </select>
      );
    },
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => <option>{placeholder}</option>,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  };
});

describe("InteractionsPanel", () => {
  test("handles clickAction, href, and animation changes", () => {
    const mockInput = jest.fn();
    function Wrapper() {
      const [component, setComponent] = useState<PageComponent>({
        id: "c1",
        type: "Box",
      } as any);
      const handleInput = <K extends keyof PageComponent>(
        field: K,
        value: PageComponent[K],
      ) => {
        mockInput(field, value);
        setComponent((c) => ({ ...c, [field]: value }));
      };
      return <InteractionsPanel component={component} handleInput={handleInput} />;
    }

    render(<Wrapper />);

    const [clickSelect, animationSelect] = screen.getAllByRole("combobox") as HTMLSelectElement[];

    expect(clickSelect.value).toBe("none");
    expect(animationSelect.value).toBe("none");
    expect(screen.queryByLabelText("Target")).toBeNull();

    fireEvent.change(clickSelect, { target: { value: "navigate" } });
    expect(mockInput).toHaveBeenNthCalledWith(1, "clickAction", "navigate");
    expect(screen.getByLabelText("Target")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Target"), {
      target: { value: "https://example.com" },
    });
    expect(mockInput).toHaveBeenNthCalledWith(2, "href", "https://example.com");

    fireEvent.change(animationSelect, { target: { value: "fade" } });
    expect(mockInput).toHaveBeenNthCalledWith(3, "animation", "fade");

    fireEvent.change(clickSelect, { target: { value: "none" } });
    expect(mockInput).toHaveBeenNthCalledWith(4, "clickAction", undefined);
    expect(mockInput).toHaveBeenNthCalledWith(5, "href", undefined);
  });
});

