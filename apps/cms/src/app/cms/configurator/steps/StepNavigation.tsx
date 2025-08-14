"use client";

import { Button } from "@/components/atoms/shadcn";
import NavigationEditor from "@/components/cms/NavigationEditor";
import NavigationPreview from "@/components/cms/NavigationPreview";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useThemeLoader } from "../hooks/useThemeLoader";
import { devicePresets, type DevicePreset } from "@ui/utils/devicePresets";
import { useState, useMemo } from "react";
import DeviceSelector from "@ui/components/cms/DeviceSelector";

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
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const device = useMemo<DevicePreset>(() => {
    const preset =
      devicePresets.find((d) => d.id === deviceId) ?? devicePresets[0];
    return orientation === "portrait"
      ? { ...preset, orientation }
      : {
          ...preset,
          width: preset.height,
          height: preset.width,
          orientation,
        };
  }, [deviceId, orientation]);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Navigation</h2>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">
          <NavigationEditor items={navItems} onChange={setNavItems} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-end">
            <DeviceSelector
              deviceId={deviceId}
              orientation={orientation}
              setDeviceId={(id) => {
                setDeviceId(id);
                setOrientation("portrait");
              }}
              toggleOrientation={() =>
                setOrientation((o) =>
                  o === "portrait" ? "landscape" : "portrait"
                )
              }
            />
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
