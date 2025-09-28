import type { Meta, StoryObj } from '@storybook/react';
import ExperimentGate from './ExperimentGate';
import { useState } from 'react';

function Harness() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled
      </label>
      <ExperimentGate enabled={enabled} fallback={<div className="rounded border p-2">Fallback content (off)</div>}>
        <div className="rounded border p-2">Gated content (on)</div>
      </ExperimentGate>
    </div>
  );
}

const meta: Meta<typeof ExperimentGate> = {
  component: ExperimentGate,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Minimal experiment/feature gate. This story toggles the `enabled` prop; URL and localStorage overrides also work when a `flag` is provided.',
      },
    },
  },
};
export default meta;

export const Default: StoryObj<typeof ExperimentGate> = { render: () => <Harness /> };

