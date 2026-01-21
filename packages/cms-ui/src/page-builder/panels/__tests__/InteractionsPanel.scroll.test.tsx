import React, { useState } from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import type { PageComponent } from "@acme/types";

import InteractionsPanel from "../InteractionsPanel";

// Provide minimal i18n so labels render as human-readable text in tests
const translations: Record<string, string> = {
  "cms.interactions.parallax": "Parallax",
  "cms.interactions.stickyOffset": "Sticky offset",
  "cms.interactions.sticky": "Sticky",
  "cms.interactions.none": "None",
  "cms.interactions.top": "Top",
  "cms.interactions.bottom": "Bottom",
  "cms.interactions.durationMs": "Duration (ms)",
  "cms.interactions.delayMs": "Delay (ms)",
};

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] || key,
}));

jest.mock("../../../../atoms/shadcn", () => {
  let id = 0;
  return {
    __esModule: true,
    Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
    // Omit non-DOM props like labelSuffix to avoid leaking to <input>
    Input: ({ label, labelSuffix: _labelSuffix, ...p }: any) => {
      const inputId = `in-${id++}`;
      return (
        <div>
          {label && <label htmlFor={inputId}>{label}</label>}
          <input id={inputId} {...p} />
        </div>
      );
    },
    Textarea: ({ label, ...p }: any) => {
      const inputId = `ta-${id++}`;
      return (
        <div>
          {label && <label htmlFor={inputId}>{label}</label>}
          <textarea id={inputId} {...p} />
        </div>
      );
    },
    Dialog: ({ children, open, onOpenChange, ...p }: any) => (
      <div data-open={open ? 'true' : 'false'} {...p}>{children}</div>
    ),
    DialogContent: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    DialogHeader: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    DialogTitle: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    DialogDescription: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    DialogFooter: ({ children, ...p }: any) => <div {...p}>{children}</div>,
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
    SelectTrigger: ({ children }: any) => children,
    SelectValue: ({ placeholder }: any) => <option>{placeholder}</option>,
    SelectContent: ({ children }: any) => children,
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
    const selects1 = screen.getAllByRole('combobox');
    const easingSelect = selects1[2] as HTMLSelectElement;
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

    const selects2 = screen.getAllByRole('combobox');
    const revealSelect = selects2[4] as HTMLSelectElement;
    fireEvent.change(revealSelect, { target: { value: "slide-up" } });
    expect(mockInput).toHaveBeenCalledWith("reveal", "slide-up");

    fireEvent.change(screen.getByLabelText("Parallax"), { target: { value: "0.3" } });
    expect(mockInput).toHaveBeenCalledWith("parallax", 0.3);

    const stickySelect = selects2[5] as HTMLSelectElement;
    fireEvent.change(stickySelect, { target: { value: "top" } });
    expect(mockInput).toHaveBeenCalledWith("sticky", "top");

    fireEvent.change(screen.getByLabelText("Sticky offset"), { target: { value: "64px" } });
    expect(mockInput).toHaveBeenCalledWith("stickyOffset", "64px");

    // clear to none
    fireEvent.change(revealSelect as HTMLSelectElement, { target: { value: "__none__" } });
    expect(mockInput).toHaveBeenCalledWith("reveal", undefined);
    fireEvent.change(stickySelect as HTMLSelectElement, { target: { value: "__none__" } });
    expect(mockInput).toHaveBeenCalledWith("sticky", undefined);
    fireEvent.change(screen.getByLabelText("Parallax"), { target: { value: "" } });
    expect(mockInput).toHaveBeenCalledWith("parallax", undefined);
    fireEvent.change(screen.getByLabelText("Sticky offset"), { target: { value: "" } });
    expect(mockInput).toHaveBeenCalledWith("stickyOffset", undefined);
  });
});
