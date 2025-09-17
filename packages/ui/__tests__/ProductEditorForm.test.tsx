import { render, fireEvent, screen } from "@testing-library/react";
import ProductEditorForm from "../src/components/cms/ProductEditorForm";
import { useProductEditorFormState } from "../src/hooks/useProductEditorFormState";

jest.mock("../src/hooks/useProductEditorFormState");

describe("ProductEditorForm", () => {
  it("renders product data, handles changes, shows errors and submits", () => {
    const hookState = {
      product: {
        id: "p1",
        price: 100,
        variants: {},
        media: [],
        title: { en: "" },
        description: { en: "" },
      },
      errors: { price: ["Required"] },
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

    render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    // shows validation error
    expect(screen.getByText(/Required/)).toBeInTheDocument();

    // change a field
    const priceInput = screen.getByLabelText(/Price/);
    fireEvent.change(priceInput, { target: { value: "200" } });
    expect(hookState.handleChange).toHaveBeenCalled();

    // submit the form
    fireEvent.submit(priceInput.closest("form")!);
    expect(hookState.handleSubmit).toHaveBeenCalled();
  });
});

