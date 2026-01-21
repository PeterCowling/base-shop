import { render } from "@testing-library/react";

import TestimonialsEditor from "../TestimonialsEditor";

const arrayEditorSpy = jest.fn(() => <div data-testid="array-editor" />);

jest.mock("../useArrayEditor", () => ({
  __esModule: true,
  useArrayEditor: () => arrayEditorSpy,
}));

describe("TestimonialsEditor", () => {
  beforeEach(() => {
    arrayEditorSpy.mockClear();
  });

  it("uses useArrayEditor with testimonials and item limits", () => {
    const component: any = {
      type: "Testimonials",
      testimonials: [],
      minItems: 1,
      maxItems: 5,
    };
    const onChange = jest.fn();

    render(<TestimonialsEditor component={component} onChange={onChange} />);

    expect(arrayEditorSpy).toHaveBeenCalledWith(
      "testimonials",
      component.testimonials,
      ["quote", "name"],
      { minItems: component.minItems, maxItems: component.maxItems }
    );
  });
});
