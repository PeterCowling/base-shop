import type { Meta, StoryObj } from '@storybook/nextjs';
import React, { useEffect, useMemo, useState } from 'react';
import MultiColumn from '../../../../packages/ui/src/components/cms/blocks/containers/MultiColumn';
import StackFlex from '../../../../packages/ui/src/components/cms/blocks/containers/StackFlex';
import TabsAccordionContainer from '../../../../packages/ui/src/components/cms/blocks/containers/TabsAccordionContainer';
import ShowcaseSection from '../../../../packages/ui/src/components/cms/blocks/ShowcaseSection';
import CollectionSectionClient from '../../../../packages/ui/src/components/cms/blocks/CollectionSection.client';

type Node = {
  type: string;
  props?: Record<string, unknown>;
  children?: Node[];
};

const REGISTRY: Record<string, React.ComponentType<Record<string, unknown>>> = {
  MultiColumn,
  StackFlex,
  TabsAccordionContainer,
  ShowcaseSection,
  CollectionSectionClient,
};

function RenderNode({ node }: { node: Node }) {
  const Cmp = REGISTRY[node.type];
  if (!Cmp) return <div style={{ color: 'crimson' }}>Unknown type: {node.type}</div>;
  const children = (node.children ?? []).map((c, i) => <RenderNode node={c} key={i} />);
  return <Cmp {...(node.props ?? {})}>{children}</Cmp>;
}

function useLocalJson(key: string, initial: string) {
  const [val, setVal] = useState<string>(() => {
    try { return localStorage.getItem(key) ?? initial; } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, val); } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

const SAMPLE = JSON.stringify(
  {
    type: 'MultiColumn',
    props: { columns: 2, gap: '1rem' },
    children: [
      { type: 'ShowcaseSection', props: { preset: 'featured', layout: 'carousel' } },
      {
        type: 'StackFlex',
        props: { direction: 'row', gap: '0.5rem' },
        children: [
          { type: 'TabsAccordionContainer', props: { mode: 'tabs', tabs: ['One', 'Two', 'Three'] }, children: [
            { type: 'StackFlex', props: { direction: 'column', gap: '0.25rem' }, children: [
              { type: 'ShowcaseSection', props: { preset: 'bestsellers', layout: 'grid', gridCols: 3 } },
            ]}
          ]},
        ],
      },
    ],
  },
  null,
  2,
);

const meta: Meta = {
  title: 'Internal/Page Builder (Editor Mode)',
  parameters: {
    docs: {
      description: {
        component:
          'Paste a JSON page definition and render it using a simple registry of blocks/containers. This internal story helps authors validate composition quickly.',
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    json: { control: 'textarea', description: 'Page JSON', table: { category: 'Content' } },
  },
  args: { json: SAMPLE },
};
export default meta;

type Story = StoryObj<{ json: string }>;

export const Editor: Story = {
  render: ({ json }) => <EditorComponent json={json} />,
};

function EditorComponent({ json }: { json: string }) {
  const [buf, setBuf] = useLocalJson('sb:page-builder:json', String(json ?? ''));
  const tree = useMemo(() => {
    try { return JSON.parse(buf) as Node; } catch { return null; }
  }, [buf]);
  return (
    <div className="flex gap-4 p-4">
      <textarea
        value={buf}
        onChange={(e) => setBuf(e.target.value)}
        style={{ width: 420, height: '80vh' }}
      />
      <div className="flex-1">
        {tree ? <RenderNode node={tree} /> : <div>Invalid JSON</div>}
      </div>
    </div>
  );
}
