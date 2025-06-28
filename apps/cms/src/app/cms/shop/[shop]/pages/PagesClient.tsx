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
}

export default function PagesClient({ shop, initial }: Props) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <Inner shop={shop} initial={initial} />
    </QueryClientProvider>
  );
}

function Inner({ shop, initial }: { shop: string; initial: Page[] }) {
  const { data } = useSuspenseQuery<Page[]>({
    queryKey: ["pages", shop],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${shop}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    initialData: initial,
  });

  return <PagesTable pages={data} />;
}
