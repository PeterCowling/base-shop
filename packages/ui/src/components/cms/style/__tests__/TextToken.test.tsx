import { render, fireEvent, screen } from "@testing-library/react";
import { TextToken } from "../TextToken";

describe("TextToken", () => {
  const tokenKey = "--custom-token";

  const renderToken = (props: Partial<React.ComponentProps<typeof TextToken>> = {}) =>
    render(
      TextToken({
        key: tokenKey,
        value: "hello",
        defaultValue: "hello",
        isOverridden: false,
        setToken: jest.fn(),
        ...props,
      })
    );

  it("renders with default value", () => {
    renderToken();
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
    expect(screen.getByText(/Default: hello/)).toBeInTheDocument();
    expect(screen.queryByText("Reset")).toBeNull();
  });

  it("emits updated value on change", () => {
    const setToken = jest.fn();
    const { container } = renderToken({ setToken });
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "world" } });
    expect(setToken).toHaveBeenCalledWith(tokenKey, "world");
  });

  it("resets to default value", () => {
    const setToken = jest.fn();
    renderToken({ value: "world", isOverridden: true, setToken });
    fireEvent.click(screen.getByText("Reset"));
    expect(setToken).toHaveBeenCalledWith(tokenKey, "hello");
  });

  it("renders without default value", () => {
    renderToken({ defaultValue: undefined });
    expect(screen.queryByText(/Default:/)).toBeNull();
    expect(screen.queryByText("Reset")).toBeNull();
  });
});
