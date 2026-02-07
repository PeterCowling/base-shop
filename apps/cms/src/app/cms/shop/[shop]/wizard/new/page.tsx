"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";

import { useTranslations } from "@acme/i18n";
import { track } from "@acme/telemetry";
import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";

import { createDraft, finalize } from "./actions";
import PreviewPane from "./components/PreviewPane";
import SpecForm from "./components/SpecForm";

export default function NewWizardPage() {
  const params = useParams<{ shop: string }>();
  const shop = params.shop;
  const [spec, setSpec] = useState<ScaffoldSpec | null>(null);
  const [draftId, setDraftId] = useState<string>("");
  const t = useTranslations();

  const handleNext = useCallback(
    async (s: ScaffoldSpec) => {
      const draft = await createDraft({ shop, spec: s });
      track("wizard:createDraft", { shop });
      setSpec(s);
      setDraftId(draft.id);
    },
    [shop]
  );

  const handleBack = useCallback(() => setSpec(null), []);
  const handleConfirm = useCallback(() => {
    track("wizard:finalize", { shop });
    return finalize({ shop, draftId });
  }, [shop, draftId]);

  if (!spec) {
    return (
      <>
        <h1 className="sr-only">{t("wizard.spec.title")}</h1>
        <SpecForm onNext={handleNext} />
      </>
    );
  }

  return (
    <>
      <h1 className="sr-only">{t("wizard.preview.title")}</h1>
      <PreviewPane spec={spec} onBack={handleBack} onConfirm={handleConfirm} />
    </>
  );
}
