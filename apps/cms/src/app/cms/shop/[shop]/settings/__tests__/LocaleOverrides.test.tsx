import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import LocaleOverridesSection from "../sections/LocaleOverridesSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("LocaleOverridesSection", () => {
  it("handles overrides and displays errors", () => {
    const addOverride = jest.fn();
    const updateOverride = jest.fn();
    const removeOverride = jest.fn();

    render(
      <LocaleOverridesSection
        overrides={[{ key: "title", value: "en" }]}
        addOverride={addOverride}
        updateOverride={updateOverride}
        removeOverride={removeOverride}
        errors={{ localeOverrides: ["must not be empty"] }}
      />, 
    );

    expect(screen.getByDisplayValue("en")).toBeInTheDocument();

    const keyInput = screen.getByPlaceholderText("Field");
    fireEvent.change(keyInput, { target: { value: "description" } });
    expect(updateOverride.mock.calls[0]).toEqual([0, "key", "description"]);

    const select = screen.getByDisplayValue("en");
    fireEvent.change(select, { target: { value: "de" } });
    expect(updateOverride.mock.calls[1]).toEqual([0, "value", "de"]);

    fireEvent.click(screen.getByText(/Add Override/i));
    expect(addOverride).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Remove/i));
    expect(removeOverride).toHaveBeenCalledWith(0);

    expect(screen.getByText(/must not be empty/i)).toBeInTheDocument();
  });
});
