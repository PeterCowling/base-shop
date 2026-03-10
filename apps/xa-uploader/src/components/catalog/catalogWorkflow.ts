import type { CatalogProductDraftInput } from "@acme/lib/xa/catalogAdminSchema";

export type { CatalogDraftWorkflowReadiness } from "@acme/lib/xa/catalogWorkflow";
export { getCatalogDraftWorkflowReadiness } from "@acme/lib/xa/catalogWorkflow";

export function getWorkflowStatusDisplay(
  dataReady: boolean,
  publishReady: boolean,
  publishState: CatalogProductDraftInput["publishState"],
  t: (key: string) => string,
): { label: string; dotClass: string } {
  const label = !dataReady
    ? t("workflowDataRequired")
    : !publishReady
      ? t("workflowDraftOnly")
      : publishState === "out_of_stock"
        ? t("workflowOutOfStock")
        : publishState === "live"
          ? t("workflowLive")
          : t("workflowReadyForLive");
  const dotClass = !dataReady
    ? "bg-gate-status-incomplete"
    : !publishReady
      ? "bg-gate-status-draft"
      : publishState === "out_of_stock"
        ? "bg-warning"
        : "bg-gate-status-ready";
  return { label, dotClass };
}
