// Force dynamic rendering to avoid SSG issues with context providers
export const dynamic = 'force-dynamic';

import ActivitiesClient from './ActivitiesClient';

export default function ActivitiesPage() {
  return <ActivitiesClient />;
}
