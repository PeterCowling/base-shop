// apps/cms/src/app/cms/shop/[shop]/pages/PagesClient.tsx
"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { fetchJson } from "@acme/lib/http";
import type { Page } from "@acme/types";
import { PagesTable } from "@acme/ui/components/cms";

interface Props {
  shop: string;
  initial: Page[];
  canWrite: boolean;
}

export default function PagesClient({ shop, initial, canWrite }: Props) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <Inner shop={shop} initial={initial} canWrite={canWrite} />
    </QueryClientProvider>
  );
}

function Inner({
  shop,
  initial,
  canWrite,
}: {
  shop: string;
  initial: Page[];
  canWrite: boolean;
}) {
  const { data } = useSuspenseQuery<Page[]>({
    queryKey: ["pages", shop],
    queryFn: async () => fetchJson<Page[]>(`/api/pages/${shop}`),
    initialData: initial,
  });

  return <PagesTable shop={shop} pages={data} canWrite={canWrite} />;
}
