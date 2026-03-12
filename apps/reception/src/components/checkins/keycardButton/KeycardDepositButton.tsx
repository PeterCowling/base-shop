// src/components/checkins/KeycardButton/KeycardDepositButton.tsx
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import type { LucideIcon } from "lucide-react";
import { Ban, Banknote, FileText, Key } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import { useLoanData } from "../../../context/LoanDataContext";
import { useDropdownMenu } from "../../../hooks/client/keycardButton/useDropdownMenu";
import useActivitiesMutations from "../../../hooks/mutations/useActivitiesMutations";
import useAllTransactions from "../../../hooks/mutations/useAllTransactionsMutations";
import { useKeycardAssignmentsMutations } from "../../../hooks/mutations/useKeycardAssignmentsMutations";
import { type CheckInRow } from "../../../types/component/CheckinRow";
import {
  type LoanMethod,
  type LoanTransaction,
} from "../../../types/hooks/data/loansData";
import {
  DocumentType,
  KeycardPayType,
  loanMethodToSelection,
  selectionToLoanMethod,
} from "../../../types/keycards";
import { getItalyIsoString } from "../../../utils/dateUtils";
import { generateTransactionId } from "../../../utils/generateTransactionId";
import { showToast } from "../../../utils/toastUtils";
import useOccupantLoans from "../../loans/useOccupantLoans";

import KeycardDepositMenu from "./KeycardDepositMenu";

interface KeycardDepositButtonProps {
  booking: CheckInRow;
}

/**
 * Visual states
 * ─────────────────────────────────────────────────────────────────────────────
 * - **Active**        primary colour, action available.
 * - **Has Keycard**   success colour, action blocked (already issued).
 * - **Disabled**      grey, action blocked for other reasons.
 */
