/* File: /src/components/checkins/KeycardButton/KeycardDepositMenu.tsx */

import React, { memo, useCallback } from "react";

import { type DocumentType, KeycardPayType } from "../../../types/keycards";

import DocumentTypeSelector from "./DocumentTypeSelector";
import PaymentMethodSelector from "./PaymentMethodSelector";

interface KeycardDepositMenuProps {
  menuOpen: boolean;
  menuPosition: { top: number; left: number };
  payType: KeycardPayType;
  docType: DocumentType;
  keycardNumber: string;
  buttonDisabled: boolean;
  setPayType: React.Dispatch<React.SetStateAction<KeycardPayType>>;
  setDocType: React.Dispatch<React.SetStateAction<DocumentType>>;
  setKeycardNumber: React.Dispatch<React.SetStateAction<string>>;
  handleConfirm: () => Promise<void>;
  closeMenu: () => void;
}

/**
 * KeycardDepositMenu:
 * - Dropdown containing pay-type selection, doc-type selection (if needed),
 *   and a "Confirm" button.
 */
function KeycardDepositMenu({
  menuOpen,
  menuPosition,
  payType,
  docType,
  keycardNumber,
  buttonDisabled,
  setPayType,
  setDocType,
  setKeycardNumber,
  handleConfirm,
  closeMenu,
}: KeycardDepositMenuProps) {
  const containerClass = `
    z-50 w-72 border border-gray-400 rounded shadow-lg bg-white p-4 dark:bg-darkSurface dark:text-darkAccentGreen
    transition-opacity duration-200 transform-gpu
    ${menuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}
  `;

  // auto-close on mouse leave
  const handleMouseLeave = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  // deposit preview logic
  const depositPreview = payType === KeycardPayType.CASH ? "10.00" : "0.00";

  return (
    <div
      style={{
        position: "absolute",
        top: menuPosition.top,
        left: menuPosition.left,
      }}
      className={containerClass}
      onMouseLeave={handleMouseLeave}
    >
      <PaymentMethodSelector payType={payType} setPayType={setPayType} />

      {payType === KeycardPayType.DOCUMENT && (
        <DocumentTypeSelector docType={docType} setDocType={setDocType} />
      )}

      {payType !== KeycardPayType.NO_CARD && (
        <div className="mt-3">
          <label htmlFor="keycardNumber" className="block font-semibold mb-1">
            Keycard #
          </label>
          <input
            id="keycardNumber"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 042"
            maxLength={3}
            value={keycardNumber}
            onChange={(e) => setKeycardNumber(e.target.value)}
            className="w-full border rounded px-2 py-1 dark:bg-darkBg dark:border-darkSurface dark:text-darkAccentGreen"
          />
        </div>
      )}

      <div className="mt-4">
        <span className="block font-semibold mb-1">Deposit Preview:</span>
        <span className="text-lg font-bold">€{depositPreview}</span>
      </div>

      <button
        onClick={handleConfirm}
        disabled={buttonDisabled}
        className={`w-full mt-4 py-2 rounded text-white ${
          buttonDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
        }`}
      >
        Confirm
      </button>
    </div>
  );
}

export default memo(KeycardDepositMenu);
