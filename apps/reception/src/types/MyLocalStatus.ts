// File: src/types/MyLocalStatus.ts
export type MyLocalStatus =
  | "free" //must keep
  | "disabled" //must keep
  | "awaiting" //must keep
  | "confirmed" //must keep
  | "1" //Booking created
  | "8" //Room payment made
  | "12" //checkedIn
  | "14" //Checkout complete
  | "23" //Bag dropped - way in or way out
  | "16"; //Bags picked up - way out
