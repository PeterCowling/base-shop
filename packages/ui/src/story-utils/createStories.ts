import type { StoryObj } from '@storybook/react';
// Local copy to avoid coupling to .storybook/*
export type StoryDataState = 'default' | 'loading' | 'empty' | 'error' | 'skeleton';

export interface StateVariants<TArgs> {
  default?: Partial<TArgs>;
  loading?: Partial<TArgs>;
  empty?: Partial<TArgs>;
  error?: Partial<TArgs>;
  skeleton?: Partial<TArgs>;
}

export interface MatrixOptions {
  a11y?: boolean;          // if false, disables Axe for this story
  critical?: boolean;      // if true, marks with 'critical' tag for CI gates
  rtl?: boolean;           // if true, asks RTL decorator to flip direction
  viewports?: Array<'mobile1' | 'tablet' | 'desktop'>;
  tags?: string[];         // additional tags (e.g., 'visual', 'ci')
  docsDescription?: string;
}

// Produces canonical Story objects per state with consistent tags/parameters.
export function makeStateStory<TArgs>(
  base: TArgs,
  patch: Partial<TArgs>,
  state: StoryDataState,
  opts: MatrixOptions = {}
): StoryObj<TArgs> {
  const {
    a11y = true,
    critical = false,
    rtl = false,
    viewports = [],
    tags = [],
    docsDescription,
  } = opts;

  const parameters: Record<string, any> = {
    a11y: { disable: !a11y },
    dataState: state,
  };

  if (rtl) parameters.rtl = true;
  if (viewports.length) parameters.viewport = { defaultViewport: viewports[0] };
  if (docsDescription) parameters.docs = { description: { story: docsDescription } };

  const computedTags = [
    'autodocs',
    a11y ? 'a11y' : 'no-a11y',
    critical ? 'critical' : 'noncritical',
    ...tags,
  ];

  // Chromatic snapshots opt-in: only when 'visual' tag is present
  parameters.chromatic = { disable: !computedTags.includes('visual') };

  return {
    args: { ...(base as any), ...(patch as any) },
    parameters,
    tags: computedTags,
  } as StoryObj<TArgs>;
}
