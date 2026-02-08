'use client';

import Link from 'next/link';
import { getStaffOwnerGateMessage } from '../../lib/security/staffOwnerGate';

export default function StaffOwnerDisabledNotice() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Access Restricted</h1>
        <p className="mb-6 text-sm text-gray-600">{getStaffOwnerGateMessage()}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
