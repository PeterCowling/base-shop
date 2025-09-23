import { mapLateFeeRows } from "../tableMappers";
import { readOrders } from "@platform-core/repositories/rentalOrders.server";
import LateFeesTableClient from "./LateFeesTableClient";

export default async function LateFeesTable({ shop }: { shop: string }) {
  const orders = await readOrders(shop);
  const charges = orders.filter((o) => o.lateFeeCharged);
  if (charges.length === 0) {
    return <p className="text-sm">No late fees charged.</p>;
  }

  const rows = mapLateFeeRows(charges);

  return <LateFeesTableClient rows={rows} />;
}
