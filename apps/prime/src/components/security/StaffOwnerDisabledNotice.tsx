'use client';

import Link from 'next/link';

import { getStaffOwnerGateMessage } from '../../lib/security/staffOwnerGate';

export default function StaffOwnerDisabledNotice() {
  return (
    <main className="min-h-svh bg-muted p-4">
      <div className="mx-auto max-w-md rounded-xl bg-card p-6 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-foreground">Access Restricted</h1>
        <p className="mb-6 text-sm text-muted-foreground">{getStaffOwnerGateMessage()}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
