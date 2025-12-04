import React, { useState } from 'react';
import { PageToolbar } from '@acme/page-builder-ui';

describe('PageToolbar breakpoints editor (CT)', { tags: ['inspectors'] }, () => {
  it('adds a breakpoint via Design popover (wide toolbar)', () => {
    const setBreakpoints = cy.stub().as('setBreakpoints');
    function Wrapper() {
      const [bps, setBps] = useState<any[]>([]);
      return (
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
            breakpoints={bps as any}
            setBreakpoints={(list: any[]) => { setBps(list); setBreakpoints(list); }}
          />
        </div>
      );
    }

    cy.mount(<Wrapper />);
    // Open Design popover, then open Breakpoints dialog
    cy.findByRole('button', { name: 'Design options' }).click();
    cy.contains('button', 'Breakpoints…').click();
    // Fill label + min/max and add
    cy.findByPlaceholderText('Label').type('Small');
    cy.findByPlaceholderText('Min px').type('360');
    cy.findByPlaceholderText('Max px').type('720');
    cy.contains('button', 'Add').click();
    // Save and assert callback
    cy.contains('button', 'Save').click();
    cy.get('@setBreakpoints').should('have.been.called');
    cy.get('@setBreakpoints').its('lastCall.args.0').should((list: any[]) => {
      expect(list).to.have.length(1);
      expect(list[0].label).to.eq('Small');
      expect(list[0].min).to.eq(360);
      expect(list[0].max).to.eq(720);
    });
  });

  it('adds a breakpoint via More menu (narrow toolbar)', () => {
    const setBreakpoints = cy.stub().as('setBreakpoints');
    function Wrapper() {
      const [bps, setBps] = useState<any[]>([]);
      return (
        <div style={{ width: 320 }}>
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
            breakpoints={bps as any}
            setBreakpoints={(list: any[]) => { setBps(list); setBreakpoints(list); }}
          />
        </div>
      );
    }

    cy.mount(<Wrapper />);
    // Open More actions popover and then Breakpoints dialog from its content
    cy.findByRole('button', { name: 'More actions' }).click();
    cy.contains('button', 'Breakpoints…').click();
    cy.findByPlaceholderText('Label').type('Large');
    cy.findByPlaceholderText('Min px').clear();
    cy.findByPlaceholderText('Max px').type('1440');
    cy.contains('button', 'Add').click();
    cy.contains('button', 'Save').click();
    cy.get('@setBreakpoints').its('lastCall.args.0').should((list: any[]) => {
      expect(list).to.have.length(1);
      expect(list[0].label).to.eq('Large');
      expect(list[0].min).to.eq(undefined);
      expect(list[0].max).to.eq(1440);
    });
  });
});
