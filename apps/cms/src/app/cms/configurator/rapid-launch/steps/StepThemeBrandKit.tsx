"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Alert, Tag } from "@acme/design-system/atoms";
import { Grid, Inline } from "@acme/design-system/primitives";
import { Button } from "@acme/design-system/shadcn";
import { cn } from "@acme/design-system/utils/style";
import { useTranslations } from "@acme/i18n";
import type { ThemeRegistryEntry } from "@acme/types";
import { useMediaUpload } from "@acme/ui/hooks/useMediaUpload";

import type { ConfiguratorState } from "../../../wizard/schema";
import { useConfigurator } from "../../ConfiguratorContext";
import useStepCompletion from "../../hooks/useStepCompletion";
import { useThemeLoader } from "../../hooks/useThemeLoader";
import ColorThemeSelector from "../../steps/ColorThemeSelector";
import { useRapidLaunchDefaultsContext } from "../RapidLaunchDefaultsContext";
import type { RapidLaunchStepProps } from "../types";

type LogoRecord = Record<string, string>;

function normalizeLogo(logo: ConfiguratorState["logo"]): LogoRecord {
  if (typeof logo === "string") {
    return logo ? { "desktop-landscape": logo } : {};
  }
  return { ...(logo ?? {}) };
}

function ThemeCard({
  theme,
  selected,
  onSelect,
  selectedLabel,
  selectLabel,
}: {
  theme: ThemeRegistryEntry;
  selected: boolean;
  onSelect: (id: string) => void;
  selectedLabel: string;
  selectLabel: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
      )}
      onClick={() => onSelect(theme.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{theme.name}</div>
          {theme.description && (
            <p className="text-xs text-muted-foreground">{theme.description}</p>
          )}
        </div>
        {selected ? (
          <Tag variant="success">{selectedLabel}</Tag>
        ) : (
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            {selectLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-full border"
          style={{ backgroundColor: theme.brandColor }}
          aria-hidden
        />
        {theme.previewUrl ? (
          <Image
            src={theme.previewUrl}
            alt={theme.name}
            width={160}
            height={90}
            className="h-12 w-auto rounded border object-cover"
          />
        ) : (
          <div className="h-12 w-24 rounded border bg-muted/40" />
        )}
      </div>
    </button>
  );
}

function BrandAssetUploader({
  label,
  description,
  value,
  shopId,
  requiredOrientation,
  onUploaded,
}: {
  label: string;
  description?: string;
  value?: string;
  shopId: string;
  requiredOrientation: "portrait" | "landscape";
  onUploaded: (url: string) => void;
}) {
  const t = useTranslations();
  const upload = useMediaUpload({
    shop: shopId,
    requiredOrientation,
    onUploaded: (item) => onUploaded(item.url),
  });

  return (
    <div className="space-y-2 rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {value ? (
          <Tag variant="success">{t("cms.rapidLaunch.brandKit.status.ready")}</Tag>
        ) : (
          <Tag variant="default">{t("cms.rapidLaunch.brandKit.status.missing")}</Tag>
        )}
      </div>
      {value ? (
        <Image
          src={value}
          alt={label}
          width={240}
          height={140}
          className="h-24 w-auto rounded border object-contain bg-white"
        />
      ) : (
        <div className="h-24 rounded border border-dashed bg-muted/40" />
      )}
      {shopId ? (
        <div className="space-y-2">
          {upload.uploader}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={upload.handleUpload}
              disabled={!upload.pendingFile || upload.isValid === false || upload.isUploading}
            >
              {upload.isUploading ? t("upload.uploading") : t("cms.image.upload")}
            </Button>
            {upload.pendingFile && (
              <span className="text-xs text-muted-foreground">
                {upload.pendingFile.name}
              </span>
            )}
          </div>
          {upload.error && (
            <p className="text-xs text-danger-foreground">{upload.error}</p>
          )}
        </div>
      ) : (
        <Alert variant="warning" tone="soft" heading={t("cms.rapidLaunch.brandKit.shopIdRequired") as string} />
      )}
    </div>
  );
}

export default function StepThemeBrandKit({
  prevStepId,
  nextStepId,
}: RapidLaunchStepProps): React.JSX.Element {
  const t = useTranslations();
  const router = useRouter();
  const { state, update, setThemeOverrides } = useConfigurator();
  const { data, loading, error } = useRapidLaunchDefaultsContext();
  const [, markComplete] = useStepCompletion("theme-brand");

  useThemeLoader();

  const logoRecord = normalizeLogo(state.logo);
  const primaryLogo = logoRecord["desktop-landscape"] || Object.values(logoRecord)[0];

  const themeOptions = data?.options.themes ?? [];
  const selectedTheme = state.theme;

  const themeTokens = useMemo(
    () => ({
      ...(state.themeDefaults ?? {}),
      ...(state.themeOverrides ?? {}),
    }),
    [state.themeDefaults, state.themeOverrides]
  );

  const handleThemeSelect = (id: string) => {
    if (id === selectedTheme) return;
    update("theme", id);
    setThemeOverrides({});
  };

  const canContinue =
    Boolean(state.theme) &&
    Boolean(primaryLogo) &&
    Boolean(state.favicon) &&
    Boolean(state.socialImage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {t("cms.rapidLaunch.brandKit.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("cms.rapidLaunch.brandKit.subheading")}
        </p>
      </div>

      {error && (
        <Alert variant="warning" tone="soft" heading={error} />
      )}

      <section className="space-y-3">
        <Inline alignY="center" gap={3} className="justify-between">
          <h3 className="text-sm font-semibold">
            {t("cms.rapidLaunch.brandKit.theme.heading")}
          </h3>
          {loading && (
            <span className="text-xs text-muted-foreground">
              {t("cms.rapidLaunch.brandKit.theme.loading")}
            </span>
          )}
        </Inline>
        <Grid cols={1} gap={3} className="md:grid-cols-2">
          {themeOptions.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={theme.id === selectedTheme}
              onSelect={handleThemeSelect}
              selectedLabel={t("cms.rapidLaunch.common.selected") as string}
              selectLabel={t("cms.rapidLaunch.common.select") as string}
            />
          ))}
        </Grid>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          {t("cms.rapidLaunch.brandKit.color.heading")}
        </h3>
        <ColorThemeSelector
          tokens={themeTokens}
          baseTokens={state.themeDefaults ?? {}}
          onChange={(next) => setThemeOverrides(next as Record<string, string>)}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          {t("cms.rapidLaunch.brandKit.assets.heading")}
        </h3>
        <Grid cols={1} gap={4} className="lg:grid-cols-3">
          <BrandAssetUploader
            label={t("cms.rapidLaunch.brandKit.assets.logo.label")}
            description={t("cms.rapidLaunch.brandKit.assets.logo.help") as string}
            value={primaryLogo}
            shopId={state.shopId}
            requiredOrientation="landscape"
            onUploaded={(url) =>
              update("logo", { ...logoRecord, "desktop-landscape": url })
            }
          />
          <BrandAssetUploader
            label={t("cms.rapidLaunch.brandKit.assets.favicon.label")}
            description={t("cms.rapidLaunch.brandKit.assets.favicon.help") as string}
            value={state.favicon}
            shopId={state.shopId}
            requiredOrientation="landscape"
            onUploaded={(url) => update("favicon", url)}
          />
          <BrandAssetUploader
            label={t("cms.rapidLaunch.brandKit.assets.social.label")}
            description={t("cms.rapidLaunch.brandKit.assets.social.help") as string}
            value={state.socialImage}
            shopId={state.shopId}
            requiredOrientation="landscape"
            onUploaded={(url) => update("socialImage", url)}
          />
        </Grid>
      </section>

      <section className="rounded-2xl border bg-muted/30 p-4">
        <div className="text-sm font-semibold">
          {t("cms.rapidLaunch.brandKit.preview.heading")}
        </div>
        <div
          className="mt-3 rounded-xl border p-4"
          style={themeTokens as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {primaryLogo ? (
                <Image
                  src={primaryLogo}
                  alt={t("cms.rapidLaunch.brandKit.assets.logo.label") as string}
                  width={80}
                  height={32}
                  className="h-8 w-auto rounded"
                />
              ) : (
                <div className="h-8 w-20 rounded bg-muted/40" />
              )}
              <div>
                <div className="text-sm font-semibold">{state.storeName || t("cms.rapidLaunch.brandKit.preview.shopName")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("cms.rapidLaunch.brandKit.preview.tagline")}
                </div>
              </div>
            </div>
            <Button size="sm" className="h-8 px-3">
              {t("cms.rapidLaunch.brandKit.preview.cta")}
            </Button>
          </div>
        </div>
      </section>

      <Inline gap={3} className="justify-between">
        {prevStepId ? (
          <Button variant="outline" onClick={() => router.push(`/cms/configurator/rapid-launch/${prevStepId}`)}>
            {t("wizard.back")}
          </Button>
        ) : (
          <span />
        )}
        {nextStepId && (
          <Button
            onClick={() => {
              markComplete(true);
              router.push(`/cms/configurator/rapid-launch/${nextStepId}`);
            }}
            disabled={!canContinue}
          >
            {t("wizard.next")}
          </Button>
        )}
      </Inline>
    </div>
  );
}
