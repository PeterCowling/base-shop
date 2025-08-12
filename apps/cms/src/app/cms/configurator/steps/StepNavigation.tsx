"use client";

import { Button } from "@/components/atoms/shadcn";
import NavigationEditor from "@/components/cms/NavigationEditor";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

interface Props {
  navItems: NavItem[];
  setNavItems: (v: NavItem[]) => void;
}

export default function StepNavigation({
  navItems,
  setNavItems,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("navigation");
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Navigation</h2>
      <NavigationEditor items={navItems} onChange={setNavItems} />
      <div className="flex justify-end gap-2">
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
