// apps/cms/src/app/cms/shop/[shop]/UpgradeSummary.tsx

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
    <table className="mt-4 w-full text-left text-sm">
      <thead>
        <tr>
          <th className="pr-4">Package</th>
          <th className="pr-4">Current</th>
          <th className="pr-4">New</th>
          <th className="pr-4">Changelog</th>
        </tr>
      </thead>
      <tbody>
        {components.map((c) => (
          <tr key={c.name}>
            <td className="pr-4">{c.name}</td>
            <td className="pr-4">{c.from ?? "-"}</td>
            <td className="pr-4">{c.to}</td>
            <td>
              {c.changelog ? (
                <a
                  href={c.changelog}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  View
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
