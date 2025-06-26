#!/usr/bin/env ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodePlop = require("node-plop").default;

async function run() {
  const [, , layer, name] = process.argv;
  if (!layer || !name) {
    console.error("Usage: pnpm gen <layer> <Name>");
    process.exit(1);
  }

  const plop = await nodePlop();
  plop.setGenerator("component", {
    description: "Generate a UI component",
    prompts: [],
    actions: [
      {
        type: "add",
        path: `packages/ui/components/${layer}/${name}.tsx`,
        template: `import * as React from 'react';

export interface ${name}Props {}

export const ${name}: React.FC<${name}Props> = () => {
  return <div>${name}</div>;
};
`,
      },
      {
        type: "add",
        path: `packages/ui/components/${layer}/${name}.test.tsx`,
        template: `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });
});
`,
      },
      {
        type: "add",
        path: `packages/ui/components/${layer}/${name}.stories.tsx`,
        template: `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: '${layer}/${name}',
  component: ${name},
  tags: ['autodocs'],
};
export default meta;
export const Default: StoryObj<typeof ${name}> = {};
`,
      },
    ],
  });

  await plop.getGenerator("component").runActions({});
}

run();
