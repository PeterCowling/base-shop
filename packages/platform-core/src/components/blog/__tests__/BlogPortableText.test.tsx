import React from "react";
import { render, screen } from "@testing-library/react";
import { BlogPortableText } from "../BlogPortableText";

// Mock ProductCard to a simple component for deterministic DOM
jest.mock("../../shop/ProductCard", () => ({
  ProductCard: ({ sku }: any) => <div data-cy="card">{sku.title}</div>,
}));

// Mock product lookups
jest.mock("../../../products", () => ({
  getProductById: (id: string) => ({ id, slug: id, title: `ById:${id}` }),
  getProductBySlug: (slug: string) => ({ id: slug, slug, title: `BySlug:${slug}` }),
}));

// Lightweight mock for PortableText that invokes relevant component mappers
jest.mock("@portabletext/react", () => ({
  PortableText: ({ value, components }: any) => {
    const out: React.ReactNode[] = [];
    for (const node of value as any[]) {
      if (node._type === "productReference") {
        out.push(
          <div key={`p-${(node.ids||node.slugs||[]).join(',')}`}>
            {components.types.productReference({ value: node })}
          </div>
        );
      } else if (node._type === "embed") {
        out.push(<div key={`e-${node.url}`}>{components.types.embed({ value: node })}</div>);
      } else if (node._type === "h") {
        const Comp = components.block[`h${node.level}`];
        out.push(<div key={`h-${node.level}`}>{Comp({ children: node.text })}</div>);
      } else if (node._type === "mark") {
        const Comp = components.marks[node.mark];
        out.push(<div key={`m-${node.mark}`}>{Comp({ children: node.text, value: node.value })}</div>);
      }
    }
    return <div>{out}</div>;
  },
}));

describe("BlogPortableText", () => {
  it("renders single product link and multiple product cards", () => {
    render(
      <BlogPortableText
        value={[
          { _type: "productReference", ids: ["p1"] },
          { _type: "productReference", ids: ["a", "b"] },
        ]}
      />,
    );
    // link for single product
    expect(screen.getByRole("link", { name: /ById:p1/ })).toHaveAttribute(
      "href",
      "../product/p1",
    );
    // cards for multiple
    const cards = screen.getAllByTestId("card");
    expect(cards.map((c) => c.textContent)).toEqual(["ById:a", "ById:b"]);
  });

  it("renders embed, headings, and marks", () => {
    render(
      <BlogPortableText
        value={[
          { _type: "embed", url: "https://example.com" },
          { _type: "h", level: 1, text: "H1" },
          { _type: "h", level: 2, text: "H2" },
          { _type: "h", level: 3, text: "H3" },
          { _type: "mark", mark: "link", text: "A", value: { href: "https://x" } },
          { _type: "mark", mark: "em", text: "E" },
        ]}
      />,
    );
    expect(screen.getByText("H1").tagName.toLowerCase()).toBe("h1");
    expect(screen.getByText("H2").tagName.toLowerCase()).toBe("h2");
    expect(screen.getByText("H3").tagName.toLowerCase()).toBe("h3");
    expect(screen.getByRole("link", { name: "A" })).toHaveAttribute("href", "https://x");
    // iframe presence via embed renderer
    expect(document.querySelector("iframe")).toBeTruthy();
  });
});
