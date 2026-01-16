import React from "react";
import AccountNavigation from "@acme/ui/components/account/AccountNavigation";

const navItems = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/sessions", label: "Sessions" },
];

const sessions = [
  { id: "sess_1", agent: "Firefox on macOS", createdAt: "2024-06-01T10:00:00Z" },
  { id: "sess_2", agent: "Safari on iOS", createdAt: "2024-06-02T08:30:00Z" },
];

function AccountSessionsListFixture() {
  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 md:flex-row" data-testid="account-shell">
        <AccountNavigation ariaLabel="Account navigation" currentPath="/account/sessions" items={navItems} />
        <main className="flex-1 rounded border p-4 md:p-6" role="main" aria-labelledby="account-sessions-heading">
          <h1 id="account-sessions-heading" className="mb-4 text-xl">
            Sessions
          </h1>
          <ul className="space-y-2" aria-label="Sessions list">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center justify-between rounded border p-4">
                <div>
                  <div>{session.agent}</div>
                  <div className="text-sm text-muted" data-token="--color-muted">
                    {new Date(session.createdAt).toISOString()}
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded border px-4 py-2 min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Revoke session {session.id}
                </button>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}

describe("Account sessions list (component)", () => {
  it("renders a focusable session list with keyboard support", () => {
    cy.mountWithRouter(<AccountSessionsListFixture />, { router: { pathname: "/account/sessions" } });

    cy.findByRole("navigation", { name: /account navigation/i }).should("exist");
    cy.findAllByRole("listitem").should("have.length", sessions.length);

    cy.findByRole("button", { name: /Revoke session sess_1/i }).focus();
    cy.focused().should("contain.text", "sess_1");
    cy.tab();
    cy.focused().should("contain.text", "sess_2");
  });
});
