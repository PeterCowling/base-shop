import { render, screen } from "@testing-library/react";
import PageBuilder from "../PageBuilder";
import UiPageBuilder from "@acme/ui/components/cms/PageBuilder";

jest.mock("@acme/ui/components/cms/PageBuilder", () => ({
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
