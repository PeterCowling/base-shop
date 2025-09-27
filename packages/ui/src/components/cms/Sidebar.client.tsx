// packages/ui/components/cms/Sidebar.tsx
"use client";
/* eslint-disable ds/no-hardcoded-copy -- UI-1420: className literals and icon-only elements; user-facing strings wrapped with t() */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";
import { Button, Card, CardContent } from "../atoms/shadcn";
import { Tag } from "../atoms";
import { cn } from "@ui/utils/style";
import { useCmsNavItems } from "./nav/useCmsNavItems";
import { useTranslations } from "@acme/i18n";

interface SidebarProps {
  role?: string;
  pathname?: string;
  onConfiguratorStartNew?: () => void | Promise<void>;
}

function Sidebar({
  role,
  pathname: pathnameProp,
  onConfiguratorStartNew,
}: SidebarProps) {
  const routerPathname = usePathname();
  const t = useTranslations();

  const pathname = useMemo(
    () => pathnameProp ?? routerPathname ?? "",
    [pathnameProp, routerPathname],
  );

  const navItems = useCmsNavItems({ pathname, role });

  const handleConfiguratorClick = () => {
    try {
      const result = onConfiguratorStartNew?.();
      if (result && typeof result.then === "function") {
        result.catch(() => {
          /* swallow reset errors so navigation still continues */
        });
        return;
      }
    } catch {
      /* ignore reset errors */
    }
  };

  return (
    <aside className="flex h-full w-full min-h-0 flex-col gap-6 overflow-y-auto px-5 py-6 text-sm text-foreground">
      <div className="space-y-6">
        <div className="space-y-2">
          <Tag className="uppercase tracking-wide" variant="default">
            {t("Control Center")}
          </Tag>
          <h1 className="text-2xl font-semibold tracking-tight">{t("Base Shop CMS")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("Configure storefronts, orchestrate launches, and monitor activity from one hub.")}
          </p>
        </div>

        <Card className="border-border-1 bg-surface-2 text-foreground shadow-elevation-2">
          <CardContent className="space-y-4 px-4 py-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
              <span>{t("Main navigation")}</span>
              <span>{t("Explore")}</span>
            </div>
            <nav className="space-y-1">
              {navItems.map(({ label, icon, title, fullHref, active, isConfigurator }) => (
                <Link
                  key={fullHref}
                  href={fullHref}
                  aria-current={active ? "page" : undefined}
                  title={title}
                  onClick={isConfigurator ? handleConfiguratorClick : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                    active
                      ? "border border-border-1 bg-surface-3 text-foreground ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-lg transition-colors",
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border-1 bg-surface-2 text-foreground/80 group-hover:border-border-2"
                    )}
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span className="flex-1 font-medium">{label}</span>
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                  )}
                </Link>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Button
          asChild
          variant="outline"
          className="w-full justify-center border-border-2 hover:bg-surface-3"
          onClick={handleConfiguratorClick}
        >
          <Link href="/cms/configurator">{t("Launch Configurator")}</Link>
        </Button>
      </div>

      <div className="mt-auto space-y-3 text-xs text-muted-foreground">
        <Card className="border-border-1 bg-surface-2 shadow-elevation-1">
          <CardContent className="space-y-2 px-4 py-4">
            <h2 className="text-sm font-semibold text-foreground">{t("Need a hand?")}</h2>
            <p>{t("Visit the docs or ping the platform team for support.")}</p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="h-9 flex-1">
                <Link href="/docs">{t("Docs")}</Link>
              </Button>
              <Button asChild variant="outline" className="h-9 flex-1">
                <Link href="/cms/support">{t("Support")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <p>{t("Build version 1.0.0 · Crafted with care for the Base Shop team.")}</p>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
