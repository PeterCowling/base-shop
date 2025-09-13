jest.mock("../src/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Input: ({ label, ...rest }: any) => (
      <label>
        {label}
        <input {...rest} />
      </label>
    ),
  };
});
jest.mock("../src/components/cms/page-builder/editorRegistry", () => ({
  __esModule: true,
  default: {},
}));
import { render, fireEvent, screen } from "@testing-library/react";
import ContentPanel from "../src/components/cms/page-builder/panels/ContentPanel";
import type { PageComponent } from "@acme/types";

test("updates min items", () => {
  const component: PageComponent = { id: "1", type: "ProductCarousel", minItems: 1, maxItems: 5 } as any;
  const onChange = jest.fn();
  render(
    <ContentPanel
      component={component}
      onChange={onChange}
      handleInput={(() => {}) as any}
    />
  );
  fireEvent.change(screen.getByLabelText("Min Items"), { target: { value: "2" } });
  expect(onChange).toHaveBeenCalledWith({ minItems: 2 });
});
