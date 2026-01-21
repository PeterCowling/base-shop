import React from "react";
import { InvalidProductContext } from "@cms/app/cms/blog/posts/invalidProductContext";
import {
  previewComponents,
  renderBlock,
  schema,
} from "@cms/app/cms/blog/posts/schema";
import { render } from "@testing-library/react";

jest.mock("@acme/ui", () => ({ Button: ({ children }: any) => <button>{children}</button> }));
jest.mock("@portabletext/editor", () => ({
  defineSchema: (x: any) => x,
  useEditor: () => ({}),
  PortableTextEditor: { delete: jest.fn(), insertBlock: jest.fn() },
}));
jest.mock("@cms/app/cms/blog/posts/ProductPreview", () => ({
  __esModule: true,
  default: ({ onValidChange }: any) => {
    onValidChange?.(false);
    return <div data-cy="product-preview" />;
  },
}));

describe("schema", () => {
  it("includes productReference block", () => {
    const block = (schema.blockObjects as unknown as any[]).find(
      (b) => b.name === "productReference",
    );
    expect(block).toBeTruthy();
    expect(block.fields).toEqual([{ name: "slug", type: "string" }]);
  });
});

describe("renderBlock", () => {
  it("renders productReference and updates context", () => {
    const invalidProducts: Record<string, string> = {};
    const markValidity = jest.fn((k: string, v: boolean, s: string) => {
      if (v) delete invalidProducts[k];
      else invalidProducts[k] = s;
    });
    render(
      <InvalidProductContext.Provider value={{ invalidProducts, markValidity }}>
        {renderBlock({
          value: { _type: "productReference", slug: "p", _key: "k" },
          path: [],
          index: 0,
          renderNode: jest.fn(),
          children: null,
        } as any)}
      </InvalidProductContext.Provider>,
    );
    expect(markValidity).toHaveBeenCalledWith("k", false, "p");
    expect(invalidProducts).toEqual({ k: "p" });
  });

  it("renders embed block", () => {
    const { container } = render(
      renderBlock({
        value: { _type: "embed", url: "http://e" },
        path: [],
        index: 0,
        renderNode: jest.fn(),
        children: null,
      } as any),
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute("src", "http://e");
  });

  it("renders image block", () => {
    const { container } = render(
      renderBlock({
        value: { _type: "image", url: "/img.png", alt: "a" },
        path: [],
        index: 0,
        renderNode: jest.fn(),
        children: null,
      } as any),
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/img.png");
    expect(img).toHaveAttribute("alt", "a");
  });

  it("renders default block", () => {
    const { getByText } = render(
      renderBlock({
        value: { _type: "other" },
        path: [],
        index: 0,
        renderNode: jest.fn(),
        children: <span>content</span>,
      } as any),
    );
    expect(getByText("content")).toBeInTheDocument();
  });
});

describe("previewComponents", () => {
  it("renders productReference preview", () => {
    const { getByTestId } = render(
      previewComponents.types.productReference({ value: { slug: "s" } }),
    );
    expect(getByTestId("product-preview")).toBeInTheDocument();
  });

  it("renders embed preview", () => {
    const { container } = render(
      previewComponents.types.embed({ value: { url: "http://e" } }),
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute("src", "http://e");
  });

  it("renders image preview", () => {
    const { container } = render(
      previewComponents.types.image({ value: { url: "/img.png", alt: "a" } }),
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/img.png");
    expect(img).toHaveAttribute("alt", "a");
  });

  it("renders link mark with href", () => {
    const { container } = render(
      previewComponents.marks.link({
        children: "link",
        value: { href: "http://x" },
      }),
    );
    const a = container.querySelector("a");
    expect(a).toHaveAttribute("href", "http://x");
  });

  it("renders link mark without href", () => {
    const { container } = render(
      previewComponents.marks.link({ children: "link" }),
    );
    const a = container.querySelector("a");
    expect(a).toHaveAttribute("href", "#");
  });

  it("renders heading blocks", () => {
    const h1 = render(
      previewComponents.block.h1({ children: "H1" }),
    ).container.querySelector("h1");
    const h2 = render(
      previewComponents.block.h2({ children: "H2" }),
    ).container.querySelector("h2");
    const h3 = render(
      previewComponents.block.h3({ children: "H3" }),
    ).container.querySelector("h3");
    expect(h1?.textContent).toBe("H1");
    expect(h2?.textContent).toBe("H2");
    expect(h3?.textContent).toBe("H3");
  });
});
