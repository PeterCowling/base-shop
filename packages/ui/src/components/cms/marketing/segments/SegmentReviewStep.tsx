import { useTranslations } from "@acme/i18n";

import { Button } from "../../../atoms/shadcn";
import type { SubmissionStatus } from "../shared";

import SegmentPreviewPanel from "./SegmentPreviewPanel";
import SegmentSummaryCard from "./SegmentSummaryCard";
import type { SegmentPreviewData } from "./types";

interface SegmentReviewStepProps {
  preview: SegmentPreviewData;
  status: SubmissionStatus;
  finishLabel: string;
  onEditRules: () => void;
  onEditDetails: () => void;
  onFinish: () => void;
}

export function SegmentReviewStep({
  preview,
  status,
  finishLabel,
  onEditRules,
  onEditDetails,
  onFinish,
}: SegmentReviewStepProps) {
  const t = useTranslations();
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <SegmentPreviewPanel data={preview} />
      </div>
      <SegmentSummaryCard
        data={preview}
        statusLabel={status === "success" ? (t("Ready") as string) : (t("Draft") as string)}
        actions={
          <Button variant="outline" onClick={onEditRules}>
            {t("Edit rules")}
          </Button>
        }
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onEditDetails}>
              {t("Update details")}
            </Button>
            <Button onClick={onFinish} disabled={status === "submitting"}>
              {status === "submitting" ? t("Saving…") : finishLabel}
            </Button>
          </div>
        }
      />
    </div>
  );
}
