import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PageLayoutSelector from "../PageLayoutSelector";

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  const SelectContext = React.createContext((v: string) => {});
  const Select = ({ onValueChange, children, ...props }: any) => (
    <SelectContext.Provider value={onValueChange}>
      <div {...props}>{children}</div>
    </SelectContext.Provider>
  );
  const SelectTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  const SelectItem = ({ value, children, ...props }: any) => {
    const onValueChange = React.useContext(SelectContext);
    return (
      <div
        data-value={value}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </div>
    );
  };
  const SelectValue = ({ placeholder }: any) => <div>{placeholder}</div>;
  return {
    __esModule: true,
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
  };
});

describe("PageLayoutSelector", () => {
  const enabledTemplates = [{ name: "Layout A", components: [{ type: "comp" } as any] }];

  it("lists available layouts", () => {
    render(
      <PageLayoutSelector
        pageTemplates={enabledTemplates}
        newPageLayout=""
        setNewPageLayout={() => {}}
        setNewComponents={() => {}}
      />,
    );
    expect(screen.getByText("Layout A")).toBeInTheDocument();
  });

  it("clicking layout triggers selection callback", async () => {
    const setNewPageLayout = jest.fn();
    const setNewComponents = jest.fn();
    const user = userEvent.setup();
    render(
      <PageLayoutSelector
        pageTemplates={enabledTemplates}
        newPageLayout=""
        setNewPageLayout={setNewPageLayout}
        setNewComponents={setNewComponents}
      />,
    );
    await user.click(screen.getByText("Layout A"));
    expect(setNewPageLayout).toHaveBeenCalledWith("Layout A");
    expect(setNewComponents).toHaveBeenCalledWith([
      expect.objectContaining({ type: "comp", id: expect.any(String) }),
    ]);
  });

  it("disabled layouts are skipped", () => {
    const templates = [
      ...enabledTemplates,
      {
        name: "Layout B",
        components: [{ type: "comp" } as any],
        disabled: true,
      },
    ];
    render(
      <PageLayoutSelector
        pageTemplates={templates}
        newPageLayout=""
        setNewPageLayout={() => {}}
        setNewComponents={() => {}}
      />,
    );
    expect(screen.getByText("Layout A")).toBeInTheDocument();
    expect(screen.queryByText("Layout B")).not.toBeInTheDocument();
  });
});

