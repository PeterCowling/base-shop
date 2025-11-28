import type { Meta, StoryObj } from '@storybook/nextjs';
import CommentsToolbar from './CommentsToolbar';
import { useState } from 'react';

const demoPeers = [
  // Use design tokens for colors
  { id: 'u1', label: 'Alex', color: 'hsl(var(--color-success-dark))' },
  { id: 'u2', label: 'Priya', color: 'hsl(var(--color-info-dark))' },
  { id: 'u3', label: 'Sam', color: 'hsl(var(--color-warning-dark))' },
] as const;

function Harness() {
  const [showResolved, setShowResolved] = useState(false);
  const [count, setCount] = useState(3);
  return (
    <div className="relative min-h-52">
      <div data-pb-portal-root />
      <CommentsToolbar
        peers={demoPeers as any}
        showResolved={showResolved}
        onShowResolvedChange={setShowResolved}
        onReload={() => setCount((c) => c)}
        onAddForSelected={() => setCount((c) => c + 1)}
        canAddForSelected={true}
        onToggleDrawer={() => {}}
        unresolvedCount={count}
      />
    </div>
  );
}

const meta: Meta<typeof CommentsToolbar> = {
  component: CommentsToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Toolbar for Page Builder comments. Demo shows unresolved count and simple peers list.' } },
  },
};
export default meta;

export const Default: StoryObj<typeof CommentsToolbar> = { render: () => <Harness /> };
