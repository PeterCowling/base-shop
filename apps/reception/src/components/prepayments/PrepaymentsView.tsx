import { memo } from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { type PrepaymentData } from "../../hooks/client/checkin/usePrepaymentData";
import DeleteButton from "../checkins/header/DeleteButton";
import { PageShell } from "../common/PageShell";
import { Spinner } from "../common/Spinner";

import BookingPaymentsLists, {
  type BookingPaymentItem,
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
    <PageShell title="PREPAYMENTS">
      <div>
        <div className="flex-grow bg-surface rounded-lg shadow-lg p-6 space-y-4">
          <>
            <div className="w-full flex justify-end mb-4 gap-2">
              <div className="w-72">
                <label
                  htmlFor="filterInput"
                  className="block text-sm font-heading text-foreground mb-1"
                >
                  Booking Ref or Surname
                </label>
                <Input
                  compatibilityMode="no-wrapper"
                  id="filterInput"
                  type="text"
                  className="w-full border border-border-strong rounded-lg px-3 py-1 font-body"
                  placeholder="Type to filter..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleRecallLast}
                disabled={!lastCompletedBooking}
                color="accent"
                tone="solid"
              >
                Recall Last
              </Button>
              {isPete && <DeleteButton onClick={handleDeleteClick} />}
            </div>
            {isDeleteMode && (
              <div className="bg-warning/10 border border-warning rounded-lg px-4 py-3 flex items-center gap-3">
                <span className="text-warning shrink-0 text-base" aria-hidden="true">⚠</span>
                <span className="text-foreground text-sm font-semibold">
                  Click a row to delete the booking
                </span>
              </div>
            )}

            {loading && (
              <div className="my-4 flex items-center justify-center gap-2" aria-live="polite">
                <Spinner size="md" label="Loading prepayment data" />
                <p className="text-sm text-muted-foreground">Loading prepayment data...</p>
              </div>
            )}

            {error && (
              <div
                className="text-danger-fg font-semibold text-center mt-4 p-3 bg-danger-fg/10 rounded-lg border border-danger-fg/30"
                role="alert"
              >
                Error loading payment data:{" "}
                {error instanceof Error ? error.message : String(error)}
              </div>
            )}

            {!loading && !error && (
              <>
                {relevantData.length === 0 && (
                  <div className="text-foreground font-medium mt-4 text-center">
                    No prepayment data was found.
                  </div>
                )}
                {relevantData.length > 0 &&
                  code21List.length === 0 &&
                  code5List.length === 0 &&
                  code6List.length === 0 &&
                  filterText && (
                    <div className="text-foreground font-medium mt-4 text-center">
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
    </PageShell>
  );
}

export default memo(PrepaymentsView);
