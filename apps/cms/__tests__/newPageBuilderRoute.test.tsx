import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@cms/actions/pages/create", () => ({ createPage: jest.fn() }));
jest.mock("next/dynamic", () => {
  return () => {
    const NextDynamicMock: React.FC = () => <div data-cy="builder" />;
    NextDynamicMock.displayName = "NextDynamicMock";
    return NextDynamicMock;
  };
});

import NewPageBuilderRoute from "../src/app/cms/shop/[shop]/pages/new/page/page";

describe("NewPageBuilderRoute", () => {
  it("renders header and builder", async () => {
    const Page = await NewPageBuilderRoute({ params: Promise.resolve({ shop: "s1" }) });
    render(Page);
    expect(screen.getByText("New page - s1")).toBeInTheDocument();
    expect(screen.getByTestId("builder")).toBeInTheDocument();
  });
});
