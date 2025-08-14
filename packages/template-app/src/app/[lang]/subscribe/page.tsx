// packages/template-app/src/app/[lang]/subscribe/page.tsx
import type { Metadata } from "next";
import SubscribeClient from "./SubscribeClient.client";
import { getShopById } from "@platform-core/src/repositories/shop.server";
import type { SubscriptionPlan } from "@acme/types";

export const metadata: Metadata = {
  title: "Subscribe · Base-Shop",
};

export default async function SubscribePage({
  params,
}: {
  params: { lang: string };
}) {
  const shop = await getShopById("shop");
  const plans: SubscriptionPlan[] = shop.rentalSubscriptions || [];
  return <SubscribeClient plans={plans} />;
}
