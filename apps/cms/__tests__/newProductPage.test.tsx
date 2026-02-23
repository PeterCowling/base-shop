import "@testing-library/jest-dom";

import NewProductPage from "../src/app/cms/shop/[shop]/products/new/page";

jest.mock("@cms/actions/products.server", () => ({ createDraftRecord: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

const { createDraftRecord } = jest.requireMock("@cms/actions/products.server") as {
  createDraftRecord: jest.Mock;
};
const { redirect } = jest.requireMock("next/navigation") as {
  redirect: jest.Mock;
};

describe("NewProductPage", () => {
  it("creates draft and redirects", async () => {
    createDraftRecord.mockResolvedValue({ id: "p1" });
    await NewProductPage({ params: Promise.resolve({ shop: "s1" }) });
    expect(createDraftRecord).toHaveBeenCalledWith("s1");
    expect(redirect).toHaveBeenCalledWith(
      "/cms/shop/s1/products/p1/edit",
    );
  });
});
