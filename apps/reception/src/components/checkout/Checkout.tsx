// File: /src/components/checkout/Checkout.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useLoanData } from "../../context/LoanDataContext";
import useCheckoutClient from "../../hooks/client/useCheckoutClient";
import useActivitiesByCodeData from "../../hooks/data/useActivitiesByCodeData";
import useActivitiesData from "../../hooks/data/useActivitiesData";
import useBagStorageData from "../../hooks/data/useBagStorageData";
import useBookings from "../../hooks/data/useBookingsData";
import { useCheckouts } from "../../hooks/data/useCheckouts";
import useFinancialsRoom from "../../hooks/data/useFinancialsRoom";
import useGuestByRoom from "../../hooks/data/useGuestByRoom";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import { useKeycardAssignments } from "../../hooks/data/useKeycardAssignments";
import useLoans from "../../hooks/data/useLoans";
import useActivitiesMutations from "../../hooks/mutations/useActivitiesMutations";
import useAllTransactions from "../../hooks/mutations/useAllTransactionsMutations";
import { useCheckoutsMutation } from "../../hooks/mutations/useCheckoutsMutation";
import { useKeycardAssignmentsMutations } from "../../hooks/mutations/useKeycardAssignmentsMutations";
import { type FirebaseBookings } from "../../types/hooks/data/bookingsData";
import { type LoanItem, type LoanMethod } from "../../types/hooks/data/loansData";
import { getItalyIsoString, getLocalToday } from "../../utils/dateUtils";
import { generateTransactionId } from "../../utils/generateTransactionId";
import { showToast } from "../../utils/toastUtils";
import { PageShell } from "../common/PageShell";
import ReceptionSkeleton from "../common/ReceptionSkeleton";
import { getDepositForItem } from "../loans/LoanUtils";

import type { Guest } from "./CheckoutTable";
import CheckoutTable from "./CheckoutTable";
import DateSelector from "./DaySelector";

type CheckoutProps = {
  debug?: boolean;
};

/**
 * Main Checkout component that fetches data, prepares a list of guests for
 * checkout, and renders the table.
 */
