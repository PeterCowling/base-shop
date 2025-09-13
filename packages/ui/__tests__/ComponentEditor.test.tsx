import { render, fireEvent, act } from "@testing-library/react";
import { TranslationsProvider } from "@acme/i18n";
import en from "@acme/i18n/en.json";
import ComponentEditor from "../src/components/cms/page-builder/ComponentEditor";
import type { PageComponent } from "@acme/types";

describe("ComponentEditor", () => {
  it("updates width, height, margin and padding", () => {
    const component: PageComponent = {
      id: "1",
      type: "Image",
    } as PageComponent;
    const onResize = jest.fn();
    const { getByLabelText, getAllByText, getByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor
          component={component}
          onChange={() => {}}
          onResize={onResize}
        />
      </TranslationsProvider>
    );
    fireEvent.click(getByText("Layout"));
    fireEvent.change(getByLabelText("Width (Desktop)", { exact: false }), {
      target: { value: "200" },
    });
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "200" });
    fireEvent.click(getAllByText("Full width")[0]);
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
    fireEvent.change(getByLabelText("Height (Desktop)", { exact: false }), {
      target: { value: "300" },
    });
    expect(onResize).toHaveBeenCalledWith({ heightDesktop: "300" });
    fireEvent.click(getAllByText("Full height")[0]);
    expect(onResize).toHaveBeenCalledWith({ heightDesktop: "100%" });
    fireEvent.change(getByLabelText("Margin (Desktop)", { exact: false }), {
      target: { value: "10px" },
    });
    expect(onResize).toHaveBeenCalledWith({ marginDesktop: "10px" });
    fireEvent.change(getByLabelText("Padding (Desktop)", { exact: false }), {
      target: { value: "5px" },
    });
    expect(onResize).toHaveBeenCalledWith({ paddingDesktop: "5px" });
  });

  it("updates minItems and maxItems", () => {
    const component: PageComponent = {
      id: "1",
      type: "ProductCarousel",
      minItems: 1,
      maxItems: 5,
    } as PageComponent;
    const onChange = jest.fn();
    const { getByLabelText, getByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor component={component} onChange={onChange} onResize={() => {}} />
      </TranslationsProvider>
    );
    fireEvent.click(getByText("Content"));
    fireEvent.change(getByLabelText("Min Items", { exact: false }), {
      target: { value: "2" },
    });
    fireEvent.change(getByLabelText("Max Items", { exact: false }), {
      target: { value: "6" },
    });
    expect(onChange).toHaveBeenCalledWith({ minItems: 2 });
    expect(onChange).toHaveBeenCalledWith({ maxItems: 6 });
  });

  it("clamps minItems and maxItems against each other", () => {
    const component: PageComponent = {
      id: "1",
      type: "ProductCarousel",
      minItems: 1,
      maxItems: 5,
    } as PageComponent;
    const onChange = jest.fn();
    const { getByLabelText, getByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor component={component} onChange={onChange} onResize={() => {}} />
      </TranslationsProvider>
    );
    fireEvent.click(getByText("Content"));
    fireEvent.change(getByLabelText("Min Items", { exact: false }), {
      target: { value: "6" },
    });
    expect(onChange).toHaveBeenNthCalledWith(1, { minItems: 6, maxItems: 6 });
    fireEvent.change(getByLabelText("Max Items", { exact: false }), {
      target: { value: "0" },
    });
    expect(onChange).toHaveBeenNthCalledWith(2, { maxItems: 0, minItems: 0 });
  });

  it("loads specific editor via registry", async () => {
    const component: PageComponent = {
      id: "1",
      type: "Image",
    } as PageComponent;
    const { findByPlaceholderText, getByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor
          component={component}
          onChange={() => {}}
          onResize={() => {}}
        />
      </TranslationsProvider>
    );
    fireEvent.click(getByText("Content"));
    // Image source field uses translations as placeholders
    expect(
      await findByPlaceholderText("Image URL")
    ).toBeInTheDocument();
  });
});
