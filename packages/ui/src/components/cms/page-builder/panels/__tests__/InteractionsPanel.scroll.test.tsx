import { render, screen, fireEvent } from "@testing-library/react";
import React, { useState } from "react";
import InteractionsPanel from "../InteractionsPanel";
import type { PageComponent } from "@acme/types";

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

describe("InteractionsPanel timing + scroll effects", () => {
  test("updates timing controls and easing", () => {
    const mockInput = jest.fn();
    function Wrapper() {
      const [component, setComponent] = useState<PageComponent>({ id: "c1", type: "Box" } as any);
      const handleInput = <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => {
        mockInput(field, value);
        setComponent((c) => ({ ...c, [field]: value }));
      };
      return <InteractionsPanel component={component} handleInput={handleInput} />;
    }

    render(<Wrapper />);

    fireEvent.change(screen.getByLabelText("Duration (ms)"), { target: { value: "600" } });
    fireEvent.change(screen.getByLabelText("Delay (ms)"), { target: { value: "120" } });
    const easingSelect = screen.getByLabelText("Easing");
    fireEvent.change(easingSelect, { target: { value: "ease-in-out" } });

    expect(mockInput).toHaveBeenCalledWith("animationDuration", 600);
    expect(mockInput).toHaveBeenCalledWith("animationDelay", 120);
    expect(mockInput).toHaveBeenCalledWith("animationEasing", "ease-in-out");

    // Clear duration
    fireEvent.change(screen.getByLabelText("Duration (ms)"), { target: { value: "" } });
    expect(mockInput).toHaveBeenCalledWith("animationDuration", undefined);
  });

  test("updates reveal, parallax, sticky settings", () => {
    const mockInput = jest.fn();
    function Wrapper() {
      const [component, setComponent] = useState<PageComponent>({ id: "c1", type: "Box" } as any);
      const handleInput = <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => {
        mockInput(field, value);
        setComponent((c) => ({ ...c, [field]: value }));
      };
      return <InteractionsPanel component={component} handleInput={handleInput} />;
    }

    render(<Wrapper />);

    const revealSelect = screen.getByLabelText("Reveal on Scroll");
    fireEvent.change(revealSelect, { target: { value: "slide-up" } });
    expect(mockInput).toHaveBeenCalledWith("reveal", "slide-up");

    fireEvent.change(screen.getByLabelText("Parallax"), { target: { value: "0.3" } });
    expect(mockInput).toHaveBeenCalledWith("parallax", 0.3);

    const stickySelect = screen.getByLabelText("Sticky");
    fireEvent.change(stickySelect, { target: { value: "top" } });
    expect(mockInput).toHaveBeenCalledWith("sticky", "top");

    fireEvent.change(screen.getByLabelText("Sticky offset"), { target: { value: "64px" } });
    expect(mockInput).toHaveBeenCalledWith("stickyOffset", "64px");

    // clear to none
    fireEvent.change(revealSelect, { target: { value: "" } });
    expect(mockInput).toHaveBeenCalledWith("reveal", undefined);
    fireEvent.change(stickySelect, { target: { value: "" } });
    expect(mockInput).toHaveBeenCalledWith("sticky", undefined);
    fireEvent.change(screen.getByLabelText("Parallax"), { target: { value: "" } });
    expect(mockInput).toHaveBeenCalledWith("parallax", undefined);
    fireEvent.change(screen.getByLabelText("Sticky offset"), { target: { value: "" } });
    expect(mockInput).toHaveBeenCalledWith("stickyOffset", undefined);
  });
});

