import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Stack } from "@ui/components/atoms/primitives";
import ArtifactsClient from "./ArtifactsClient";
import type { ArtifactsStrings } from "./types";

export default async function ArtifactsPage() {
  const t = await getTranslations("en");
  const strings: ArtifactsStrings = {
    upload: {
      label: t("pipeline.artifacts.upload.label"),
      title: t("pipeline.artifacts.upload.title"),
      candidateLabel: t("pipeline.artifacts.upload.fields.candidate"),
      stageRunLabel: t("pipeline.artifacts.upload.fields.stageRun"),
      kindLabel: t("pipeline.artifacts.upload.fields.kind"),
      fileLabel: t("pipeline.artifacts.upload.fields.file"),
      submitLabel: t("pipeline.artifacts.upload.actions.submit"),
      loadingCandidates: t("pipeline.artifacts.upload.messages.loadingCandidates"),
      loadingRuns: t("pipeline.artifacts.upload.messages.loadingRuns"),
      emptyRuns: t("pipeline.artifacts.upload.messages.emptyRuns"),
      successMessage: t("pipeline.artifacts.upload.messages.success"),
      errorMessage: t("pipeline.artifacts.upload.messages.error"),
    },
    list: {
      label: t("pipeline.artifacts.section.label"),
      title: t("pipeline.artifacts.section.title"),
      empty: t("pipeline.artifacts.messages.empty"),
      loading: t("pipeline.artifacts.messages.loading"),
    },
    fields: {
      candidate: t("pipeline.artifacts.fields.candidate"),
      stage: t("pipeline.artifacts.fields.stage"),
      kind: t("pipeline.artifacts.fields.kind"),
      created: t("pipeline.artifacts.fields.created"),
      uri: t("pipeline.artifacts.fields.uri"),
    },
    actions: {
      open: t("pipeline.artifacts.actions.open"),
      viewCandidate: t("pipeline.artifacts.actions.viewCandidate"),
    },
    notAvailable: t("pipeline.common.notAvailable"),
  };

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.artifacts.badge")}
        title={t("pipeline.artifacts.title")}
        subtitle={t("pipeline.artifacts.subtitle")}
      />
      <ArtifactsClient strings={strings} />
    </Stack>
  );
}
