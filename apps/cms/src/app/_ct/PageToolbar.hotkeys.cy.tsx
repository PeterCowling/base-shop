import React from 'react';

import { PageToolbar } from '@acme/page-builder-ui';
import { getLegacyPreset } from '@acme/ui/utils/devicePresets';

describe('PageToolbar hotkeys (CT)', { tags: ['inspectors'] }, () => {
  it('Ctrl/⌘+1/2/3 switch device and reset orientation', () => {
    const setDeviceId = cy.stub().as('setDeviceId');
    const setOrientation = cy.stub().as('setOrientation');

    cy.mount(
      <PageToolbar
        deviceId="desktop"
        setDeviceId={setDeviceId as any}
        orientation="landscape"
        setOrientation={setOrientation as any}
        locale={'en' as any}
        setLocale={() => {}}
        locales={['en', 'de'] as any}
        progress={null}
        isValid={true}
      />
    );

    cy.window().then((win) => {
      const keyEvent = (key: string) => new win.KeyboardEvent('keydown', { key, metaKey: true, ctrlKey: true, bubbles: true });
      win.dispatchEvent(keyEvent('1'));
      win.dispatchEvent(keyEvent('2'));
      win.dispatchEvent(keyEvent('3'));
    });

    cy.get('@setDeviceId').should('be.calledWith', getLegacyPreset('desktop').id);
    cy.get('@setDeviceId').should('be.calledWith', getLegacyPreset('tablet').id);
    cy.get('@setDeviceId').should('be.calledWith', getLegacyPreset('mobile').id);
    cy.get('@setOrientation').should('have.callCount', 3);
    cy.get('@setOrientation').should('always.be.calledWith', 'portrait');
  });
});
