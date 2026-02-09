import Link from 'next/link';
import { Users } from 'lucide-react';

import StaffOwnerDisabledNotice from '../../../components/security/StaffOwnerDisabledNotice';
import { canAccessStaffOwnerRoutes } from '../../../lib/security/staffOwnerGate';

export default function AdminUsersPage() {
  if (!canAccessStaffOwnerRoutes()) {
    return <StaffOwnerDisabledNotice />;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage staff and admin users</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">User management coming soon.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
