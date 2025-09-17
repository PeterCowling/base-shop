import '@testing-library/cypress/add-commands';
import 'cypress-axe';
import React from 'react';
import ReactDOM from 'react-dom/client';

describe('CMS settings forms accessibility', () => {
  it('IdentitySection inputs are labelled and errors announced', () => {
    cy.visit('about:blank').then(async (win) => {
      const { default: IdentitySection } = await import('../../apps/cms/src/app/cms/shop/[shop]/settings/sections/IdentitySection');
      const Wrapper = () => {
        const [values, setValues] = React.useState({
          name: '',
          themeId: '',
          luxuryFeatures: {
            blog: false,
            contentMerchandising: false,
            raTicketing: false,
            fraudReviewThreshold: 0,
            requireStrongCustomerAuth: false,
            strictReturnConditions: false,
            trackingDashboard: false,
          },
        });
        const [errors, setErrors] = React.useState<Record<string, string[]>>({});
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setErrors({ name: ['Required'], themeId: ['Required'] });
            }}
          >
            <IdentitySection
              values={values as any}
              errors={errors as any}
              onNameChange={(value) => setValues((prev) => ({ ...prev, name: value }))}
              onThemeIdChange={(value) =>
                setValues((prev) => ({ ...prev, themeId: value }))
              }
              onLuxuryFeatureChange={(feature, value) =>
                setValues((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    [feature]: value,
                  },
                }))
              }
            />
            <button type="submit">Save</button>
          </form>
        );
      };
      ReactDOM.createRoot(win.document.body).render(React.createElement(Wrapper));
    });

    cy.injectAxe();
    cy.findByRole('button', { name: /save/i }).click();
    cy.findByLabelText('Name').should('have.attr', 'aria-invalid', 'true');
    cy.findByLabelText('Theme').should('have.attr', 'aria-invalid', 'true');
    cy.findAllByText('Required').each(($el) => {
      cy.wrap($el).should('have.attr', 'role', 'alert');
    });
    cy.checkA11y(undefined, undefined, undefined, true);
  });

  it('CurrencyTaxEditor inputs are labelled and errors announced', () => {
    cy.visit('about:blank').then(async (win) => {
      const actions = await import('../../apps/cms/src/actions/shops.server');
      cy.stub(actions, 'updateCurrencyAndTax').resolves({
        errors: { currency: ['Required'], taxRegion: ['Required'] },
      });
      const { default: CurrencyTaxEditor } = await import('../../apps/cms/src/app/cms/shop/[shop]/settings/CurrencyTaxEditor');
      ReactDOM.createRoot(win.document.body).render(
        React.createElement(CurrencyTaxEditor, {
          shop: 'test-shop',
          initial: { currency: '', taxRegion: '' },
        }),
      );
    });

    cy.injectAxe();
    cy.findByRole('button', { name: /save/i }).click();
    cy.findByLabelText('Currency').should('have.attr', 'aria-invalid', 'true');
    cy.findByLabelText('Tax Region').should('have.attr', 'aria-invalid', 'true');
    cy.findAllByText('Required').each(($el) => {
      cy.wrap($el).should('have.attr', 'role', 'alert');
    });
    cy.checkA11y(undefined, undefined, undefined, true);
  });
});
