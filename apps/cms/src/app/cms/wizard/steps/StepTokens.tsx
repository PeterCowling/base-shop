"use client";

import { Button } from "@/components/atoms/shadcn";
import WizardPreview from "../WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";

interface Props {
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepTokens({
  themeStyle,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("tokens");
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
            markComplete(true);
            onNext();
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
