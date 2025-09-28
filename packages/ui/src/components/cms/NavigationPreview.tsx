import React, { forwardRef } from "react";
import type { NavItem } from "./NavigationEditor";
import { Inline } from "../atoms/primitives/Inline";
import { Stack } from "../atoms/primitives/Stack";
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
    <StyledNav style={style} className="bg-surface-2 text-foreground p-4 rounded border border-border-1" data-token="--color-bg">
      <Inline gap={4} role="list">
        {items.map((item) => (
          <NavItemView key={item.id} item={item} />
        ))}
      </Inline>
    </StyledNav>
  );
}

function NavItemView({ item }: { item: NavItem }) {
  const t = useTranslations();
  return (
    <div className="relative group" role="listitem">
      <a
        href={item.url || "#"}
        className="font-medium inline-block min-h-10 min-w-10"
        data-token="--color-fg"
      >
        {item.label || (t("nav.itemFallback") as string)}
      </a>
      {item.children && item.children.length > 0 && (
        <div className="absolute start-0 top-full hidden min-w-32 rounded-md border border-border-1 bg-surface-2 p-2 shadow-elevation-2 group-hover:block" data-token="--color-bg">
          <Stack gap={1}>
            {item.children.map((child) => (
              <div key={child.id}>
                <a
                  href={child.url || "#"}
                  className="block px-2 py-1 hover:underline min-h-10 min-w-10"
                  data-token="--color-fg"
                >
                  {child.label || (t("nav.itemFallback") as string)}
                </a>
              </div>
            ))}
          </Stack>
        </div>
      )}
    </div>
  );
}
