/* eslint-disable ds/no-hardcoded-copy -- PM-0001 internal operator tool, English-only, no DS provider [ttl=2027-12-31] */
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPmSessionFromCookieHeader } from "../../lib/auth/session";

const NAV_LINKS = [
  { href: "/orders", label: "Orders" },
  { href: "/shops", label: "Shops" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reconciliation", label: "Reconciliation" },
  { href: "/webhooks", label: "Webhooks" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session guard — defence-in-depth behind the middleware cookie check.
  const cookieHeader = (await headers()).get("cookie");
  const authenticated = await hasPmSessionFromCookieHeader(cookieHeader);
  if (!authenticated) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh bg-gate-bg text-gate-ink">
      {/* Sidebar nav */}
      <nav className="flex w-48 shrink-0 flex-col border-r border-gate-border bg-gate-surface px-3 py-6">
        <Link
          href="/"
          className="mb-6 text-sm font-semibold text-gate-ink hover:text-gate-accent"
        >
          Payment Manager
        </Link>
        <ul className="space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded px-3 py-2 text-sm text-gate-ink hover:bg-gate-bg hover:text-gate-accent"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Page content */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
