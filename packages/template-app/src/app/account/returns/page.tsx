// packages/template-app/src/app/account/returns/page.tsx
import { getReturnBagAndLabel } from "@platform-core/returnLogistics";

export default async function AccountReturnsPage() {
  const cfg = await getReturnBagAndLabel();
  const labelHref = `https://${cfg.labelService.toLowerCase()}.com/`;
  return (
    <div className="p-6 space-y-4">
      {cfg.bagType === "reusable" && (
        <p>Please reuse the reusable bag to return your items.</p>
      )}
      {cfg.tracking && (
        <a href={labelHref} className="text-primary underline">
          Print {cfg.labelService} return label
        </a>
      )}
    </div>
  );
}

