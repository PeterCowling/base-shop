// src/components/prepayments/PrepaymentsContainer.tsx
import { memo, useCallback, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import usePrepaymentData, {
  PrepaymentData,
} from "../../hooks/client/checkin/usePrepaymentData";
import useActivitiesMutations from "../../hooks/mutations/useActivitiesMutations";
import useAllTransactions from "../../hooks/mutations/useAllTransactionsMutations";
import useCCDetailsMutations from "../../hooks/mutations/useCCDetailsMutations";
import useFinancialsRoomMutations from "../../hooks/mutations/useFinancialsRoomMutations";
import { generateTransactionId } from "../../utils/generateTransactionId";
import { getCurrentIsoTimestamp } from "../../utils/dateUtils";
import { BookingPaymentItem } from "./BookingPaymentsLists";
import PrepaymentsView, { PaymentStatus } from "./PrepaymentsView";

interface PrepaymentsContainerProps {
  setMessage: (message: string) => void;
}

function PrepaymentsContainer({
  setMessage,
}: PrepaymentsContainerProps): JSX.Element {
  const { relevantData, loading, error } = usePrepaymentData();

  // 2) Pull in new "write" hooks
  const { addActivity, logActivity } = useActivitiesMutations();
  const { addToAllTransactions } = useAllTransactions();
  const { saveCCDetails } = useCCDetailsMutations();
  const { saveFinancialsRoom } = useFinancialsRoomMutations();
  const { user } = useAuth();
  const isPete = user?.user_name === "Pete";
  const [selectedBooking, setSelectedBooking] = useState<PrepaymentData | null>(
    null
  );
  const [showEntryDialog, setShowEntryDialog] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>("");
  const [lastCompletedBooking, setLastCompletedBooking] =
    useState<PrepaymentData | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<PrepaymentData | null>(
    null
  );

  /**
   * Creates a payment transaction in Firebase.
   */
  const createPaymentTransaction = useCallback(
    async (bookingRef: string, occupantId: string, amount: number) => {
      const transactionId = generateTransactionId();
      const nowISO = getCurrentIsoTimestamp();

      // Add to /allFinancialTransactions
      await addToAllTransactions(transactionId, {
        amount,
        bookingRef,
        occupantId,
        count: 1,
        description: "Prepayment",
        itemCategory: "ROOM",
        method: "CARD",
        timestamp: nowISO,
        type: "PAYMENT",
        user_name: "System",
        nonRefundable: true,
      });

      // Also update /financialsRoom
      await saveFinancialsRoom(bookingRef, {
        transactions: {
          [transactionId]: {
            occupantId,
            amount,
            bookingRef,
            timestamp: nowISO,
            nonRefundable: true,
            type: "payment",
          },
        },
      });

      // Log successful payment activity
      await addActivity(occupantId, 8);
    },
    [addToAllTransactions, saveFinancialsRoom, addActivity]
  );

  // Filter data by bookingRef or occupantName
  const filteredRelevantData = useMemo(() => {
    if (!filterText) return relevantData;
    const lowerText = filterText.toLowerCase();

    return relevantData.filter((item) => {
      const refMatch = item.bookingRef.toLowerCase().includes(lowerText);
      const nameMatch =
        item.occupantName?.toLowerCase().includes(lowerText) ?? false;
      return refMatch || nameMatch;
    });
  }, [relevantData, filterText]);

  /**
   * Splits the filtered data by code pattern.
   */
  const { code21List, code5List, code6List } = useMemo(() => {
    const code21Arr: BookingPaymentItem[] = [];
    const code5Arr: BookingPaymentItem[] = [];
    const code6Arr: BookingPaymentItem[] = [];

    filteredRelevantData.forEach((item) => {
      const {
        codes = [],
        bookingRef,
        occupantName,
        occupantId,
        ccCardNumber,
        ccExpiry,
        amountToCharge,
        checkInDate,
      } = item;

      const getHours = () => {
        if (codes.includes(21) && item.hoursElapsed21 !== undefined) {
          return item.hoursElapsed21;
        } else if (codes.includes(5) && item.hoursElapsed5 !== undefined) {
          return item.hoursElapsed5;
        } else if (codes.includes(6) && item.hoursElapsed6 !== undefined) {
          return item.hoursElapsed6;
        }
        return null;
      };
      const hoursElapsed = getHours();

      const baseItem = {
        bookingRef,
        occupantId,
        occupantName: occupantName ?? "N/A",
        codes,
        hoursElapsed,
        ccCardNumber,
        ccExpiry,
        amountToCharge,
        checkInDate,
      };

      if (codes.includes(21) && ![5, 6, 7, 8].some((c) => codes.includes(c))) {
        code21Arr.push(baseItem);
      } else if (
        codes.includes(5) &&
        ![6, 7, 8].some((c) => codes.includes(c))
      ) {
        code5Arr.push(baseItem);
      } else if (codes.includes(6) && ![7, 8].some((c) => codes.includes(c))) {
        code6Arr.push(baseItem);
      }
    });

    const sortByHours = (a: BookingPaymentItem, b: BookingPaymentItem) =>
      (b.hoursElapsed ?? 0) - (a.hoursElapsed ?? 0);

    code21Arr.sort(sortByHours);
    code5Arr.sort(sortByHours);
    code6Arr.sort(sortByHours);

    return { code21List: code21Arr, code5List: code5Arr, code6List: code6Arr };
  }, [filteredRelevantData]);

  // Handlers
  const handleOpenBooking = useCallback(
    (item: BookingPaymentItem): void => {
      const found = relevantData.find(
        (d) =>
          d.occupantId === item.occupantId && d.bookingRef === item.bookingRef
      );
      if (!found) {
        console.error("Could not find full booking data for", item.bookingRef);
        setMessage(`Error: Could not load details for ${item.bookingRef}`);
        return;
      }

      setSelectedBooking(found);
      setShowEntryDialog(true);
    },
    [relevantData, setMessage]
  );

  const handleCloseDialogs = useCallback((): void => {
    setShowEntryDialog(false);
    setSelectedBooking(null);
  }, []);

  const handleRecallLast = useCallback((): void => {
    if (!lastCompletedBooking) {
      setMessage("No completed transaction to recall.");
      return;
    }
    setSelectedBooking(lastCompletedBooking);
    setShowEntryDialog(true);
  }, [lastCompletedBooking, setMessage]);

  const handleDeleteClick = useCallback(() => {
    setIsDeleteMode((prev) => !prev);
  }, []);

  const handleRowClickForDelete = useCallback(
    (item: BookingPaymentItem) => {
      const found = relevantData.find(
        (d) =>
          d.bookingRef === item.bookingRef && d.occupantId === item.occupantId
      );
      if (found) {
        setBookingToDelete(found);
      }
      setIsDeleteMode(false);
    },
    [relevantData]
  );

  const handleSaveOrUpdateCardData = useCallback(
    async ({
      cardNumber,
      expiry,
    }: {
      cardNumber: string;
      expiry: string;
    }): Promise<void> => {
      if (!selectedBooking?.bookingRef || !selectedBooking?.occupantId) {
        console.error("Missing booking context for saving card data");
        setMessage("Error: Cannot save card details without booking context.");
        return;
      }

      const { bookingRef, occupantId } = selectedBooking;
      const hadExistingCard = !!relevantData.find(
        (d) => d.bookingRef === bookingRef
      )?.ccCardNumber;

      try {
        await saveCCDetails(bookingRef, occupantId, {
          ccNum: cardNumber,
          expDate: expiry,
        });

        setSelectedBooking((prev) =>
          prev ? { ...prev, ccCardNumber: cardNumber, ccExpiry: expiry } : null
        );

        const messageAction = hadExistingCard ? "Updated" : "Saved";
        setMessage(`${messageAction} card for reservation ${bookingRef}`);
      } catch (error) {
        console.error("Failed to save CC details:", error);
        setMessage(
          `Error saving card details for ${bookingRef}. ${
            error instanceof Error ? error.message : ""
          }`
        );
      }
    },
    [selectedBooking, saveCCDetails, setMessage, relevantData]
  );

  const handleProcessPaymentAttempt = useCallback(
    async (status: PaymentStatus): Promise<void> => {
      if (!selectedBooking) {
        console.error("No booking selected for payment processing.");
        setMessage("Error: No booking selected.");
        return;
      }

      const {
        bookingRef,
        occupantId,
        codes = [],
        amountToCharge = 0,
      } = selectedBooking;

      try {
        if (status === "failed") {
          let codeToLog = 5;
          if (codes.includes(5) && !codes.includes(6)) {
            codeToLog = 6;
          } else if (codes.includes(6)) {
            codeToLog = 7;
          }
          await addActivity(occupantId, codeToLog);
          setMessage(`Payment failed for ${bookingRef}. Status code updated.`);
        }

        if (status === "paid") {
          if (amountToCharge <= 0) {
            setMessage(
              `Error: Amount to charge for ${bookingRef} is invalid (${amountToCharge}).`
            );
            console.error(
              `Invalid amount ${amountToCharge} for booking ${bookingRef}`
            );
            return;
          }
          await createPaymentTransaction(
            bookingRef,
            occupantId,
            amountToCharge
          );
          setLastCompletedBooking(selectedBooking);
          setMessage(`Payment successful for ${bookingRef}`);
          handleCloseDialogs();
        }
      } catch (error) {
        console.error("Error processing payment status:", error);
        setMessage(
          `Error processing payment for ${bookingRef}. ${
            error instanceof Error ? error.message : ""
          }`
        );
      }
    },
    [
      selectedBooking,
      addActivity,
      createPaymentTransaction,
      handleCloseDialogs,
      setLastCompletedBooking,
      setMessage,
    ]
  );

  const handleMarkAsPaid = useCallback(
    async (item: BookingPaymentItem): Promise<void> => {
      if (item.amountToCharge <= 0) {
        setMessage(
          `Error: Amount to charge for ${item.bookingRef} is invalid (${item.amountToCharge}). Cannot mark as paid.`
        );
        console.error(
          `Invalid amount ${item.amountToCharge} for booking ${item.bookingRef} in handleMarkAsPaid`
        );
        return;
      }
      try {
        await createPaymentTransaction(
          item.bookingRef,
          item.occupantId,
          item.amountToCharge
        );
        const found = relevantData.find(
          (d) =>
            d.bookingRef === item.bookingRef && d.occupantId === item.occupantId
        );
        if (found) {
          setLastCompletedBooking(found);
        }
        setMessage(`Marked reservation ${item.bookingRef} as paid.`);
      } catch (error) {
        console.error("Error marking as paid:", error);
        setMessage(
          `Error marking ${item.bookingRef} as paid. ${
            error instanceof Error ? error.message : ""
          }`
        );
      }
    },
    [
      createPaymentTransaction,
      relevantData,
      setLastCompletedBooking,
      setMessage,
    ]
  );

  return (
    <PrepaymentsView
      loading={loading}
      error={error}
      relevantData={relevantData}
      code21List={code21List}
      code5List={code5List}
      code6List={code6List}
      filterText={filterText}
      setFilterText={setFilterText}
      lastCompletedBooking={lastCompletedBooking}
      handleRecallLast={handleRecallLast}
      isPete={isPete}
      handleDeleteClick={handleDeleteClick}
      isDeleteMode={isDeleteMode}
      handleOpenBooking={handleOpenBooking}
      handleRowClickForDelete={handleRowClickForDelete}
      handleMarkAsPaid={handleMarkAsPaid}
      setMessage={setMessage}
      createPaymentTransaction={createPaymentTransaction}
      logActivity={logActivity}
      selectedBooking={selectedBooking}
      showEntryDialog={showEntryDialog}
      handleCloseDialogs={handleCloseDialogs}
      handleProcessPaymentAttempt={handleProcessPaymentAttempt}
      handleSaveOrUpdateCardData={handleSaveOrUpdateCardData}
      bookingToDelete={bookingToDelete}
      setBookingToDelete={setBookingToDelete}
    />
  );
}

export default memo(PrepaymentsContainer);
