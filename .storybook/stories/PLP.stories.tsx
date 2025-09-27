import type { Meta, StoryObj } from '@storybook/react';
import HeaderSection from '../../packages/ui/src/components/cms/blocks/HeaderSection';
import CollectionSectionClient from '../../packages/ui/src/components/cms/blocks/CollectionSection.client';
import FooterSection from '../../packages/ui/src/components/cms/blocks/FooterSection';
import { PRODUCTS } from '../../packages/platform-core/src/products/index';

function PLPComposition() {
  return (
    <div>
      <HeaderSection variant="sticky" searchMode="inline" />
      <main>
        <CollectionSectionClient initial={PRODUCTS as any} params={{ slug: 'demo' }} paginationMode="loadMore" />
      </main>
      <FooterSection variant="legalHeavy" />
    </div>
  );
}

const meta: Meta<typeof PLPComposition> = {
  title: 'Compositions/PLP',
  component: PLPComposition,
};
export default meta;

export const Default: StoryObj<typeof PLPComposition> = {};

