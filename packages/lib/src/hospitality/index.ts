const HOSPITALITY_RTDB_ROOTS = {
  occupantIndex: 'occupantIndex',
  bookings: 'bookings',
  guestDetails: 'guestsDetails',
  guestByRoom: 'guestByRoom',
  financialsRoom: 'financialsRoom',
  preorder: 'preorder',
  cityTax: 'cityTax',
  bagStorage: 'bagStorage',
  completedTasks: 'completedTasks',
  loans: 'loans',
  activities: 'activities',
  activitiesByCode: 'activitiesByCode',
  checkins: 'checkins',
  checkouts: 'checkouts',
  guestsByBooking: 'guestsByBooking',
  primeRequests: 'primeRequests',
  roomsByDate: 'roomsByDate',
} as const;

export { HOSPITALITY_RTDB_ROOTS };

export type HospitalityLoanTransactionType = 'Loan' | 'Refund' | 'No_Card';

function joinFirebasePath(...segments: Array<string | null | undefined>): string {
  return segments
    .filter((segment): segment is string => Boolean(segment))
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

export function normalizeHospitalityLoanTransactionType(
  value: string | null | undefined,
): HospitalityLoanTransactionType | null {
  if (!value) {
    return null;
  }

  switch (value.trim().toLowerCase()) {
    case 'loan':
      return 'Loan';
    case 'refund':
      return 'Refund';
    case 'no_card':
    case 'no-card':
    case 'no card':
    case 'nocard':
      return 'No_Card';
    default:
      return null;
  }
}

export function roomsByDateIndexKey(roomNumber: string): string {
  return `index_${roomNumber}`;
}

export function occupantIndexPath(occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.occupantIndex, occupantId);
}

export function bookingRootPath(bookingRef: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.bookings, bookingRef);
}

export function bookingOccupantPath(bookingRef: string, occupantId: string): string {
  return joinFirebasePath(bookingRootPath(bookingRef), occupantId);
}

export function guestDetailsBookingPath(bookingRef: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.guestDetails, bookingRef);
}

export function guestDetailsOccupantPath(bookingRef: string, occupantId: string): string {
  return joinFirebasePath(guestDetailsBookingPath(bookingRef), occupantId);
}

export function guestByRoomOccupantPath(occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.guestByRoom, occupantId);
}

export function financialsRoomPath(bookingRef: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.financialsRoom, bookingRef);
}

export function preorderOccupantPath(occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.preorder, occupantId);
}

export function cityTaxBookingPath(bookingRef: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.cityTax, bookingRef);
}

export function cityTaxOccupantPath(bookingRef: string, occupantId: string): string {
  return joinFirebasePath(cityTaxBookingPath(bookingRef), occupantId);
}

export function bagStorageOccupantPath(occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.bagStorage, occupantId);
}

export function completedTasksOccupantPath(occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.completedTasks, occupantId);
}

export function loansBookingPath(bookingRef: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.loans, bookingRef);
}

export function loansOccupantPath(bookingRef: string, occupantId: string): string {
  return joinFirebasePath(loansBookingPath(bookingRef), occupantId);
}

export function loansTransactionsPath(bookingRef: string, occupantId: string): string {
  return joinFirebasePath(loansOccupantPath(bookingRef, occupantId), 'txns');
}

export function loansTransactionPath(
  bookingRef: string,
  occupantId: string,
  transactionId: string,
): string {
  return joinFirebasePath(loansTransactionsPath(bookingRef, occupantId), transactionId);
}

export function activitiesOccupantPath(occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.activities, occupantId);
}

export function activitiesByCodeOccupantPath(code: string, occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.activitiesByCode, code, occupantId);
}

export function checkinOccupantPath(dateKey: string, occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.checkins, dateKey, occupantId);
}

export function checkoutOccupantPath(dateKey: string, occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.checkouts, dateKey, occupantId);
}

export function guestsByBookingOccupantPath(occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.guestsByBooking, occupantId);
}

export function primeRequestByGuestPath(occupantId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.primeRequests, 'byGuest', occupantId);
}

export function primeRequestByIdPath(requestId: string): string {
  return joinFirebasePath(HOSPITALITY_RTDB_ROOTS.primeRequests, 'byId', requestId);
}

export function roomsByDateRoomPath(dateKey: string, roomNumber: string): string {
  return joinFirebasePath(
    HOSPITALITY_RTDB_ROOTS.roomsByDate,
    dateKey,
    roomsByDateIndexKey(roomNumber),
    roomNumber,
  );
}

export function roomsByDateGuestIdsPath(dateKey: string, roomNumber: string): string {
  return joinFirebasePath(roomsByDateRoomPath(dateKey, roomNumber), 'guestIds');
}
