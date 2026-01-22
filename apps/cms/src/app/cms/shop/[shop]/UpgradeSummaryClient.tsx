"use client";

import DataTable, { type Column } from "@acme/cms-ui/DataTable";
import { useTranslations } from "@acme/i18n";

interface ComponentChange {
  name: string;
  from: string | null;
  to: string;
  changelog?: string;
}

function useColumns() {
  const t = useTranslations();
  const cols: Column<ComponentChange>[] = [
    { header: String(t("cms.upgrade.table.package")), render: (row) => row.name },
    {
      header: String(t("cms.upgrade.table.current")),
      render: (row) =>
        row.from ?? (
          <span aria-label={String(t("common.none"))} title={String(t("common.none"))}>
            —
          </span>
        ),
    },
    { header: String(t("cms.upgrade.table.new")), render: (row) => row.to },
    {
      header: String(t("cms.upgrade.table.changelog")),
      width: "120px",
      render: (row) =>
        row.changelog ? (
          <a
            href={row.changelog}
            target="_blank"
            rel="noreferrer"
            className="text-link underline inline-flex min-h-11 min-w-11 items-center justify-center px-2" /* i18n-exempt */
          >
            {t("cms.upgrade.table.view")}
          </a>
        ) : (
          <span
            className="text-muted-foreground"
            aria-label={String(t("common.none"))}
            title={String(t("common.none"))}
          >
            —
          </span>
        ),
    },
  ];
  return cols;
}

export default function UpgradeSummaryClient({
  components,
}: {
  components: ComponentChange[];
}) {
  const columns = useColumns();
  return <DataTable rows={components} columns={columns} />;
}
