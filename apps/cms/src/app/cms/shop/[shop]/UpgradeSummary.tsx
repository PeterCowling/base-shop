// apps/cms/src/app/cms/shop/[shop]/UpgradeSummary.tsx

import UpgradeSummaryClient from "./UpgradeSummaryClient";

interface ComponentChange {
  name: string;
  from: string | null;
  to: string;
  changelog?: string;
}

interface ComponentResponse {
  components: ComponentChange[];
}

export const revalidate = 0;

// Columns are defined in the client component to avoid passing
// function props across the server/client boundary.

export default async function UpgradeSummary({ shop }: { shop: string }) {
  const res = await fetch(`/api/components/${shop}?diff`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return (
      <p className="text-sm text-danger-foreground">
        Failed to load upgrade information.
      </p>
    );
  }

  const data = (await res.json()) as ComponentResponse;
  const { components } = data;

  if (components.length === 0) {
    return <p className="text-sm">No component upgrades found.</p>;
  }

  return (
    <div className="mt-4">
      <UpgradeSummaryClient components={components} />
    </div>
  );
}
