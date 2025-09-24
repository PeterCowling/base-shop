import { render, fireEvent, screen } from "@testing-library/react";
import { RangeToken } from "../RangeToken";

describe("RangeToken", () => {
  const tokenKey = "--spacing";

  const renderToken = (
    props: Partial<React.ComponentProps<typeof RangeToken>> = {}
  ) =>
    render(
      RangeToken({
        tokenKey,
        value: "8px",
        defaultValue: "8px",
        isOverridden: false,
        setToken: jest.fn(),
        ...props,
      })
    );

  it("renders with default value", () => {
    renderToken();
    expect(screen.getByText(/Default: 8px/)).toBeInTheDocument();
    expect(screen.queryByText("Reset")).toBeNull();
  });

  it("renders without default value", () => {
    renderToken({ defaultValue: undefined });
    expect(screen.queryByText(/Default:/)).toBeNull();
    expect(screen.queryByText("Reset")).toBeNull();
  });

  it("emits updated value on change", () => {
    const setToken = jest.fn();
    const { container } = renderToken({ setToken });
    const range = container.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(range, { target: { value: "12" } });
    expect(setToken).toHaveBeenCalledWith(tokenKey, "12px");
  });

  it("resets to default value", () => {
    const setToken = jest.fn();
    renderToken({ value: "12px", isOverridden: true, setToken });
    fireEvent.click(screen.getByText("Reset"));
    expect(setToken).toHaveBeenCalledWith(tokenKey, "8px");
  });

  it("resets with no default value", () => {
    const setToken = jest.fn();
    renderToken({
      value: "12px",
      defaultValue: undefined,
      isOverridden: true,
      setToken,
    });
    fireEvent.click(screen.getByText("Reset"));
    expect(setToken).toHaveBeenCalledWith(tokenKey, "");
  });
});
