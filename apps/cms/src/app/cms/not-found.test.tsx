import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("./not-found.client", () => ({
  __esModule: true,
  default: () => <div data-cy="cms-not-found" />,
}));

afterEach(() => {
  jest.clearAllMocks();
});

it("wraps the CmsNotFound client component", async () => {
  const { default: NotFound } = await import("./not-found");
  render(<NotFound />);
  expect(screen.getByTestId("cms-not-found")).toBeInTheDocument();
});
