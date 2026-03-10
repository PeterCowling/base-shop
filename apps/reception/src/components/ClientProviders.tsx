"use client";

import type { ComponentType, ReactNode } from "react";
import dynamic from "next/dynamic";

// Providers wrapped with ssr: false — prevents the Firebase/auth provider tree
// from initialising during server-side rendering. Without this, SSR of client
// components that call initializeApp/getDatabase leaves side-effects in the
// Node.js process that cause every subsequent request to return 400 Bad Request.
const ClientProviders: ComponentType<{ children: ReactNode }> = dynamic(
  () => import("./Providers"),
  { ssr: false },
);

export default ClientProviders;
