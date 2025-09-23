// cypress/support/index.ts

import "cypress-axe";
import '@cypress/code-coverage/support';
import 'cypress-image-snapshot/command';
import 'cypress-audit/commands';
import 'cypress-grep';
// Enable Mock Service Worker for API mocking in Cypress tests
import { server } from "~test/msw/server";
import { handlersLoginAs, handlersCheckoutHappyPath } from "~test/msw/flows";

// Prevent tests from failing on uncaught exceptions originating from the app
Cypress.on("uncaught:exception", (_err, _runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

before(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
after(() => server.close());

// Sessions are persisted via cy.session in tests where needed.

// -----------------------------
// Page Builder custom commands
// -----------------------------
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Programmatic login as default admin via credentials provider */
      loginAsAdmin(): Chainable<void>;
      /** Apply MSW handlers to simulate next-auth credentials login for a role. Auto-resets after each test. */
      mswLoginAs(role?: 'admin' | 'viewer'): Chainable<void>;
      /** Apply MSW handlers for a deterministic checkout-session endpoint. */
      mswCheckoutHappyPath(): Chainable<void>;
      pbVisitBuilder(shop: string, pageIdOrSlug: string): Chainable<void>;
      pbEnsurePaletteOpen(): Chainable<void>;
      pbDrag(fromSelector: string, toSelector: string): Chainable<void>;
      pbDragPaletteToCanvas(type: string): Chainable<void>;
      pbDragPaletteToContainer(type: string, containerIndex?: number): Chainable<void>;
      pbSelectContainer(index: number): Chainable<JQuery<HTMLElement>>;
      pbContainerChildCount(index: number): Chainable<number>;
      pbOpenCanvasSettings(): Chainable<void>;
      pbToggleGrid(): Chainable<void>;
      pbToggleSnap(): Chainable<void>;
      pbSetGridCols(n: number): Chainable<void>;
      pbToggleRulers(): Chainable<void>;
      pbToggleBaseline(): Chainable<void>;
      pbUndo(): Chainable<void>;
      pbRedo(): Chainable<void>;
      pbTogglePreview(): Chainable<void>;
      pbSave(): Chainable<void>;
      pbDragHandle(handle: JQuery<HTMLElement>, dx: number, dy: number, opts?: { shift?: boolean }): Chainable<void>;
    }
  }
}

function pointerSequence(win: Window, target: Element, type: string, coords: { x: number; y: number }) {
  const ev = new (win as any).PointerEvent(type, {
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    bubbles: true,
    cancelable: true,
    buttons: type === "pointerup" ? 0 : 1,
    button: 0,
    clientX: coords.x,
    clientY: coords.y,
  });
  target.dispatchEvent(ev);
}

Cypress.Commands.add("pbVisitBuilder", (shop: string, pageIdOrSlug: string) => {
  const url = `/cms/shop/${shop}/pages/${pageIdOrSlug}/builder`;
  cy.visit(url, { failOnStatusCode: false });
  cy.location("pathname").should("eq", url);
  // Ensure builder canvas is present instead of legacy header text
  cy.get('[data-cy="pb-canvas"]').should('exist');
});

// Simple credentials login helper (reused by specs)
Cypress.Commands.add("loginAsAdmin", () => {
  cy.request("/api/auth/csrf").then(({ body }) => {
    const csrf = body.csrfToken as string;
    cy.request({
      method: "POST",
      url: "/api/auth/callback/credentials",
      form: true,
      followRedirect: true,
      body: {
        csrfToken: csrf,
        email: "admin@example.com",
        password: "admin",
        callbackUrl: "/",
      },
    });
  });
});

// MSW flow helpers
Cypress.Commands.add("mswLoginAs", (role: 'admin' | 'viewer' = 'admin') => {
  server.use(...handlersLoginAs(role));
});

Cypress.Commands.add("mswCheckoutHappyPath", () => {
  server.use(...handlersCheckoutHappyPath());
});

Cypress.Commands.add("pbEnsurePaletteOpen", () => {
  cy.get("body").then(($body) => {
    if ($body.find('[data-cy="pb-palette"]').length > 0) return;
    cy.window().then((win) => {
      try { win.localStorage.setItem('pb:show-palette', '1'); } catch {}
    });
    cy.reload();
    cy.get('[data-cy="pb-palette"]').should('exist');
  });
});

