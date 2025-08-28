"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";
import SpecForm from "./components/SpecForm";
import PreviewPane from "./components/PreviewPane";
import { createDraft, finalize } from "./actions";
import { useTranslations } from "@acme/i18n";

export default function NewWizardPage() {
  const t = useTranslations();
  const params = useParams<{ shop: string }>();
  const shop = params.shop;
  const [spec, setSpec] = useState<ScaffoldSpec | null>(null);
  const [draftId, setDraftId] = useState<string>("");
  const [status, setStatus] = useState("");

  const handleNext = useCallback(
    async (s: ScaffoldSpec) => {
      const draft = await createDraft(shop, s);
      setSpec(s);
      setDraftId(draft.id);
      setStatus(t("wizard.status.previewReady"));
      },
      [shop, t]
    );

  const handleBack = useCallback(() => {
    setSpec(null);
    setStatus(t("wizard.status.editing"));
  }, [t]);
  const handleConfirm = useCallback(() => finalize(shop, draftId), [shop, draftId]);

  if (!spec) {
    return (
      <>
        <p aria-live="polite" className="sr-only">
          {status}
        </p>
        <SpecForm onNext={handleNext} />
      </>
    );
  }

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {status}
      </p>
      <PreviewPane spec={spec} onBack={handleBack} onConfirm={handleConfirm} />
    </>
  );
}
