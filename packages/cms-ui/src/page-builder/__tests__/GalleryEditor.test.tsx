import { render } from "@testing-library/react";

import GalleryEditor from "../GalleryEditor";

const arrayEditorSpy = jest.fn(() => <div data-testid="array-editor" />);

jest.mock("../useArrayEditor", () => ({
  __esModule: true,
  useArrayEditor: () => arrayEditorSpy,
}));

describe("GalleryEditor", () => {
  beforeEach(() => {
    arrayEditorSpy.mockClear();
  });

  it("uses useArrayEditor with images and item limits", () => {
    const component: any = {
      type: "Gallery",
      images: [],
      minItems: 1,
      maxItems: 3,
    };
    const onChange = jest.fn();

    render(<GalleryEditor component={component} onChange={onChange} />);

    expect(arrayEditorSpy).toHaveBeenCalledWith(
      "images",
      component.images,
      ["src", "alt"],
      { minItems: component.minItems, maxItems: component.maxItems }
    );
  });
});
