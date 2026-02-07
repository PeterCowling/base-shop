export const GUEST_CRITICAL_FLOW_ENDPOINTS = {
  booking_details: '/api/guest-booking',
  arrival_code: '/api/check-in-code',
  extension_request: '/api/extension-request',
  meal_orders: '/api/firebase/preorders',
  bag_drop: '/api/bag-drop-request',
  staff_lookup_payload: '/api/check-in-lookup',
} as const;
