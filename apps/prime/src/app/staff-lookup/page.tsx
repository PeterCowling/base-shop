'use client';

import dynamic from 'next/dynamic';
import StaffOwnerDisabledNotice from '../../components/security/StaffOwnerDisabledNotice';
import { canAccessStaffOwnerRoutes } from '../../lib/security/staffOwnerGate';

const StaffLookupClient = dynamic(() => import('./StaffLookupClient'), { ssr: false });

export default function StaffLookupPage() {
  if (!canAccessStaffOwnerRoutes()) {
    return <StaffOwnerDisabledNotice />;
  }

  return <StaffLookupClient />;
}
