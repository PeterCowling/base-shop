import { render, screen } from "@testing-library/react";

import { PageBuilder as UiPageBuilder } from "@acme/page-builder-ui";

import PageBuilder from "../PageBuilder";

jest.mock("@acme/page-builder-ui", () => ({
  __esModule: true,
  // Use data-cy to align with Testing Library's configured testIdAttribute.
  PageBuilder: jest.fn(() => <div data-cy="ui-page-builder" />),
}));

describe("cms PageBuilder re-export", () => {
  it("renders underlying ui component", () => {
    render(<PageBuilder />);
    expect(screen.getByTestId("ui-page-builder")).toBeInTheDocument();
    expect(UiPageBuilder).toHaveBeenCalled();
  });
});
