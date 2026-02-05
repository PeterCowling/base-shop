import dynamicImport from 'next/dynamic';

// Disable static generation - this page requires runtime data
export const dynamic = 'force-dynamic';

// Dynamically import with ssr: false to prevent prerendering
// This avoids SSR issues with localStorage in DarkModeContext
const CheckinContent = dynamicImport(
  () => import('@/components/checkins/CheckinContent'),
  { ssr: false }
);

export default function CheckinPage() {
  return <CheckinContent />;
}
