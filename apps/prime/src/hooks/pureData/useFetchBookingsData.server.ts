// Server-side bookings fetching via API route
// Uses Next.js API route instead of direct Firebase client connection

import { useQuery } from '@tanstack/react-query';
import useUuid from '../useUuid';

async function fetchBookingsViaAPI(uuid: string) {
  if (!uuid) {
    return {};
  }

  const response = await fetch(`/api/firebase/bookings?uuid=${encodeURIComponent(uuid)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }

  const data = await response.json();
  return data.bookings || {};
}

export function useFetchBookingsDataServer() {
  const uuid = useUuid();

  const {
    data,
    error,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['bookings-server', uuid],
    queryFn: () => fetchBookingsViaAPI(uuid),
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refetch = async (): Promise<void> => {
    await refetchQuery();
  };

  return {
    data: data ?? {},
    error: error ?? null,
    isLoading,
    isError: error !== null,
    refetch,
  };
}
