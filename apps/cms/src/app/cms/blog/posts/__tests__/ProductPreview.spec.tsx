import { render, screen, waitFor } from "@testing-library/react";
import ProductPreview from "@cms/app/cms/blog/posts/ProductPreview";

describe("ProductPreview", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  it("renders product info", async () => {
    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: "Test", price: 100 }),
    });
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await screen.findByText("Test");
    expect(onValid).toHaveBeenCalledWith(true);
  });

  it("handles error", async () => {
    (global as any).fetch.mockRejectedValueOnce(new Error("fail"));
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await waitFor(() => expect(onValid).toHaveBeenCalledWith(false));
  });
});
