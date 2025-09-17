// apps/cms/src/app/cms/shop/[shop]/UpgradeSummary.tsx

import DataTable, { type Column } from "@ui/components/cms/DataTable";

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

const componentColumns: Column<ComponentChange>[] = [
  {
    header: "Package",
    render: (row) => row.name,
  },
  {
    header: "Current",
    render: (row) => row.from ?? "-",
  },
  {
    header: "New",
    render: (row) => row.to,
  },
  {
    header: "Changelog",
    width: "120px",
    render: (row) =>
      row.changelog ? (
        <a
          href={row.changelog}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline"
        >
          View
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

export default async function UpgradeSummary({ shop }: { shop: string }) {
  const res = await fetch(`/api/components/${shop}?diff`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return (
      <p className="text-sm text-red-600">
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
      <DataTable rows={components} columns={componentColumns} />
    </div>
  );
}
