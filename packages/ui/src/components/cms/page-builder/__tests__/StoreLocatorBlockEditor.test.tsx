import { fireEvent, render, screen } from "@testing-library/react";
import StoreLocatorBlockEditor from "../StoreLocatorBlockEditor";

const arrayEditorSpy = jest.fn(() => <div data-cy="array-editor" />);

jest.mock("../useArrayEditor", () => ({
  __esModule: true,
  useArrayEditor: () => arrayEditorSpy,
}));

describe("StoreLocatorBlockEditor", () => {
  beforeEach(() => {
    arrayEditorSpy.mockClear();
  });

  it("renders locations fields via useArrayEditor", () => {
    const component: any = {
      type: "StoreLocatorBlock",
      locations: [],
      zoom: undefined,
    };
    const onChange = jest.fn();

    render(
      <StoreLocatorBlockEditor component={component} onChange={onChange} />
    );

    expect(arrayEditorSpy).toHaveBeenCalledWith(
      "locations",
      component.locations,
      ["lat", "lng", "label"]
    );
    expect(screen.getByTestId("array-editor")).toBeInTheDocument();
  });

  it("parses numeric zoom values", () => {
    const component: any = {
      type: "StoreLocatorBlock",
      locations: [],
      zoom: 1,
    };
    const onChange = jest.fn();

    render(
      <StoreLocatorBlockEditor component={component} onChange={onChange} />
    );

    const input = screen.getByLabelText("Zoom");
    fireEvent.change(input, { target: { value: "5" } });

    expect(onChange).toHaveBeenCalledWith({ zoom: 5 });
  });

  it.each(["", "abc"])("sets zoom undefined for invalid value '%s'", (val) => {
    const component: any = {
      type: "StoreLocatorBlock",
      locations: [],
      zoom: 1,
    };
    const onChange = jest.fn();

    render(
      <StoreLocatorBlockEditor component={component} onChange={onChange} />
    );

    const input = screen.getByLabelText("Zoom");
    fireEvent.change(input, { target: { value: val } });

    expect(onChange).toHaveBeenCalledWith({ zoom: undefined });
  });
});

