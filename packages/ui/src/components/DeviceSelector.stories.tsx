import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';

import { getLegacyPreset } from '@acme/ui/utils/devicePresets';

import DeviceSelector from './DeviceSelector';

function Harness() {
  const [deviceId, setDeviceId] = useState(getLegacyPreset('desktop').id);
  return (
    <div className="space-y-4">
      <DeviceSelector deviceId={deviceId} setDeviceId={setDeviceId} />
      <div>Selected: <code>{deviceId}</code></div>
      <div className="border rounded p-4">Preview area sized per preset is handled by the consumer.</div>
    </div>
  );
}

const meta: Meta<typeof DeviceSelector> = {
  title: 'Utilities/DeviceSelector',
  component: DeviceSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'UI control to pick a device preset (desktop/tablet/mobile or full list). Emits a preset id; consumer applies sizing.',
      },
    },
  },
};
export default meta;

export const Default: StoryObj<typeof DeviceSelector> = { render: () => <Harness /> };

