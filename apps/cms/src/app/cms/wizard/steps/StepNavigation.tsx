"use client";

import { Button } from "@/components/atoms/shadcn";
import NavigationEditor from "@/components/cms/NavigationEditor";
import useStepCompletion from "../hooks/useStepCompletion";

interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

interface Props {
  navItems: NavItem[];
  setNavItems: (v: NavItem[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepNavigation({
  navItems,
  setNavItems,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("navigation");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Navigation</h2>
      <NavigationEditor items={navItems} onChange={setNavItems} />
      <div className="flex justify-between gap-2">
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