function CheckoutComponent({ debug: _debug }: CheckoutProps) {
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(getLocalToday());

  // ───────────────────────────────────────── Fetch data ──────────────────────────────────────────
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useBookings<FirebaseBookings | null>();

  const {
    guestsDetails,
    loading: occupantDetailsLoading,
    error: guestsDetailsError,
    validationError: _guestValErr,
  } = useGuestDetails();

  const {
    financialsRoom,
    loading: finLoading,
    error: finError,
  } = useFinancialsRoom();

  const { loans, loading: loansLoading, error: loansError } = useLoans();

  const {
    activities,
    loading: actLoading,
    error: actError,
  } = useActivitiesData();

  const {
    activitiesByCodes,
    loading: code14Loading,
    error: code14Error,
  } = useActivitiesByCodeData({ codes: [14] });

  const {
    checkouts,
    loading: checkoutsLoading,
    error: checkoutsError,
  } = useCheckouts();

  const {
    guestByRoom,
    loading: guestByRoomLoading,
    error: guestByRoomError,
  } = useGuestByRoom();

  const {
    bagStorage = {},
    loading: bagStorageLoading,
    error: bagStorageError,
  } = useBagStorageData();

  // ───────────────────────────── consolidate loading / error state ──────────────────────────────
  const loading =
    bookingsLoading ||
    occupantDetailsLoading ||
    finLoading ||
    loansLoading ||
    actLoading ||
    checkoutsLoading ||
    code14Loading ||
    guestByRoomLoading ||
    bagStorageLoading;

  const error =
    bookingsError ||
    guestsDetailsError ||
    finError ||
    loansError ||
    actError ||
    checkoutsError ||
    code14Error ||
    guestByRoomError ||
    bagStorageError;

  // ──────────────────────────────── prepare checkout rows ────────────────────────────────────────
  const checkoutRows = useCheckoutClient({
    bookings,
    guestsDetails,
    financialsRoom,
    loans,
    activities,
    activitiesByCodes,
    checkouts,
    guestByRoom,
    startDate: selectedDate,
    endDate: selectedDate,
    loading,
    error,
  });

  // ───────────────────────────────────────── mutations ───────────────────────────────────────────
  const { removeLoanItem } = useLoanData();
  const { saveActivity, removeLastActivity } = useActivitiesMutations();
  const { saveCheckout } = useCheckoutsMutation();
  const { addToAllTransactions } = useAllTransactions();
  const { assignmentsRecord } = useKeycardAssignments();
  const { returnKeycard } = useKeycardAssignmentsMutations();

  // Remove a single loan item
  const handleRemoveLoanItem = useCallback(
    (
      bookingRef: string,
      guestId: string,
      txnKey: string,
      item: string,
      depositType?: LoanMethod | string
    ) => {
      const txnId = generateTransactionId();
      const depositPerItem = getDepositForItem(item as LoanItem);
      const method = depositType || "NO_CARD";
      const amount = method === "CASH" ? -depositPerItem : 0;

      addToAllTransactions(txnId, {
        occupantId: guestId,
        bookingRef,
        amount,
        type: "Refund",
        method,
        count: 1,
        description:
          item === "Keycard" ? "Keycard returned" : `Returned ${item}`,
        itemCategory: item.toLowerCase(),
        ...(item === "Keycard" ? { isKeycard: true } : {}),
      })?.catch((err) => {
        console.error("Error logging loan return:", err);
        showToast("Failed to log loan return", "error");
      });

      removeLoanItem(bookingRef, guestId, txnKey, item, depositType)?.catch(
        (err) => {
          console.error("Error removing loan item:", err);
          showToast("Failed to remove loan item", "error");
        }
      );

      if (item === "Keycard") {
        const match = Object.entries(assignmentsRecord).find(
          ([, a]) =>
            a.status === "issued" &&
            a.occupantId === guestId &&
            a.bookingRef === bookingRef
        );
        if (match) {
          returnKeycard(match[0]);
        }
      }
    },
    [addToAllTransactions, assignmentsRecord, removeLoanItem, returnKeycard]
  );

  // Mark or un-mark a checkout as completed
  const onComplete = useCallback(
    async (
      bookingRef: string,
      guestId: string,
      isCompleted: boolean,
      checkoutDate: string
    ) => {
      if (!user) {
        console.warn("Not logged in.");
        return;
      }

      if (!checkoutDate) {
        console.warn(
          `[Checkout] Missing checkout date for occupant ${guestId} (${bookingRef}).`
        );
        return;
      }

      if (isCompleted) {
        try {
          const undoResult = await removeLastActivity(guestId, 14);
          if (!undoResult.success) {
            console.error("Error undoing checkout:", undoResult.error);
            showToast("Failed to reverse checkout", "error");
            return;
          }

          await saveCheckout(checkoutDate, { [guestId]: null });
          console.log(`Occupant ${guestId} checkout reversed.`);
        } catch (err) {
          console.error(
            `[Checkout] Error clearing checkout record for ${guestId}:`,
            err
          );
          const restoreResult = await saveActivity(guestId, {
            code: 14,
            description: "Compensating restore after checkout-reversal failure",
          });
          if (!restoreResult.success) {
            console.error(
              `[Checkout] Compensation failed while restoring checkout activity for ${guestId}:`,
              restoreResult.error
            );
          }
          showToast("Failed to update checkout record", "error");
        }
      } else {
        try {
          const completeResult = await saveActivity(guestId, {
            code: 14,
            description: "Manually completed checkout",
          });
          if (!completeResult.success) {
            console.error("Error marking checkout:", completeResult.error);
            showToast("Failed to mark checkout", "error");
            return;
          }

          await saveCheckout(checkoutDate, {
            [guestId]: {
              timestamp: getItalyIsoString(),
            },
          });
          console.log(`Occupant ${guestId} completed checkout.`);
        } catch (err) {
          console.error(
            `[Checkout] Error recording checkout for ${guestId}:`,
            err
          );
          const rollbackResult = await removeLastActivity(guestId, 14);
          if (!rollbackResult.success) {
            console.error(
              `[Checkout] Compensation failed while rolling back checkout activity for ${guestId}:`,
              rollbackResult.error
            );
          }
          showToast("Failed to record checkout", "error");
        }
      }
    },
    [
      user,
      saveActivity,
      removeLastActivity,
      saveCheckout,
    ]
  );

  // ────────────────────────────────────────── derive table data ──────────────────────────────────
  const guests: Guest[] = useMemo(
    () =>
      checkoutRows.map((row) => {
        const occupantId = row.occupantId ?? "";
        const storageRecord = bagStorage[occupantId];

        if (_debug) {
          console.debug(
            "Occupant:",
            occupantId,
            " => BagStorageRecord:",
            storageRecord
          );
        }

        return {
          _key: occupantId,
          bookingRef: row.bookingRef,
          guestId: occupantId,
          checkoutDate: row.checkOutDate,
          firstName: row.firstName,
          lastName: row.lastName,
          roomAllocated: row.rooms.join(", "),
          loans: Object.fromEntries(
            Object.entries(row.loans).map(([k, v]) => [
              k,
              {
                item: v.item,
                depositType: v.depositType,
              },
            ])
          ) as Record<string, { item: string; depositType?: LoanMethod }>,
          fridge: "",
          isCompleted: row.isCompleted,
          bagStorageOptedIn: storageRecord?.optedIn === true,
        };
      }),
    [checkoutRows, bagStorage, _debug]
  );

  // ───────────────────────────────────────────── render ───────────────────────────────────────────
  if (!user) {
    return (
      <p className="p-5 text-error-main">Not authorized. Please log in.</p>
    );
  }

  return (
    <PageShell title="CHECKOUTS">
      <div className="flex-grow p-6 space-y-4 bg-surface rounded-lg shadow-lg">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          username={user.user_name}
        />

        {!!error && (
          <div className="font-semibold text-error-main">
            Error loading checkout data: {String(error)}
          </div>
        )}

        {loading && <ReceptionSkeleton rows={5} />}

        {!loading && (
          <CheckoutTable
            guests={guests}
            removeLoanItem={handleRemoveLoanItem}
            onComplete={onComplete}
          />
        )}
      </div>
    </PageShell>
  );
}

export default React.memo(CheckoutComponent);
