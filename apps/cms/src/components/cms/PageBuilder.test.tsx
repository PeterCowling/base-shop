import { render } from "@testing-library/react";
import PageBuilder from "./PageBuilder";
import UiPageBuilder from "@ui/components/cms/PageBuilder";

jest.mock("@ui/components/cms/PageBuilder", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="ui-page-builder" />),
}));

describe("cms PageBuilder re-export", () => {
  it("renders underlying ui component", () => {
    const { getByTestId } = render(<PageBuilder />);
    expect(getByTestId("ui-page-builder")).toBeInTheDocument();
    expect(UiPageBuilder).toHaveBeenCalled();
  });
});
