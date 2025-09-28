import type { Meta, StoryObj } from '@storybook/react';
import DevToolsOverlay from './DevToolsOverlay';
import { useEffect, useRef } from 'react';

function Harness() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    try { localStorage.setItem('pb:devtools', '1'); } catch {}
  }, []);
  return (
    <div className="relative h-80 border border-dashed border-muted">
      <div id="canvas" className="relative h-full w-full">
        {/* Simulated droppable containers */}
        <div id="container-1" className="absolute left-6 top-6 h-20 w-32 border border-muted" />
        <div id="container-2" className="absolute left-52 top-40 h-24 w-36 border border-muted" />
        {/* Simulated page components */}
        <div data-component-id="a" className="absolute left-20 top-16 h-10 w-16 border border-info" />
        <div data-component-id="b" className="absolute left-72 top-10 h-12 w-12 border border-info" />
      </div>
      <DevToolsOverlay scrollRef={scrollRef as any} />
    </div>
  );
}

const meta: Meta<typeof DevToolsOverlay> = {
  component: DevToolsOverlay,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Developer overlay for Page Builder. Story pre-enables the overlay and renders a synthetic canvas with droppable containers and items.' } },
  },
};
export default meta;

export const Default: StoryObj<typeof DevToolsOverlay> = { render: () => <Harness /> };
