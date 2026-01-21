import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';

import { PRODUCTS } from '../../../../packages/platform-core/src/products/index';
import CollectionSectionClient from '../../../../packages/ui/src/components/cms/blocks/CollectionSection.client';
import FooterSection from '../../../../packages/ui/src/components/cms/blocks/FooterSection';
import HeaderSection from '../../../../packages/ui/src/components/cms/blocks/HeaderSection';

type PLPCompositionProps = {
  headerProps: ComponentProps<typeof HeaderSection>;
  collectionProps: ComponentProps<typeof CollectionSectionClient>;
  footerProps: ComponentProps<typeof FooterSection>;
};

function PLPComposition({ headerProps, collectionProps, footerProps }: PLPCompositionProps) {
  return (
    <div>
      <HeaderSection {...headerProps} />
      <main>
        <CollectionSectionClient {...collectionProps} />
      </main>
      <FooterSection {...footerProps} />
    </div>
  );
}

const meta: Meta<PLPCompositionProps> = {
  title: 'Compositions/PLP',
  component: PLPComposition,
  args: {
    headerProps: {
      variant: 'sticky',
      searchMode: 'inline',
    },
    collectionProps: {
      initial: PRODUCTS as any,
      params: { slug: 'demo' },
      paginationMode: 'loadMore',
    },
    footerProps: {
      variant: 'legalHeavy',
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
