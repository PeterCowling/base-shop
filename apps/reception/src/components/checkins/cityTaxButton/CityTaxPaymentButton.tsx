/* File: /src/components/checkins/CityTaxPaymentButton.tsx */
import { faCreditCard, faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  MouseEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";

import useCityTaxAmount from "./useCityTaxAmount";
import { useCityTaxPayment } from "./useCityTaxPayment";
import useActivitiesMutations from "../../../hooks/mutations/useActivitiesMutations";
import useAllTransactions from "../../../hooks/mutations/useAllTransactionsMutations";
import useCityTaxMutation from "../../../hooks/mutations/useCityTaxMutation";
import { CheckInRow } from "../../../types/component/CheckinRow";
import { PayType } from "../../../types/domains/cityTaxDomain";
import { generateTransactionId } from "../../../utils/generateTransactionId";
import { showToast } from "../../../utils/toastUtils";
import SmallSpinner from "../../search/SmallSpinner";

interface CityTaxPaymentButtonProps {
  booking: CheckInRow; // occupant-level type
}

function CityTaxPaymentButton({ booking }: CityTaxPaymentButtonProps) {
  const occupantId = booking.occupantId;
  const bookingRef = booking.bookingRef;

  // Derive occupant city tax payType & amount
  const { payType, setPayType, amount, loading } = useCityTaxAmount(
    bookingRef,
    occupantId,
    booking.cityTax
  );

  const { saveCityTax } = useCityTaxMutation();
  const { addActivity } = useActivitiesMutations();
  const { addToAllTransactions } = useAllTransactions();
  const { calculateCityTaxUpdate, buildCityTaxTransaction } =
    useCityTaxPayment();

  // Local UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const hideMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If amount <= 0 and data loaded, occupant is considered "paid"
  const isPaid = !loading && amount <= 0;
  const isDisabled = buttonDisabled || isPaid;

  // Show/hide dropdown menu
  useEffect(() => {
    if (menuOpen) {
      setMenuVisible(true);
      if (hideMenuTimeoutRef.current) {
        clearTimeout(hideMenuTimeoutRef.current);
        hideMenuTimeoutRef.current = null;
      }
    } else {
      if (hideMenuTimeoutRef.current) {
        clearTimeout(hideMenuTimeoutRef.current);
      }
      hideMenuTimeoutRef.current = setTimeout(() => {
        setMenuVisible(false);
        hideMenuTimeoutRef.current = null;
      }, 200);
    }
  }, [menuOpen]);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      if (hideMenuTimeoutRef.current) {
        clearTimeout(hideMenuTimeoutRef.current);
      }
      if (positionTimeoutRef.current) {
        clearTimeout(positionTimeoutRef.current);
      }
    };
  }, []);

  const schedulePositionReset = useCallback(() => {
    if (positionTimeoutRef.current) {
      clearTimeout(positionTimeoutRef.current);
    }
    positionTimeoutRef.current = setTimeout(() => {
      setMenuPosition(null);
      positionTimeoutRef.current = null;
    }, 200);
  }, [setMenuPosition]);

  const portalStyle = useMemo(
    () =>
      menuPosition
        ? {
            position: "absolute" as const,
            top: menuPosition.top,
            left: menuPosition.left,
          }
        : undefined,
    [menuPosition]
  );

  // Toggle dropdown
  const handleMenuToggle = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (isDisabled) {
        showToast(
          "City tax payment is already done or not applicable.",
          "info"
        );
        return;
      }
      if (!menuOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      } else {
        schedulePositionReset();
      }
      setMenuOpen((prev) => !prev);
    },
    [isDisabled, menuOpen, schedulePositionReset]
  );

  // PayType selector
  const handleMenuItemClick = useCallback(
    (selectedPayType: PayType) => {
      setPayType(selectedPayType);
      setMenuOpen(false);
      schedulePositionReset();
    },
    [setPayType, schedulePositionReset]
  );

  const handleMenuMouseLeave = useCallback(() => {
    setMenuOpen(false);
    schedulePositionReset();
  }, [schedulePositionReset]);

  const handleMenuItemClickCash = useCallback(() => {
    handleMenuItemClick("CASH");
  }, [handleMenuItemClick]);

  const handleMenuItemClickCC = useCallback(() => {
    handleMenuItemClick("CC");
  }, [handleMenuItemClick]);

  // Process immediate payment
  const handleImmediatePayment = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (isDisabled) {
        showToast(
          "City tax payment is already done or not applicable.",
          "info"
        );
        return;
      }

      try {
        setButtonDisabled(true);

        // occupant's city tax record
        const occupantTax = booking.cityTax;
        if (!occupantTax) {
          showToast("No city tax record found for this occupant.", "warning");
          return;
        }

        // Compute updated paid/balance
        const { newTotalPaid, newBalance } = calculateCityTaxUpdate(
          occupantTax,
          amount
        );

        // Write occupant city tax changes
        await saveCityTax(bookingRef, occupantId, {
          totalPaid: newTotalPaid,
          balance: newBalance,
        });

        // Record transaction in occupant's cityTax/transactions
        const txnId = generateTransactionId();
        const transactionData = buildCityTaxTransaction(amount);
        await saveCityTax(bookingRef, occupantId, {
          [`transactions/${txnId}`]: transactionData,
        });

        // Occupant-level activity (code=9)
        await addActivity(occupantId, 9);

        // Mirror in /allFinancialTransactions
        await addToAllTransactions(txnId, {
          bookingRef,
          occupantId,
          amount,
          type: "taxPayment",
          method: payType,
          itemCategory: "cityTax",
          count: 1,
          nonRefundable: false,
          docType: "",
          description: "City tax payment",
        });

        showToast("City tax payment successful!", "success");
      } catch {
        showToast("Error confirming city tax payment", "error");
      } finally {
        setButtonDisabled(false);
      }
    },
    [
      isDisabled,
      bookingRef,
      occupantId,
      amount,
      calculateCityTaxUpdate,
      saveCityTax,
      buildCityTaxTransaction,
      addActivity,
      addToAllTransactions,
      payType,
      booking.cityTax,
    ]
  );

  // Icon & label
  const getPayTypeIcon = () => (payType === "CC" ? faCreditCard : faMoneyBill);
  const getButtonLabel = () => {
    if (loading) return <SmallSpinner />;
    return amount > 0 ? `€${amount.toFixed(2)}` : "Paid";
  };
  // Style classes
  const activeClass = "bg-primary-main hover:bg-primary-dark text-white dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80";
  const disabledClass =
    "bg-success-light text-white cursor-not-allowed opacity-70";
  const baseButtonClass =
    "min-h-[55px] px-4 flex items-center justify-center focus:outline-none transition-colors";

  const leftButtonClass = isDisabled
    ? disabledClass
    : `${activeClass} border-r border-gray-400/20`;
  const rightButtonClass = isDisabled ? disabledClass : activeClass;

  return (
    <div className="relative flex items-center">
      {/* Left button: choose payment type */}
      <button
        ref={buttonRef}
        onClick={handleMenuToggle}
        disabled={isDisabled}
        className={`${baseButtonClass} rounded-l ${leftButtonClass}`}
        title={
          isDisabled
            ? "City tax is already paid or not applicable."
            : "Click to choose payment type"
        }
      >
        <FontAwesomeIcon
          icon={getPayTypeIcon()}
          size="lg"
          title={payType === "CC" ? "Credit Card" : "Cash"}
        />
      </button>

      {/* Right button: immediate payment */}
      <button
        onClick={handleImmediatePayment}
        disabled={isDisabled}
        className={`${baseButtonClass} rounded-r ${rightButtonClass}`}
        title={
          isDisabled
            ? "City tax is already paid or not applicable."
            : "Pay immediately with selected type"
        }
      >
        {getButtonLabel()}
      </button>

      {/* Dropdown menu */}
      {menuVisible &&
        !isDisabled &&
        menuPosition &&
        ReactDOM.createPortal(
          <div
            style={portalStyle}
            className={`z-50 mt-1 w-32 border border-gray-400 rounded shadow-lg bg-white p-3 dark:bg-darkSurface dark:text-darkAccentGreen
              transition-opacity duration-200 transform-gpu
              ${menuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            onMouseLeave={handleMenuMouseLeave}
          >
            <button
              onClick={handleMenuItemClickCash}
              className="w-full text-left px-3 py-1 focus:outline-none transition-colors hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
              CASH
            </button>
            <button
              onClick={handleMenuItemClickCC}
              className="w-full text-left px-3 py-1 focus:outline-none transition-colors hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
              CC
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

export default memo(CityTaxPaymentButton);
