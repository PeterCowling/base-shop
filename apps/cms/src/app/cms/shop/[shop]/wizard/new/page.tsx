"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";
import SpecForm from "./components/SpecForm";
import PreviewPane from "./components/PreviewPane";
import { createDraft, finalize } from "./actions";

export default function NewWizardPage() {
  const params = useParams<{ shop: string }>();
  const shop = params.shop;
  const [spec, setSpec] = useState<ScaffoldSpec | null>(null);
  const [draftId, setDraftId] = useState<string>("");

  const handleNext = useCallback(
    async (s: ScaffoldSpec) => {
      const draft = await createDraft(shop, s);
      setSpec(s);
      setDraftId(draft.id);
    },
    [shop]
  );

  const handleBack = useCallback(() => setSpec(null), []);
  const handleConfirm = useCallback(() => finalize(shop, draftId), [shop, draftId]);

  if (!spec) {
    return <SpecForm onNext={handleNext} />;
  }

  return <PreviewPane spec={spec} onBack={handleBack} onConfirm={handleConfirm} />;
}
