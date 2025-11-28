// packages/ui/src/components/account/AccountNavigation.tsx
import Link from "next/link";
import { cn } from "../../utils/style";
import { ACCOUNT_NAV_TEST_ID } from "./constants";

export interface AccountNavigationItem {
  href: string;
  label: string;
}

export interface AccountNavigationProps {
  items: AccountNavigationItem[];
  currentPath: string;
  ariaLabel: string;
}

export default function AccountNavigation({
  items,
  currentPath,
  ariaLabel,
}: AccountNavigationProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="w-full md:w-64"
      data-testid={ACCOUNT_NAV_TEST_ID}
    >
      <ul className="space-y-2 rounded border p-3">
        {items.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={currentPath === href ? "page" : undefined}
              className={cn(
                "block",
                "rounded",
                "px-3",
                "py-2",
                "transition",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-ring",
                "focus-visible:ring-offset-2",
                "focus-visible:ring-offset-background",
                currentPath === href ? ["bg-muted", "font-medium"] : "hover:bg-muted/60",
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
