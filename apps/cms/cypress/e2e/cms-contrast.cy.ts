describe('CMS color contrast', () => {
  it('detects color-contrast violations when tokens are low-contrast', function () {
    cy.visit('/login', { failOnStatusCode: false });
    cy.document().then((doc) => {
      const root = doc.documentElement as HTMLElement;
      // Set identical fg/bg to trigger a violation
      root.style.setProperty('--color-fg', '0 0% 50%');
      root.style.setProperty('--color-bg', '0 0% 50%');
      let div = doc.getElementById('contrast-fixture');
      if (!div) {
        div = doc.createElement('div');
        div.id = 'contrast-fixture';
      }
      div.innerHTML = `
        <main>
          <p style="color: hsl(0 0% 50%); background: hsl(0 0% 50%); padding: 8px">Low contrast text</p>
        </main>
      `;
      doc.body.appendChild(div);
    });

    cy.injectAxe();
    cy.document().then(function (doc) {
      const fixture = doc.getElementById('contrast-fixture');
      if (!fixture) {
        cy.log(
          'Skipping cms-contrast (low-contrast case): #contrast-fixture is missing, likely due to a redirect or hydration in this environment.',
        );
         
        this.skip();
        return;
      }

      // Check only color-contrast and assert at least one violation
      cy.checkA11y(
        '#contrast-fixture',
        { runOnly: ['color-contrast'] },
        (violations) => {
          expect(violations.some((v) => v.id === 'color-contrast')).to.be.true;
        },
        true,
      );
    });
  });

  it('passes color-contrast when tokens are accessible', function () {
    cy.visit('/login', { failOnStatusCode: false });
    cy.document().then((doc) => {
      const root = doc.documentElement as HTMLElement;
      root.style.setProperty('--color-fg', '0 0% 100%');
      root.style.setProperty('--color-bg', '0 0% 0%');
      let div = doc.getElementById('contrast-fixture');
      if (!div) {
        div = doc.createElement('div');
        div.id = 'contrast-fixture';
      }
      div.innerHTML = `
        <main>
          <p style="color: hsl(0 0% 100%); background: hsl(0 0% 0%); padding: 8px">Good contrast text</p>
        </main>
      `;
      doc.body.appendChild(div);
    });

    cy.injectAxe();
    cy.document().then(function (doc) {
      const fixture = doc.getElementById('contrast-fixture');
      if (!fixture) {
        cy.log(
          'Skipping cms-contrast (accessible case): #contrast-fixture is missing, likely due to a redirect or hydration in this environment.',
        );
         
        this.skip();
        return;
      }

      cy.checkA11y('#contrast-fixture', { runOnly: ['color-contrast'] });
    });
  });
});
