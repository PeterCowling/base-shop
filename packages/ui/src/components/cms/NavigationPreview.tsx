import React, { forwardRef } from "react";
import type { NavItem } from "./NavigationEditor";
// Use semantic lists to match tests and expected markup
import { useTranslations } from "@acme/i18n";
import { Inline, Stack } from "../atoms/primitives";

interface Props {
  items: NavItem[];
  style?: React.CSSProperties;
}

const StyledNav = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ children, ...rest }, ref) => (
    <nav ref={ref} {...rest}>
      {children}
    </nav>
  ),
);
StyledNav.displayName = "StyledNav";

export default function NavigationPreview({ items, style }: Props) {
  return (
    <StyledNav
      style={style}
      className="bg-surface-2 text-foreground p-4 rounded border border-border-1"
      data-token="--color-bg"
    >
      <Inline asChild gap={4} wrap={false} className="m-0 list-none p-0">
        <ul>
          {items.map((item) => (
            <NavItemView key={item.id} item={item} />
          ))}
        </ul>
      </Inline>
    </StyledNav>
  );
}

function NavItemView({ item }: { item: NavItem }) {
  const t = useTranslations();
  return (
    <li className="relative group">
      <a
        href={item.url || "#"}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        data-token="--color-fg"
      >
        {item.label || (t("nav.itemFallback") as string)}
      </a>
      {item.children && item.children.length > 0 && (
        <Stack
          asChild
          gap={1}
          className="absolute top-full start-0 min-w-32 rounded-md border border-border-1 bg-surface-2 p-2 shadow-elevation-2 opacity-0 transition-opacity duration-150 ease-out pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100"
          data-token="--color-bg"
        >
          <ul className="m-0 list-none p-0">
            {item.children.map((child) => (
              <li key={child.id}>
                <a
                  href={child.url || "#"}
                  className="inline-flex min-h-10 min-w-10 items-center rounded px-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  data-token="--color-fg"
                >
                  {child.label || (t("nav.itemFallback") as string)}
                </a>
              </li>
            ))}
          </ul>
        </Stack>
      )}
    </li>
  );
}
