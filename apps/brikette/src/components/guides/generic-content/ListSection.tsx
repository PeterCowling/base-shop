// apps/brikette/src/components/guides/generic-content/ListSection.tsx
// Reusable component for rendering list-based guide sections (tips, warnings, essentials, costs)

import type { ReactNode } from "react";

import { SectionHeading } from "./SectionHeading";

type ListSectionProps = {
  id: string;
  title: string;
  items: string[];
  renderItem: (item: string, index: number) => ReactNode;
};

export function ListSection({ id, title, items, renderItem }: ListSectionProps): JSX.Element {
  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <SectionHeading>{title}</SectionHeading>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index}>{renderItem(item, index)}</li>
        ))}
      </ul>
    </section>
  );
}
