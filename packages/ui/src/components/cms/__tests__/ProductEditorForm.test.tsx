import { render, fireEvent } from "@testing-library/react";
import ProductEditorForm from "../ProductEditorForm";
import { useProductEditorFormState } from "../../../hooks/useProductEditorFormState";

jest.mock("../PublishLocationSelector", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (ids: string[]) => void }) => (
    <button
      data-testid="publish-selector"
      onClick={() => onChange(["loc1"])}
    />
  ),
}));

jest.mock("../../../hooks/useProductEditorFormState");

describe("ProductEditorForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays error messages when provided", () => {
    const hookState = {
      product: {
        id: "p1",
        price: 100,
        variants: {},
        media: [],
        title: { en: "" },
        description: { en: "" },
      },
      errors: { price: ["Required"], title: ["Too short"] },
      saving: false,
      publishTargets: [],
      setPublishTargets: jest.fn(),
      handleChange: jest.fn(),
      handleSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
      uploader: null as React.ReactNode,
      removeMedia: jest.fn(),
      moveMedia: jest.fn(),
      addVariantValue: jest.fn(),
      removeVariantValue: jest.fn(),
    };
    (useProductEditorFormState as jest.Mock).mockReturnValue(hookState);

    const { getByText } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    expect(getByText("Required")).toBeInTheDocument();
    expect(getByText("Too short")).toBeInTheDocument();
  });

  it("allows adding and removing variant values", () => {
    const hookState = {
      product: {
        id: "p1",
        price: 100,
        variants: { size: ["M"] },
        media: [],
        title: { en: "" },
        description: { en: "" },
      },
      errors: {},
      saving: false,
      publishTargets: [],
      setPublishTargets: jest.fn(),
      handleChange: jest.fn(),
      handleSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
      uploader: null as React.ReactNode,
      removeMedia: jest.fn(),
      moveMedia: jest.fn(),
      addVariantValue: jest.fn(),
      removeVariantValue: jest.fn(),
    };
    (useProductEditorFormState as jest.Mock).mockReturnValue(hookState);

    const { getByText, getByRole } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    fireEvent.click(getByText("Add"));
    expect(hookState.addVariantValue).toHaveBeenCalledWith("size");

    fireEvent.click(getByRole("button", { name: "✕" }));
    expect(hookState.removeVariantValue).toHaveBeenCalledWith("size", 0);
  });

  it("updates publish targets via selector", () => {
    const hookState = {
      product: {
        id: "p1",
        price: 100,
        variants: {},
        media: [],
        title: { en: "" },
        description: { en: "" },
      },
      errors: {},
      saving: false,
      publishTargets: [],
      setPublishTargets: jest.fn(),
      handleChange: jest.fn(),
      handleSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
      uploader: null as React.ReactNode,
      removeMedia: jest.fn(),
      moveMedia: jest.fn(),
      addVariantValue: jest.fn(),
      removeVariantValue: jest.fn(),
    };
    (useProductEditorFormState as jest.Mock).mockReturnValue(hookState);

    const { getByTestId } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    fireEvent.click(getByTestId("publish-selector"));
    expect(hookState.setPublishTargets).toHaveBeenCalledWith(["loc1"]);
  });

  it("reorders and removes media items", () => {
    const hookState = {
      product: {
        id: "p1",
        price: 100,
        variants: {},
        media: [
          { type: "image", url: "a.jpg", altText: "" },
          { type: "image", url: "b.jpg", altText: "" },
        ],
        title: { en: "" },
        description: { en: "" },
      },
      errors: {},
      saving: false,
      publishTargets: [],
      setPublishTargets: jest.fn(),
      handleChange: jest.fn(),
      handleSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
      uploader: null as React.ReactNode,
      removeMedia: jest.fn(),
      moveMedia: jest.fn(),
      addVariantValue: jest.fn(),
      removeVariantValue: jest.fn(),
    };
    (useProductEditorFormState as jest.Mock).mockReturnValue(hookState);

    const { getAllByText } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    fireEvent.click(getAllByText("↓")[0]);
    expect(hookState.moveMedia).toHaveBeenCalledWith(0, 1);

    fireEvent.click(getAllByText("↑")[0]);
    expect(hookState.moveMedia).toHaveBeenCalledWith(1, 0);

    fireEvent.click(getAllByText("✕")[1]);
    expect(hookState.removeMedia).toHaveBeenCalledWith(1);
  });

  it("submits form and shows saving state", () => {
    const hookState = {
      product: {
        id: "p1",
        price: 100,
        variants: {},
        media: [],
        title: { en: "" },
        description: { en: "" },
      },
      errors: {},
      saving: true,
      publishTargets: [],
      setPublishTargets: jest.fn(),
      handleChange: jest.fn(),
      handleSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
      uploader: null as React.ReactNode,
      removeMedia: jest.fn(),
      moveMedia: jest.fn(),
      addVariantValue: jest.fn(),
      removeVariantValue: jest.fn(),
    };
    (useProductEditorFormState as jest.Mock).mockReturnValue(hookState);

    const { getByRole } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    const button = getByRole("button", { name: "Saving…" });
    expect(button).toBeDisabled();

    fireEvent.submit(button.closest("form")!);
    expect(hookState.handleSubmit).toHaveBeenCalled();
  });
});
