// apps/cms/src/app/cms/shop/[shop]/pages/PagesClient.tsx
"use client";

import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { Page } from "@types";
import { PagesTable } from "@ui/components/cms";
import { useState } from "react";

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
    queryFn: async () => {
      const res = await fetch(`/api/pages/${shop}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    initialData: initial,
  });

  return <PagesTable shop={shop} pages={data} canWrite={canWrite} />;
}
