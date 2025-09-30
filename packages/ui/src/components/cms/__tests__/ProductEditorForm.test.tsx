import { render, fireEvent } from "@testing-library/react";
import ProductEditorForm from "../ProductEditorForm";
import { useProductEditorFormState } from "../../../hooks/useProductEditorFormState";

// Lightweight mocks to keep JSDOM happy and avoid act() warnings
jest.mock("next/image", () => ({
  __esModule: true,
  // i18n-exempt: test-only mock component
  default: ({
    alt = "",
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    ...rest
  }: Record<string, unknown>) => (
    // Use <input type="image"> to avoid Next/DS lint noise in tests
    // and bypass Next.js URL parsing/loader requirements.
    <input type="image" alt={String(alt ?? "")} {...(rest as any)} />
  ),
}));

jest.mock("@acme/platform-core/hooks/usePublishLocations", () => ({
  __esModule: true,
  usePublishLocations: () => ({ locations: [], reload: jest.fn() }),
}));

jest.mock("../PublishLocationSelector", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (ids: string[]) => void }) => (
    <button data-cy="publish-selector" onClick={() => onChange(["loc1"])} />
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

    expect(getByText(/Required/)).toBeInTheDocument();
    expect(getByText(/Too short/)).toBeInTheDocument();
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

    const { getByRole } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    fireEvent.click(getByRole("button", { name: "Variants" }));

    fireEvent.click(getByRole("button", { name: "Add option to size" }));
    expect(hookState.addVariantValue).toHaveBeenCalledWith("size");

    fireEvent.click(
      getByRole("button", { name: "Remove size option 1" })
    );
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

    const { getByRole, getByTestId } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    fireEvent.click(getByRole("button", { name: "Publish locations" }));
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

    const { getByRole } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    fireEvent.click(getByRole("button", { name: "Media gallery" }));

    fireEvent.click(getByRole("button", { name: "Move media 1 down" }));
    expect(hookState.moveMedia).toHaveBeenCalledWith(0, 1);

    fireEvent.click(getByRole("button", { name: "Move media 2 up" }));
    expect(hookState.moveMedia).toHaveBeenCalledWith(1, 0);

    fireEvent.click(getByRole("button", { name: "Remove media 2" }));
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

    const { getByTestId, getByText } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    const form = getByTestId("product-editor-form");
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(getByText("Saving product…")).toBeInTheDocument();

    fireEvent.submit(form);
    expect(hookState.handleSubmit).toHaveBeenCalled();
  });
});
