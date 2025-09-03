import { render, waitFor } from "@testing-library/react";
import ProductPreview from "@cms/app/cms/blog/posts/ProductPreview";
import { rest, server } from "../../../../../../__tests__/msw/server";

describe("ProductPreview", () => {
  it("renders product info", async () => {
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await waitFor(() => expect(onValid).toHaveBeenCalledWith(true));
  });

  it("handles error", async () => {
    server.use(
      rest.get("*/api/products", (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );
    const onValid = jest.fn();
    render(<ProductPreview slug="t" onValidChange={onValid} />);
    await waitFor(() => expect(onValid).toHaveBeenCalledWith(false));
  });
});
