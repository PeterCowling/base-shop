// apps/shop-bcd/src/app/account/orders/[id]/page.tsx
import OrderDetail, { metadata } from "@ui/components/account/OrderDetail";
import shop from "../../../../../shop.json";

export { metadata };

interface PageProps {
  params: { id: string };
}

export default function Page({ params }: PageProps) {
  return <OrderDetail shopId={shop.id} orderId={params.id} />;
}

