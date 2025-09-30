// packages/ui/src/components/cms/blocks/containers/TabsAccordionContainer.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import TabsAccordionContainer from './TabsAccordionContainer';
import { makeStateStory } from '../../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/Containers/TabsAccordionContainer/Matrix',
  component: TabsAccordionContainer,
  parameters: { docs: { autodocs: false } },
  parameters: {
    docs: {
      description: {
        component: `Tabbed/accordion container for panel content. Switches modes and supports RTL.\n\nUsage:\n\n\`\`\`tsx\nimport TabsAccordionContainer from './TabsAccordionContainer';\n\n<TabsAccordionContainer mode="tabs" tabs={["One","Two","Three"]}>\n  <div>One</div>\n  <div>Two</div>\n  <div>Three</div>\n</TabsAccordionContainer>\n\n// Key args: mode ('tabs'|'accordion'), tabs[], children\n\`\`\``,
      },
    },
  },
  args: {
    mode: 'tabs',
    tabs: ['One', 'Two', 'Three'],
    children: [
      <div key={1} className="p-3">Tab One Content</div>,
      <div key={2} className="p-3">Tab Two Content</div>,
      <div key={3} className="p-3">Tab Three Content</div>,
    ],
  },
} satisfies Meta<typeof TabsAccordionContainer>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Tabs mode with three panels; keyboard and aria roles applied.',
}) satisfies Story;

export const Loading = makeStateStory(baseArgs, { mode: 'accordion' }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Accordion mode to simulate a lighter UI while loading.',
}) satisfies Story;

export const Empty = makeStateStory(baseArgs, { tabs: [], children: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No panels; container renders tablist without tabs.',
}) satisfies Story;

export const Error = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Matrix completeness state; component is purely presentational.',
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL sample for tabs and accordion headings.',
}) satisfies Story;
