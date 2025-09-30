import '@testing-library/cypress/add-commands';
import 'cypress-plugin-tab';
import React from 'react';
import ReactDOM from 'react-dom/client';
import PopupModal from '../../packages/ui/src/components/cms/blocks/PopupModal';
import { ProductQuickView } from '../../packages/ui/src/components/overlays/ProductQuickView';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from '../../packages/ui/src/components/atoms/primitives/dialog';

describe('Modal accessibility', () => {
  it('PopupModal traps focus and restores on close', () => {
    cy.visit('about:blank').then((win) => {
      function App() {
        const [show, setShow] = React.useState(false);
        return (
          <div>
            <button id="open-popup" onClick={() => setShow(true)}>
              Open Popup
            </button>
            {show && (
              <PopupModal content="<button id='first'>First</button><button id='second'>Second</button>" />
            )}
          </div>
        );
      }
      ReactDOM.createRoot(win.document.body).render(<App />);
    });

    cy.injectAxe();

    cy.get('#open-popup').click();
    cy.get('[role="dialog"]').should('have.attr', 'aria-modal', 'true');
    cy.checkA11y('[role="dialog"]');

    cy.get('body').tab();
    cy.focused().should('have.id', 'first');
    cy.tab();
    cy.focused().should('have.id', 'second');
    cy.tab();
    cy.focused().should('have.attr', 'aria-label', 'Close');
    cy.tab();
    cy.focused().should('have.id', 'first');
    cy.tab({ shift: true });
    cy.focused().should('have.attr', 'aria-label', 'Close');
    cy.tab({ shift: true });
    cy.focused().should('have.id', 'second');
    cy.tab({ shift: true });
    cy.focused().should('have.id', 'first');

    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
    cy.focused().should('have.id', 'open-popup');
  });

  it('ProductQuickView traps focus and restores on close', () => {
    cy.visit('about:blank').then((win) => {
      function App() {
        const [open, setOpen] = React.useState(false);
        const product = {
          id: '1',
          slug: 'test',
          title: 'Test',
          price: 1,
          deposit: 0,
          stock: 0,
          forSale: true,
          forRental: false,
          media: [{ url: '', type: 'image' }],
          sizes: [],
          description: '',
        };
        return (
          <div>
            <button id="open-quickview" onClick={() => setOpen(true)}>
              Open Quick View
            </button>
            <ProductQuickView
              product={product}
              open={open}
              onOpenChange={setOpen}
              onAddToCart={() => {}}
            />
          </div>
        );
      }
      ReactDOM.createRoot(win.document.body).render(<App />);
    });

    cy.injectAxe();

    cy.get('#open-quickview').click();
    cy.get('[role="dialog"]').should('have.attr', 'aria-modal', 'true');
    cy.checkA11y('[role="dialog"]');

    cy.get('body').tab();
    cy.focused().should('have.attr', 'aria-label', 'Close');
    cy.tab();
    cy.focused().should('contain', 'Add to cart');
    cy.tab();
    cy.focused().should('have.attr', 'aria-label', 'Close');
    cy.tab({ shift: true });
    cy.focused().should('contain', 'Add to cart');
    cy.tab({ shift: true });
    cy.focused().should('have.attr', 'aria-label', 'Close');

    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
    cy.focused().should('have.id', 'open-quickview');
  });

  it('Dialog primitive traps focus and restores on close', () => {
    cy.visit('about:blank').then((win) => {
      function App() {
        return (
          <Dialog>
            <DialogTrigger id="open-dialog">Open Dialog</DialogTrigger>
            <DialogContent>
              <button id="dialog-first">First</button>
              <button id="dialog-second">Second</button>
            </DialogContent>
          </Dialog>
        );
      }
      ReactDOM.createRoot(win.document.body).render(<App />);
    });

    cy.injectAxe();

    cy.get('#open-dialog').click();
    cy.get('[role="dialog"]').should('have.attr', 'aria-modal', 'true');
    cy.checkA11y('[role="dialog"]');

    cy.get('body').tab();
    cy.focused().should('have.attr', 'aria-label', 'Close');
    cy.tab();
    cy.focused().should('have.id', 'dialog-first');
    cy.tab();
    cy.focused().should('have.id', 'dialog-second');
    cy.tab();
    cy.focused().should('have.attr', 'aria-label', 'Close');
    cy.tab({ shift: true });
    cy.focused().should('have.id', 'dialog-second');
    cy.tab({ shift: true });
    cy.focused().should('have.id', 'dialog-first');

    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
    cy.focused().should('have.id', 'open-dialog');
  });
});

