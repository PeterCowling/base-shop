import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FilterSidebar } from "../src/components/organisms/FilterSidebar";

describe("FilterSidebar", () => {
  it("opens sidebar, selects option, and applies numeric width", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<FilterSidebar onChange={onChange} width={320} />);

    expect(onChange).toHaveBeenCalledWith({ size: undefined });

    await user.click(screen.getByRole("button", { name: /filters/i }));
    expect(screen.getByRole("dialog")).toHaveClass("w-[320px]");

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "42" }));

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({ size: "42" })
    );
  });

  it("supports custom width class and keyboard navigation", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<FilterSidebar onChange={onChange} width="w-80" />);

    await user.tab();
    await user.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass("w-80");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
