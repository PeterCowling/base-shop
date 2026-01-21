/* i18n-exempt file -- tests use literal copy for assertions */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FilterSidebar } from "../FilterSidebar";

describe("FilterSidebar", () => {
  it("opens sidebar and updates filters on selection", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<FilterSidebar onChange={onChange} width={320} />);

    expect(onChange).toHaveBeenCalledWith({ size: undefined });

    await user.click(screen.getByRole("button", { name: /filters/i }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "42" }));

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({ size: "42" })
    );

    expect(screen.getByRole("dialog")).toHaveClass("w-[320px]");
  });
});
