import "@testing-library/jest-dom";

import React from "react";

import NewProductPage from "../src/app/cms/shop/[shop]/products/new/page";

const createDraftRecord = jest.fn();
jest.mock("@cms/actions/products.server", () => ({ createDraftRecord }));
const redirect = jest.fn();
jest.mock("next/navigation", () => ({ redirect }));

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
