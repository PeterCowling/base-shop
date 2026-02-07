import '@testing-library/cypress/add-commands';
import 'cypress-plugin-tab';

import React from 'react';
import ReactDOM from 'react-dom/client';

interface NavItem {
  title: string;
  href: string;
}

const navItems: NavItem[] = [
  { title: 'Home', href: '#home' },
  { title: 'Products', href: '#products' },
  { title: 'Contact', href: '#contact' },
];

function ResponsiveHeader({ nav }: { nav: NavItem[] }) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <header>
      {isMobile && (
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          Menu
        </button>
      )}
      <nav aria-label="Main navigation">
        <ul style={{ display: !isMobile || open ? 'block' : 'none' }}>
          {nav.map((item, idx) => (
            <li key={item.href}>
              <a id={`nav-${idx}`} href={item.href}>
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

const viewports = [
  { label: 'mobile', width: 320, height: 640, hasHamburger: true },
  { label: 'tablet', width: 768, height: 1024, hasHamburger: true },
  { label: 'desktop', width: 1280, height: 800, hasHamburger: false },
];

describe('Navigation accessibility', { tags: ['a11y'] }, () => {
  viewports.forEach(({ label, width, height, hasHamburger }) => {
    it(`behaves correctly on ${label} (${width}x${height})`, () => {
      cy.viewport(width, height);
      cy.visit('about:blank').then((win) => {
        ReactDOM.createRoot(win.document.body).render(
          React.createElement(ResponsiveHeader, { nav: navItems })
        );
      });

      if (hasHamburger) {
        cy.get('body').tab();
        cy.focused().should('have.attr', 'aria-label', 'Toggle menu');

        // Toggle open and closed to ensure functionality
        cy.focused().type('{enter}');
        cy.get('nav ul').should('be.visible');
        cy.focused().type('{enter}');
        cy.get('nav ul').should('not.be.visible');

        // Open for further tests
        cy.focused().type('{enter}');
        cy.get('nav ul').should('be.visible');

        cy.injectAxe();
        cy.checkA11y(undefined, undefined, undefined, true);

        navItems.forEach((item) => {
          cy.tab();
          cy.focused().should('have.attr', 'href', item.href);
        });
      } else {
        cy.get('body').tab();
        cy.focused().should('have.attr', 'href', navItems[0].href);

        cy.injectAxe();
        cy.checkA11y(undefined, undefined, undefined, true);

        navItems.slice(1).forEach((item) => {
          cy.tab();
          cy.focused().should('have.attr', 'href', item.href);
        });
      }

      cy.get('nav').then(($nav) => {
        const ids = $nav.find('[id]').toArray().map((el) => el.id);
        expect(new Set(ids).size).to.eq(ids.length);
      });
    });
  });
});
