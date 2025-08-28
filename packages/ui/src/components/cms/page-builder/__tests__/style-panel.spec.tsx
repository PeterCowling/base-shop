import { fireEvent, render, screen } from "@testing-library/react";
import StylePanel from "../StylePanel";

describe("StylePanel", () => {
  it("updates styles and warns on low contrast", () => {
    const component: any = { type: "Button", styles: "" };
    const handleInput = jest.fn((field, value) => {
      component[field] = value;
    });
    const { rerender } = render(
      <StylePanel component={component} handleInput={handleInput} />
    );
    fireEvent.change(screen.getByLabelText("Foreground"), {
      target: { value: "#ffffff" },
    });
    rerender(<StylePanel component={component} handleInput={handleInput} />);
    fireEvent.change(screen.getByLabelText("Background"), {
      target: { value: "#ffffff" },
    });
    const last = handleInput.mock.calls.pop();
    expect(last[0]).toBe("styles");
    expect(JSON.parse(last[1])).toEqual({
      color: { fg: "#ffffff", bg: "#ffffff" },
      typography: {},
    });
    rerender(<StylePanel component={component} handleInput={handleInput} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Low contrast");
  });
});
