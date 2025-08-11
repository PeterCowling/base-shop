"use client";

import { Button } from "@/components/atoms/shadcn";
import WizardPreview from "../WizardPreview";

interface Props {
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
  markStepComplete: (stepId: string, status: boolean) => void;
}

export default function StepTokens({
  themeStyle,
  onBack,
  onNext,
  markStepComplete,
}: Props): React.JSX.Element {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customize Tokens</h2>
      <WizardPreview style={themeStyle} />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => {
            markStepComplete("tokens", true);
            onNext();
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
