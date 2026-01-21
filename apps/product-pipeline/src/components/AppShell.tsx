import Link from "next/link";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { Cluster, Inline, Sidebar, Stack } from "@acme/ui/components/atoms/primitives";

import BuildStamp from "@/components/BuildStamp";
import Container from "@/components/Container";
import NavLink from "@/components/NavLink";
import { NAV_PRIMARY, NAV_SECONDARY } from "@/lib/nav";

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("en");

  return (
    <Stack gap={0} className="pp-shell">
      <header className="border-b border-border-1 bg-surface-1/80 backdrop-blur">
        <Container className="max-w-6xl">
          <Stack
            gap={4}
            className="py-6 md:flex-row md:items-center md:justify-between"
          >
            <Stack gap={2}>
              <Link
                href="/"
                className="inline-flex min-h-12 min-w-12 items-center text-xl font-semibold tracking-tight"
              >
                {t("pipeline.app.title")}
              </Link>
              <Inline gap={3} alignY="center" className="text-xs text-foreground/60">
                <span className="pp-chip">{t("pipeline.shell.phase")}</span>
                <span>{t("pipeline.shell.tagline")}</span>
              </Inline>
            </Stack>
            <Inline gap={3} alignY="center" className="text-xs text-foreground/60">
              <span className="hidden md:inline">
                {t("pipeline.shell.opsConsole")}
              </span>
              <span className="rounded-full border border-border-2 px-3 py-1">
                {t("pipeline.shell.accessKey")}
              </span>
            </Inline>
          </Stack>
        </Container>
        <nav className="border-t border-border-1 bg-surface-2/90 lg:hidden">
          <Container className="max-w-6xl">
            <Inline gap={3} wrap={false} className="overflow-x-auto py-3">
              {NAV_PRIMARY.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={t(item.labelKey)}
                  description={t(item.descriptionKey)}
                  compact
                />
              ))}
            </Inline>
          </Container>
        </nav>
      </header>

      <Container className="max-w-6xl">
        <Sidebar sideWidth="w-56" gap={6} className="py-8 flex-col lg:flex-row">
          <div className="hidden lg:block">
            <Stack gap={6}>
              <Stack gap={3}>
                <span className="text-xs uppercase tracking-widest text-foreground/60">
                  {t("pipeline.shell.nav.primary")}
                </span>
                <Stack gap={3}>
                  {NAV_PRIMARY.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={t(item.labelKey)}
                      description={t(item.descriptionKey)}
                    />
                  ))}
                </Stack>
              </Stack>
              <Stack gap={3}>
                <span className="text-xs uppercase tracking-widest text-foreground/60">
                  {t("pipeline.shell.nav.secondary")}
                </span>
                <Stack gap={3}>
                  {NAV_SECONDARY.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={t(item.labelKey)}
                      description={t(item.descriptionKey)}
                    />
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </div>

          <main className="min-w-0">{children}</main>
        </Sidebar>
      </Container>

      <footer className="border-t border-border-1 bg-surface-1/80">
        <Container className="max-w-6xl">
          <Cluster
            justify="between"
            alignY="center"
            className="py-6 text-xs text-foreground/60"
          >
            <span>{t("pipeline.shell.footer")}</span>
            <BuildStamp />
          </Cluster>
        </Container>
      </footer>
    </Stack>
  );
}
