"use client";

import { Button } from "@/components/atoms/shadcn";
import WizardPreview from "../WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  themeStyle: React.CSSProperties;
}

export default function StepTokens({
  themeStyle,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("tokens");
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customize Tokens</h2>
      <WizardPreview style={themeStyle} />
      <div className="flex justify-end">
        <Button
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </Button>
      </div>
    </div>
  );
}
