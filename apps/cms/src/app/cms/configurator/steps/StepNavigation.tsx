"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import NavigationEditor from "@/components/cms/NavigationEditor";
import NavigationPreview from "@/components/cms/NavigationPreview";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useThemeLoader } from "../hooks/useThemeLoader";
import { devicePresets } from "@ui/utils/devicePresets";
import { useState, useMemo } from "react";

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
  const [deviceId, setDeviceId] = useState(devicePresets[0].id);
  const device = useMemo(() => {
    return devicePresets.find((d) => d.id === deviceId) ?? devicePresets[0];
  }, [deviceId]);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Navigation</h2>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">
          <NavigationEditor items={navItems} onChange={setNavItems} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-end">
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger aria-label="Device" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {devicePresets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div
            className="mx-auto"
            style={{ width: device.width, height: device.height }}
          >
            <NavigationPreview items={navItems} style={themeStyle} />
          </div>
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
