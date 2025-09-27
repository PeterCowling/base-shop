import React from "react";
import type { NavItem } from "./NavigationEditor";

interface Props {
  items: NavItem[];
  style?: React.CSSProperties;
}

export default function NavigationPreview({ items, style }: Props) {
  return (
    <nav style={style} className="bg-surface-2 text-foreground p-4 rounded border border-border-1" data-token="--color-bg">
      <ul className="flex gap-4">
        {items.map((item) => (
          <NavItemView key={item.id} item={item} />
        ))}
      </ul>
    </nav>
  );
}

function NavItemView({ item }: { item: NavItem }) {
  return (
    <li className="relative group">
      <a
        href={item.url || "#"}
        className="font-medium"
        data-token="--color-fg"
      >
        {item.label || "Item"}
      </a>
      {item.children && item.children.length > 0 && (
        <ul
          className="absolute start-0 top-full hidden min-w-32 flex-col rounded-md border border-border-1 bg-surface-2 p-2 shadow-elevation-2 group-hover:flex"
          data-token="--color-bg"
        >
          {item.children.map((child) => (
            <li key={child.id}>
              <a
                href={child.url || "#"}
                className="block px-2 py-1 hover:underline"
                data-token="--color-fg"
              >
                {child.label || "Item"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
