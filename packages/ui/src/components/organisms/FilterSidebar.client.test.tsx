import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterSidebar } from "./FilterSidebar.client";

describe("FilterSidebar client", () => {
  it("opens and closes the sidebar", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FilterSidebar onChange={onChange} width={320} />);

    expect(onChange).toHaveBeenCalledWith({ size: undefined });

    await user.click(screen.getByRole("button", { name: /filters/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveClass("w-[320px]");

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("applies size filter", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FilterSidebar onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /filters/i }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "42" }));

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({ size: "42" })
    );
  });
});

