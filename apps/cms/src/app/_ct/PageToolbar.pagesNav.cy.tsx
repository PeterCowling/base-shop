import React from 'react';
import PageToolbar from '@ui/components/cms/page-builder/PageToolbar';

describe('PageToolbar pagesNav (CT)', { tags: ['inspectors'] }, () => {
  it('pushes router when selecting a different page', () => {
    const push = cy.stub().as('push');
    const pagesNav = {
      current: 'home',
      items: [
        { label: 'Home', value: 'home', href: '/cms/shop/demo/pages/home/builder' },
        { label: 'About', value: 'about', href: '/cms/shop/demo/pages/about/builder' },
      ],
    };
    cy.mountWithRouter(<PageToolbar
      deviceId="desktop"
      setDeviceId={() => {}}
      orientation="portrait"
      setOrientation={() => {}}
      locale={'en' as any}
      setLocale={() => {}}
      locales={['en', 'de'] as any}
      progress={null}
      isValid={true}
      pagesNav={pagesNav as any}
    />, { router: { push } });

    cy.findByLabelText('Page').click();
    cy.get('[role="option"]').contains('About').click();
    cy.get('@push').should('have.been.calledWith', '/cms/shop/demo/pages/about/builder');
  });
});

