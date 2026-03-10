import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Permissions } from "../../../lib/roles";
import type { IconModalProps } from "../../../types/component/IconModalProps";
import type { ModalAction } from "../../../types/component/ModalAction";
import ManagementModal from "../ManagementModal";
import ManModal from "../ManModal";
import OperationsModal from "../OperationsModal";
import TillModal from "../TillModal";

/* eslint-disable no-var */
var withIconModalMock: jest.Mock;
/* eslint-enable no-var */

/**
 * Mock captures the config each modal passes to withIconModal.
 * We assert on the config shape rather than an old hardcoded actions array,
 * so that tests remain valid as navConfig evolves.
 */
jest.mock("../../../hoc/withIconModal", () => {
  withIconModalMock = jest.fn(
    (opts: { label: string; actions: ModalAction[]; permissionKey?: string[] }) => {
      const MockComponent: React.FC<{
        onClose: () => void;
        onLogout: () => void;
        [key: string]: unknown;
      }> = ({ onClose, onLogout }) => (
        <div data-label={opts.label}>
          <button onClick={onClose}>close</button>
          <button onClick={onLogout}>logout</button>
        </div>
      );
      return MockComponent;
    }
  );

  return { withIconModal: withIconModalMock };
});

const user = { email: "test@example.com", user_name: "Pete" };

// Helper: extract the config object captured for a given modal label.
function capturedConfig(label: string) {
  const call = (withIconModalMock.mock.calls as Array<[{ label: string; actions: ModalAction[]; permissionKey?: string[] }]>).find(
    ([opts]) => opts.label === label
  );
  if (!call) throw new Error(`No withIconModal call found for label "${label}"`);
  return call[0];
}

// Helper: routes present in a captured config.
function capturedRoutes(label: string): string[] {
  return capturedConfig(label).actions.map((a) => a.route);
}

async function testLogout(Component: React.ComponentType<IconModalProps>) {
  const onLogout = jest.fn();
  render(
    <Component visible onClose={() => undefined} onLogout={onLogout} user={user as never} />
  );
  await userEvent.click(screen.getByRole("button", { name: "logout" }));
  return onLogout;
}

describe("AppNav modals — config shape assertions", () => {
  // TC-01: OperationsModal — Inbox present, Dashboard absent (sidebarOnly)
  it("OperationsModal includes Inbox and excludes Dashboard", () => {
    const routes = capturedRoutes("OPERATIONS");
    expect(routes).toContain("/inbox");
    expect(routes).not.toContain("/");        // Dashboard is sidebarOnly
    expect(routes).toContain("/bar");
    expect(routes).toContain("/checkin");
    expect(routes).toContain("/prime-requests");
  });

  it("OperationsModal logout button works", async () => {
    const onLogout = await testLogout(OperationsModal);
    expect(onLogout).toHaveBeenCalled();
  });

  // TC-02: ManagementModal — Staff Accounts absent (it lives in Admin section)
  it("ManagementModal excludes Staff Accounts", () => {
    const routes = capturedRoutes("MANAGEMENT");
    expect(routes).not.toContain("/staff-accounts");
    expect(routes).toContain("/prepare-dashboard");
    expect(routes).toContain("/prepayments");
    expect(routes).toContain("/email-automation");
    expect(routes).toContain("/audit");
  });

  it("ManagementModal logout button works", async () => {
    const onLogout = await testLogout(ManagementModal);
    expect(onLogout).toHaveBeenCalled();
  });

  // TC-03: ManModal — Admin section includes Manager Audit, EOD Checklist, Staff Accounts
  it("ManModal includes Manager Audit, EOD Checklist, and Staff Accounts", () => {
    const routes = capturedRoutes("MAN");
    expect(routes).toContain("/manager-audit");
    expect(routes).toContain("/eod-checklist");
    expect(routes).toContain("/staff-accounts");
    expect(routes).toContain("/alloggiati");
    expect(routes).toContain("/menu-performance");
  });

  it("ManModal EOD Checklist item has correct label (not 'End of Day')", () => {
    const actions = capturedConfig("MAN").actions;
    const eodItem = actions.find((a) => a.route === "/eod-checklist");
    expect(eodItem?.label).toBe("EOD Checklist");
  });

  it("ManModal Menu Performance item has full label", () => {
    const actions = capturedConfig("MAN").actions;
    const menuItem = actions.find((a) => a.route === "/menu-performance");
    expect(menuItem?.label).toBe("Menu Performance");
  });

  it("ManModal logout button works", async () => {
    const onLogout = await testLogout(ManModal);
    expect(onLogout).toHaveBeenCalled();
  });

  // TC-04: TillModal — permissionKey is TILL_ACCESS
  it("TillModal has permissionKey set to TILL_ACCESS", () => {
    const config = capturedConfig("TILL");
    expect(config.permissionKey).toEqual(Permissions.TILL_ACCESS);
  });

  it("TillModal includes all 6 Till & Safe items", () => {
    const routes = capturedRoutes("TILL");
    expect(routes).toHaveLength(6);
    expect(routes).toContain("/till-reconciliation");
    expect(routes).toContain("/safe-reconciliation");
    expect(routes).toContain("/reconciliation-workbench");
    expect(routes).toContain("/live");
    expect(routes).toContain("/variance-heatmap");
    expect(routes).toContain("/end-of-day");
  });

  it("TillModal logout button works", async () => {
    const onLogout = await testLogout(TillModal);
    expect(onLogout).toHaveBeenCalled();
  });

  // ManModal permissionKey: MANAGEMENT_ACCESS
  it("ManModal has permissionKey set to MANAGEMENT_ACCESS", () => {
    const config = capturedConfig("MAN");
    expect(config.permissionKey).toEqual(Permissions.MANAGEMENT_ACCESS);
  });
});
