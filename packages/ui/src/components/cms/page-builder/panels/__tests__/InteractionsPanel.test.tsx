import React, { useState } from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import type { PageComponent } from "@acme/types";

import InteractionsPanel from "../InteractionsPanel";

// Provide minimal runtime exports needed by downstream modules (e.g. @acme/i18n)
jest.mock("@acme/types", () => ({
  __esModule: true,
  LOCALES: ["en"],
}));

// Stub i18n hook to return human-friendly labels used in assertions
jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => (key: string) =>
    ({
      "cms.interactions.clickAction": "Click Action",
      "cms.interactions.none": "None",
      "cms.interactions.navigate": "Navigate",
      "cms.interactions.scrollTo": "Scroll to",
      "cms.interactions.target": "Target",
      "cms.interactions.targetAnchor": "Target anchor",
      "cms.interactions.openModal": "Open modal",
      "cms.interactions.modalContent": "Modal content",
      "cms.common.pick": "Pick",
      "cms.common.plainText": "Plain text",
    }[key] ?? key),
}));

jest.mock("../../../../atoms/shadcn", () => {
  let id = 0;
  return {
    __esModule: true,
    Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
    Dialog: ({ children, open, onOpenChange, ...p }: any) => (
      <div data-open={open ? 'true' : 'false'} {...p}>{children}</div>
    ),
    DialogContent: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    DialogHeader: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    DialogTitle: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    DialogDescription: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    DialogFooter: ({ children, ...p }: any) => <div {...p}>{children}</div>,
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
    SelectTrigger: ({ children }: any) => <span>{children}</span>,
    SelectValue: ({ placeholder }: any) => <option>{placeholder}</option>,
    SelectContent: ({ children }: any) => <span>{children}</span>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  };
});

describe("InteractionsPanel", () => {
  test("shows Target when navigating and clears href on reset", () => {
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

    const [clickSelect] = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(screen.queryByLabelText("Target")).toBeNull();

    fireEvent.change(clickSelect, { target: { value: "navigate" } });
    expect(mockInput).toHaveBeenNthCalledWith(1, "clickAction", "navigate");
    const targetInput = screen.getByLabelText("Target");

    fireEvent.change(targetInput, {
      target: { value: "https://example.com" },
    });
    expect(mockInput).toHaveBeenNthCalledWith(2, "href", "https://example.com");

    fireEvent.change(clickSelect, { target: { value: "none" } });
    expect(mockInput).toHaveBeenNthCalledWith(3, "clickAction", undefined);
    expect(mockInput).toHaveBeenNthCalledWith(4, "href", undefined);
    expect(screen.queryByLabelText("Target")).toBeNull();
  });

  test("updates animation selector values", () => {
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

    const [, animationSelect] = screen.getAllByRole("combobox") as HTMLSelectElement[];

    expect(animationSelect.value).toBe("none");

    fireEvent.change(animationSelect, { target: { value: "fade" } });
    expect(mockInput).toHaveBeenNthCalledWith(1, "animation", "fade");
    expect(animationSelect.value).toBe("fade");

    fireEvent.change(animationSelect, { target: { value: "slide" } });
    expect(mockInput).toHaveBeenNthCalledWith(2, "animation", "slide");
    expect(animationSelect.value).toBe("slide");

    fireEvent.change(animationSelect, { target: { value: "none" } });
    expect(mockInput).toHaveBeenNthCalledWith(3, "animation", undefined);
    expect(animationSelect.value).toBe("none");
  });
});
