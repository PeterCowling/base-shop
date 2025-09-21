import 'cypress-axe';

describe('CMS color contrast', () => {
  it('detects color-contrast violations when tokens are low-contrast', () => {
    cy.visit('about:blank').then((win) => {
      const doc = win.document;
      const root = doc.documentElement as HTMLElement;
      // Set identical fg/bg to trigger a violation
      root.style.setProperty('--color-fg', '0 0% 50%');
      root.style.setProperty('--color-bg', '0 0% 50%');
      const div = doc.createElement('div');
      div.innerHTML = `
        <main>
          <p style="color: hsl(var(--color-fg)); background: hsl(var(--color-bg)); padding: 8px">Low contrast text</p>
        </main>
      `;
      doc.body.appendChild(div);
    });

    cy.injectAxe();
    // Check only color-contrast and assert at least one violation
    cy.checkA11y('main', { runOnly: ['color-contrast'] }, (violations) => {
      expect(violations.some((v) => v.id === 'color-contrast')).to.be.true;
    }, true);
  });

  it('passes color-contrast when tokens are accessible', () => {
    cy.visit('about:blank').then((win) => {
      const doc = win.document;
      const root = doc.documentElement as HTMLElement;
      root.style.setProperty('--color-fg', '0 0% 100%');
      root.style.setProperty('--color-bg', '0 0% 0%');
      const div = doc.createElement('div');
      div.innerHTML = `
        <main>
          <p style="color: hsl(var(--color-fg)); background: hsl(var(--color-bg)); padding: 8px">Good contrast text</p>
        </main>
      `;
      doc.body.appendChild(div);
    });

    cy.injectAxe();
    cy.checkA11y('main', { runOnly: ['color-contrast'] });
  });
});

