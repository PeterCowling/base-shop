import { onRequestGet as __api_firebase_bookings_ts_onRequestGet } from "/Users/petercowling/base-shop/apps/prime/functions/api/firebase/bookings.ts"
import { onRequestGet as __api_firebase_guest_details_ts_onRequestGet } from "/Users/petercowling/base-shop/apps/prime/functions/api/firebase/guest-details.ts"
import { onRequestGet as __api_firebase_preorders_ts_onRequestGet } from "/Users/petercowling/base-shop/apps/prime/functions/api/firebase/preorders.ts"
import { onRequestPost as __api_firebase_preorders_ts_onRequestPost } from "/Users/petercowling/base-shop/apps/prime/functions/api/firebase/preorders.ts"
import { onRequestPost as __api_bag_drop_request_ts_onRequestPost } from "/Users/petercowling/base-shop/apps/prime/functions/api/bag-drop-request.ts"
import { onRequestGet as __api_check_in_code_ts_onRequestGet } from "/Users/petercowling/base-shop/apps/prime/functions/api/check-in-code.ts"
import { onRequestPost as __api_check_in_code_ts_onRequestPost } from "/Users/petercowling/base-shop/apps/prime/functions/api/check-in-code.ts"
import { onRequestGet as __api_check_in_lookup_ts_onRequestGet } from "/Users/petercowling/base-shop/apps/prime/functions/api/check-in-lookup.ts"
import { onRequestPost as __api_extension_request_ts_onRequestPost } from "/Users/petercowling/base-shop/apps/prime/functions/api/extension-request.ts"
import { onRequestGet as __api_find_booking_ts_onRequestGet } from "/Users/petercowling/base-shop/apps/prime/functions/api/find-booking.ts"
import { onRequestGet as __api_guest_booking_ts_onRequestGet } from "/Users/petercowling/base-shop/apps/prime/functions/api/guest-booking.ts"
import { onRequestGet as __api_guest_session_ts_onRequestGet } from "/Users/petercowling/base-shop/apps/prime/functions/api/guest-session.ts"
import { onRequestPost as __api_guest_session_ts_onRequestPost } from "/Users/petercowling/base-shop/apps/prime/functions/api/guest-session.ts"
import { onRequestPost as __api_process_messaging_queue_ts_onRequestPost } from "/Users/petercowling/base-shop/apps/prime/functions/api/process-messaging-queue.ts"
import { onRequestPost as __api_staff_auth_session_ts_onRequestPost } from "/Users/petercowling/base-shop/apps/prime/functions/api/staff-auth-session.ts"
import { onRequest as __g__token__ts_onRequest } from "/Users/petercowling/base-shop/apps/prime/functions/g/[token].ts"

export const routes = [
    {
      routePath: "/api/firebase/bookings",
      mountPath: "/api/firebase",
      method: "GET",
      middlewares: [],
      modules: [__api_firebase_bookings_ts_onRequestGet],
    },
  {
      routePath: "/api/firebase/guest-details",
      mountPath: "/api/firebase",
      method: "GET",
      middlewares: [],
      modules: [__api_firebase_guest_details_ts_onRequestGet],
    },
  {
      routePath: "/api/firebase/preorders",
      mountPath: "/api/firebase",
      method: "GET",
      middlewares: [],
      modules: [__api_firebase_preorders_ts_onRequestGet],
    },
  {
      routePath: "/api/firebase/preorders",
      mountPath: "/api/firebase",
      method: "POST",
      middlewares: [],
      modules: [__api_firebase_preorders_ts_onRequestPost],
    },
  {
      routePath: "/api/bag-drop-request",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_bag_drop_request_ts_onRequestPost],
    },
  {
      routePath: "/api/check-in-code",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_check_in_code_ts_onRequestGet],
    },
  {
      routePath: "/api/check-in-code",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_check_in_code_ts_onRequestPost],
    },
  {
      routePath: "/api/check-in-lookup",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_check_in_lookup_ts_onRequestGet],
    },
  {
      routePath: "/api/extension-request",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_extension_request_ts_onRequestPost],
    },
  {
      routePath: "/api/find-booking",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_find_booking_ts_onRequestGet],
    },
  {
      routePath: "/api/guest-booking",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_guest_booking_ts_onRequestGet],
    },
  {
      routePath: "/api/guest-session",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_guest_session_ts_onRequestGet],
    },
  {
      routePath: "/api/guest-session",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_guest_session_ts_onRequestPost],
    },
  {
      routePath: "/api/process-messaging-queue",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_process_messaging_queue_ts_onRequestPost],
    },
  {
      routePath: "/api/staff-auth-session",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_staff_auth_session_ts_onRequestPost],
    },
  {
      routePath: "/g/:token",
      mountPath: "/g",
      method: "",
      middlewares: [],
      modules: [__g__token__ts_onRequest],
    },
  ]