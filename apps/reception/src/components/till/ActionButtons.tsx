import { type FC, useState } from "react";

import ActionDropdown from "./ActionDropdown";

interface ActionButtonsProps {
  shiftOpenTime: Date | null;
  isTillOverMax: boolean;
  isDrawerOverLimit: boolean;
  userName: string;
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
  userName,
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
  const canManageCash = ["pete", "serena", "cristiana"].includes(
    userName.toLowerCase()
  );

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
      {userName === "Pete" && (
        <div className="flex items-center gap-2 dark:bg-darkSurface dark:text-darkAccentGreen sm:ms-auto">
          <label
            className="text-sm font-semibold dark:text-darkAccentGreen"
            htmlFor="drawerLimit"
          >
            Drawer Limit
          </label>
          <input
            id="drawerLimit"
            type="number"
            className="border rounded p-1 w-24 dark:bg-darkBg dark:text-darkAccentGreen"
            value={drawerLimitInput}
            onChange={(e) => setDrawerLimitInput(e.target.value)}
            onBlur={() => updateLimit(Number(drawerLimitInput) || 0)}
          />
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
