import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import type { UpgradeComponent } from '@acme/types';
import ComponentPreview from './ComponentPreview';

// Provide a mock component via the global mapping consumed by ComponentPreview
const Demo = ({ label = 'Demo' }: { label?: string }) => (
  <button type="button" className="rounded border px-3 py-2">{label}</button>
);

// @ts-expect-error augment global for story runtime
declare global {
  var __UPGRADE_MOCKS__: Record<string, React.ComponentType<unknown>> | undefined;
}

if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { __UPGRADE_MOCKS__?: Record<string, React.ComponentType<unknown>> }).__UPGRADE_MOCKS__ = {
    '@ui/components/demo/Button': Demo,
    '@ui/components/demo/Button.bak': (props: { label?: string }) => (
      <button type="button" className="rounded border px-3 py-2 opacity-70">{props.label || 'Demo (old)'}</button>
    ),
  };
}

const meta: Meta<typeof ComponentPreview> = {
  title: 'Utilities/ComponentPreview',
  component: ComponentPreview,
  tags: ['autodocs'],
  args: {
    component: { file: 'demo/Button.tsx', componentName: 'DemoButton', newChecksum: 'dev' } as UpgradeComponent,
    componentProps: { label: 'Hello' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Developer utility to preview a component alongside a previous (bak) version and compare side-by-side or toggled.',
      },
    },
  },
};
export default meta;

export const Default: StoryObj<typeof ComponentPreview> = {};
