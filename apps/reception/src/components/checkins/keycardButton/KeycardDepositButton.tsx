// src/components/checkins/KeycardButton/KeycardDepositButton.tsx
import {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBan,
  faFileAlt,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useLoanData } from "../../../context/LoanDataContext";
import useActivitiesMutations from "../../../hooks/mutations/useActivitiesMutations";
import useAllTransactions from "../../../hooks/mutations/useAllTransactionsMutations";
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
  const { addActivity } = useActivitiesMutations();
  const { saveLoan } = useLoanData();
  const { addToAllTransactions } = useAllTransactions();

  /* ──────────────── keycard / “No_card” status ─────────────────────────── */
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

  /* ──────────────── menu / dropdown state ──────────────────────────────── */
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  /* Reference for the confirm ("Keycard") button so it can be resized */
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmButtonWidth, setConfirmButtonWidth] = useState<number | null>(
    null
  );

  /* Track active timers so they can be cleared on unmount */
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const setTrackedTimeout = useCallback(
    (fn: () => void, delay: number): ReturnType<typeof setTimeout> => {
      const id = setTimeout(() => {
        fn();
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      }, delay);
      timeoutsRef.current.push(id);
      return id;
    },
    [timeoutsRef]
  );

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  /* Ensure the confirm button is exactly 15 px narrower than its natural width */
  useLayoutEffect(() => {
    if (confirmButtonRef.current && confirmButtonWidth === null) {
      const naturalWidth = confirmButtonRef.current.offsetWidth;
      setConfirmButtonWidth(naturalWidth - 15);
    }
  }, [confirmButtonWidth]);

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
    icon: IconDefinition;
    className: string;
  } => {
    switch (payType) {
      case KeycardPayType.DOCUMENT:
        return {
          icon: faFileAlt,
          className: "text-yellow-400 dark:text-darkAccentOrange",
        };
      case KeycardPayType.NO_CARD:
        return { icon: faBan, className: "dark:text-darkAccentGreen" };
      case KeycardPayType.CASH:
      default:
        return {
          icon: faMoneyBill,
          className: "text-green-400 dark:text-darkAccentGreen",
        };
    }
  }, [payType]);

  /* Issue only one keycard unless “No_card” was chosen. */
  const cardCount = 1;

  /* ──────────────── dropdown fade-in / out ─────────────────────────────── */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (menuOpen) setMenuVisible(true);
    else timer = setTrackedTimeout(() => setMenuVisible(false), 200);
    return () => {
      if (timer) {
        clearTimeout(timer);
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== timer);
      }
    };
  }, [menuOpen, setTrackedTimeout]);

  /* ──────────────── disabled logic ─────────────────────────────────────── */
  const disabledDueToKeycard = hasKeycard || hasNoCard;
  const disabledDueToOther = !bookingRef || !occupantId || buttonDisabled;
  const isDisabled = disabledDueToKeycard || disabledDueToOther;

  /* ──────────────── styling helpers ────────────────────────────────────── */
  const baseButtonClass =
    "min-h-[55px] px-4 flex items-center justify-center transition-colors focus:outline-none";

  const activeClass =
    "bg-primary-main hover:bg-primary-dark text-white dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80";
  const successDisabledClass =
    "bg-success-light text-white cursor-not-allowed opacity-70";
  const greyDisabledClass =
    "bg-gray-400 text-white cursor-not-allowed opacity-70 dark:bg-darkSurface dark:text-darkAccentGreen";

  const leftButtonClass = disabledDueToKeycard
    ? `${successDisabledClass} border-r border-gray-200/20 dark:border-darkSurface`
    : isDisabled
    ? greyDisabledClass
    : `${activeClass} border-r border-gray-200/20 dark:border-darkSurface`;

  const rightButtonClass = disabledDueToKeycard
    ? successDisabledClass
    : isDisabled
    ? greyDisabledClass
    : activeClass;

  /* ──────────────── handlers ───────────────────────────────────────────── */
  const handleMenuToggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (isDisabled) {
        showToast("Keycard deposit action not available.", "warning");
        return;
      }
      if (!menuOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      } else {
        setTrackedTimeout(() => setMenuPosition(null), 200);
      }
      setMenuOpen((prev) => !prev);
    },
    [isDisabled, menuOpen, setTrackedTimeout]
  );

  /**
   * Confirm keycard issuance / “No_card”.
   * Creates a **Loan** transaction, records financials,
   * and logs activity code 10.
   */
  const handleConfirm = useCallback((): Promise<void> => {
    if (isDisabled) return Promise.resolve();

    setButtonDisabled(true);
    return new Promise<void>((resolve) => {
      setTrackedTimeout(resolve, 800);
    })
      .then(() => {
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

        saveLoan(bookingRef, occupantId, transactionId, {
          count: cardCount,
          createdAt,
          depositType,
          deposit: depositAmount,
          item,
          type: "Loan",
        });

        if (item === "Keycard") {
          addToAllTransactions(transactionId, {
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
        }

        addActivity(occupantId, 10);

        showToast(
          payType === KeycardPayType.NO_CARD
            ? "Guest declined a keycard (No_card logged)."
            : `Issued 1 keycard with deposit €${depositAmount}.`,
          payType === KeycardPayType.NO_CARD ? "info" : "success"
        );
      })
      .catch(() => {
        showToast("Error issuing keycard.", "error");
      })
      .finally(() => {
        setButtonDisabled(false);
        setMenuOpen(false);
        setTrackedTimeout(() => setMenuPosition(null), 200);
      });
  }, [
    isDisabled,
    bookingRef,
    occupantId,
    payType,
    docType,
    cardCount,
    saveLoan,
    addToAllTransactions,
    addActivity,
    setTrackedTimeout,
  ]);

  /* ──────────────── render ─────────────────────────────────────────────── */
  return (
    <div className="relative flex items-center">
      {/* Deposit-type selector */}
      <button
        ref={buttonRef}
        onClick={handleMenuToggle}
        disabled={isDisabled}
        className={`${baseButtonClass} rounded-l ${leftButtonClass}`}
        title={
          disabledDueToKeycard
            ? "Guest already has a keycard."
            : isDisabled
            ? "Keycard deposit action not available."
            : "Select deposit type"
        }
      >
        <FontAwesomeIcon
          icon={depositIcon.icon}
          className={depositIcon.className}
          size="lg"
        />
      </button>

      {/* Confirm action */}
      <button
        ref={confirmButtonRef}
        onClick={handleConfirm}
        disabled={isDisabled}
        style={confirmButtonWidth ? { width: confirmButtonWidth } : undefined}
        className={`${baseButtonClass} rounded-r ${rightButtonClass}`}
        title={
          disabledDueToKeycard
            ? "Guest already has a keycard."
            : isDisabled
            ? "Keycard deposit action not available."
            : "Confirm keycard deposit"
        }
      >
        <span className="ms-2 hidden md:inline">Keycard</span>
      </button>

      {/* Dropdown menu (portal) */}
      {menuVisible &&
        menuPosition &&
        ReactDOM.createPortal(
          <KeycardDepositMenu
            menuOpen={menuOpen}
            menuPosition={menuPosition}
            payType={payType}
            docType={docType}
            buttonDisabled={buttonDisabled}
            setPayType={setPayType}
            setDocType={setDocType}
            handleConfirm={handleConfirm}
            closeMenu={() => {
              setMenuOpen(false);
              setTrackedTimeout(() => setMenuPosition(null), 200);
            }}
          />,
          document.body
        )}
    </div>
  );
}

export default memo(KeycardDepositButton);
