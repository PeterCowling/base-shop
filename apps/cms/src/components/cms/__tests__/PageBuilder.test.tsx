import { render, screen } from "@testing-library/react";

import UiPageBuilder from "@acme/cms-ui/PageBuilder";

import PageBuilder from "../PageBuilder";

jest.mock("@acme/cms-ui/PageBuilder", () => ({
  __esModule: true,
  // Use data-cy to align with Testing Library's configured testIdAttribute.
  default: jest.fn(() => <div data-cy="ui-page-builder" />),
}));

describe("cms PageBuilder re-export", () => {
  it("renders underlying ui component", () => {
    render(<PageBuilder />);
    expect(screen.getByTestId("ui-page-builder")).toBeInTheDocument();
    expect(UiPageBuilder).toHaveBeenCalled();
  });
});
