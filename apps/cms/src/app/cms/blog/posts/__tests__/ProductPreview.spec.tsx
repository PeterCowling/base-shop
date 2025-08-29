import { render, screen, waitFor } from "@testing-library/react";
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
    await waitFor(() => expect(onValid).toHaveBeenCalledWith(true));
  });

  it("handles error", async () => {
    (global as any).fetch.mockRejectedValueOnce(new Error("fail"));
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await waitFor(() => expect(onValid).toHaveBeenCalledWith(false));
  });
});
