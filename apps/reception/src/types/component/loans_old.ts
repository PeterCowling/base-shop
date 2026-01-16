/**
 * Describes the shape of the "loans" node in Firebase.
 *
 * Firebase structure:
 *   loans/
 *     <bookingRef>/
 *       <occupantId>/
 *         txns/
 *           <transactionId>/
 *             { item, deposit, count, type, createdAt, ... }
 */
export interface LoansState {
  [bookingRef: string]: {
    [occupantId: string]: {
      txns?: {
        [transactionId: string]: {
          item: string;
          deposit: number;
          count: number;
          type: string;
          createdAt: string;
          method?: string;
          docType?: string;
        };
      };
    };
  };
}
