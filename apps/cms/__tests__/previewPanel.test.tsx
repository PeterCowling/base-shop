import { render, screen } from "@testing-library/react";

import PreviewPanel from "../src/app/cms/shop/[shop]/settings/seo/PreviewPanel";

describe("PreviewPanel", () => {
  it("shows placeholders when title/description missing and hides image", () => {
    render(<PreviewPanel title="" />);

    expect(screen.getAllByText("Title goes here")).toHaveLength(3);
    expect(screen.getAllByText("Description goes here")).toHaveLength(3);
    expect(screen.queryByAltText("preview image")).not.toBeInTheDocument();
  });

  it("renders provided title, description, and image", () => {
    render(
      <PreviewPanel
        title="My title"
        description="My description"
        image="/img.png"
        url="example.com"
      />
    );

    expect(screen.queryByText("Title goes here")).not.toBeInTheDocument();
    expect(screen.queryByText("Description goes here")).not.toBeInTheDocument();
    expect(screen.getAllByText("My title")).toHaveLength(3);
    expect(screen.getAllByText("My description")).toHaveLength(3);
    expect(screen.getAllByAltText("preview image")).toHaveLength(2);
  });
});
