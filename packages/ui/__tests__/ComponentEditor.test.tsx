import { render, fireEvent, act } from "@testing-library/react";
import { TranslationsProvider } from "@acme/i18n";
import en from "@acme/i18n/en.json";
import ComponentEditor from "../src/components/cms/page-builder/ComponentEditor";
import type { PageComponent } from "@acme/types";

const handleInput = jest.fn();
jest.mock("../src/components/cms/page-builder/useComponentInputs", () => ({
  __esModule: true,
  default: jest.fn(() => ({ handleInput })),
}));

beforeEach(() => {
  handleInput.mockClear();
});

describe("ComponentEditor", () => {
  it("updates width, height, margin and padding", async () => {
    const component: PageComponent = {
      id: "1",
      type: "Image",
    } as PageComponent;
    const onResize = jest.fn();
    const { findByLabelText, findAllByLabelText, findAllByText, getByText } = render(
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
    const widthInputs = await findAllByLabelText(/Width \(Desktop\)/i);
    fireEvent.change(widthInputs[0], {
      target: { value: "200" },
    });
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "200" });
    fireEvent.click((await findAllByText("Full width"))[0]);
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
    const heightInputs = await findAllByLabelText(/Height \(Desktop\)/i);
    fireEvent.change(heightInputs[0], {
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

  it("returns null when component is null", () => {
    const { container } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor component={null} onChange={() => {}} onResize={() => {}} />
      </TranslationsProvider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("invokes handleInput when editing style and interactions", async () => {
    const component: PageComponent = { id: "1", type: "Image" } as PageComponent;
    const { getByText, getByLabelText, findByText } = render(
      <TranslationsProvider messages={en}>
        <ComponentEditor component={component} onChange={() => {}} onResize={() => {}} />
      </TranslationsProvider>,
    );

    fireEvent.click(getByText("Style"));
    fireEvent.change(getByLabelText("Foreground"), { target: { value: "#fff" } });
    expect(handleInput).toHaveBeenCalledWith("styles", expect.any(String));

    fireEvent.click(getByText("Interactions"));
    const clickTrigger = getByLabelText("Click Action");
    fireEvent.mouseDown(clickTrigger);
    fireEvent.click(await findByText("Navigate"));
    expect(handleInput).toHaveBeenCalledWith("clickAction", "navigate");

    const animationTrigger = getByLabelText("Animation");
    fireEvent.mouseDown(animationTrigger);
    fireEvent.click(await findByText("Fade"));
    expect(handleInput).toHaveBeenCalledWith("animation", "fade");
  });
});
