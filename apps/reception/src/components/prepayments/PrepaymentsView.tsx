import { memo } from "react";
import { PrepaymentData } from "../../hooks/client/checkin/usePrepaymentData";
import DeleteButton from "../checkins/header/DeleteButton";
import BookingPaymentsLists, {
  BookingPaymentItem,
} from "./BookingPaymentsLists";
import DeleteBookingModal from "./DeleteBookingModal";
import EntryDialog from "./EntryDialogue";

export type PaymentStatus = "failed" | "paid";

export interface PrepaymentsViewProps {
  loading: boolean;
  error: unknown;
  relevantData: PrepaymentData[];
  code21List: BookingPaymentItem[];
  code5List: BookingPaymentItem[];
  code6List: BookingPaymentItem[];
  filterText: string;
  setFilterText: (text: string) => void;
  lastCompletedBooking: PrepaymentData | null;
  handleRecallLast: () => void;
  isPete: boolean;
  handleDeleteClick: () => void;
  isDeleteMode: boolean;
  handleOpenBooking: (item: BookingPaymentItem) => void;
  handleRowClickForDelete: (item: BookingPaymentItem) => void;
  handleMarkAsPaid: (item: BookingPaymentItem) => Promise<void>;
  setMessage: (msg: string) => void;
  createPaymentTransaction: (
    bookingRef: string,
    guestId: string,
    amount: number
  ) => Promise<void>;
  logActivity: (
    occupantId: string,
    code: number,
    description: string
  ) => Promise<void>;
  selectedBooking: PrepaymentData | null;
  showEntryDialog: boolean;
  handleCloseDialogs: () => void;
  handleProcessPaymentAttempt: (status: PaymentStatus) => Promise<void>;
  handleSaveOrUpdateCardData: (data: {
    cardNumber: string;
    expiry: string;
  }) => Promise<void>;
  bookingToDelete: PrepaymentData | null;
  setBookingToDelete: (booking: PrepaymentData | null) => void;
}

function PrepaymentsView({
  loading,
  error,
  relevantData,
  code21List,
  code5List,
  code6List,
  filterText,
  setFilterText,
  lastCompletedBooking,
  handleRecallLast,
  isPete,
  handleDeleteClick,
  isDeleteMode,
  handleOpenBooking,
  handleRowClickForDelete,
  handleMarkAsPaid,
  setMessage,
  createPaymentTransaction,
  logActivity,
  selectedBooking,
  showEntryDialog,
  handleCloseDialogs,
  handleProcessPaymentAttempt,
  handleSaveOrUpdateCardData,
  bookingToDelete,
  setBookingToDelete,
}: PrepaymentsViewProps): JSX.Element {
  return (
    <div className="min-h-[80vh] p-4 bg-gray-100 font-sans text-gray-800 dark:bg-darkBg dark:text-darkAccentGreen">
      <div>
        <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
          PRE-PAYMENTS
        </h1>
        <div className="flex-grow bg-white rounded-lg shadow p-6 space-y-4 dark:bg-darkSurface">
          <>
            <div className="w-full flex justify-end mb-4 gap-2">
              <div className="w-72">
                <label
                  htmlFor="filterInput"
                  className="block text-sm font-heading text-gray-700 mb-1 dark:text-darkAccentGreen"
                >
                  Booking Ref or Surname
                </label>
                <input
                  id="filterInput"
                  type="text"
                  className="w-full border border-gray-400 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary-main font-body dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
                  placeholder="Type to filter..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleRecallLast}
                disabled={!lastCompletedBooking}
                className="px-3 py-2 bg-secondary-main text-white rounded hover:bg-secondary-dark transition-colors disabled:opacity-50"
              >
                Recall Last
              </button>
              {isPete && <DeleteButton onClick={handleDeleteClick} />}
            </div>
            {isDeleteMode && (
              <div className="text-red-600 text-sm font-semibold text-center">
                Click a row to delete the booking
              </div>
            )}

            {loading && (
              <div
                className="my-4 flex justify-center"
                role="status"
                aria-live="polite"
              >
                <div className="w-8 h-8 border-4 border-gray-400 border-t-primary-main rounded-full animate-spin dark:border-darkSurface" />
                <p className="ml-2 text-gray-600 dark:text-darkAccentGreen">Loading prepayment data...</p>
              </div>
            )}

            {error && (
              <div
                className="text-error-main font-semibold text-center mt-4 p-3 bg-error-light rounded"
                role="alert"
              >
                Error loading payment data:{" "}
                {error instanceof Error ? error.message : String(error)}
              </div>
            )}

            {!loading && !error && (
              <>
                {relevantData.length === 0 && (
                  <div className="text-gray-700 font-medium mt-4 text-center dark:text-darkAccentGreen">
                    No prepayment data was found.
                  </div>
                )}
                {relevantData.length > 0 &&
                  code21List.length === 0 &&
                  code5List.length === 0 &&
                  code6List.length === 0 &&
                  filterText && (
                    <div className="text-gray-700 font-medium mt-4 text-center dark:text-darkAccentGreen">
                      No prepayments match your filter &apos;{filterText}&apos;.
                    </div>
                  )}
                {(code21List.length > 0 ||
                  code5List.length > 0 ||
                  code6List.length > 0) && (
                  <div className="w-full mt-2">
                    <BookingPaymentsLists
                      code21List={code21List}
                      code5List={code5List}
                      code6List={code6List}
                      onOpenBooking={handleOpenBooking}
                      onBookingClick={
                        isDeleteMode ? handleRowClickForDelete : undefined
                      }
                      onMarkAsPaid={handleMarkAsPaid}
                      setMessage={setMessage}
                      createPaymentTransaction={createPaymentTransaction}
                      logActivity={logActivity}
                    />
                  </div>
                )}
              </>
            )}
          </>
        </div>
        {selectedBooking && showEntryDialog && (
          <EntryDialog
            key={selectedBooking.occupantId + selectedBooking.bookingRef}
            open={showEntryDialog}
            initialCardNumber={selectedBooking.ccCardNumber ?? ""}
            initialExpiry={selectedBooking.ccExpiry ?? ""}
            amountToCharge={selectedBooking.amountToCharge ?? 0}
            bookingRef={selectedBooking.bookingRef}
            onClose={handleCloseDialogs}
            onProcessPayment={handleProcessPaymentAttempt}
            onSaveOrUpdate={handleSaveOrUpdateCardData}
          />
        )}
        {bookingToDelete && (
          <DeleteBookingModal
            booking={bookingToDelete}
            onClose={() => setBookingToDelete(null)}
          />
        )}
      </div>
    </div>
  );
}

export default memo(PrepaymentsView);
