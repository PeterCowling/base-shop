import '@testing-library/cypress/add-commands';
import 'cypress-axe';
import React from 'react';
import ReactDOM from 'react-dom/client';

describe('CMS settings forms accessibility', () => {
  it('GeneralSettings inputs are labelled and errors announced', () => {
    cy.visit('about:blank').then(async (win) => {
      const { default: ShopIdentitySection } = await import('../../apps/cms/src/app/cms/shop/[shop]/settings/sections/ShopIdentitySection');
      const Wrapper = () => {
        const [info, setInfo] = React.useState({
          name: '',
          themeId: '',
          luxuryFeatures: {
            blog: false,
            contentMerchandising: false,
            raTicketing: false,
            requireStrongCustomerAuth: false,
            strictReturnConditions: false,
            trackingDashboard: false,
            premierDelivery: false,
            fraudReviewThreshold: 0,
          },
        });
        const [errors, setErrors] = React.useState<Record<string, string[]>>({});
        const handleInfoChange = (field: 'name' | 'themeId', value: string) => {
          setInfo((prev) => ({ ...prev, [field]: value }));
        };
        const handleLuxuryChange = (
          feature:
            | 'blog'
            | 'contentMerchandising'
            | 'raTicketing'
            | 'requireStrongCustomerAuth'
            | 'strictReturnConditions'
            | 'trackingDashboard'
            | 'premierDelivery'
            | 'fraudReviewThreshold',
          value: boolean | number,
        ) => {
          setInfo((prev) => ({
            ...prev,
            luxuryFeatures: {
              ...prev.luxuryFeatures,
              [feature]: value,
            },
          }));
        };
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setErrors({ name: ['Required'], themeId: ['Required'] });
            }}
          >
            <ShopIdentitySection
              info={info}
              errors={errors}
              onInfoChange={handleInfoChange}
              onLuxuryFeatureChange={handleLuxuryChange}
            />
            <button type="submit">Save</button>
          </form>
        );
      };
      ReactDOM.createRoot(win.document.body).render(React.createElement(Wrapper));
    });

    cy.injectAxe();
    cy.findByRole('button', { name: /save/i }).click();
    cy.findByLabelText('Shop name').should('have.attr', 'aria-invalid', 'true');
    cy.findByLabelText('Theme preset').should('have.attr', 'aria-invalid', 'true');
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
