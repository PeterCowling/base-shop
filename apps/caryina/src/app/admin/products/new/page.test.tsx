import { render, screen } from "@testing-library/react";

import AdminProductNewPage from "./page";

jest.mock("@/components/admin/ProductForm.client", () => ({
  ProductForm: () => <div data-testid="product-form" />,
}));

describe("AdminProductNewPage", () => {
  it("renders heading and product form", () => {
    render(<AdminProductNewPage />);

    expect(screen.getByRole("heading", { name: "New product" })).toBeInTheDocument();
    expect(screen.getByTestId("product-form")).toBeInTheDocument();
  });
});
