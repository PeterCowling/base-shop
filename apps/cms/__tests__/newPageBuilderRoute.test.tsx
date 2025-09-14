import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@cms/actions/pages/create", () => ({ createPage: jest.fn() }));
jest.mock("next/dynamic", () => () => () => <div data-cy="builder" />);

import NewPageBuilderRoute from "../src/app/cms/shop/[shop]/pages/new/builder/page";

describe("NewPageBuilderRoute", () => {
  it("renders header and builder", async () => {
    const Page = await NewPageBuilderRoute({ params: Promise.resolve({ shop: "s1" }) });
    render(Page);
    expect(screen.getByText("New page - s1")).toBeInTheDocument();
    expect(screen.getByTestId("builder")).toBeInTheDocument();
  });
});
