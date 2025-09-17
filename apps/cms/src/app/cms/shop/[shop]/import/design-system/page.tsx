"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { track } from "@acme/telemetry";
import { useTranslations } from "@acme/i18n";
import { Button, Card, CardContent, Progress } from "@ui/components/atoms";

export default function DesignSystemImportPage() {
  const params = useParams<{ shop: string }>();
  const shop = params?.shop ?? "shop";
  const router = useRouter();

  useEffect(() => {
    track("designsystem:import:view", { shop });
  }, [shop]);

  const t = useTranslations();

  const handleStartImport = () => {
    track("designsystem:import:start", { shop });
    router.push(`/cms/shop/${shop}/wizard`);
  };

  const handleNavigateLibrary = () => {
    track("designsystem:import:navigate-library", { shop });
    router.push(`/cms/shop/${shop}/themes`);
  };

  const handleNavigateSettings = () => {
    track("designsystem:import:navigate-settings", { shop });
    router.push(`/cms/shop/${shop}/settings`);
  };

  const handleDocClick = (target: "package" | "lifecycle") => {
    track("designsystem:import:doc", { shop, target });
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white shadow-xl">
        <CardContent className="space-y-6 p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              {t("cms.theme.importDesignSystem")}
            </p>
            <h2 className="text-3xl font-bold">Design system onboarding</h2>
            <p className="text-white/80">{t("cms.theme.importDesc")}</p>
            <p className="text-white/70">
              Follow the guided steps to bring your brand tokens and UI kit into Base-Shop. We’ll
              save your progress so you can pause and resume whenever you’re ready.
            </p>
          </div>
          <Progress
            value={33}
            label="Step 1 of 3 · Package preparation"
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStartImport}>Begin guided import</Button>
            <Button
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={handleNavigateLibrary}
            >
              Explore theme library
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step-by-step roadmap
              </p>
              <h3 className="text-lg font-semibold">How the import works</h3>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1.</span> Export your tokens and
                components from your design tool.
              </li>
              <li>
                <span className="font-medium text-foreground">2.</span> Upload the package and map
                tokens to Base-Shop variables.
              </li>
              <li>
                <span className="font-medium text-foreground">3.</span> Preview updates and publish
                to your live theme.
              </li>
            </ol>
            <Progress value={33} label="Currently on Step 1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resources
              </p>
              <h3 className="text-lg font-semibold">Need a refresher?</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="/docs/design-system-package-import"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={() => handleDocClick("package")}
                >
                  {t("cms.theme.packageGuide")}
                </a>
              </li>
              <li>
                <a
                  href="/docs/theme-lifecycle-and-library"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={() => handleDocClick("lifecycle")}
                >
                  {t("cms.theme.libraryTips")}
                </a>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              {t("cms.and")} explore updated workflows, asset management tips, and rollout
              checklists.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Team alignment
              </p>
              <h3 className="text-lg font-semibold">Invite collaborators</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Loop in the rest of your brand studio to coordinate approvals, asset uploads, and QA
              checks before launch.
            </p>
            <Button variant="ghost" onClick={handleNavigateSettings}>
              Manage team access
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
