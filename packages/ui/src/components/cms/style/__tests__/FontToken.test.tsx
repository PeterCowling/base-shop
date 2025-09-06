import { render, fireEvent, screen } from "@testing-library/react";
import { FontToken } from "../FontToken";

describe("FontToken", () => {
  const tokenKey = "--font-sans";
  const options = ["Arial", "Helvetica"];
  const googleFonts = ["Roboto", "Inter"];

  const renderToken = (props: Partial<React.ComponentProps<typeof FontToken>> = {}) =>
    render(
      FontToken({
        key: tokenKey,
        value: "Arial",
        defaultValue: "Arial",
        isOverridden: false,
        options,
        type: "sans",
        googleFonts,
        setToken: jest.fn(),
        handleUpload: jest.fn(),
        setGoogleFont: jest.fn(),
        ...props,
      })
    );

  it("renders with default value", () => {
    renderToken();
    expect(screen.getByDisplayValue("Arial")).toBeInTheDocument();
    expect(screen.getByText(/Default:/)).toHaveTextContent("Default: Arial");
    expect(screen.queryByText("Reset")).toBeNull();
  });

  it("emits updated value on selection", () => {
    const setToken = jest.fn();
    const { container } = renderToken({ setToken });
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "Helvetica" } });
    expect(setToken).toHaveBeenCalledWith(tokenKey, "Helvetica");
  });

  it("handles reset, upload, and google fonts", () => {
    const setToken = jest.fn();
    const handleUpload = jest.fn();
    const setGoogleFont = jest.fn();
    const { container } = renderToken({
      value: "Helvetica",
      isOverridden: true,
      setToken,
      handleUpload,
      setGoogleFont,
    });

    fireEvent.click(screen.getByText("Reset"));
    expect(setToken).toHaveBeenCalledWith(tokenKey, "Arial");

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["foo"], "font.woff", { type: "font/woff" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(handleUpload).toHaveBeenCalled();

    const selects = container.querySelectorAll("select");
    const googleSelect = selects[1] as HTMLSelectElement;
    fireEvent.change(googleSelect, { target: { value: "Roboto" } });
    expect(setGoogleFont).toHaveBeenCalledWith("sans", "Roboto");
    expect(googleSelect.value).toBe("");
  });
});