function KeycardDepositButton({ booking }: KeycardDepositButtonProps) {
  const { occupantId, bookingRef } = booking;

  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
  const [keycardNumber, setKeycardNumber] = useState<string>("");
  const { addActivity } = useActivitiesMutations();
  const { saveLoan } = useLoanData();
  const { addToAllTransactions } = useAllTransactions();
  const { assignGuestKeycard } = useKeycardAssignmentsMutations();

  /* ──────────────── keycard / "No_card" status ─────────────────────────── */
  const { occupantLoans } = useOccupantLoans(bookingRef, occupantId);

  let hasKeycard = false;
  let hasNoCard = false;
  if (occupantLoans?.txns) {
    Object.values(
      occupantLoans.txns as Record<string, LoanTransaction>
    ).forEach(({ item, type, count }) => {
      const normalizedItem = item.trim().toLowerCase();
      if (normalizedItem === "keycard") {
        if (type === "Loan") hasKeycard = true;
        else if (type === "Refund" && count > 0) hasKeycard = false;
      }
      if (normalizedItem === "no_card" && type === "Loan") {
        hasNoCard = true;
      }
    });
  }

  /* ──────────────── disabled logic ─────────────────────────────────────── */
  const disabledDueToKeycard = hasKeycard || hasNoCard;
  const disabledDueToOther = !bookingRef || !occupantId || buttonDisabled;
  const isDisabled = disabledDueToKeycard || disabledDueToOther;

  /* ──────────────── menu / dropdown state ──────────────────────────────── */
  const {
    menuOpen,
    menuVisible,
    menuPosition,
    buttonRef,
    handleMenuToggle,
    closeMenu,
    setTrackedTimeout,
  } = useDropdownMenu({ isDisabled });

  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  /* ──────────────── payment- & doc-type state ───────────────────────────── */
  const [payType, setPayType] = useState<KeycardPayType>(KeycardPayType.CASH);
  const [docType, setDocType] = useState<DocumentType>(DocumentType.PASSPORT);

  /* Keep payType/docType in sync with latest loan transaction */
  useEffect(() => {
    if (!occupantLoans?.txns) return;

    const txns = occupantLoans.txns as Record<string, LoanTransaction>;
    const latest = Object.values(txns)
      .filter(
        (t) =>
          (t.item === "Keycard" || t.item === "No_card") && t.type === "Loan"
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    if (!latest) return;

    const { payType: pType, docType: dType } = loanMethodToSelection(
      latest.depositType
    );

    setPayType(pType);
    if (pType === KeycardPayType.DOCUMENT) {
      setDocType(dType);
    }
  }, [occupantLoans]);

  /* --- icon on the selector button --------------------------------------- */
  const depositIcon = useMemo((): {
    icon: LucideIcon;
    className: string;
  } => {
    switch (payType) {
      case KeycardPayType.DOCUMENT:
        return {
          icon: FileText,
          className: "text-warning-main",
        };
      case KeycardPayType.NO_CARD:
        return { icon: Ban, className: "text-primary" };
      case KeycardPayType.CASH:
      default:
        return {
          icon: Banknote,
          className: "text-success-main",
        };
    }
  }, [payType]);

  /* Issue only one keycard unless "No_card" was chosen. */
  const cardCount = 1;

  /* ──────────────── styling helpers ────────────────────────────────────── */
  const baseButtonClass =
    "h-9 px-2.5 flex items-center justify-center transition-colors focus:outline-none text-xs font-medium";

  const activeClass =
    "bg-primary-main hover:opacity-90 text-primary-fg";
  const successDisabledClass =
    "bg-success-main text-success-fg cursor-not-allowed opacity-70";
  const greyDisabledClass =
    "bg-surface-3 text-foreground cursor-not-allowed opacity-50";

  const leftButtonClass = disabledDueToKeycard
    ? successDisabledClass
    : isDisabled
    ? greyDisabledClass
    : activeClass;

  const rightButtonClass = disabledDueToKeycard
    ? successDisabledClass
    : isDisabled
    ? greyDisabledClass
    : activeClass;

  /* ──────────────── handlers ───────────────────────────────────────────── */

  /**
   * Confirm keycard issuance / "No_card".
   * Creates a **Loan** transaction, records financials,
   * and logs activity code 10.
   */
  const handleConfirm = useCallback(async (): Promise<void> => {
    if (isDisabled) return Promise.resolve();

    setButtonDisabled(true);
    try {
      await new Promise<void>((resolve) => {
        setTrackedTimeout(resolve, 800);
      });

      const transactionId = generateTransactionId();
      const createdAt = getItalyIsoString();
      const depositAmount = payType === KeycardPayType.CASH ? 10 : 0;
      const item = payType === KeycardPayType.NO_CARD ? "No_card" : "Keycard";

      const depositType: LoanMethod = selectionToLoanMethod(payType, docType);

      console.log("[KeycardDepositButton] issue keycard", {
        bookingRef,
        occupantId,
        payType,
        docType,
        depositType,
        depositAmount,
        item,
      });

      await saveLoan(bookingRef, occupantId, transactionId, {
        count: cardCount,
        createdAt,
        depositType,
        deposit: depositAmount,
        item,
        type: "Loan",
      });

      if (item === "Keycard") {
        await addToAllTransactions(transactionId, {
          occupantId,
          bookingRef,
          amount: depositAmount,
          count: cardCount,
          description: "Keycard loan",
          method: depositType,
          type: "Loan",
          isKeycard: true,
          itemCategory: "keycard",
        });

        if (keycardNumber.trim()) {
          const roomNumber = booking.roomAllocated ?? booking.roomBooked ?? "";
          await assignGuestKeycard({
            keycardNumber: keycardNumber.trim(),
            occupantId,
            bookingRef,
            roomNumber,
            depositMethod: depositType,
            depositAmount,
            loanTxnId: transactionId,
          });
        }
      }

      const activityResult = await addActivity(occupantId, 10);
      if (!activityResult.success) {
        throw new Error(activityResult.error ?? "Failed to log keycard activity.");
      }

      showToast(
        payType === KeycardPayType.NO_CARD
          ? "Guest declined a keycard (No_card logged)."
          : `Issued 1 keycard (#${keycardNumber || "?"}) with deposit €${depositAmount}.`,
        payType === KeycardPayType.NO_CARD ? "info" : "success"
      );
      setKeycardNumber("");
    } catch {
      showToast("Error issuing keycard.", "error");
    } finally {
      setButtonDisabled(false);
      closeMenu();
    }
  }, [
    isDisabled,
    booking,
    bookingRef,
    occupantId,
    payType,
    docType,
    cardCount,
    keycardNumber,
    saveLoan,
    addToAllTransactions,
    assignGuestKeycard,
    addActivity,
    setTrackedTimeout,
    closeMenu,
  ]);

  /* ──────────────── render ─────────────────────────────────────────────── */
  return (
    <div className="relative">
      <div className="flex items-stretch rounded-md overflow-hidden">
        {/* Deposit-type selector */}
        <Button
          compatibilityMode="passthrough"
          ref={buttonRef}
          onClick={handleMenuToggle}
          disabled={isDisabled}
          className={`${baseButtonClass} rounded-none ${leftButtonClass}`}
          title={
            disabledDueToKeycard
              ? "Guest already has a keycard."
              : isDisabled
              ? "Keycard deposit action not available."
              : "Select deposit type"
          }
        >
          <depositIcon.icon size={16} />
        </Button>

        <div className="w-px self-stretch bg-border-1" />

        {/* Confirm action */}
        <Button
          compatibilityMode="passthrough"
          ref={confirmButtonRef}
          onClick={handleConfirm}
          disabled={isDisabled}
          className={`${baseButtonClass} rounded-none ${rightButtonClass}`}
          title={
            disabledDueToKeycard
              ? "Guest already has a keycard."
              : isDisabled
              ? "Keycard deposit action not available."
              : "Confirm keycard deposit"
          }
        >
          <Key size={14} />
        </Button>
      </div>

      {/* Dropdown menu (portal) */}
      {menuVisible &&
        menuPosition &&
        ReactDOM.createPortal(
          <KeycardDepositMenu
            menuOpen={menuOpen}
            menuPosition={menuPosition}
            payType={payType}
            docType={docType}
            keycardNumber={keycardNumber}
            buttonDisabled={buttonDisabled}
            setPayType={setPayType}
            setDocType={setDocType}
            setKeycardNumber={setKeycardNumber}
            handleConfirm={handleConfirm}
            closeMenu={closeMenu}
          />,
          document.body
        )}
    </div>
  );
}

export default memo(KeycardDepositButton);
