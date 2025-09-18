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
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <SegmentPreviewPanel data={preview} />
      <SegmentSummaryCard
        data={preview}
        statusLabel={status === "success" ? "Ready" : "Draft"}
        actions={
          <Button variant="outline" onClick={onEditRules}>
            Edit rules
          </Button>
        }
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onEditDetails}>
              Update details
            </Button>
            <Button onClick={onFinish} disabled={status === "submitting"}>
              {status === "submitting" ? "Saving…" : finishLabel}
            </Button>
          </div>
        }
      />
    </div>
  );
}
