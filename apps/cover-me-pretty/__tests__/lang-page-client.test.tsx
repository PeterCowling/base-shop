import { render } from "@testing-library/react";
import type { PageComponent } from "@acme/page-builder-core";
import type { BlogPost } from "@acme/cms-ui/blocks/BlogListing";

jest.mock("@acme/cms-ui/blocks/BlogListing", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("@acme/ui/components/DynamicRenderer", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

import Home from "../src/app/[lang]/page.client";
import BlogListing from "@acme/cms-ui/blocks/BlogListing";
import DynamicRenderer from "@acme/ui/components/DynamicRenderer";

describe("Home page client", () => {
  const components: PageComponent[] = [
    { id: "c1", type: "HeroBanner" },
  ];
  const locale = "en" as const;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders BlogListing only when latestPost provided", () => {
    const { rerender } = render(<Home components={components} locale={locale} />);
    expect(BlogListing).not.toHaveBeenCalled();

    const latestPost = { title: "Hello" } as BlogPost;
    rerender(
      <Home
        components={components}
        locale={locale}
        latestPost={latestPost}
      />,
    );
    expect(BlogListing).toHaveBeenCalledWith(
      { posts: [latestPost] },
      undefined,
    );
  });

  it("passes components and locale to DynamicRenderer", () => {
    render(<Home components={components} locale={locale} />);
    expect(DynamicRenderer).toHaveBeenCalledWith(
      { components, locale },
      undefined,
    );
  });
});
