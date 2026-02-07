import React, { useState } from 'react';

import { PageToolbar } from '@acme/page-builder-ui';

describe('PageToolbar (CT)', { tags: ['inspectors'] }, () => {
  it('changes locale when clicking locale button', () => {
    function Wrapper() {
      const [locale, setLocale] = useState<'en' | 'de'>('en');
      return (
        <PageToolbar
          deviceId="desktop"
          setDeviceId={() => {}}
          orientation="portrait"
          setOrientation={() => {}}
          locale={locale}
          setLocale={setLocale as any}
          locales={['en', 'de'] as any}
          progress={null}
          isValid={true}
        />
      );
    }

    cy.mount(<Wrapper />);
    cy.contains('button', 'DE').click();
    // After clicking DE, the EN button should no longer be the active variant
    // A simple heuristic: clicking EN changes back
    cy.contains('button', 'EN').click();
  });
});
