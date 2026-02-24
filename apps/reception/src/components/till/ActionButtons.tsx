"use client";

import { type FC, useMemo, useState } from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

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
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDrawerReauth, setShowDrawerReauth] = useState(false);
  const [pendingDrawerLimit, setPendingDrawerLimit] = useState<number | null>(
    null
  );
  const canManageCash = useMemo(
    () => canAccess(user, Permissions.TILL_ACCESS),
    [user]
  );
  const canManageDrawerLimit = useMemo(
    () => canAccess(user, Permissions.MANAGEMENT_ACCESS),
    [user]
  );

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
    <div className="flex flex-col gap-4 sm:flex-row">
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
              },
              {
                label: "Exchange Notes",
                onClick: handleExchangeClick,
                disabled: !shiftOpenTime,
              },
              {
                label: "Lift",
                onClick: handleLiftClick,
                disabled: !shiftOpenTime,
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
              },
              {
                label: "Return Keycard",
                onClick: handleReturnKeycard,
                disabled: !shiftOpenTime,
              },
              {
                label: "Count Keycards",
                onClick: handleKeycardCountClick,
                disabled: !shiftOpenTime,
              },
            ]}
          />
        </>
      )}
      {canManageDrawerLimit && (
        <div className="flex items-center gap-2 sm:ms-auto">
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
            className="border rounded p-1 w-24"
            value={drawerLimitInput}
            onChange={(e) => setDrawerLimitInput(e.target.value)}
          />
          <Button
            type="button"
            onClick={handleDrawerLimitSubmit}
            className="px-3 py-1 rounded bg-primary-main text-primary-fg hover:bg-primary-dark"
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
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
