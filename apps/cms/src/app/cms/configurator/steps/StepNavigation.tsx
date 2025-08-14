"use client";

import { Button } from "@/components/atoms/shadcn";
import NavigationEditor from "@/components/cms/NavigationEditor";
import NavigationPreview from "@/components/cms/NavigationPreview";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useThemeLoader } from "../hooks/useThemeLoader";

interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

export default function StepNavigation(): React.JSX.Element {
  const { state, update } = useConfigurator();
  const navItems = state.navItems;
  const setNavItems = (items: NavItem[]) => update("navItems", items);
  const themeStyle = useThemeLoader();
  const [, markComplete] = useStepCompletion("navigation");
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Navigation</h2>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">
          <NavigationEditor items={navItems} onChange={setNavItems} />
        </div>
        <div className="flex-1">
          <NavigationPreview items={navItems} style={themeStyle} />
        </div>
      </div>
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
