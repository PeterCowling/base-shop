/* i18n-exempt file -- TEST-0004: unit test literals are not user-facing */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FontSelect } from "../FontSelect";

describe("FontSelect", () => {
  const options = ["Arial", "Helvetica"];

  it("renders provided options", () => {
    render(
      <FontSelect
        value={"Arial"}
        options={options}
        onChange={jest.fn()}
        onUpload={jest.fn()}
      />
    );

    expect(screen.getByRole("option", { name: "Arial" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Helvetica" })).toBeInTheDocument();
  });

  it("applies font family classes to options", () => {
    const { container } = render(
      <FontSelect
        value={"Arial"}
        options={options}
        onChange={jest.fn()}
        onUpload={jest.fn()}
      />
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).toContain(".fontopt-arial");
    expect(styleTag?.textContent).toContain(".fontopt-helvetica");

    options.forEach((o) => {
      const option = screen.getByRole("option", { name: o });
      expect(option.className).toContain("fontopt-");
    });
  });

  it("selects option based on value prop", () => {
    render(
      <FontSelect
        value={"Helvetica"}
        options={options}
        onChange={jest.fn()}
        onUpload={jest.fn()}
      />
    );

    expect(screen.getByRole("option", { name: "Helvetica" })).toHaveProperty(
      "selected",
      true,
    );
    expect(screen.getByRole("option", { name: "Arial" })).toHaveProperty(
      "selected",
      false,
    );
  });

  it("calls onChange when selecting a font", async () => {
    const handleChange = jest.fn();
    render(
      <FontSelect
        value={"Arial"}
        options={options}
        onChange={handleChange}
        onUpload={jest.fn()}
      />
    );

    await userEvent.selectOptions(screen.getByRole("combobox"), "Helvetica");
    expect(handleChange).toHaveBeenCalledWith("Helvetica");
  });

  it("calls onUpload when a file is chosen", async () => {
    const handleUpload = jest.fn();
    const { container } = render(
      <FontSelect
        value={"Arial"}
        options={options}
        onChange={jest.fn()}
        onUpload={handleUpload}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "font.woff", { type: "font/woff" });
    await userEvent.upload(fileInput, file);

    expect(handleUpload).toHaveBeenCalled();
  });

  it("renders empty select when no options are provided", () => {
    const { container } = render(
      <FontSelect
        value={""}
        options={[]}
        onChange={jest.fn()}
        onUpload={jest.fn()}
      />
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
  });
});
