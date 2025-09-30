import { render, fireEvent, screen } from "@testing-library/react";
import TabsEditor from "../TabsEditor";

jest.mock("../../../atoms/shadcn", () => {
  const React = require("react");
  let id = 0;
  return {
    __esModule: true,
    Button: (props: any) => <button {...props} />,
    // Omit non-DOM props like labelSuffix to avoid React unknown-prop warnings
    Input: ({ label, labelSuffix: _labelSuffix, ...props }: any) => {
      const inputId = `in-${id++}`;
      return (
        <div>
          {label && <label htmlFor={inputId}>{label}</label>}
          <input id={inputId} {...props} />
        </div>
      );
    },
    Select: ({ value, onValueChange, children }: any) => (
      <select
        data-cy="active-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => children,
    SelectValue: ({ placeholder }: any) => (
      <option value="" disabled>
        {placeholder}
      </option>
    ),
    SelectContent: ({ children }: any) => children,
    SelectItem: ({ value, children }: any) => (
      <option value={value}>{children}</option>
    ),
  };
});

describe("TabsEditor", () => {
  it("appends an empty label when adding a tab", () => {
    const onChange = jest.fn();
    render(
      <TabsEditor
        component={{ labels: ["One"], active: 0 } as any}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Add Tab"));
    expect(onChange).toHaveBeenCalledWith({ labels: ["One", ""] });
  });

  it("removes a tab and resets active when needed", () => {
    const onChange = jest.fn();
    render(
      <TabsEditor
        component={{ labels: ["One", "Two"], active: 1 } as any}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getAllByText("Remove")[1]);
    expect(onChange).toHaveBeenCalledWith({ labels: ["One"], active: 0 });
  });

  it("calls onChange when selecting active tab", () => {
    const onChange = jest.fn();
    render(
      <TabsEditor
        component={{ labels: ["One", "Two"], active: 0 } as any}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByTestId("active-select"), {
      target: { value: "1" },
    });
    expect(onChange).toHaveBeenCalledWith({ active: 1 });
  });

  it("updates tab label", () => {
    const onChange = jest.fn();
    render(
      <TabsEditor
        component={{ labels: ["Old"], active: 0 } as any}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Tab 1 Label"), {
      target: { value: "New" },
    });
    expect(onChange).toHaveBeenCalledWith({ labels: ["New"] });
  });

});
