import React from 'react';
import { PageToolbar } from '@acme/page-builder-ui';

describe('PageToolbar help dialog (CT)', { tags: ['inspectors'] }, () => {
  it('opens keyboard shortcuts dialog', () => {
    cy.mount(
      <div style={{ width: 600 }}>
        <PageToolbar
          deviceId="desktop"
          setDeviceId={() => {}}
          orientation="portrait"
          setOrientation={() => {}}
          locale={'en' as any}
          setLocale={() => {}}
          locales={['en', 'de'] as any}
          progress={null}
          isValid={true}
        />
      </div>
    );
    cy.findByRole('button', { name: 'Keyboard shortcuts' }).click();
    cy.findByText('Keyboard shortcuts').should('exist');
    cy.findByText(/Ctrl|⌘ \+ 1/).should('exist');
  });
});
