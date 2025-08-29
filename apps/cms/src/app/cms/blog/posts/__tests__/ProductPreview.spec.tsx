import { render, screen } from "@testing-library/react";
import ProductPreview from "@cms/app/cms/blog/posts/ProductPreview";

describe("ProductPreview", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  it("renders product info", async () => {
    (global as any).fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ title: "Test", price: 100 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await screen.findByText("Test");
    expect(onValid).toHaveBeenCalledWith(true);
  });

  it("handles error", async () => {
    (global as any).fetch.mockRejectedValueOnce(new Error("fail"));
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await screen.findByText(/failed to load product/i);
    expect(onValid).toHaveBeenCalledWith(false);
  });
});
