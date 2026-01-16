import React from "react";
import AccountNavigation from "@acme/ui/components/account/AccountNavigation";
import { OrderTrackingTimeline, type OrderStep } from "@acme/ui/components/organisms/OrderTrackingTimeline";

const navItems = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/sessions", label: "Sessions" },
];

const orders: { id: string; steps: OrderStep[]; status: string }[] = [
  {
    id: "ord_1",
    status: "Shipped",
    steps: [
      { label: "Order placed", date: "2024-05-01", complete: true },
      { label: "Preparing", date: "2024-05-02", complete: true },
      { label: "Out for delivery", complete: false },
    ],
  },
  {
    id: "ord_2",
    status: "Processing",
    steps: [
      { label: "Order placed", date: "2024-05-03", complete: true },
    ],
  },
];

function AccountOrdersListFixture() {
  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 md:flex-row" data-testid="account-shell">
        <AccountNavigation ariaLabel="Account navigation" currentPath="/account/orders" items={navItems} />
        <main className="flex-1 rounded border p-4 md:p-6" role="main" aria-labelledby="account-orders-heading">
          <h1 id="account-orders-heading" className="mb-4 text-xl">
            Orders
          </h1>
          <ul className="space-y-2" aria-label="Orders list">
            {orders.map((order) => (
              <li key={order.id} className="rounded border p-4 space-y-2">
                <div>{`Order: ${order.id}`}</div>
                <p className="text-sm text-muted">Status: {order.status}</p>
                <OrderTrackingTimeline shippingSteps={order.steps} returnSteps={[]} className="mt-2" />
                <button
                  type="button"
                  className="inline-flex items-center justify-start underline text-start min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  View order {order.id}
                </button>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}

describe("Account orders list (component)", () => {
  it("exposes semantic list info and keyboard navigation", () => {
    cy.mountWithRouter(<AccountOrdersListFixture />, { router: { pathname: "/account/orders" } });

    cy.findByRole("navigation", { name: /account navigation/i }).should("exist");
    cy.findByRole("list", { name: /orders list/i }).within(() => {
      cy.get("> li").should("have.length", orders.length);
    });

    cy.findByRole("button", { name: /View order ord_1/i }).focus();
    cy.focused().should("contain.text", "ord_1");
    cy.tab();
    cy.focused().should("contain.text", "ord_2");
  });
});
