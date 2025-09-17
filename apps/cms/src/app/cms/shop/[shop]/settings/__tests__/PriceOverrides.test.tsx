import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopOverridesSection from "../sections/ShopOverridesSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
    Accordion: ({ children }: any) => <div>{children}</div>,
    AccordionItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AccordionTrigger: ({ children, ...props }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    AccordionContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }),
  { virtual: true },
);

function createController(initial: Array<{ key: string; value: string }>) {
  return {
    rows: initial,
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setRows: jest.fn(),
  } as any;
}

describe("ShopOverridesSection", () => {
  it("invokes row controller actions and surfaces errors", () => {
    const filterController = createController([{ key: "color", value: "attributes.color" }]);
    const priceController = createController([{ key: "en", value: "10" }]);

    render(
      <ShopOverridesSection
        filterMappings={filterController}
        priceOverrides={priceController}
        errors={{ priceOverrides: ["must not be empty"] }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("color"), {
      target: { value: "size" },
    });
    expect(filterController.update).toHaveBeenCalledWith(0, "key", "size");

    fireEvent.change(screen.getByPlaceholderText("attributes.color"), {
      target: { value: "attributes.size" },
    });
    expect(filterController.update).toHaveBeenCalledWith(
      0,
      "value",
      "attributes.size",
    );

    fireEvent.change(screen.getByPlaceholderText("en-GB"), {
      target: { value: "fr" },
    });
    expect(priceController.update).toHaveBeenCalledWith(0, "key", "fr");

    fireEvent.change(screen.getByPlaceholderText("12000"), {
      target: { value: "20" },
    });
    expect(priceController.update).toHaveBeenCalledWith(0, "value", "20");

    fireEvent.click(screen.getByText(/Add filter mapping/i));
    expect(filterController.add).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Add price override/i));
    expect(priceController.add).toHaveBeenCalled();

    fireEvent.click(screen.getAllByText(/Remove/i)[0]);
    expect(filterController.remove).toHaveBeenCalledWith(0);

    expect(screen.getByRole("alert", { name: /must not be empty/i })).toBeInTheDocument();
  });
});
