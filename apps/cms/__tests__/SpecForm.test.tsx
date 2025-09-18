/* eslint-env jest */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SpecForm from "../src/app/cms/shop/[shop]/wizard/new/components/SpecForm";

describe("SpecForm", () => {
  it("submits trimmed sections and filled fields", async () => {
    const onNext = jest.fn();
    render(<SpecForm onNext={onNext} />);
    const user = userEvent.setup();

    const layoutSelect = screen.getByLabelText("Layout");
    await user.selectOptions(layoutSelect, "sidebar");

    await user.type(
      screen.getByLabelText("Sections"),
      " intro , , features ,  , highlights  "
    );
    await user.type(screen.getByLabelText("Hero"), "A warm welcome");
    await user.type(
      screen.getByLabelText("Call to action"),
      "Shop the collection"
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledWith({
      layout: "sidebar",
      sections: ["intro", "features", "highlights"],
      hero: "A warm welcome",
      cta: "Shop the collection",
    });
  });

  it("submits default values when left untouched", async () => {
    const onNext = jest.fn();
    render(<SpecForm onNext={onNext} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledWith({
      layout: "default",
      sections: [],
      hero: "",
      cta: "",
    });
  });
});
