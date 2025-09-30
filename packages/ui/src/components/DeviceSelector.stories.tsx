import type { Meta, StoryObj } from '@storybook/react';
import DeviceSelector from './DeviceSelector';
import { useState } from 'react';
import { getLegacyPreset } from '../utils/devicePresets';

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

const meta = {
  component: DeviceSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'UI control to pick a device preset (desktop/tablet/mobile or full list). Emits a preset id; consumer applies sizing.',
      },
    },
  },
} satisfies Meta<typeof DeviceSelector>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = { render: () => <Harness /> } satisfies Story;

