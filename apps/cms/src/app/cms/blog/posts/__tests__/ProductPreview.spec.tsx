import { render, screen, waitFor } from "@testing-library/react";
import { rest, server } from "../../../../../../../../test/msw/server";
import ProductPreview from "@cms/app/cms/blog/posts/ProductPreview";

describe("ProductPreview", () => {
  it("renders product info", async () => {
    server.use(
      rest.get("/api/products", (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ title: "Test", price: 100 }))
      )
    );
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await screen.findByText("Test");
    expect(onValid).toHaveBeenCalledWith(true);
  });

  it("handles error", async () => {
    server.use(
      rest.get("/api/products", (_req, res, ctx) =>
        res.networkError("fail")
      )
    );
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await waitFor(() => expect(onValid).toHaveBeenCalledWith(false));
  });
});
