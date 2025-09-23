/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import DynamicRenderer from "../src/components/DynamicRenderer";

jest.mock("@platform-core/products/index", () => ({ PRODUCTS: [{ id: "sku1" }] }));

const productGridMock = jest.fn(() => <div data-testid="grid" />);
jest.mock("@platform-core/components/shop/ProductGrid", () => ({
  ProductGrid: (props: any) => productGridMock(props),
}));

// Capture Text block props to verify className merge (stackStrategy branch)
const textMock = jest.fn((props: any) => <div data-testid="text" data-class={props.className} />);
jest.mock("@ui/components/atoms/primitives/textarea", () => ({
  Textarea: (props: any) => textMock(props),
}));

describe("DynamicRenderer", () => {
  it("warns on unknown component", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <DynamicRenderer
        components={[{ id: "1", type: "Unknown" } as any]}
        locale="en"
      />,
    );
    expect(warn).toHaveBeenCalledWith("Unknown component type: Unknown");
    warn.mockRestore();
  });

  it("renders product grid with products", () => {
    render(
      <DynamicRenderer
        components={[{ id: "2", type: "ProductGrid" } as any]}
        locale="en"
      />,
    );
    expect(productGridMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skus: [{ id: "sku1" }],
        locale: "en",
      }),
    );
  });

  it("applies hidden classes and order on wrapper", () => {
    const { container } = render(
      <DynamicRenderer
        components={[
          {
            id: "h1",
            type: "ProductGrid",
            hiddenBreakpoints: ["mobile"],
            orderMobile: 2,
            styles: "not-json", // exercise parse error branch
          } as any,
        ]}
        locale="en"
        editor={{ h1: { hidden: ["tablet"] } } as any}
      />,
    );
    const wrappers = Array.from(container.querySelectorAll(".pb-scope"));
    expect(wrappers.length).toBeGreaterThan(0);
    const cls = wrappers[0].className;
    expect(cls).toMatch(/pb-hide-mobile/);
    expect(cls).toMatch(/pb-hide-tablet/);
    expect(cls).toMatch(/pb-order-mobile-2/);
  });

  it("passes stackStrategy class to non-grid blocks", () => {
    render(
      <DynamicRenderer
        components={[
          {
            id: "t1",
            type: "Text",
            stackStrategy: "reverse",
            orderMobile: 1,
          } as any,
        ]}
        locale="en"
      />,
    );
    expect(textMock).toHaveBeenCalled();
    const last = (textMock as jest.Mock).mock.calls.pop()![0];
    expect(String(last.className)).toContain("pb-stack-mobile-reverse");
  });

  it("applies Section height presets and minHeight on wrapper", () => {
    const { container, rerender } = render(
      <DynamicRenderer
        components={[{ id: "s1", type: "Section", heightPreset: "compact" } as any]}
        locale="en"
      />,
    );
    const first = container.querySelector(".pb-scope") as HTMLElement | null;
    expect(first).toBeTruthy();
    // Height preset compact => 320px min-height
    expect(first!.style.minHeight).toBe("320px");

    rerender(
      <DynamicRenderer
        components={[{ id: "s2", type: "Section", minHeight: "480px" } as any]}
        locale="en"
      />,
    );
    const second = container.querySelector(".pb-scope") as HTMLElement | null;
    expect(second).toBeTruthy();
    expect(second!.style.minHeight).toBe("480px");
  });
});
