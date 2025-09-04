import React from "react";

export interface ProductListTemplateProps {
  /** Section heading */
  heading: string;
  /** Products to render in an unordered list */
  products: Array<{ id: string; name: string }>;
}

/**
 * Renders a basic list of products with a heading.
 */
export function ProductListTemplate({ heading, products }: ProductListTemplateProps) {
  return (
    <section>
      <h2>{heading}</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </section>
  );
}
