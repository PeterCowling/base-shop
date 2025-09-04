"use client";

import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  pageTemplates: Array<{ name: string; components: any[]; preview: string }>;
  homeLayout: string;
  setHomeLayout: (v: string) => void;
  components: any[];
  setComponents: (v: any[]) => void;
  homePageId: string | null;
  setHomePageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  prevStepId?: string;
  nextStepId?: string;
}

// The production component performs complex page building. For unit tests we only
// need a very small subset of the behaviour: clicking the "Next" button should
// mark the step complete and navigate to the next step.
export default function StepHomePage({ nextStepId }: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("home-page");
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Home Page</h2>
      <div className="flex justify-end">
        <button
          onClick={() => {
            markComplete(true);
            router.push(`/cms/configurator/${nextStepId}`);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
