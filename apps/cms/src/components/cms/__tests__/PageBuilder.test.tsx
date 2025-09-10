import { render } from "@testing-library/react";
import PageBuilder from "../PageBuilder";
import UiPageBuilder from "@ui/components/cms/PageBuilder";

jest.mock("@ui/components/cms/PageBuilder", () => ({
  __esModule: true,
  default: jest.fn(
    () => (
      /* Use `data-cy` because Testing Library is configured with `testIdAttribute: "data-cy"` */
      <div data-cy="ui-page-builder" />
    ),
  ),
}));

describe("cms PageBuilder re-export", () => {
  it("renders underlying ui component", () => {
    const { getByTestId } = render(<PageBuilder />);
    expect(getByTestId("ui-page-builder")).toBeInTheDocument();
    expect(UiPageBuilder).toHaveBeenCalled();
  });
});
