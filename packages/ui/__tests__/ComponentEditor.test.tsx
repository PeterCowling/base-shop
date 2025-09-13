import { render, fireEvent, act } from "@testing-library/react";
import { TranslationsProvider } from "@acme/i18n";
import en from "@acme/i18n/en.json";
import ComponentEditor from "../src/components/cms/page-builder/ComponentEditor";
import type { PageComponent } from "@acme/types";

describe("ComponentEditor", () => {
  it("updates width, height, margin and padding", async () => {
    const component: PageComponent = {
      id: "1",
      type: "Image",
    } as PageComponent;
    const onResize = jest.fn();
    const { findByLabelText, findAllByText, getByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor
          component={component}
          onChange={() => {}}
          onResize={onResize}
        />
      </TranslationsProvider>
    );
    await act(async () => {
      fireEvent.click(getByText("Layout"));
    });
    fireEvent.change(await findByLabelText("Width (Desktop)", { exact: false }), {
      target: { value: "200" },
    });
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "200" });
    fireEvent.click((await findAllByText("Full width"))[0]);
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
    fireEvent.change(await findByLabelText("Height (Desktop)", { exact: false }), {
      target: { value: "300" },
    });
    expect(onResize).toHaveBeenCalledWith({ heightDesktop: "300" });
    fireEvent.click((await findAllByText("Full height"))[0]);
    expect(onResize).toHaveBeenCalledWith({ heightDesktop: "100%" });
    fireEvent.change(await findByLabelText("Margin (Desktop)", { exact: false }), {
      target: { value: "10px" },
    });
    expect(onResize).toHaveBeenCalledWith({ marginDesktop: "10px" });
    fireEvent.change(await findByLabelText("Padding (Desktop)", { exact: false }), {
      target: { value: "5px" },
    });
    expect(onResize).toHaveBeenCalledWith({ paddingDesktop: "5px" });
  });

  it("updates minItems and maxItems", async () => {
    const component: PageComponent = {
      id: "1",
      type: "ProductCarousel",
      minItems: 1,
      maxItems: 5,
    } as PageComponent;
    const onChange = jest.fn();
    const { findByLabelText, getByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor component={component} onChange={onChange} onResize={() => {}} />
      </TranslationsProvider>
    );
    await act(async () => {
      fireEvent.click(getByText("Content"));
    });
    fireEvent.change(await findByLabelText("Min Items", { exact: false }), {
      target: { value: "2" },
    });
    fireEvent.change(await findByLabelText("Max Items", { exact: false }), {
      target: { value: "6" },
    });
    expect(onChange).toHaveBeenCalledWith({ minItems: 2 });
    expect(onChange).toHaveBeenCalledWith({ maxItems: 6 });
  });

  it("clamps minItems and maxItems against each other", async () => {
    const component: PageComponent = {
      id: "1",
      type: "ProductCarousel",
      minItems: 1,
      maxItems: 5,
    } as PageComponent;
    const onChange = jest.fn();
    const { findByLabelText, getByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor component={component} onChange={onChange} onResize={() => {}} />
      </TranslationsProvider>
    );
    await act(async () => {
      fireEvent.click(getByText("Content"));
    });
    fireEvent.change(await findByLabelText("Min Items", { exact: false }), {
      target: { value: "6" },
    });
    expect(onChange).toHaveBeenNthCalledWith(1, { minItems: 6, maxItems: 6 });
    fireEvent.change(await findByLabelText("Max Items", { exact: false }), {
      target: { value: "0" },
    });
    expect(onChange).toHaveBeenNthCalledWith(2, { maxItems: 0, minItems: 0 });
  });

  it("loads specific editor via registry", async () => {
    const component: PageComponent = {
      id: "1",
      type: "Button",
    } as PageComponent;
    const { findByLabelText, getByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor
          component={component}
          onChange={() => {}}
          onResize={() => {}}
        />
      </TranslationsProvider>
    );
    await act(async () => {
      fireEvent.click(getByText("Content"));
    });
    expect(await findByLabelText("Label")).toBeInTheDocument();
  });
});
