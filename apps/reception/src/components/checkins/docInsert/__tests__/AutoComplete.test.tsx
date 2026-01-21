import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AutoComplete from "../AutoComplete";

const suggestions = ["Apple", "Apricot", "Banana", "Orange"];

function setup(
  extraProps: Partial<React.ComponentProps<typeof AutoComplete>> = {}
) {
  const onChange = jest.fn();
  const props = {
    onChange,
    suggestions,
    ...extraProps,
  } as React.ComponentProps<typeof AutoComplete>;
  render(<AutoComplete {...props} />);
  const input = screen.getByRole("textbox");
  return { input, onChange };
}

describe("AutoComplete", () => {
  it("filters suggestions based on input", async () => {
    const { input } = setup();
    await userEvent.type(input, "ap");

    const items = screen.getAllByRole("button", { name: /ap/i });
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Apple");
    expect(items[1]).toHaveTextContent("Apricot");
    expect(
      screen.queryByRole("button", { name: "Banana" })
    ).not.toBeInTheDocument();
  });

  it("allows selecting a suggestion via click", async () => {
    const onItemSelect = jest.fn();
    const { input, onChange } = setup({ onItemSelect });
    await userEvent.type(input, "ap");
    await userEvent.click(screen.getByRole("button", { name: "Apricot" }));

    expect(onChange).toHaveBeenLastCalledWith("Apricot");
    expect(onItemSelect).toHaveBeenCalledWith("Apricot");
    expect((input as HTMLInputElement).value).toBe("Apricot");
  });

  it("allows selecting a suggestion via Enter", async () => {
    const onItemSelect = jest.fn();
    const { input, onChange } = setup({ onItemSelect });
    await userEvent.type(input, "or");
    await userEvent.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith("Orange");
    expect(onItemSelect).toHaveBeenCalledWith("Orange");
    expect((input as HTMLInputElement).value).toBe("Orange");
  });
});
