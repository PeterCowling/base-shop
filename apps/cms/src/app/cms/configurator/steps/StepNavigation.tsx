"use client";

import NavigationEditor from "@/components/cms/NavigationEditor";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { StepControls } from "../steps";

interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

interface Props {
  previousStepId?: string;
  nextStepId?: string;
}

export default function StepNavigation({
  previousStepId,
  nextStepId,
}: Props): React.JSX.Element {
  const { state, update } = useConfigurator();
  const navItems = state.navItems;
  const setNavItems = (items: NavItem[]) => update("navItems", items);
  const [, markComplete] = useStepCompletion("navigation");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Navigation</h2>
      <NavigationEditor items={navItems} onChange={setNavItems} />
      <StepControls
        prev={previousStepId}
        next={nextStepId}
        onNext={() => markComplete(true)}
      />
    </div>
  );
}
