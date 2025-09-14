// apps/cms/src/app/cms/maintenance/page.tsx
import { runMaintenanceScan } from "@acme/platform-machine/maintenanceScheduler";
import { logger } from "@platform-core/utils";

export const revalidate = 0;

interface FlaggedItem {
  message: string;
  shopId: string;
  sku: string;
}

async function scanForMaintenance(): Promise<FlaggedItem[]> {
  const items: FlaggedItem[] = [];
  const original = logger.info.bind(logger) as typeof logger.info;
  (logger.info as unknown as (
    msg: string,
    meta: { shopId: string; sku: string },
  ) => void) = (msg, meta) => {
    if (msg === "item needs retirement" || msg === "item needs maintenance") {
      items.push({ message: msg, ...meta });
    }
    original(msg, meta);
  };
  try {
    await runMaintenanceScan();
  } finally {
    // restore original logger
    (logger.info as unknown as typeof original) = original;
  }
  return items;
}

export default async function MaintenancePage() {
  const flagged = await scanForMaintenance();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Maintenance Report</h2>
      {flagged.length === 0 && <p>No items require maintenance.</p>}
      {flagged.length > 0 && (
        <ul className="list-disc pl-5 space-y-1">
          {flagged.map((f, idx) => (
            <li key={`${f.shopId}-${f.sku}-${idx}`}>
              {f.shopId} – {f.sku} – {f.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

