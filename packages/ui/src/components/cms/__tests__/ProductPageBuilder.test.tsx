import { render } from "@testing-library/react";

import PageBuilder from "../page-builder/PageBuilder";
import ProductPageBuilder from "../ProductPageBuilder";

jest.mock("../page-builder/PageBuilder", () => jest.fn(() => null));

const MockPageBuilder = PageBuilder as unknown as jest.Mock;

describe("ProductPageBuilder", () => {
  it("forwards props to PageBuilder", () => {
    const props = {
      page: { id: "p1", path: "/", components: [] } as any,
      onSave: jest.fn(),
      onPublish: jest.fn(),
    };

    render(<ProductPageBuilder {...props} />);

    expect(MockPageBuilder).toHaveBeenCalledWith(props, undefined);
  });
});
