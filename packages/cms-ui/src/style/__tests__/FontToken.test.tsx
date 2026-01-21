import { fireEvent, render, screen } from "@testing-library/react";

import { TranslationsProvider } from "@acme/i18n";

import { FontToken } from "../FontToken";

describe("FontToken", () => {
  const tokenKey = "--font-sans";
  const options = ["Arial", "Helvetica"];
  const googleFonts = ["Roboto", "Inter"];

  const renderToken = (props: Partial<React.ComponentProps<typeof FontToken>> = {}) =>
    render(
      <TranslationsProvider
        messages={{
          "common.reset": "Reset",
          "common.default": "Default",
          "cms.style.googleFonts": "Google Fonts",
        }}
      >
        <FontToken
          tokenKey={tokenKey}
          key={tokenKey}
          value="Arial"
          defaultValue="Arial"
          isOverridden={false}
          options={options}
          type="sans"
          googleFonts={googleFonts}
          setToken={jest.fn()}
          handleUpload={jest.fn()}
          setGoogleFont={jest.fn()}
          {...props}
        />
      </TranslationsProvider>
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

  it("resets to default value when overridden", () => {
    const setToken = jest.fn();
    renderToken({ value: "Helvetica", isOverridden: true, setToken });
    fireEvent.click(screen.getByText("Reset"));
    expect(setToken).toHaveBeenCalledWith(tokenKey, "Arial");
  });

  it("triggers file upload handler with event", () => {
    const handleUpload = jest.fn();
    const { container } = renderToken({ handleUpload });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["foo"], "font.woff", { type: "font/woff" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(handleUpload).toHaveBeenCalledWith("sans", expect.any(Object));
    expect(handleUpload.mock.calls[0][1].target.files[0]).toBe(file);
  });

  it("invokes setGoogleFont and resets select value", () => {
    const setGoogleFont = jest.fn();
    const { container } = renderToken({ setGoogleFont });
    const selects = container.querySelectorAll("select");
    const googleSelect = selects[1] as HTMLSelectElement;
    fireEvent.change(googleSelect, { target: { value: "Roboto" } });
    expect(setGoogleFont).toHaveBeenCalledWith("sans", "Roboto");
    expect(googleSelect.value).toBe("");
  });

  it("ignores empty google font selection", () => {
    const setGoogleFont = jest.fn();
    const { container } = renderToken({ setGoogleFont });
    const selects = container.querySelectorAll("select");
    const googleSelect = selects[1] as HTMLSelectElement;
    fireEvent.change(googleSelect, { target: { value: "" } });
    expect(setGoogleFont).not.toHaveBeenCalled();
    expect(googleSelect.value).toBe("");
  });
});
