"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const router = useRouter();
  return (
    <header className="h-12 flex items-center justify-end gap-3 border-b border-gray-200 dark:border-gray-800 px-4">
      <button
        onClick={() => router.refresh()}
        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Refresh
      </button>
      <button
        onClick={() => signOut()}
        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Sign out
      </button>
    </header>
  );
}
