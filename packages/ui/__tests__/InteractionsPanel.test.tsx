jest.mock("../src/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Input: ({ label, ...rest }: any) => (
      <label>
        {label}
        <input {...rest} />
      </label>
    ),
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

import { render, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import InteractionsPanel from "../src/components/cms/page-builder/panels/InteractionsPanel";
import type { PageComponent } from "@acme/types";

function Wrapper({ component }: { component: PageComponent }) {
  const [comp, setComp] = useState(component);
  const handleInput = <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K],
  ) => {
    setComp((prev) => ({ ...prev, [field]: value }));
  };
  return <InteractionsPanel component={comp} handleInput={handleInput} />;
}

test("updates interaction fields", () => {
  const component: PageComponent = { id: "1", type: "Image" } as any;
  render(<Wrapper component={component} />);
  const selects = screen.getAllByRole("combobox");
  fireEvent.change(selects[0], { target: { value: "navigate" } });
  fireEvent.change(screen.getByLabelText("Target"), {
    target: { value: "/about" },
  });
  fireEvent.change(selects[1], { target: { value: "fade" } });
  expect((screen.getByLabelText("Target") as HTMLInputElement).value).toBe(
    "/about",
  );
});
