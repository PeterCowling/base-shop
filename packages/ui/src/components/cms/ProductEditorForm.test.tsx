import { render, fireEvent } from "@testing-library/react";
import ProductEditorForm from "./ProductEditorForm";
import { useProductEditorFormState } from "../../hooks/useProductEditorFormState";

jest.mock("./PublishLocationSelector", () => ({
  __esModule: true,
  default: () => <div data-testid="publish-selector" />,
}));

jest.mock("../../hooks/useProductEditorFormState");

describe("ProductEditorForm", () => {
  it("renders fields and submits via hook", () => {
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

    const { getByLabelText, getByText } = render(
      <ProductEditorForm
        product={hookState.product}
        onSave={jest.fn()}
        locales={["en"]}
      />
    );

    expect(getByLabelText(/Price/)).toHaveValue(100);
    expect(getByText("Required")).toBeInTheDocument();

    fireEvent.submit(getByText(/Save/).closest("form")!);
    expect(hookState.handleSubmit).toHaveBeenCalled();
  });
});
