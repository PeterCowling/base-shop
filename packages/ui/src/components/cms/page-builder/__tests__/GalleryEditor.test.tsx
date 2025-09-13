import { render } from "@testing-library/react";
import GalleryEditor from "../GalleryEditor";

const arrayEditorMock = jest.fn(() => <div data-testid="images-editor" />);
const useArrayEditorMock = jest.fn(() => arrayEditorMock);

jest.mock("../useArrayEditor", () => ({
  __esModule: true,
  useArrayEditor: (onChange: any) => useArrayEditorMock(onChange),
}));

describe("GalleryEditor", () => {
  it("passes minItems and maxItems to useArrayEditor", () => {
    const component = {
      type: "Gallery" as const,
      images: [],
      minItems: 1,
      maxItems: 3,
    };
    const onChange = jest.fn();

    render(<GalleryEditor component={component} onChange={onChange} />);

    expect(useArrayEditorMock).toHaveBeenCalledWith(onChange);
    expect(arrayEditorMock).toHaveBeenCalledWith(
      "images",
      component.images,
      ["src", "alt"],
      { minItems: component.minItems, maxItems: component.maxItems }
    );
  });
});

