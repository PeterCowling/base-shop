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

  it("applies font family styles to options", () => {
    render(
      <FontSelect
        value={"Arial"}
        options={options}
        onChange={jest.fn()}
        onUpload={jest.fn()}
      />
    );

    options.forEach((o) => {
      expect(screen.getByRole("option", { name: o })).toHaveStyle({ fontFamily: o });
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
});
