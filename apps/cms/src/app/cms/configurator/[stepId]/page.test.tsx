import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

jest.mock("../ConfiguratorContext", () => ({
  ConfiguratorProvider: ({ children }: any) => (
    <div data-cy="provider">{children}</div>
  ),
}));

jest.mock("./step-page", () => ({
  __esModule: true,
  default: ({ stepId }: any) => <div data-cy="step-page">{stepId}</div>,
}));

afterEach(() => {
  jest.clearAllMocks();
});

it("wraps StepPage with provider", async () => {
  const { default: Page } = await import("./page");
  const ui = (await Page({
    params: Promise.resolve({ stepId: "abc" }),
  })) as ReactElement;

  render(ui);
  expect(screen.getByTestId("provider")).toBeInTheDocument();
  expect(screen.getByTestId("step-page")).toHaveTextContent("abc");
});

