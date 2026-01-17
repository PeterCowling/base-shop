import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

type BuilderProps = {
  page?: unknown;
  history?: unknown;
  onSave?: (formData: FormData) => unknown;
  onPublish?: (formData: FormData) => unknown;
};

let capturedBuilderProps: BuilderProps | undefined;

jest.mock("@acme/platform-core/repositories/pages/index.server", () => ({
  getPages: jest.fn(),
}));
jest.mock("@cms/actions/pages/update", () => ({
  updatePage: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: jest.fn(() => {
    return function PageBuilderStub(props: BuilderProps) {
      capturedBuilderProps = props;
      return <div data-cy="page-builder-stub" />;
    };
  }),
}));

import { getPages } from "@acme/platform-core/repositories/pages/index.server";
import { updatePage } from "@cms/actions/pages/update";
import { notFound } from "next/navigation";
import PageBuilderRoute from "../src/app/cms/shop/[shop]/pages/[page]/builder/page";

const getPagesMock = jest.mocked(getPages);
const updatePageMock = jest.mocked(updatePage);
const notFoundMock = jest.mocked(notFound);

describe("PageBuilderRoute", () => {
  beforeEach(() => {
    getPagesMock.mockReset();
    updatePageMock.mockReset();
    notFoundMock.mockReset();
    capturedBuilderProps = undefined;
  });

  it("renders builder content and wires up save/publish actions", async () => {
    const page = {
      id: "page-1",
      slug: "hero",
      title: "Hero",
      status: "draft",
      history: [{ id: "rev-1" }],
    } as any;

    getPagesMock.mockResolvedValue([page]);

    const Page = await PageBuilderRoute({
      params: Promise.resolve({ shop: "acme", page: "hero" }),
    });

    render(Page);

    // Route should render the PageBuilder with proper props; legacy header/help text removed.
    expect(screen.getByTestId("page-builder-stub")).toBeInTheDocument();

    expect(capturedBuilderProps?.page).toBe(page);
    expect(capturedBuilderProps?.history).toBe(page.history);

    expect(typeof capturedBuilderProps?.onSave).toBe("function");
    expect(typeof capturedBuilderProps?.onPublish).toBe("function");

    const saveData = new FormData();
    await capturedBuilderProps!.onSave!(saveData);
    expect(updatePageMock).toHaveBeenNthCalledWith(1, "acme", saveData);

    const publishData = new FormData();
    await capturedBuilderProps!.onPublish!(publishData);
    expect(updatePageMock).toHaveBeenNthCalledWith(2, "acme", publishData);
    expect(publishData.get("status")).toBe("published");
  });

  it("invokes notFound when the requested page does not exist", async () => {
    getPagesMock.mockResolvedValue([] as any);

    await PageBuilderRoute({
      params: Promise.resolve({ shop: "acme", page: "missing" }),
    });

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
