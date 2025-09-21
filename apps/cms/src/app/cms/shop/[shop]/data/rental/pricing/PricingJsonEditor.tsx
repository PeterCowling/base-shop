import { Button, Textarea } from "@/components/atoms/shadcn";
import { type ChangeEvent } from "react";

interface Props {
  draft: string;
  error: string | null;
  onDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onApply: () => void;
  onReturnToGuided: () => void;
}

export default function PricingJsonEditor({ draft, error, onDraftChange, onApply, onReturnToGuided }: Props) {
  return (
    <div className="space-y-4" role="tabpanel" aria-labelledby="pricing-tab-json">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="pricing-json-editor">
          Pricing JSON configuration
        </label>
        <Textarea
          id="pricing-json-editor"
          value={draft}
          onChange={onDraftChange}
          rows={18}
          className="bg-surface-2 text-foreground"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "pricing-json-error" : undefined}
        />
        <p className="text-xs text-muted-foreground">
          Edit directly to paste pricing from other systems. Validation runs before you return to the guided editor.
        </p>
        {error ? (
          <p id="pricing-json-error" className="text-xs text-danger-foreground">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="h-10 rounded-xl bg-success px-4 text-sm font-semibold text-success-foreground hover:bg-success/90"
          onClick={onApply}
        >
          Apply JSON to form
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-border/30 px-4 text-sm text-foreground hover:bg-surface-3"
          onClick={onReturnToGuided}
        >
          Return to guided editor
        </Button>
      </div>
    </div>
  );
}
