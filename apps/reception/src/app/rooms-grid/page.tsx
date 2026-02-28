"use client";

import dynamicImport from "next/dynamic";

// Keep this dynamic to avoid static caching of rapidly changing booking data.
// ssr: false prevents the Firebase/auth provider tree (inside RoomsGridClient)
// from initialising during SSR, avoiding 400 Bad Request on subsequent requests.
const RoomsGridClient = dynamicImport(() => import("./RoomsGridClient"), {
  ssr: false,
});

export default function RoomsGridPage() {
  return <RoomsGridClient />;
}
