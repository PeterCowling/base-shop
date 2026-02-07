import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { devicePresets } from "../../utils/devicePresets";

import DeviceSelector from "./DeviceSelector";

const meta: Meta<typeof DeviceSelector> = {
  title: "Common/DeviceSelector",
  component: DeviceSelector,
};

export default meta;
type Story = StoryObj<typeof DeviceSelector>;

const DeviceSelectorStory = () => {
  const [deviceId, setDeviceId] = useState(devicePresets[0]!.id);
  return (
    <div className="space-y-2">
      <DeviceSelector deviceId={deviceId} onChange={setDeviceId} showLegacyButtons />
      <div className="text-sm text-muted-foreground">Selected: {deviceId}</div>
    </div>
  );
};

export const Default: Story = {
  render: () => <DeviceSelectorStory />,
};
