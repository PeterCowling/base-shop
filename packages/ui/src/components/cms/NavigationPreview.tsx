import React, { forwardRef } from "react";
import type { NavItem } from "./NavigationEditor";
// Use semantic lists to match tests and expected markup
import { useTranslations } from "@acme/i18n";

interface Props {
  items: NavItem[];
  style?: React.CSSProperties;
}

const StyledNav = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ children, ...rest }, ref) => (
    <nav ref={ref} {...rest}>{children}</nav>
  )
);
StyledNav.displayName = "StyledNav";

export default function NavigationPreview({ items, style }: Props) {
  return (
    <StyledNav
      style={style}
      className="bg-surface-2 text-foreground p-4 rounded border border-border-1"
      data-token="--color-bg"
    >
      <ul className="flex gap-4">
        {items.map((item) => (
          <NavItemView key={item.id} item={item} />)
        )}
      </ul>
    </StyledNav>
  );
}

function NavItemView({ item }: { item: NavItem }) {
  const t = useTranslations();
  return (
    <li className="relative group">
      <a href={item.url || "#"} className="font-medium" data-token="--color-fg">
        {item.label || (t("nav.itemFallback") as string)}
      </a>
      {item.children && item.children.length > 0 && (
        <ul
          className="absolute left-0 top-full hidden min-w-[8rem] flex-col rounded-md border border-border-1 bg-surface-2 p-2 shadow-elevation-2 group-hover:flex"
          data-token="--color-bg"
        >
          {item.children.map((child) => (
            <li key={child.id}>
              <a
                href={child.url || "#"}
                className="block px-2 py-1 hover:underline"
                data-token="--color-fg"
              >
                {child.label || (t("nav.itemFallback") as string)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
