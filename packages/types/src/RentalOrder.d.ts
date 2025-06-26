export interface RentalOrder {
  id: string;
  sessionId: string;
  shop: string;
  deposit: number;
  expectedReturnDate?: string;
  startedAt: string;
  returnedAt?: string;
  refundedAt?: string;
}
