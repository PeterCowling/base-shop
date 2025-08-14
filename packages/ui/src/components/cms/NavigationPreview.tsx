import React from "react";
import type { NavItem } from "./NavigationEditor";

interface Props {
  items: NavItem[];
  style?: React.CSSProperties;
}

export default function NavigationPreview({ items, style }: Props) {
  return (
    <nav style={style} className="bg-background text-foreground p-4 rounded border" data-token="--color-bg">
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
          className="absolute left-0 top-full hidden min-w-[8rem] flex-col rounded-md border bg-background p-2 shadow-md group-hover:flex"
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

