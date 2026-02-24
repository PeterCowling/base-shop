'use client';

import GuardedRouteRedirect from '../../../components/navigation/GuardedRouteRedirect';

export default function ChatPage() {
  return <GuardedRouteRedirect targetPath="/activities" />;
}
