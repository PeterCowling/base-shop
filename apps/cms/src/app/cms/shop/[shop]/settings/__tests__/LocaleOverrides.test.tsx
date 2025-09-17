import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopLocalizationSection from "../sections/ShopLocalizationSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("ShopLocalizationSection", () => {
  it("handles overrides and displays errors", () => {
    const addOverride = jest.fn();
    const updateOverride = jest.fn();
    const removeOverride = jest.fn();

    render(
      <ShopLocalizationSection
        mappings={[]}
        onAddMapping={jest.fn()}
        onUpdateMapping={jest.fn()}
        onRemoveMapping={jest.fn()}
        localeOverrides={[{ key: "title", value: "en" }]}
        onAddLocaleOverride={addOverride}
        onUpdateLocaleOverride={updateOverride}
        onRemoveLocaleOverride={removeOverride}
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
