import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { Stack } from "@acme/design-system/primitives";

import PageHeader from "@/components/PageHeader";

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
    stageLabels: {
      P: t("pipeline.home.stageRail.stage.preSelection"),
      M: t("pipeline.candidate.section.stageM.label"),
      A: t("pipeline.candidate.section.stageA.label"),
      T: t("pipeline.candidate.section.stageT.label"),
      S: t("pipeline.candidate.section.stageS.label"),
      N: t("pipeline.candidate.section.stageN.label"),
      D: t("pipeline.candidate.section.stageD.label"),
      B: t("pipeline.candidate.section.stageB.label"),
      C: t("pipeline.candidate.section.stageC.label"),
      K: t("pipeline.candidate.section.stageK.label"),
      R: t("pipeline.candidate.section.stageR.label"),
      L: t("pipeline.nav.launches.label"),
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
