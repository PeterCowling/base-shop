"use client";

import { type FC, useState } from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { Inline, Stack } from "@acme/design-system/primitives";

import type { TillRowMode } from "../../hooks/client/till/useTillReconciliationUI";
import { canAccess, Permissions } from "../../lib/roles";
import type { User } from "../../types/domains/userDomain";
import PasswordReauthModal from "../common/PasswordReauthModal";

import ActionDropdown from "./ActionDropdown";

interface ActionButtonsProps {
  shiftOpenTime: Date | null;
  isTillOverMax: boolean;
  isDrawerOverLimit: boolean;
  user: User;
  drawerLimitInput: string;
  setDrawerLimitInput: (val: string) => void;
  updateLimit: (val: number) => void;
  handleOpenShiftClick: () => void;
  handleKeycardCountClick: () => void;
  handleCloseShiftClick: (variant: "close" | "reconcile") => void;
  handleAddChangeClick: () => void;
  handleExchangeClick: () => void;
  handleAddKeycard: () => void;
  handleReturnKeycard: () => void;
  handleLiftClick: () => void;
  setRowMode: (v: TillRowMode) => void;
}

const ActionButtons: FC<ActionButtonsProps> = ({
  shiftOpenTime,
  isTillOverMax,
  isDrawerOverLimit: _isDrawerOverLimit,
  user,
  drawerLimitInput,
  setDrawerLimitInput,
  updateLimit,
  handleOpenShiftClick,
  handleKeycardCountClick,
  handleCloseShiftClick,
  handleAddChangeClick,
  handleExchangeClick,
  handleAddKeycard,
  handleReturnKeycard,
  handleLiftClick,
  setRowMode,
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDrawerReauth, setShowDrawerReauth] = useState(false);
  const [pendingDrawerLimit, setPendingDrawerLimit] = useState<number | null>(
    null
  );
  const canManageCash = canAccess(user, Permissions.TILL_ACCESS);
  const canManageDrawerLimit = canAccess(user, Permissions.MANAGEMENT_ACCESS);

  const handleDrawerLimitSubmit = () => {
    const nextLimit = Number(drawerLimitInput) || 0;
    setPendingDrawerLimit(nextLimit);
    setShowDrawerReauth(true);
  };

  const handleDrawerLimitConfirm = async () => {
    if (pendingDrawerLimit === null) return;
    await updateLimit(pendingDrawerLimit);
    setPendingDrawerLimit(null);
    setShowDrawerReauth(false);
  };

  const handleDrawerLimitCancel = () => {
    setPendingDrawerLimit(null);
    setShowDrawerReauth(false);
  };

  return (
    <Stack gap={4} className="sm:flex-row">
      <ActionDropdown
        id="shift"
        openId={openId}
        setOpenId={setOpenId}
        label="Shift"
        options={[
          {
            label: "Open Shift",
            onClick: handleOpenShiftClick,
            disabled: !!shiftOpenTime,
          },
          {
            label: "Reconcile",
            onClick: () => handleCloseShiftClick("reconcile"),
            disabled: !shiftOpenTime,
          },
          {
            label: "Close",
            onClick: () => handleCloseShiftClick("close"),
            disabled: !shiftOpenTime || isTillOverMax,
          },
        ]}
      />
      {canManageCash && (
        <>
          <ActionDropdown
            id="cash"
            openId={openId}
            setOpenId={setOpenId}
            label="Cash"
            options={[
              {
                label: "Add",
                onClick: handleAddChangeClick,
                disabled: !shiftOpenTime,
                disabledReason: !shiftOpenTime ? "Open a shift first" : undefined,
              },
              {
                label: "Exchange Notes",
                onClick: handleExchangeClick,
                disabled: !shiftOpenTime,
                disabledReason: !shiftOpenTime ? "Open a shift first" : undefined,
              },
              {
                label: "Lift",
                onClick: handleLiftClick,
                disabled: !shiftOpenTime,
                disabledReason: !shiftOpenTime ? "Open a shift first" : undefined,
              },
              {
                label: "Edit Transaction",
                onClick: () => setRowMode("edit"),
                disabled: !shiftOpenTime,
                disabledReason: !shiftOpenTime ? "Open a shift first" : undefined,
              },
              {
                label: "Delete Transaction",
                onClick: () => setRowMode("delete"),
                disabled: !shiftOpenTime,
                disabledReason: !shiftOpenTime ? "Open a shift first" : undefined,
              },
            ]}
          />
          <ActionDropdown
            id="keycards"
            openId={openId}
            setOpenId={setOpenId}
            label="Keycards"
            options={[
              {
                label: "Add Keycard",
                onClick: handleAddKeycard,
                disabled: !shiftOpenTime,
                disabledReason: !shiftOpenTime ? "Open a shift first" : undefined,
              },
              {
                label: "Return Keycard",
                onClick: handleReturnKeycard,
                disabled: !shiftOpenTime,
                disabledReason: !shiftOpenTime ? "Open a shift first" : undefined,
              },
              {
                label: "Count Keycards",
                onClick: handleKeycardCountClick,
                disabled: !shiftOpenTime,
                disabledReason: !shiftOpenTime ? "Open a shift first" : undefined,
              },
            ]}
          />
        </>
      )}
      {canManageDrawerLimit && (
        <Inline className="sm:ms-auto">
          <label
            className="text-sm font-semibold"
            htmlFor="drawerLimit"
          >
            Drawer Limit
          </label>
          <Input
            compatibilityMode="no-wrapper"
            id="drawerLimit"
            type="number"
            className="border border-border-strong rounded-lg p-1 w-24"
            value={drawerLimitInput}
            onChange={(e) => setDrawerLimitInput(e.target.value)}
          />
          <Button
            type="button"
            onClick={handleDrawerLimitSubmit}
            className="px-3 py-1 rounded-lg bg-primary-main text-primary-fg hover:bg-primary-dark"
          >
            Update
          </Button>
          {showDrawerReauth && (
            <PasswordReauthModal
              title="Confirm drawer limit"
              instructions="Enter your password to update the cash drawer limit."
              onSuccess={handleDrawerLimitConfirm}
              onCancel={handleDrawerLimitCancel}
            />
          )}
        </Inline>
      )}
    </Stack>
  );
};

export default ActionButtons;
