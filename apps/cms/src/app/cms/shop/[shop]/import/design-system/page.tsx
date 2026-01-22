"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { Progress } from "@acme/design-system/atoms";
import { Button, Card, CardContent } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import { track } from "@acme/telemetry";

export default function DesignSystemImportPage() {
  const params = useParams<{ shop: string }>();
  const shop = params?.shop ?? "shop";
  const router = useRouter();

  useEffect(() => {
    track("designsystem:import:view", { shop });
  }, [shop]);

  const t = useTranslations();
  // Non-user-facing class token extracted to avoid i18n lint false positive
  const progressLabelClass = "text-hero-foreground/80";

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
      <Card className="overflow-hidden bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <CardContent className="space-y-6 p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-hero-foreground/80">
              {t("cms.theme.importDesignSystem")}
            </p>
            <h2 className="text-3xl font-bold">{t("cms.theme.importOnboarding.title")}</h2>
            <p className="text-hero-foreground/80">{t("cms.theme.importDesc")}</p>
            <p className="text-hero-foreground/80">{t("cms.theme.importOnboarding.intro")}</p>
          </div>
          <Progress
            value={33}
            label={t("cms.theme.importOnboarding.progressLabel")}
            labelClassName={progressLabelClass}
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStartImport}>{t("cms.theme.importOnboarding.begin")}</Button>
            <Button
              variant="outline"
              className="border-primary/40 bg-surface-2 text-foreground hover:bg-primary/10"
              onClick={handleNavigateLibrary}
            >
              {t("cms.theme.importOnboarding.exploreLibrary")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cms.theme.importOnboarding.roadmapTag")}
              </p>
              <h3 className="text-lg font-semibold">{t("cms.theme.importOnboarding.roadmapHeading")}</h3>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1.</span> {t("cms.theme.importOnboarding.roadmap.step1")}
              </li>
              <li>
                <span className="font-medium text-foreground">2.</span> {t("cms.theme.importOnboarding.roadmap.step2")}
              </li>
              <li>
                <span className="font-medium text-foreground">3.</span> {t("cms.theme.importOnboarding.roadmap.step3")}
              </li>
            </ol>
            <Progress value={33} label={t("cms.theme.importOnboarding.currentStep")} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cms.theme.importOnboarding.resourcesTag")}
              </p>
              <h3 className="text-lg font-semibold">{t("cms.theme.importOnboarding.resourcesHeading")}</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="/docs/design-system-package-import"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline min-h-11 min-w-11 inline-flex items-center"
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
                  className="text-link hover:underline min-h-11 min-w-11 inline-flex items-center"
                  onClick={() => handleDocClick("lifecycle")}
                >
                  {t("cms.theme.libraryTips")}
                </a>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              {t("cms.and")} {t("cms.theme.importOnboarding.resources.more")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cms.theme.importOnboarding.teamTag")}
              </p>
              <h3 className="text-lg font-semibold">{t("cms.theme.importOnboarding.teamHeading")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("cms.theme.importOnboarding.teamDesc")}</p>
            <Button variant="ghost" onClick={handleNavigateSettings}>
              {t("cms.theme.importOnboarding.manageAccess")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