Cypress.Commands.add("pbDrag", (fromSelector: string, toSelector: string) => {
  cy.get(fromSelector).should("be.visible");
  cy.get(toSelector).scrollIntoView().should("be.visible");
  cy.window().then((win) => {
    cy.get(fromSelector).then(($from) => {
      const from = $from.get(0);
      const fr = from.getBoundingClientRect();
      const start = { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 };
      // pointerdown on source
      pointerSequence(win, from, "pointerdown", start);
      // small move to start drag
      pointerSequence(win, win.document.body, "pointermove", { x: start.x + 5, y: start.y + 5 });

      cy.get(toSelector).then(($to) => {
        const to = $to.get(0);
        const tr = to.getBoundingClientRect();
        const end = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 };
        // move across the screen to target center
        pointerSequence(win, win.document.body, "pointermove", { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 });
        pointerSequence(win, win.document.body, "pointermove", end);
        // release on target
        pointerSequence(win, to, "pointerup", end);
      });
    });
  });
});

Cypress.Commands.add("pbDragPaletteToCanvas", (type: string) => {
  cy.get(`[data-cy="pb-palette"]`).should("exist");
  cy.pbDrag(`[data-cy="pb-palette-item-${type}"]`, `[data-cy="pb-canvas"]`);
});

Cypress.Commands.add("pbDragPaletteToContainer", (type: string, containerIndex = 0) => {
  cy.get(`[data-cy="pb-palette-item-${type}"]`).then(($from) => {
    cy.get(`[data-cy="pb-container"]`).eq(containerIndex).then(($to) => {
      cy.window().then((win) => {
        const from = $from.get(0) as Element;
        const to = $to.get(0) as Element;
        const fr = from.getBoundingClientRect();
        const tr = to.getBoundingClientRect();
        const start = { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 };
        const end = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 };
        pointerSequence(win, from, "pointerdown", start);
        pointerSequence(win, win.document.body, "pointermove", { x: start.x + 5, y: start.y + 5 });
        pointerSequence(win, win.document.body, "pointermove", { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 });
        pointerSequence(win, win.document.body, "pointermove", end);
        pointerSequence(win, to, "pointerup", end);
      });
    });
  });
});

Cypress.Commands.add("pbOpenCanvasSettings", () => {
  cy.findByRole("button", { name: "Canvas settings" }).click();
});

Cypress.Commands.add("pbToggleGrid", () => {
  cy.contains("button", /Show grid|Hide grid/).click();
});

Cypress.Commands.add("pbToggleSnap", () => {
  cy.contains("button", /Snap on|Snap off/).click();
});

Cypress.Commands.add("pbSetGridCols", (n: number) => {
  cy.get('input[type="number"]').first().clear().type(String(n));
});

Cypress.Commands.add("pbToggleRulers", () => {
  cy.contains("button", /Rulers on|Rulers off/).click();
});

Cypress.Commands.add("pbToggleBaseline", () => {
  cy.contains("button", /Baseline on|Baseline off/).click();
});

Cypress.Commands.add("pbSelectContainer", (index: number) => {
  return cy.get('[data-cy="pb-container"]').eq(index);
});

Cypress.Commands.add("pbContainerChildCount", (index: number) => {
  return cy.get('[data-cy="pb-container"]').eq(index).then(($c) => {
    // Count direct child components rendered inside this container
    const count = $c.find('[data-component-id]').length;
    return cy.wrap(count);
  });
});

export {};

// Simple action helpers
Cypress.Commands.add("pbUndo", () => {
  cy.contains('button', /^Undo$/).click();
});

Cypress.Commands.add("pbRedo", () => {
  cy.contains('button', /^Redo$/).click();
});

Cypress.Commands.add("pbTogglePreview", () => {
  cy.findByRole('button', { name: 'View options' }).click();
  cy.findByRole('switch', { name: /Preview/i }).click();
});

Cypress.Commands.add("pbSave", () => {
  cy.contains('button', /^Save$/).click();
  // Wait until Save re-enables
  cy.contains('button', /^Save$/).should('not.be.disabled');
});

Cypress.Commands.add("pbDragHandle", (handle: JQuery<HTMLElement>, dx: number, dy: number, opts?: { shift?: boolean }) => {
  cy.window().then((win) => {
    const from = handle.get(0);
    const rect = from.getBoundingClientRect();
    const start = { x: rect.left + 2, y: rect.top + 2 };
    const end = { x: start.x + dx, y: start.y + dy };
    const down = new (win as any).PointerEvent('pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: start.x, clientY: start.y, bubbles: true, buttons: 1 });
    from!.dispatchEvent(down);
    const move1 = new (win as any).PointerEvent('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: (start.x + end.x) / 2, clientY: (start.y + end.y) / 2, bubbles: true, buttons: 1, shiftKey: !!opts?.shift });
    win.document.body.dispatchEvent(move1);
    const move2 = new (win as any).PointerEvent('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: end.x, clientY: end.y, bubbles: true, buttons: 1, shiftKey: !!opts?.shift });
    win.document.body.dispatchEvent(move2);
    const up = new (win as any).PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: end.x, clientY: end.y, bubbles: true, buttons: 0 });
    from!.dispatchEvent(up);
  });
});
