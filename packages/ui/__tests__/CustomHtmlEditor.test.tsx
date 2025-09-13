import { fireEvent, render, screen } from "@testing-library/react";
import CustomHtmlEditor from "../src/components/cms/page-builder/CustomHtmlEditor";

const handleInput = jest.fn();
jest.mock("../src/components/cms/page-builder/useComponentInputs", () => ({
  __esModule: true,
  default: () => ({ handleInput }),
}));

describe("CustomHtmlEditor", () => {
  it("calls handleInput with updated html", () => {
    render(
      <CustomHtmlEditor
        component={{ type: "CustomHtml", html: "" }}
        onChange={jest.fn()}
      />,
    );
    const textarea = screen.getByLabelText("HTML");
    fireEvent.change(textarea, { target: { value: "<p>test</p>" } });
    expect(handleInput).toHaveBeenCalledWith("html", "<p>test</p>");
  });
});
