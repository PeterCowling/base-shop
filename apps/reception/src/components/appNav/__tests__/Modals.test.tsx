import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { IconModalProps } from "../../../types/component/IconModalProps";
import type { ModalAction } from "../../../types/component/ModalAction";
import ManagementModal from "../ManagementModal";
import ManModal from "../ManModal";
import OperationsModal from "../OperationsModal";
import TillModal from "../TillModal";

/* eslint-disable no-var */
var withIconModalMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../hoc/withIconModal", () => {
  withIconModalMock = jest.fn((opts: { label: string; actions: ModalAction[] }) => {
    const MockComponent: React.FC<{
      onClose: () => void;
      onLogout: () => void;
      [key: string]: unknown;
    }> = ({ onClose, onLogout, ...rest }) => (
      <div
        data-label={opts.label}
        data-interactive={rest.interactive ? "true" : "false"}
      >
        <button onClick={onClose}>close</button>
        <button onClick={onLogout}>logout</button>
      </div>
    );
    return MockComponent;
  });

  return { withIconModal: withIconModalMock };
});

const user = { email: "test@example.com", user_name: "Pete" };

const operationsActions: ModalAction[] = [
  { label: "Bar", iconClass: "fas fa-cocktail", route: "/bar" },
  { label: "Checkin", iconClass: "fas fa-sign-in-alt", route: "/checkin" },
  { label: "View Rooms", iconClass: "fas fa-eye", route: "/rooms-grid" },
  { label: "Checkout", iconClass: "fas fa-sign-out-alt", route: "/checkout" },
  { label: "Loans", iconClass: "fas fa-lock", route: "/loan-items" },
  { label: "Extension", iconClass: "fas fa-calendar-plus", route: "/extension" },
];

const managementActions: ModalAction[] = [
  { label: "Prepare", iconClass: "fas fa-broom", route: "/prepare-dashboard" },
  { label: "Prepayments", iconClass: "fas fa-credit-card", route: "/prepayments" },
  { label: "Opt-In", iconClass: "fas fa-envelope", route: "/email-automation" },
  { label: "Search", iconClass: "fas fa-search", route: "/audit" },
];

const manActions: ModalAction[] = [
  { label: "Alloggiati", iconClass: "fas fa-database", route: "/alloggiati" },
  { label: "Stock", iconClass: "fas fa-boxes", route: "/stock" },
  { label: "Ingredient Stock", iconClass: "fas fa-carrot", route: "/ingredient-stock" },
  { label: "Real Time", iconClass: "fas fa-chart-line", route: "/real-time-dashboard" },
  { label: "Statistics", iconClass: "fas fa-chart-bar", route: "/statistics" },
  { label: "Menu Performance", iconClass: "fas fa-chart-pie", route: "/menu-performance" },
];

const tillActions: ModalAction[] = [
  { label: "Till", iconClass: "fas fa-cash-register", route: "/till-reconciliation" },
  { label: "Safe", iconClass: "fas fa-shield-alt", route: "/safe-reconciliation" },
  { label: "Workbench", iconClass: "fas fa-tools", route: "/reconciliation-workbench" },
  { label: "Live", iconClass: "fas fa-stream", route: "/live" },
  { label: "Variance", iconClass: "fas fa-chart-area", route: "/variance-heatmap" },
  { label: "End of Day", iconClass: "fas fa-file-alt", route: "/end-of-day" },
];

async function testLogout(Component: React.ComponentType<IconModalProps>) {
  const onLogout = jest.fn();
  render(
    <Component visible onClose={() => undefined} onLogout={onLogout} user={user} />
  );
  await userEvent.click(screen.getByRole("button", { name: "logout" }));
  return onLogout;
}

describe("AppNav modals", () => {
  it("passes actions to OperationsModal", () => {
    expect(withIconModalMock).toHaveBeenNthCalledWith(1, {
      label: "OPERATIONS",
      actions: operationsActions,
    });
  });

  it("OperationsModal logout button works", async () => {
    const onLogout = await testLogout(OperationsModal);
    expect(onLogout).toHaveBeenCalled();
  });

  it("passes actions to ManagementModal", () => {
    expect(withIconModalMock).toHaveBeenNthCalledWith(2, {
      label: "MANAGEMENT",
      actions: managementActions,
    });
  });

  it("ManagementModal logout button works", async () => {
    const onLogout = await testLogout(ManagementModal);
    expect(onLogout).toHaveBeenCalled();
  });

  it("passes actions to ManModal", () => {
    expect(withIconModalMock).toHaveBeenNthCalledWith(3, {
      label: "MAN",
      actions: manActions,
    });
  });

  it("ManModal logout button works", async () => {
    const onLogout = await testLogout(ManModal);
    expect(onLogout).toHaveBeenCalled();
  });

  it("passes actions to TillModal", () => {
    expect(withIconModalMock).toHaveBeenNthCalledWith(4, {
      label: "TILL",
      actions: tillActions,
    });
  });

  it("TillModal logout button works", async () => {
    const onLogout = await testLogout(TillModal);
    expect(onLogout).toHaveBeenCalled();
  });
});
